/// <reference lib="webworker" />

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { ClipTextOverlay, ClipTrackClip } from "../shared/types";

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 30;
const SAMPLE_RATE = 48000;
const CORE_VERSION = "0.12.10";

type ExportRequestMessage = {
  type: "EXPORT";
  requestId: string;
  clips: ClipTrackClip[];
  textOverlays: ClipTextOverlay[];
};

type WorkerMessage =
  | {
      type: "EXPORT_PROGRESS";
      requestId: string;
      progress: number;
      message: string;
    }
  | {
      type: "EXPORT_DONE";
      requestId: string;
      bytes: ArrayBuffer;
      filename: string;
    }
  | {
      type: "EXPORT_ERROR";
      requestId: string;
      error: string;
    };

const workerScope = self as DedicatedWorkerGlobalScope;
let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;
let isExporting = false;

function postMessageToMain(message: WorkerMessage, transfer?: Transferable[]) {
  workerScope.postMessage(message, transfer || []);
}

function postProgress(requestId: string, progress: number, message: string) {
  postMessageToMain({
    type: "EXPORT_PROGRESS",
    requestId,
    progress,
    message,
  });
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
      Math.min(
        clip.durationSeconds,
        clip.sourceEndSeconds - clip.sourceStartSeconds
      )
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
  includeClipAudio: boolean,
  textOverlays: ClipTextOverlay[]
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

  const concatLabel = "vbase";
  const filterPrefix = `${filters.join(";")};${concatInputs.join("")}concat=n=${segmentIndex}:v=1:a=1[${concatLabel}][a]`;

  const overlayFilters: string[] = [];
  if (textOverlays.length > 0) {
    let inputLabel = concatLabel;
    for (let index = 0; index < textOverlays.length; index += 1) {
      const overlay = textOverlays[index];
      const outputLabel =
        index === textOverlays.length - 1 ? "v" : `vtxt${index}`;
      const safeText = overlay.text
        .replace(/\\/g, "\\\\")
        .replace(/:/g, "\\:")
        .replace(/'/g, "\\'")
        .replace(/\n/g, "\\n");
      const x = `(w*${(overlay.xPercent / 100).toFixed(4)})-text_w/2`;
      const y = `(h*${(overlay.yPercent / 100).toFixed(4)})-text_h/2`;
      overlayFilters.push(
        `[${inputLabel}]drawtext=text='${safeText}':x=${x}:y=${y}:fontsize=${Math.max(
          12,
          Math.round(overlay.fontSize)
        )}:fontcolor=${overlay.color}:borderw=2:bordercolor=black@0.65:enable='between(t,${overlay.startSeconds.toFixed(
          3
        )},${overlay.endSeconds.toFixed(3)})'[${outputLabel}]`
      );
      inputLabel = outputLabel;
    }
  }

  if (overlayFilters.length === 0) {
    return `${filterPrefix};[${concatLabel}]copy[v]`;
  }

  return `${filterPrefix};${overlayFilters.join(";")}`;
}

async function getFfmpeg(requestId: string) {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }
  if (ffmpegLoadingPromise) {
    return ffmpegLoadingPromise;
  }

  ffmpegLoadingPromise = (async () => {
    postProgress(requestId, 6, "正在加载 FFmpeg Core...");
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

async function runExport(
  requestId: string,
  clips: ClipTrackClip[],
  textOverlays: ClipTextOverlay[]
) {
  if (isExporting) {
    throw new Error("已有导出任务正在执行");
  }
  isExporting = true;

  let ffmpeg: FFmpeg | null = null;
  let progressListener: ((payload: { progress: number }) => void) | null = null;
  const tempFiles: string[] = [];

  try {
    console.log("[clip-export-worker] start", {
      requestId,
      clipCount: clips.length,
      textOverlayCount: textOverlays.length,
    });
    if (clips.length === 0) {
      throw new Error("时间轴没有片段可导出");
    }

    postProgress(requestId, 2, "正在预处理时间线...");
    const plan = buildSegmentPlan(clips);
    console.log("[clip-export-worker] plan", {
      requestId,
      segmentCount: plan.length,
      clipSegmentCount: plan.filter((segment) => segment.kind === "clip").length,
    });
    if (plan.length === 0) {
      throw new Error("没有有效片段可导出");
    }

    ffmpeg = await getFfmpeg(requestId);

    postProgress(requestId, 12, "正在准备素材...");
    const inputArgs: string[] = [];
    progressListener = ({ progress }) => {
      const mapped = Math.round(55 + progress * 38);
      postProgress(requestId, mapped, "正在渲染导出视频...");
    };
    ffmpeg.on("progress", progressListener);

    let clipInputIndex = 0;
    const clipSegments = plan.filter((segment) => segment.kind === "clip");
    for (const segment of clipSegments) {
      const filename = `clip_input_${clipInputIndex}.mp4`;
      tempFiles.push(filename);
      await ffmpeg.writeFile(filename, await fetchFile(segment.clip.objectUrl));
      inputArgs.push("-i", filename);
      clipInputIndex += 1;
      const writeProgress = Math.round(
        16 + (clipInputIndex / Math.max(1, clipSegments.length)) * 34
      );
      console.log("[clip-export-worker] input written", {
        requestId,
        index: clipInputIndex,
        total: clipSegments.length,
        progress: writeProgress,
      });
      postProgress(requestId, writeProgress, "正在写入时间轴素材...");
    }

    const outputFile = "timeline_export.mp4";
    tempFiles.push(outputFile);

    const buildArgs = (includeClipAudio: boolean) => {
      const filterComplex = buildFilterComplex(
        plan,
        includeClipAudio,
        textOverlays
      );
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

    postProgress(requestId, 55, "正在执行导出命令...");
    console.log("[clip-export-worker] ffmpeg exec start", { requestId });
    try {
      await ffmpeg.exec(buildArgs(true));
    } catch {
      console.warn("[clip-export-worker] audio track fallback", { requestId });
      postProgress(requestId, 72, "素材音轨异常，切换静音轨重试...");
      await ffmpeg.exec(buildArgs(false));
    }

    postProgress(requestId, 95, "正在读取导出文件...");
    const data = await ffmpeg.readFile(outputFile);
    const rawBytes =
      data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    const bytes = Uint8Array.from(rawBytes);
    console.log("[clip-export-worker] output ready", {
      requestId,
      size: bytes.byteLength,
    });

    postMessageToMain(
      {
        type: "EXPORT_DONE",
        requestId,
        bytes: bytes.buffer,
        filename: `clip-export-${Date.now()}.mp4`,
      },
      [bytes.buffer]
    );
  } finally {
    if (ffmpeg && progressListener) {
      ffmpeg.off("progress", progressListener);
    }
    if (ffmpeg) {
      for (const file of tempFiles) {
        try {
          await ffmpeg.deleteFile(file);
        } catch {
          // ignore cleanup failures
        }
      }
    }
    isExporting = false;
    console.log("[clip-export-worker] finished", { requestId });
  }
}

workerScope.onmessage = (event: MessageEvent<ExportRequestMessage>) => {
  const message = event.data;
  if (!message || message.type !== "EXPORT") {
    return;
  }

  void runExport(
    message.requestId,
    message.clips,
    message.textOverlays || []
  ).catch((error: unknown) => {
    const errorMessage =
      error instanceof Error ? error.message : "导出失败，请稍后重试";
    console.error("[clip-export-worker] failed", {
      requestId: message.requestId,
      error: errorMessage,
    });
    postMessageToMain({
      type: "EXPORT_ERROR",
      requestId: message.requestId,
      error: errorMessage,
    });
  });
};
