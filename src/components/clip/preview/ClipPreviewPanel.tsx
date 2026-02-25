import { useRef } from "react";
import { ClipPanelFrame } from "../shared/ClipPanelFrame";
import { useClipEditorStore } from "../store/clipEditorStore";
import { useClipPreviewController } from "./useClipPreviewController";
import { ClipPreviewStickerOverlayLayer } from "./ClipPreviewStickerOverlayLayer";
import { ClipPreviewTextOverlayLayer } from "./ClipPreviewTextOverlayLayer";
import { ClipPreviewControlBar } from "./ClipPreviewControlBar";

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
  const setSelectedInspectorAsset = useClipEditorStore(
    (state) => state.setSelectedInspectorAsset
  );
  const setSelectedPreviewVideoInfo = useClipEditorStore(
    (state) => state.setSelectedPreviewVideoInfo
  );
  const selectedInspectorSticker = useClipEditorStore(
    (state) => state.selectedInspectorSticker
  );
  const setSelectedInspectorSticker = useClipEditorStore(
    (state) => state.setSelectedInspectorSticker
  );
  const textOverlays = useClipEditorStore((state) => state.textOverlays);
  const stickerOverlays = useClipEditorStore((state) => state.stickerOverlays);
  const setTextOverlays = useClipEditorStore((state) => state.setTextOverlays);
  const setStickerOverlays = useClipEditorStore(
    (state) => state.setStickerOverlays
  );
  const previewStageRef = useRef<HTMLDivElement>(null);
  const timelineSource =
    previewSource?.sourceType === "timeline" ? previewSource : null;
  const { videoRef, isEmptySource, effectivePlaying, togglePlayPause, seekBy } =
    useClipPreviewController({
      previewSource,
      timelinePlaying,
      onToggleTimelinePlaying: setTimelinePlaying,
    });

  const activeTextOverlays = textOverlays.filter(
    (overlay) =>
      timelineCurrentTimeSeconds >= overlay.startSeconds &&
      timelineCurrentTimeSeconds < overlay.endSeconds
  );
  const activeStickerOverlays = stickerOverlays.filter(
    (overlay) =>
      timelineCurrentTimeSeconds >= overlay.startSeconds &&
      timelineCurrentTimeSeconds < overlay.endSeconds
  );
  const showPreviewStage =
    Boolean(previewSource) ||
    activeTextOverlays.length > 0 ||
    activeStickerOverlays.length > 0;


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
                    请导入视频开始编辑
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
                          onClick={() => {
                            if (!timelineSource) {
                              return;
                            }
                            setSelectedInspectorAsset(null);
                            setSelectedInspectorSticker(null);
                            setSelectedPreviewVideoInfo({
                              objectUrl: timelineSource.objectUrl,
                              durationSeconds: timelineSource.durationSeconds,
                              sourceStartSeconds:
                                timelineSource.sourceStartSeconds,
                              sourceEndSeconds: timelineSource.sourceEndSeconds,
                            });
                          }}
                        />
                      ) : (
                        <div className="h-full w-full bg-black" />
                      )}
                    </>
                  )}
                  <ClipPreviewTextOverlayLayer
                    stageRef={previewStageRef}
                    textOverlays={textOverlays}
                    currentTimeSeconds={timelineCurrentTimeSeconds}
                    setTextOverlays={setTextOverlays}
                  />
                  <ClipPreviewStickerOverlayLayer
                    stageRef={previewStageRef}
                    stickerOverlays={stickerOverlays}
                    currentTimeSeconds={timelineCurrentTimeSeconds}
                    selectedStickerId={selectedInspectorSticker?.id ?? null}
                    onSelectSticker={(sticker) => {
                      setSelectedInspectorAsset(null);
                      setSelectedPreviewVideoInfo(null);
                      setSelectedInspectorSticker(sticker);
                    }}
                    onClearSelection={() => setSelectedInspectorSticker(null)}
                    setStickerOverlays={setStickerOverlays}
                  />
                </div>
              )}
            </div>
            <ClipPreviewControlBar
              currentTimeSeconds={timelineCurrentTimeSeconds}
              totalDurationSeconds={timelineTotalDurationSeconds}
              isPlaying={effectivePlaying}
              onTogglePlayPause={togglePlayPause}
              onSeekBy={seekBy}
            />
          </div>
        </div>
      </div>
    </ClipPanelFrame>
  );
}
