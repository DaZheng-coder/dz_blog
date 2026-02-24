/// <reference lib="webworker" />

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { ClipTextOverlay, ClipTrackClip } from "../shared/types";

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 30;
const SAMPLE_RATE = 48000;
const CORE_VERSION = "0.12.10";
const FALLBACK_FONT_URL =
  "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf";

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
let isExporting = false;
let cachedFontData: Uint8Array | null = null;

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

function normalizeDrawtextColor(color: string) {
  const raw = (color || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
    return `0x${raw.slice(1).toUpperCase()}`;
  }
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const hex = raw
      .slice(1)
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
      .toUpperCase();
    return `0x${hex}`;
  }
  if (/^0x[0-9a-fA-F]{6}$/.test(raw)) {
    return `0x${raw.slice(2).toUpperCase()}`;
  }
  if (/^[a-zA-Z]+$/.test(raw)) {
    return raw.toLowerCase();
  }
  return "white";
}

async function getFallbackFontData(requestId: string) {
  if (cachedFontData) {
    return cachedFontData;
  }
  postProgress(requestId, 10, "正在加载导出字体...");
  const response = await fetch(FALLBACK_FONT_URL);
  if (!response.ok) {
    throw new Error(`字体下载失败: ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0) {
    throw new Error("字体文件为空");
  }
  cachedFontData = bytes;
  return bytes;
}

function getTextTrackEndSeconds(textOverlays: ClipTextOverlay[]) {
  return textOverlays.reduce((maxEnd, overlay) => {
    const hasText = overlay.text.trim().length > 0;
    const duration = overlay.endSeconds - overlay.startSeconds;
    if (!hasText || duration <= 0) {
      return maxEnd;
    }
    return Math.max(maxEnd, overlay.endSeconds);
  }, 0);
}

function buildSegmentPlan(clips: ClipTrackClip[], textOverlays: ClipTextOverlay[]) {
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

  const textEndSeconds = getTextTrackEndSeconds(textOverlays);
  const timelineEndSeconds = Math.max(cursor, textEndSeconds);
  const tailGap = Math.max(0, timelineEndSeconds - cursor);
  if (tailGap > 0) {
    plan.push({ kind: "gap", duration: tailGap });
  }

  return plan;
}

function buildFilterComplex(
  plan: ReturnType<typeof buildSegmentPlan>,
  includeClipAudio: boolean,
  textOverlays: ClipTextOverlay[],
  includeLineSpacing: boolean,
  textOverlayTextFiles: string[],
  fontFile: string
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
  const validTextOverlays = textOverlays.filter(
    (overlay) =>
      overlay.text.trim().length > 0 && overlay.endSeconds > overlay.startSeconds
  );
  if (validTextOverlays.length > 0) {
    let inputLabel = concatLabel;
    for (let index = 0; index < validTextOverlays.length; index += 1) {
      const overlay = validTextOverlays[index];
      const textFile = textOverlayTextFiles[index];
      if (!textFile) {
        continue;
      }
      const outputLabel =
        index === validTextOverlays.length - 1 ? "v" : `vtxt${index}`;
      const x = `(w*${(overlay.xPercent / 100).toFixed(4)})-text_w/2`;
      const y = `(h*${(overlay.yPercent / 100).toFixed(4)})-text_h/2`;
      const fontSize = Math.max(12, Math.round(overlay.fontSize));
      const fontColor = normalizeDrawtextColor(overlay.color);
      const lineHeight = Number.isFinite(overlay.lineHeight)
        ? Math.max(0.8, Math.min(3, overlay.lineHeight))
        : 1.2;
      const lineSpacing = Math.max(
        0,
        Math.round(fontSize * (lineHeight - 1))
      );
      const spacingOption =
        includeLineSpacing && lineSpacing > 0
          ? `:line_spacing=${lineSpacing}`
          : "";
      overlayFilters.push(
        `[${inputLabel}]drawtext=fontfile='${fontFile}':textfile='${textFile}':expansion=none:x=${x}:y=${y}:fontsize=${fontSize}${spacingOption}:fontcolor=${fontColor}:borderw=2:bordercolor=black@0.65:enable='between(t,${overlay.startSeconds.toFixed(
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
  postProgress(requestId, 6, "正在加载 FFmpeg Core...");
  const ffmpeg = new FFmpeg();
  const base = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`;
  await ffmpeg.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
  });
  return ffmpeg;
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
  const filePrefix = `job_${requestId.replace(/-/g, "")}`;
  const validTextOverlays = textOverlays.filter(
    (overlay) =>
      overlay.text.trim().length > 0 && overlay.endSeconds > overlay.startSeconds
  );

  try {
    console.log("[clip-export-worker] start", {
      requestId,
      clipCount: clips.length,
      textOverlayCount: textOverlays.length,
    });
    postProgress(requestId, 2, "正在预处理时间线...");
    const plan = buildSegmentPlan(clips, textOverlays);
    console.log("[clip-export-worker] plan", {
      requestId,
      segmentCount: plan.length,
      clipSegmentCount: plan.filter((segment) => segment.kind === "clip").length,
    });
    if (plan.length === 0) {
      throw new Error("没有有效片段可导出");
    }

    ffmpeg = await getFfmpeg(requestId);
    const removeFileIfExists = async (filename: string) => {
      if (!ffmpeg) {
        return;
      }
      try {
        await ffmpeg.deleteFile(filename);
      } catch {
        // ignore when file does not exist
      }
    };

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
      const filename = `${filePrefix}_clip_input_${clipInputIndex}.mp4`;
      await removeFileIfExists(filename);
      tempFiles.push(filename);
      try {
        await ffmpeg.writeFile(filename, await fetchFile(segment.clip.objectUrl));
      } catch (error) {
        console.error("[clip-export-worker] write input failed", {
          requestId,
          filename,
          clipInputIndex,
          clipObjectUrl: segment.clip.objectUrl,
          error,
          message: error instanceof Error ? error.message : String(error),
        });
        throw new Error(`写入输入素材失败: ${filename}`);
      }
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

    const outputFile = `${filePrefix}_timeline_export.mp4`;
    await removeFileIfExists(outputFile);
    tempFiles.push(outputFile);
    const fontFile = `${filePrefix}_font.otf`;
    await removeFileIfExists(fontFile);
    tempFiles.push(fontFile);
    try {
      const fontData = await getFallbackFontData(requestId);
      await ffmpeg.writeFile(fontFile, fontData);
    } catch (error) {
      console.error("[clip-export-worker] write font failed", {
        requestId,
        fontFile,
        error,
        message: error instanceof Error ? error.message : String(error),
      });
      throw new Error("导出字体写入失败");
    }
    const textOverlayTextFiles: string[] = [];
    for (let index = 0; index < validTextOverlays.length; index += 1) {
      const textFile = `${filePrefix}_txt_${index}.txt`;
      await removeFileIfExists(textFile);
      tempFiles.push(textFile);
      try {
        await ffmpeg.writeFile(
          textFile,
          new TextEncoder().encode(validTextOverlays[index].text)
        );
      } catch (error) {
        console.error("[clip-export-worker] write text failed", {
          requestId,
          textFile,
          index,
          text: validTextOverlays[index].text,
          error,
          message: error instanceof Error ? error.message : String(error),
        });
        throw new Error(`写入文本素材失败: ${textFile}`);
      }
      textOverlayTextFiles.push(textFile);
    }

    const buildArgs = (
      includeClipAudio: boolean,
      includeLineSpacing: boolean
    ) => {
      const filterComplex = buildFilterComplex(
        plan,
        includeClipAudio,
        textOverlays,
        includeLineSpacing,
        textOverlayTextFiles,
        fontFile
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

    const execWithLog = async (
      stage: string,
      includeClipAudio: boolean,
      includeLineSpacing: boolean
    ) => {
      if (!ffmpeg) {
        throw new Error("FFmpeg 未初始化");
      }
      const ff = ffmpeg;
      const args = buildArgs(includeClipAudio, includeLineSpacing);
      const filterComplexIndex = args.indexOf("-filter_complex");
      const filterComplex =
        filterComplexIndex >= 0 ? args[filterComplexIndex + 1] : "";
      console.log("[clip-export-worker] exec args", {
        requestId,
        stage,
        includeClipAudio,
        includeLineSpacing,
        args,
        filterComplex,
      });
      try {
        const exitCode = await ff.exec(args);
        if (exitCode !== 0) {
          console.error("[clip-export-worker] exec non-zero exit", {
            requestId,
            stage,
            includeClipAudio,
            includeLineSpacing,
            exitCode,
            args,
            filterComplex,
          });
          throw new Error(`FFmpeg 执行失败，退出码: ${exitCode}`);
        }
      } catch (error) {
        console.error("[clip-export-worker] exec failed", {
          requestId,
          stage,
          includeClipAudio,
          includeLineSpacing,
          error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          args,
          filterComplex,
        });
        throw error;
      }
    };

    postProgress(requestId, 55, "正在执行导出命令...");
    console.log("[clip-export-worker] ffmpeg exec start", { requestId });
    try {
      await execWithLog("primary", true, true);
    } catch (firstError) {
      const firstMessage =
        firstError instanceof Error ? firstError.message : String(firstError);
      console.warn("[clip-export-worker] audio track fallback", {
        requestId,
        firstMessage,
        firstError,
      });
      postProgress(requestId, 72, "素材音轨异常，切换静音轨重试...");
      const lineSpacingUnsupported =
        textOverlays.length > 0 &&
        /line_spacing|Option not found|No such filter option/i.test(
          firstMessage
        );
      try {
        await execWithLog(
          "fallback-no-audio",
          false,
          !lineSpacingUnsupported
        );
      } catch (secondError) {
        const secondMessage =
          secondError instanceof Error
            ? secondError.message
            : String(secondError);
        console.warn("[clip-export-worker] fallback failed", {
          requestId,
          secondMessage,
          secondError,
        });
        if (
          !lineSpacingUnsupported &&
          textOverlays.length > 0 &&
          /line_spacing|Option not found|No such filter option/i.test(
            secondMessage
          )
        ) {
          await execWithLog("fallback-no-audio-no-line-spacing", false, false);
        } else {
          throw secondError;
        }
      }
    }

    postProgress(requestId, 95, "正在读取导出文件...");
    let data: Uint8Array | string;
    try {
      data = await ffmpeg.readFile(outputFile);
    } catch (error) {
      let filesSnapshot: unknown = null;
      try {
        const ff = ffmpeg as unknown as { listDir?: (path: string) => unknown };
        filesSnapshot = ff.listDir ? ff.listDir("/") : null;
      } catch {
        filesSnapshot = null;
      }
      console.error("[clip-export-worker] read output failed", {
        requestId,
        outputFile,
        error,
        message: error instanceof Error ? error.message : String(error),
        filesSnapshot,
      });
      throw new Error(`读取导出文件失败: ${outputFile}`);
    }
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
      try {
        ffmpeg.terminate();
      } catch {
        // ignore terminate failures
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
      rawError: error,
      errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    postMessageToMain({
      type: "EXPORT_ERROR",
      requestId: message.requestId,
      error: errorMessage,
    });
  });
};
