import { ClipPanelFrame } from "../shared/ClipPanelFrame";
import { useClipEditorStore } from "../store/clipEditorStore";
import { formatDuration } from "../shared/time";
import { useClipPreviewController } from "./useClipPreviewController";

const SEEK_STEP_SECONDS = 2;

export function ClipPreviewPanel() {
  const previewSource = useClipEditorStore((state) => state.previewSource);
  const timelinePlaying = useClipEditorStore((state) => state.timelinePlaying);
  const timelineTotalDurationSeconds = useClipEditorStore(
    (state) => state.trackTotalDurationSeconds
  );
  const setTimelinePlaying = useClipEditorStore(
    (state) => state.setTimelinePlaying
  );
  const timelineSource =
    previewSource?.sourceType === "timeline" ? previewSource : null;
  const {
    videoRef,
    isEmptySource,
    effectivePlaying,
    timelineCurrentSeconds,
    togglePlayPause,
    seekBy,
  } = useClipPreviewController({
    previewSource,
    timelinePlaying,
    onToggleTimelinePlaying: setTimelinePlaying,
  });

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
              {!previewSource && (
                <div className="relative h-full w-full overflow-hidden bg-[#090d14]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#22d3ee30_0%,transparent_35%),radial-gradient(circle_at_75%_75%,#3b82f640_0%,transparent_42%)]" />
                  <div className="absolute inset-0 grid place-items-center text-sm text-[#9ca3af]">
                    请在时间轴选择片段进行预览
                  </div>
                </div>
              )}
              {previewSource && (
                <>
                  {isEmptySource ? (
                    <div className="grid h-full w-full place-items-center bg-black text-sm text-[#9ca3af]">
                      空白帧预览
                    </div>
                  ) : (
                    <video
                      key={`${timelineSource?.sourceType}-${timelineSource?.objectUrl}`}
                      ref={videoRef}
                      src={timelineSource?.objectUrl}
                      className="h-full w-full object-contain"
                      playsInline
                      muted
                    />
                  )}
                </>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-[#d1d5db]">
              <div className="flex items-center gap-2">
                <button
                  className="cursor-pointer rounded border border-white/15 bg-white/5 px-2 py-1 hover:border-[#22d3ee]/70"
                  onClick={() => seekBy(-SEEK_STEP_SECONDS)}
                >
                  « 2s
                </button>
                <button
                  className="cursor-pointer rounded border border-white/15 bg-white/5 px-3 py-1 hover:border-[#22d3ee]/70"
                  onClick={togglePlayPause}
                >
                  {effectivePlaying ? "暂停" : "播放"}
                </button>
                <button
                  className="cursor-pointer rounded border border-white/15 bg-white/5 px-2 py-1 hover:border-[#22d3ee]/70"
                  onClick={() => seekBy(SEEK_STEP_SECONDS)}
                >
                  2s »
                </button>
              </div>
              <div className="text-right text-[#9ca3af]">
                <p>
                  {formatDuration(timelineCurrentSeconds)} /{" "}
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
