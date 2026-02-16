import type { ClipVideoAsset } from "./types";

function toSignature(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function createAsset(
  file: File,
  objectUrl: string,
  durationSeconds: number,
  coverDataUrl: string | null
): ClipVideoAsset {
  return {
    id: crypto.randomUUID(),
    signature: toSignature(file),
    title: file.name,
    durationSeconds,
    objectUrl,
    coverDataUrl,
  };
}

export function createVideoAsset(file: File): Promise<ClipVideoAsset> {
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
      coverDataUrl: string | null
    ) => {
      clean();
      resolve(createAsset(file, objectUrl, durationSeconds, coverDataUrl));
    };

    const fail = () => {
      clean();
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`无法读取视频文件: ${file.name}`));
    };

    video.onerror = fail;

    video.onloadedmetadata = () => {
      const durationSeconds = Number.isFinite(video.duration) ? video.duration : 0;
      const captureTime = Math.min(0.1, Math.max(durationSeconds / 3, 0));
      const timer = window.setTimeout(
        () => resolveAndClean(durationSeconds, null),
        1200
      );

      video.onseeked = () => {
        window.clearTimeout(timer);
        let coverDataUrl: string | null = null;
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 180;
          const context = canvas.getContext("2d");
          if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            coverDataUrl = canvas.toDataURL("image/jpeg", 0.72);
          }
        } catch {
          coverDataUrl = null;
        }
        resolveAndClean(durationSeconds, coverDataUrl);
      };

      try {
        video.currentTime = captureTime;
      } catch {
        window.clearTimeout(timer);
        resolveAndClean(durationSeconds, null);
      }
    };
  });
}
