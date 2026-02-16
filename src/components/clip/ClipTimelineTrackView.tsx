import { useClipEditorStore } from "./clipEditorStore";
import {
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  MIN_CLIP_WIDTH,
} from "./clipTimelineConfig";
import { clamp, formatTime } from "./clipTimelineUtils";
import { timelineZoomButtonClass } from "./styles";
import { ClipTimelineClipItem } from "./ClipTimelineClipItem";
import { ClipTimelineDragPreviewItem } from "./ClipTimelineDragPreviewItem";
import { ClipTimelinePlayhead } from "./ClipTimelinePlayhead";
import { ClipTimelineRuler } from "./ClipTimelineRuler";
import { useTimelineClipEditing } from "./useTimelineClipEditing";
import { useTimelineDragAndDrop } from "./useTimelineDragAndDrop";
import { useTimelinePlayback } from "./useTimelinePlayback";

export type TimelineDragPreview = {
  title: string;
  startSeconds: number;
  durationSeconds: number;
};

function ClipTimelineTrackCanvas() {
  const draggingAsset = useClipEditorStore((state) => state.draggingAsset);
  const selectedTimelineClipId = useClipEditorStore(
    (state) => state.selectedTimelineClipId
  );
  const timelineClips = useClipEditorStore((state) => state.timelineClips);
  const timelinePlaying = useClipEditorStore((state) => state.timelinePlaying);
  const setDraggingAsset = useClipEditorStore((state) => state.setDraggingAsset);
  const setTimelinePlaying = useClipEditorStore(
    (state) => state.setTimelinePlaying
  );
  const setTrackTotalDurationSeconds = useClipEditorStore(
    (state) => state.setTrackTotalDurationSeconds
  );
  const setTimelineClips = useClipEditorStore((state) => state.setTimelineClips);
  const previewTimelineClip = useClipEditorStore(
    (state) => state.previewTimelineClip
  );
  const previewEmptyFrame = useClipEditorStore((state) => state.previewEmptyFrame);
  const syncTimelineFrame = useClipEditorStore((state) => state.syncTimelineFrame);

  const playback = useTimelinePlayback({
    clips: timelineClips,
    playing: timelinePlaying,
    onPlayingChange: setTimelinePlaying,
    onTrackDurationChange: setTrackTotalDurationSeconds,
    onPreviewClip: previewTimelineClip,
    onPreviewEmptyFrame: previewEmptyFrame,
    onTimelineFrame: syncTimelineFrame,
  });

  const dragAndDrop = useTimelineDragAndDrop({
    clips: timelineClips,
    setClips: setTimelineClips,
    draggingAsset,
    pixelsPerSecond: playback.pixelsPerSecond,
    laneRef: playback.laneRef,
    scrollRef: playback.scrollRef,
    selectedClipId: selectedTimelineClipId,
    onPreviewClip: previewTimelineClip,
    onAssetDropComplete: () => setDraggingAsset(null),
  });

  const clipEditing = useTimelineClipEditing({
    clips: timelineClips,
    setClips: setTimelineClips,
    pixelsPerSecond: playback.pixelsPerSecond,
    selectedClipId: selectedTimelineClipId,
    draggingClipId: dragAndDrop.draggingClipId,
    clearDragState: dragAndDrop.clearDragState,
    isPlaying: playback.isPlaying,
    currentTimeRef: playback.currentTimeRef,
    onPreviewClip: previewTimelineClip,
    onPreviewEmptyFrame: previewEmptyFrame,
    emitTimelineFrame: playback.emitTimelineFrame,
  });

  const {
    scrollRef,
    laneRef,
    trackViewportRef,
    currentTimeSeconds,
    currentTimeX,
    pixelsPerSecond,
    majorGridWidth,
    minorGridWidth,
    rulerMarks,
    rulerTickMarks,
    isScrubbing,
    setPixelsPerSecond,
    handleSeekClick,
    handlePlayheadMouseDown,
  } = playback;
  const {
    dragPreview,
    ripplePreviewClips,
    draggingClipId,
    handleTrackDrop,
    handleTrackDragOver,
    handleTrackDragLeave,
    handleClipDragStart,
    handleClipDragEnd,
  } = dragAndDrop;
  const {
    resizingClipId,
    handleClipResizeStart,
    handleClipLeftResizeStart,
    splitSelectedClipAtPlayhead,
  } = clipEditing;

  const zoomPercent = Math.round((playback.pixelsPerSecond / DEFAULT_ZOOM) * 100);
  const renderedClips = ripplePreviewClips ?? timelineClips;

  return (
    <>
      <div className="flex h-11 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
          <span className="rounded bg-white/10 px-2 py-1 text-[#d1d5db]">主时间线</span>
          <span>{formatTime(currentTimeSeconds)}</span>
          <span>缩放 {zoomPercent}%</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="cursor-pointer rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#d1d5db] hover:border-[#22d3ee]/70"
            title="切割工具"
            aria-label="切割工具"
            onClick={splitSelectedClipAtPlayhead}
          >
            切割
          </button>
          <button
            className={timelineZoomButtonClass}
            onClick={() =>
              setPixelsPerSecond((prev) => clamp(prev + 2, MIN_ZOOM, MAX_ZOOM))
            }
          >
            +
          </button>
          <button
            className={timelineZoomButtonClass}
            onClick={() =>
              setPixelsPerSecond((prev) => clamp(prev - 2, MIN_ZOOM, MAX_ZOOM))
            }
          >
            -
          </button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={1}
            value={pixelsPerSecond}
            onChange={(event) => setPixelsPerSecond(Number(event.target.value))}
            className="h-1.5 w-28 cursor-pointer appearance-none rounded-full bg-white/15 accent-[#67e8f9]"
            aria-label="时间轴缩放"
          />
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto px-4 select-none">
        <div className="flex min-h-full items-stretch gap-3">
          <div className="w-20 shrink-0 pt-7 text-xs text-[#9ca3af]">视频轨道1</div>
          <div ref={trackViewportRef} className="min-h-full flex-1">
            <div className="relative min-h-full">
              <ClipTimelineRuler
                rulerMarks={rulerMarks}
                rulerTickMarks={rulerTickMarks}
                pixelsPerSecond={pixelsPerSecond}
                onSeekClick={handleSeekClick}
              />

              <div
                ref={laneRef}
                data-clip-track-lane="video-1"
                data-track-pps={pixelsPerSecond}
                data-track-min-clip-width={MIN_CLIP_WIDTH}
                className="relative h-16 rounded-md border border-dashed border-white/15 select-none"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 1px, transparent 1px, transparent 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08) 1px, transparent 1px, transparent 100%)",
                  backgroundSize: `${minorGridWidth}px 100%, ${majorGridWidth}px 100%`,
                }}
                onClick={handleSeekClick}
                onDragOver={handleTrackDragOver}
                onDragLeave={handleTrackDragLeave}
                onDrop={handleTrackDrop}
              >
                {renderedClips.length === 0 ? (
                  <div className="absolute inset-0 grid place-items-center text-xs text-[#6b7280]">
                    从素材库拖拽视频到此轨道
                  </div>
                ) : null}

                {renderedClips.map((clip, index) => (
                  <ClipTimelineClipItem
                    key={clip.id}
                    clip={clip}
                    index={index}
                    pixelsPerSecond={pixelsPerSecond}
                    selectedClipId={selectedTimelineClipId}
                    draggingClipId={draggingClipId}
                    resizingClipId={resizingClipId}
                    onClipClick={previewTimelineClip}
                    onClipDragStart={handleClipDragStart}
                    onClipDragEnd={handleClipDragEnd}
                    onClipLeftResizeStart={handleClipLeftResizeStart}
                    onClipResizeStart={handleClipResizeStart}
                  />
                ))}

                {dragPreview ? (
                  <ClipTimelineDragPreviewItem
                    dragPreview={dragPreview}
                    pixelsPerSecond={pixelsPerSecond}
                  />
                ) : null}
              </div>

              <ClipTimelinePlayhead
                currentTimeX={currentTimeX}
                isScrubbing={isScrubbing}
                onPlayheadMouseDown={handlePlayheadMouseDown}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function ClipTimelineTrackView() {
  return <ClipTimelineTrackCanvas />;
}
