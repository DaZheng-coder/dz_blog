import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { ClipTrackClip } from "../shared/types";

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 30;
const SAMPLE_RATE = 48000;
const CORE_VERSION = "0.12.10";

type ExportProgressPayload = {
  progress: number;
  message: string;
};

type ExportTimelineOptions = {
  onProgress?: (payload: ExportProgressPayload) => void;
};

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;
let ffmpegProgressListener: ((payload: { progress: number }) => void) | null =
  null;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function getFfmpeg() {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }
  if (ffmpegLoadingPromise) {
    return ffmpegLoadingPromise;
  }

  ffmpegLoadingPromise = (async () => {
    const ffmpeg = new FFmpeg();
    const base = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`;
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return ffmpegLoadingPromise;
}

function sortedClips(clips: ClipTrackClip[]) {
  return [...clips].sort((a, b) => a.startSeconds - b.startSeconds);
}

function buildSegmentPlan(clips: ClipTrackClip[]) {
  const sorted = sortedClips(clips);
  const plan: Array<
    | { kind: "gap"; duration: number }
    | { kind: "clip"; clip: ClipTrackClip; duration: number }
  > = [];

  let cursor = 0;
  for (const clip of sorted) {
    const gap = Math.max(0, clip.startSeconds - cursor);
    if (gap > 0) {
      plan.push({ kind: "gap", duration: gap });
      cursor += gap;
    }
    const duration = Math.max(
      0,
      Math.min(clip.durationSeconds, clip.sourceEndSeconds - clip.sourceStartSeconds)
    );
    if (duration > 0) {
      plan.push({ kind: "clip", clip, duration });
      cursor += duration;
    }
  }

  return plan;
}

function buildFilterComplex(
  plan: ReturnType<typeof buildSegmentPlan>,
  includeClipAudio: boolean
) {
  const filters: string[] = [];
  const concatInputs: string[] = [];
  let clipInputIndex = 0;
  let segmentIndex = 0;

  for (const segment of plan) {
    const vLabel = `v${segmentIndex}`;
    const aLabel = `a${segmentIndex}`;

    if (segment.kind === "gap") {
      const duration = segment.duration.toFixed(6);
      filters.push(
        `color=c=black:s=${WIDTH}x${HEIGHT}:r=${FPS}:d=${duration}[${vLabel}]`
      );
      filters.push(
        `anullsrc=r=${SAMPLE_RATE}:cl=stereo:d=${duration}[${aLabel}]`
      );
      concatInputs.push(`[${vLabel}][${aLabel}]`);
      segmentIndex += 1;
      continue;
    }

    const start = segment.clip.sourceStartSeconds.toFixed(6);
    const end = (segment.clip.sourceStartSeconds + segment.duration).toFixed(6);
    const duration = segment.duration.toFixed(6);
    filters.push(
      `[${clipInputIndex}:v]trim=start=${start}:end=${end},setpts=PTS-STARTPTS,scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:black,fps=${FPS},format=yuv420p[${vLabel}]`
    );

    if (includeClipAudio) {
      filters.push(
        `[${clipInputIndex}:a]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS,aresample=${SAMPLE_RATE},aformat=sample_fmts=fltp:channel_layouts=stereo[${aLabel}]`
      );
    } else {
      filters.push(
        `anullsrc=r=${SAMPLE_RATE}:cl=stereo:d=${duration}[${aLabel}]`
      );
    }

    concatInputs.push(`[${vLabel}][${aLabel}]`);
    clipInputIndex += 1;
    segmentIndex += 1;
  }

  return `${filters.join(";")};${concatInputs.join("")}concat=n=${segmentIndex}:v=1:a=1[v][a]`;
}

export async function exportTimelineToMp4(
  clips: ClipTrackClip[],
  options: ExportTimelineOptions = {}
) {
  const { onProgress } = options;
  if (clips.length === 0) {
    throw new Error("时间轴没有片段可导出");
  }

  onProgress?.({ progress: 2, message: "正在加载 FFmpeg..." });
  const ffmpeg = await getFfmpeg();

  const plan = buildSegmentPlan(clips);
  if (plan.length === 0) {
    throw new Error("没有有效片段可导出");
  }

  if (ffmpegProgressListener) {
    ffmpeg.off("progress", ffmpegProgressListener);
  }
  ffmpegProgressListener = ({ progress }) => {
    const mapped = Math.round(10 + progress * 85);
    onProgress?.({ progress: mapped, message: "正在渲染导出视频..." });
  };
  ffmpeg.on("progress", ffmpegProgressListener);

  onProgress?.({ progress: 8, message: "正在写入时间轴素材..." });

  const inputArgs: string[] = [];
  const tempFiles: string[] = [];

  let clipInputIndex = 0;
  for (const segment of plan) {
    if (segment.kind === "gap") {
      continue;
    }
    const filename = `clip_input_${clipInputIndex}.mp4`;
    tempFiles.push(filename);
    await ffmpeg.writeFile(filename, await fetchFile(segment.clip.objectUrl));
    inputArgs.push("-i", filename);
    clipInputIndex += 1;
  }

  const outputFile = "timeline_export.mp4";
  tempFiles.push(outputFile);

  const buildArgs = (includeClipAudio: boolean) => {
    const filterComplex = buildFilterComplex(plan, includeClipAudio);
    return [
      ...inputArgs,
      "-filter_complex",
      filterComplex,
      "-map",
      "[v]",
      "-map",
      "[a]",
      "-r",
      String(FPS),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      "-y",
      outputFile,
    ];
  };

  onProgress?.({ progress: 10, message: "正在执行导出命令..." });
  try {
    await ffmpeg.exec(buildArgs(true));
  } catch {
    onProgress?.({ progress: 45, message: "素材音轨异常，切换静音轨重试..." });
    await ffmpeg.exec(buildArgs(false));
  }

  onProgress?.({ progress: 97, message: "正在读取导出文件..." });
  const data = await ffmpeg.readFile(outputFile);
  const rawBytes =
    data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
  const bytes = Uint8Array.from(rawBytes);
  const blob = new Blob([bytes], { type: "video/mp4" });
  downloadBlob(blob, `clip-export-${Date.now()}.mp4`);

  for (const file of tempFiles) {
    try {
      await ffmpeg.deleteFile(file);
    } catch {
      // ignore cleanup failures
    }
  }

  onProgress?.({ progress: 100, message: "导出完成" });
}
