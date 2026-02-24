import { useRef } from "react";
import { ClipPanelFrame } from "../shared/ClipPanelFrame";
import { useClipEditorStore } from "../store/clipEditorStore";
import { formatDuration } from "../shared/time";
import { useClipPreviewController } from "./useClipPreviewController";
import {
  FastForwardIcon,
  PauseIcon,
  PlayIcon,
  RewindIcon,
} from "../shared/icons";

const SEEK_STEP_SECONDS = 2;

export function ClipPreviewPanel() {
  const previewSource = useClipEditorStore((state) => state.previewSource);
  const timelinePlaying = useClipEditorStore((state) => state.timelinePlaying);
  const timelineTotalDurationSeconds = useClipEditorStore(
    (state) => state.trackTotalDurationSeconds
  );
  const timelineCurrentTimeSeconds = useClipEditorStore(
    (state) => state.timelineCurrentTimeSeconds
  );
  const setTimelinePlaying = useClipEditorStore(
    (state) => state.setTimelinePlaying
  );
  const textOverlays = useClipEditorStore((state) => state.textOverlays);
  const setTextOverlays = useClipEditorStore((state) => state.setTextOverlays);
  const previewStageRef = useRef<HTMLDivElement>(null);
  const timelineSource =
    previewSource?.sourceType === "timeline" ? previewSource : null;
  const {
    videoRef,
    isEmptySource,
    effectivePlaying,
    togglePlayPause,
    seekBy,
  } = useClipPreviewController({
    previewSource,
    timelinePlaying,
    onToggleTimelinePlaying: setTimelinePlaying,
  });

  const activeTextOverlays = textOverlays.filter(
    (overlay) =>
      timelineCurrentTimeSeconds >= overlay.startSeconds &&
      timelineCurrentTimeSeconds < overlay.endSeconds
  );
  const showPreviewStage = Boolean(previewSource) || activeTextOverlays.length > 0;

  const handleOverlayDragStart = (
    event: React.MouseEvent<HTMLDivElement>,
    overlayId: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const stage = previewStageRef.current;
    if (!stage) {
      return;
    }

    const rect = stage.getBoundingClientRect();
    const updatePosition = (clientX: number, clientY: number) => {
      const xPercent = Math.max(
        0,
        Math.min(100, ((clientX - rect.left) / rect.width) * 100)
      );
      const yPercent = Math.max(
        0,
        Math.min(100, ((clientY - rect.top) / rect.height) * 100)
      );
      setTextOverlays((prev) =>
        prev.map((overlay) =>
          overlay.id === overlayId
            ? { ...overlay, xPercent, yPercent }
            : overlay
        )
      );
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updatePosition(moveEvent.clientX, moveEvent.clientY);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <ClipPanelFrame
      title="预览窗口"
      titleClassName="text-[#d1d5db] font-normal"
      className="bg-[#0b111b]/90"
      bodyClassName="p-3 md:p-6"
      rightSlot={
        <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
          <span>16:9</span>
          <span className="h-1 w-1 rounded-full bg-[#6b7280]" />
          <span>1080P</span>
        </div>
      }
    >
      <div className="min-h-0 h-full flex-1">
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex h-full w-full max-w-3xl flex-col">
            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_30px_80px_-30px_rgba(34,211,238,0.35)]">
              {!showPreviewStage && (
                <div className="relative h-full w-full overflow-hidden bg-[#090d14]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#22d3ee30_0%,transparent_35%),radial-gradient(circle_at_75%_75%,#3b82f640_0%,transparent_42%)]" />
                  <div className="absolute inset-0 grid place-items-center text-sm text-[#9ca3af]">
                    请在时间轴选择片段进行预览
                  </div>
                </div>
              )}
              {showPreviewStage && (
                <div ref={previewStageRef} className="relative h-full w-full">
                  {isEmptySource ? (
                    <div className="h-full w-full bg-black" />
                  ) : (
                    <>
                      {previewSource ? (
                        <video
                          key={`${timelineSource?.sourceType}-${timelineSource?.objectUrl}`}
                          ref={videoRef}
                          src={timelineSource?.objectUrl}
                          className="h-full w-full object-contain"
                          playsInline
                          muted
                        />
                      ) : (
                        <div className="h-full w-full bg-black" />
                      )}
                    </>
                  )}
                  {activeTextOverlays.map((overlay) => (
                    <div
                      key={overlay.id}
                      className="absolute cursor-move select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
                      style={{
                        left: `${overlay.xPercent}%`,
                        top: `${overlay.yPercent}%`,
                        transform: "translate(-50%, -50%)",
                        color: overlay.color,
                        fontSize: `${overlay.fontSize}px`,
                        fontWeight: 600,
                        textAlign: "center",
                        whiteSpace: "pre-wrap",
                      }}
                      onMouseDown={(event) =>
                        handleOverlayDragStart(event, overlay.id)
                      }
                    >
                      {overlay.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2 relative flex items-center justify-center rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-[#d1d5db]">
              <div className="flex items-center gap-2">
                <button
                  className="cursor-pointer rounded border border-white/15 bg-white/5 p-2 hover:border-[#22d3ee]/70"
                  onClick={() => seekBy(-SEEK_STEP_SECONDS)}
                  aria-label="快退2秒"
                  title="快退 2 秒"
                >
                  <RewindIcon />
                </button>
                <button
                  className="cursor-pointer rounded border border-white/15 bg-white/5 p-2 hover:border-[#22d3ee]/70"
                  onClick={togglePlayPause}
                  aria-label={effectivePlaying ? "暂停" : "播放"}
                  title={effectivePlaying ? "暂停" : "播放"}
                >
                  {effectivePlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button
                  className="cursor-pointer rounded border border-white/15 bg-white/5 p-2 hover:border-[#22d3ee]/70"
                  onClick={() => seekBy(SEEK_STEP_SECONDS)}
                  aria-label="快进2秒"
                  title="快进 2 秒"
                >
                  <FastForwardIcon />
                </button>
              </div>
              <div className="text-right text-[#9ca3af] absolute right-3">
                <p>
                  {formatDuration(timelineCurrentTimeSeconds)} /{" "}
                  {formatDuration(timelineTotalDurationSeconds)}
                </p>
                <p className="text-[11px] text-[#6b7280]">
                  总时长 {formatDuration(timelineTotalDurationSeconds)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClipPanelFrame>
  );
}
