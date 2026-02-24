import type { ClipTextOverlay, ClipTrackClip } from "../shared/types";

type ExportProgressPayload = {
  progress: number;
  message: string;
};

type ExportTimelineOptions = {
  textOverlays?: ClipTextOverlay[];
  onProgress?: (payload: ExportProgressPayload) => void;
};

export type ExportTimelineResult = {
  blob: Blob;
  filename: string;
};

type ExportRequestMessage = {
  type: "EXPORT";
  requestId: string;
  clips: ClipTrackClip[];
  textOverlays: ClipTextOverlay[];
};

type ExportWorkerMessage =
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

let exportWorker: Worker | null = null;

function getExportWorker() {
  if (exportWorker) {
    return exportWorker;
  }
  exportWorker = new Worker(new URL("./exportTimeline.worker.ts", import.meta.url), {
    type: "module",
  });
  return exportWorker;
}

export async function exportTimelineToMp4(
  clips: ClipTrackClip[],
  options: ExportTimelineOptions = {}
): Promise<ExportTimelineResult> {
  const { onProgress, textOverlays = [] } = options;
  if (clips.length === 0) {
    throw new Error("时间轴没有片段可导出");
  }

  const worker = getExportWorker();
  const requestId = crypto.randomUUID();
  console.log("[clip-export] start", {
    requestId,
    clipCount: clips.length,
    textOverlayCount: textOverlays.length,
  });
  onProgress?.({ progress: 1, message: "正在创建导出任务..." });

  return await new Promise<ExportTimelineResult>((resolve, reject) => {
    const handleMessage = (event: MessageEvent<ExportWorkerMessage>) => {
      const message = event.data;
      if (!message || message.requestId !== requestId) {
        return;
      }

      if (message.type === "EXPORT_PROGRESS") {
        console.log("[clip-export] progress", {
          requestId,
          progress: message.progress,
          message: message.message,
        });
        onProgress?.({
          progress: Math.max(0, Math.min(100, message.progress)),
          message: message.message,
        });
        return;
      }

      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);

      if (message.type === "EXPORT_ERROR") {
        console.error("[clip-export] failed", {
          requestId,
          error: message.error,
        });
        reject(new Error(message.error));
        return;
      }

      const bytes = new Uint8Array(message.bytes);
      const blob = new Blob([bytes], { type: "video/mp4" });
      console.log("[clip-export] done", {
        requestId,
        filename: message.filename,
        size: bytes.byteLength,
      });
      onProgress?.({ progress: 100, message: "导出完成" });
      resolve({ blob, filename: message.filename });
    };

    const handleError = (event: ErrorEvent) => {
      console.error("[clip-export] worker error", {
        requestId,
        message: event.message,
      });
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      reject(new Error(event.message || "导出失败，请稍后重试"));
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);

    const message: ExportRequestMessage = {
      type: "EXPORT",
      requestId,
      clips,
      textOverlays,
    };
    worker.postMessage(message);
  });
}
