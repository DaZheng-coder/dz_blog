import type { ClipMediaAsset } from "../shared/types";

const MIN_VIDEO_THUMBNAILS = 6;
const MAX_VIDEO_THUMBNAILS = 60;
const THUMBNAIL_INTERVAL_SECONDS = 1.5;
const THUMBNAIL_WIDTH = 160;
const THUMBNAIL_QUALITY = 0.64;
const COVER_MAX_WIDTH = 640;
const COVER_QUALITY = 0.9;
const AUDIO_LEVEL_SAMPLES = 96;

function toSignature(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function createAsset(
  file: File,
  objectUrl: string,
  durationSeconds: number,
  coverDataUrl: string | null,
  mediaType: "video" | "audio",
  frameThumbnails?: string[],
  audioLevels?: number[]
): ClipMediaAsset {
  return {
    id: crypto.randomUUID(),
    signature: toSignature(file),
    title: file.name,
    durationSeconds,
    objectUrl,
    mediaType,
    coverDataUrl,
    frameThumbnails,
    audioLevels,
  };
}

async function extractAudioLevels(
  file: File,
  sampleCount = AUDIO_LEVEL_SAMPLES
): Promise<number[]> {
  const AudioContextClass =
    window.AudioContext ||
    (
      window as typeof window & { webkitAudioContext?: typeof AudioContext }
    ).webkitAudioContext;
  if (!AudioContextClass) {
    return [];
  }

  const audioContext = new AudioContextClass();
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    if (!length || !channels) {
      return [];
    }

    const blockSize = Math.max(1, Math.floor(length / sampleCount));
    const levels: number[] = [];
    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
      const start = sampleIndex * blockSize;
      const end = Math.min(length, start + blockSize);
      if (start >= end) {
        levels.push(0);
        continue;
      }

      let sum = 0;
      let count = 0;
      for (let channelIndex = 0; channelIndex < channels; channelIndex += 1) {
        const channelData = audioBuffer.getChannelData(channelIndex);
        for (let point = start; point < end; point += 1) {
          const value = channelData[point] || 0;
          sum += value * value;
          count += 1;
        }
      }
      const rms = count > 0 ? Math.sqrt(sum / count) : 0;
      levels.push(Math.min(1, rms * 2.8));
    }
    return levels;
  } catch {
    return [];
  } finally {
    await audioContext.close();
  }
}

function resolveVideoThumbnailCount(durationSeconds: number) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return MIN_VIDEO_THUMBNAILS;
  }
  const dynamicCount = Math.ceil(durationSeconds / THUMBNAIL_INTERVAL_SECONDS);
  return Math.max(
    MIN_VIDEO_THUMBNAILS,
    Math.min(MAX_VIDEO_THUMBNAILS, dynamicCount)
  );
}

export function createVideoAsset(file: File): Promise<ClipMediaAsset> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;

    const clean = () => {
      video.removeAttribute("src");
      video.load();
    };

    const resolveAndClean = (
      durationSeconds: number,
      coverDataUrl: string | null,
      frameThumbnails: string[],
      audioLevels: number[]
    ) => {
      clean();
      resolve(
        createAsset(
          file,
          objectUrl,
          durationSeconds,
          coverDataUrl,
          "video",
          frameThumbnails,
          audioLevels
        )
      );
    };

    const fail = () => {
      clean();
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`无法读取视频文件: ${file.name}`));
    };

    video.onerror = fail;

    const seekTo = (targetSeconds: number) =>
      new Promise<void>((resolveSeek, rejectSeek) => {
        const handleSeeked = () => {
          resolveSeek();
        };
        const handleError = () => {
          rejectSeek(new Error("seek failed"));
        };
        video.addEventListener("seeked", handleSeeked, { once: true });
        video.addEventListener("error", handleError, { once: true });
        try {
          video.currentTime = targetSeconds;
        } catch {
          rejectSeek(new Error("seek failed"));
        }
      });

    video.onloadedmetadata = async () => {
      const audioLevelsPromise = extractAudioLevels(file);
      const durationSeconds = Number.isFinite(video.duration) ? video.duration : 0;
      const sourceWidth = video.videoWidth || 320;
      const sourceHeight = video.videoHeight || 180;
      const thumbnailScale = THUMBNAIL_WIDTH / sourceWidth;
      const thumbnailCanvas = document.createElement("canvas");
      thumbnailCanvas.width = THUMBNAIL_WIDTH;
      thumbnailCanvas.height = Math.max(1, Math.round(sourceHeight * thumbnailScale));
      const thumbnailContext = thumbnailCanvas.getContext("2d");
      const coverWidth = Math.min(sourceWidth, COVER_MAX_WIDTH);
      const coverScale = coverWidth / sourceWidth;
      const coverCanvas = document.createElement("canvas");
      coverCanvas.width = Math.max(1, Math.round(coverWidth));
      coverCanvas.height = Math.max(1, Math.round(sourceHeight * coverScale));
      const coverContext = coverCanvas.getContext("2d");
      const frameThumbnails: string[] = [];
      let coverDataUrl: string | null = null;

      const captureCurrentFrame = () => {
        if (!thumbnailContext) {
          return null;
        }
        thumbnailContext.drawImage(
          video,
          0,
          0,
          thumbnailCanvas.width,
          thumbnailCanvas.height
        );
        return thumbnailCanvas.toDataURL("image/jpeg", THUMBNAIL_QUALITY);
      };

      const captureCoverFrame = () => {
        if (!coverContext) {
          return null;
        }
        coverContext.drawImage(video, 0, 0, coverCanvas.width, coverCanvas.height);
        return coverCanvas.toDataURL("image/jpeg", COVER_QUALITY);
      };

      try {
        const frameCount = resolveVideoThumbnailCount(durationSeconds);
        const frameTimes = Array.from({ length: frameCount }, (_, index) => {
          const ratio = (index + 0.5) / frameCount;
          const upper = Math.max(durationSeconds - 0.05, 0);
          return Math.min(upper, Math.max(0, durationSeconds * ratio));
        });

        for (const time of frameTimes) {
          await seekTo(time);
          if (!coverDataUrl) {
            coverDataUrl = captureCoverFrame();
          }
          const frame = captureCurrentFrame();
          if (frame) {
            frameThumbnails.push(frame);
          }
        }

        resolveAndClean(
          durationSeconds,
          coverDataUrl || frameThumbnails[0] || null,
          frameThumbnails,
          await audioLevelsPromise
        );
      } catch {
        resolveAndClean(durationSeconds, null, [], await audioLevelsPromise);
      }
    };
  });
}

export function createAudioAsset(file: File): Promise<ClipMediaAsset> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = objectUrl;

    const clean = () => {
      audio.removeAttribute("src");
      audio.load();
    };

    audio.onerror = () => {
      clean();
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`无法读取音频文件: ${file.name}`));
    };

    audio.onloadedmetadata = () => {
      const durationSeconds = Number.isFinite(audio.duration) ? audio.duration : 0;
      clean();
      extractAudioLevels(file).then((audioLevels) => {
        resolve(
          createAsset(file, objectUrl, durationSeconds, null, "audio", [], audioLevels)
        );
      });
    };
  });
}
