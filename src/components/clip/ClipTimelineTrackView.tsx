import { useEffect, useRef } from "react";
import { useClipEditorStore } from "./clipEditorStore";
import { DEFAULT_ZOOM, MIN_CLIP_WIDTH } from "./clipTimelineConfig";
import { clamp, formatTime, isEditableElement } from "./clipTimelineUtils";
import { timelineZoomButtonClass } from "./styles";
import { ClipTimelineClipItem } from "./ClipTimelineClipItem";
import { ClipTimelineDragPreviewItem } from "./ClipTimelineDragPreviewItem";
import { ClipTimelinePlayhead } from "./ClipTimelinePlayhead";
import { ClipTimelineRuler } from "./ClipTimelineRuler";
import { useTimelineAudioPlayback } from "./useTimelineAudioPlayback";
import { useTimelineClipEditing } from "./useTimelineClipEditing";
import { useTimelineDragAndDrop } from "./useTimelineDragAndDrop";
import { useTimelinePlayback } from "./useTimelinePlayback";

export type TimelineDragPreview = {
  title: string;
  startSeconds: number;
  durationSeconds: number;
};

const TIMELINE_LEFT_INSET_PX = 20;

function ClipTimelineTrackCanvas() {
  const draggingAsset = useClipEditorStore((state) => state.draggingAsset);
  const selectedTimelineClipId = useClipEditorStore(
    (state) => state.selectedTimelineClipId
  );
  const selectedTimelineClipIds = useClipEditorStore(
    (state) => state.selectedTimelineClipIds
  );
  const selectedTimelineTrack = useClipEditorStore(
    (state) => state.selectedTimelineTrack
  );
  const timelineClips = useClipEditorStore((state) => state.timelineClips);
  const audioTimelineClips = useClipEditorStore(
    (state) => state.audioTimelineClips
  );
  const timelinePlaying = useClipEditorStore((state) => state.timelinePlaying);
  const setDraggingAsset = useClipEditorStore(
    (state) => state.setDraggingAsset
  );
  const setTimelinePlaying = useClipEditorStore(
    (state) => state.setTimelinePlaying
  );
  const setTrackTotalDurationSeconds = useClipEditorStore(
    (state) => state.setTrackTotalDurationSeconds
  );
  const setTimelineClips = useClipEditorStore(
    (state) => state.setTimelineClips
  );
  const setAudioTimelineClips = useClipEditorStore(
    (state) => state.setAudioTimelineClips
  );
  const setSelectedTimelineClip = useClipEditorStore(
    (state) => state.setSelectedTimelineClip
  );
  const previewTimelineClip = useClipEditorStore(
    (state) => state.previewTimelineClip
  );
  const previewEmptyFrame = useClipEditorStore(
    (state) => state.previewEmptyFrame
  );
  const syncTimelineFrame = useClipEditorStore(
    (state) => state.syncTimelineFrame
  );

  const playback = useTimelinePlayback({
    clips: timelineClips,
    playing: timelinePlaying,
    onPlayingChange: setTimelinePlaying,
    onTrackDurationChange: setTrackTotalDurationSeconds,
    onPreviewClip: previewTimelineClip,
    onPreviewEmptyFrame: previewEmptyFrame,
    onTimelineFrame: syncTimelineFrame,
  });

  const audioLaneRef = useRef<HTMLDivElement>(null);

  const videoDragAndDrop = useTimelineDragAndDrop({
    clips: timelineClips,
    setClips: setTimelineClips,
    draggingAsset,
    pixelsPerSecond: playback.pixelsPerSecond,
    laneRef: playback.laneRef,
    selectedClipId:
      selectedTimelineTrack === "video" ? selectedTimelineClipId : null,
    onPreviewClip: previewTimelineClip,
    onAssetDropComplete: () => setDraggingAsset(null),
    acceptedMediaType: "video",
    onAssetClipCreated: ({ createdClip, asset }) => {
      if (asset.mediaType !== "video") {
        return;
      }
      setAudioTimelineClips((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          assetId: `${createdClip.assetId}-audio`,
          title: `${createdClip.title} 音频`,
          mediaType: "audio",
          mediaDurationSeconds: createdClip.mediaDurationSeconds,
          durationSeconds: createdClip.durationSeconds,
          startSeconds: createdClip.startSeconds,
          sourceStartSeconds: createdClip.sourceStartSeconds,
          sourceEndSeconds: createdClip.sourceEndSeconds,
          objectUrl: createdClip.objectUrl,
          frameThumbnails: [],
          audioLevels: createdClip.audioLevels || [],
        },
      ]);
    },
  });

  const audioDragAndDrop = useTimelineDragAndDrop({
    clips: audioTimelineClips,
    setClips: setAudioTimelineClips,
    draggingAsset,
    pixelsPerSecond: playback.pixelsPerSecond,
    laneRef: audioLaneRef,
    selectedClipId:
      selectedTimelineTrack === "audio" ? selectedTimelineClipId : null,
    onAssetDropComplete: () => setDraggingAsset(null),
    acceptedMediaType: "audio",
  });

  const videoClipEditing = useTimelineClipEditing({
    clips: timelineClips,
    setClips: setTimelineClips,
    pixelsPerSecond: playback.pixelsPerSecond,
    selectedClipId:
      selectedTimelineTrack === "video" ? selectedTimelineClipId : null,
    selectedClipIds: selectedTimelineClipIds,
    draggingClipId: videoDragAndDrop.draggingClipId,
    clearDragState: videoDragAndDrop.clearDragState,
    isPlaying: playback.isPlaying,
    currentTimeRef: playback.currentTimeRef,
    onPreviewClip: previewTimelineClip,
    onPreviewEmptyFrame: previewEmptyFrame,
    emitTimelineFrame: playback.emitTimelineFrame,
    clearSelection: () => setSelectedTimelineClip(null, null),
  });

  const audioClipEditing = useTimelineClipEditing({
    clips: audioTimelineClips,
    setClips: setAudioTimelineClips,
    pixelsPerSecond: playback.pixelsPerSecond,
    selectedClipId:
      selectedTimelineTrack === "audio" ? selectedTimelineClipId : null,
    selectedClipIds: selectedTimelineClipIds,
    draggingClipId: audioDragAndDrop.draggingClipId,
    clearDragState: audioDragAndDrop.clearDragState,
    isPlaying: playback.isPlaying,
    currentTimeRef: playback.currentTimeRef,
    emitTimelineFrame: playback.emitTimelineFrame,
    clearSelection: () => setSelectedTimelineClip(null, null),
  });

  useEffect(() => {
    const videoEnd = timelineClips.reduce(
      (maxEnd, clip) =>
        Math.max(maxEnd, clip.startSeconds + clip.durationSeconds),
      0
    );
    const audioEnd = audioTimelineClips.reduce(
      (maxEnd, clip) =>
        Math.max(maxEnd, clip.startSeconds + clip.durationSeconds),
      0
    );
    setTrackTotalDurationSeconds(Math.max(videoEnd, audioEnd));
  }, [audioTimelineClips, setTrackTotalDurationSeconds, timelineClips]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isEditableElement(event.target)) {
        return;
      }
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }
      event.preventDefault();
      if (selectedTimelineClipIds.length > 0) {
        videoClipEditing.deleteSelectedClip();
        audioClipEditing.deleteSelectedClip();
        return;
      }
      if (selectedTimelineTrack === "audio") {
        audioClipEditing.deleteSelectedClip();
      } else {
        videoClipEditing.deleteSelectedClip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    audioClipEditing,
    selectedTimelineClipIds.length,
    selectedTimelineTrack,
    videoClipEditing,
  ]);

  const {
    scrollRef,
    laneRef,
    trackViewportRef,
    currentTimeSeconds,
    currentTimeX,
    pixelsPerSecond,
    minZoom,
    maxZoom,
    timelineWidthPx,
    majorGridWidth,
    minorGridWidth,
    rulerMarks,
    rulerTickMarks,
    isScrubbing,
    setPixelsPerSecond,
    handleSeekClick,
    handleSeekMouseDown,
    handlePlayheadMouseDown,
  } = playback;

  const zoomPercent = Math.round((pixelsPerSecond / DEFAULT_ZOOM) * 100);
  const renderedVideoClips =
    videoDragAndDrop.ripplePreviewClips ?? timelineClips;
  const renderedAudioClips =
    audioDragAndDrop.ripplePreviewClips ?? audioTimelineClips;
  const isAnyDragActive =
    Boolean(draggingAsset) ||
    Boolean(videoDragAndDrop.draggingClipId) ||
    Boolean(audioDragAndDrop.draggingClipId);
  const { audioRef } = useTimelineAudioPlayback({
    audioClips: renderedAudioClips,
    currentTimeSeconds,
    isPlaying: playback.isPlaying,
  });

  const handleSplitSelected = () => {
    if (selectedTimelineClipIds.length > 0) {
      videoClipEditing.splitSelectedClipAtPlayhead();
      audioClipEditing.splitSelectedClipAtPlayhead();
      return;
    }
    if (selectedTimelineTrack === "audio") {
      audioClipEditing.splitSelectedClipAtPlayhead();
      return;
    }
    videoClipEditing.splitSelectedClipAtPlayhead();
  };

  return (
    <>
      <audio ref={audioRef} className="hidden" preload="auto" />
      <div className="flex h-11 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
          <span className="rounded bg-white/10 px-2 py-1 text-[#d1d5db]">
            主时间线
          </span>
          <span>{formatTime(currentTimeSeconds)}</span>
          <span>缩放 {zoomPercent}%</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="cursor-pointer rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#d1d5db] hover:border-[#22d3ee]/70"
            title="切割工具"
            aria-label="切割工具"
            onClick={handleSplitSelected}
          >
            切割
          </button>
          <button
            className={timelineZoomButtonClass}
            onClick={() =>
              setPixelsPerSecond((prev) => clamp(prev + 2, minZoom, maxZoom))
            }
          >
            +
          </button>
          <button
            className={timelineZoomButtonClass}
            onClick={() =>
              setPixelsPerSecond((prev) => clamp(prev - 2, minZoom, maxZoom))
            }
          >
            -
          </button>
          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={1}
            value={pixelsPerSecond}
            onChange={(event) => setPixelsPerSecond(Number(event.target.value))}
            className="h-1.5 w-28 cursor-pointer appearance-none rounded-full bg-white/15 accent-[#67e8f9]"
            aria-label="时间轴缩放"
          />
        </div>
      </div>

      <div className="min-h-0 flex flex-1 items-stretch px-4 select-none">
        <div className="w-20 shrink-0 pr-3 text-xs text-[#9ca3af]">
          <div className="h-[52px]" aria-hidden="true" />
          <div className="flex h-16 items-center">视频轨道1</div>
          <div className="mt-2 flex h-6 items-center">音频轨道1</div>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
          <div ref={trackViewportRef} className="min-h-full">
            <div
              className="relative min-h-full"
              style={{ paddingLeft: `${TIMELINE_LEFT_INSET_PX}px` }}
            >
              <ClipTimelineRuler
                rulerMarks={rulerMarks}
                rulerTickMarks={rulerTickMarks}
                pixelsPerSecond={pixelsPerSecond}
                timelineWidthPx={timelineWidthPx}
                onSeekMouseDown={handleSeekMouseDown}
                onSeekClick={handleSeekClick}
              />

              <div className="space-y-2">
                <div
                  ref={laneRef}
                  data-clip-track-lane="video-1"
                  data-track-pps={pixelsPerSecond}
                  data-track-min-clip-width={MIN_CLIP_WIDTH}
                  className="relative h-16 rounded-md border border-dashed border-white/15 select-none"
                  style={{
                    width: `${timelineWidthPx}px`,
                    backgroundImage:
                      "repeating-linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 1px, transparent 1px, transparent 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08) 1px, transparent 1px, transparent 100%)",
                    backgroundSize: `${minorGridWidth}px 100%, ${majorGridWidth}px 100%`,
                  }}
                  onClick={(event) => {
                    handleSeekClick(event);
                    setSelectedTimelineClip(null, null);
                  }}
                  onDragOver={videoDragAndDrop.handleTrackDragOver}
                  onDragLeave={videoDragAndDrop.handleTrackDragLeave}
                  onDrop={videoDragAndDrop.handleTrackDrop}
                >
                  {renderedVideoClips.length === 0 ? (
                    <div className="absolute inset-0 grid place-items-center text-xs text-[#6b7280]">
                      从素材库拖拽视频到此轨道
                    </div>
                  ) : null}

                  {renderedVideoClips.map((clip, index) => (
                    <ClipTimelineClipItem
                      key={clip.id}
                      clip={clip}
                      index={index}
                      pixelsPerSecond={pixelsPerSecond}
                      selectedClipIds={selectedTimelineClipIds}
                      draggingClipId={videoDragAndDrop.draggingClipId}
                      resizingClipId={videoClipEditing.resizingClipId}
                      onClipClick={(clip, appendSelection) => {
                        setSelectedTimelineClip(clip.id, "video", appendSelection);
                        if (!appendSelection) {
                          previewTimelineClip(clip);
                        }
                      }}
                      onClipDragStart={videoDragAndDrop.handleClipDragStart}
                      onClipDragEnd={videoDragAndDrop.handleClipDragEnd}
                      onClipLeftResizeStart={
                        videoClipEditing.handleClipLeftResizeStart
                      }
                      onClipResizeStart={videoClipEditing.handleClipResizeStart}
                    />
                  ))}

                  {videoDragAndDrop.dragPreview ? (
                    <ClipTimelineDragPreviewItem
                      dragPreview={videoDragAndDrop.dragPreview}
                      pixelsPerSecond={pixelsPerSecond}
                    />
                  ) : null}
                </div>

                <div
                  ref={audioLaneRef}
                  data-clip-track-lane="audio-1"
                  data-track-pps={pixelsPerSecond}
                  data-track-min-clip-width={MIN_CLIP_WIDTH}
                  className="relative h-6 rounded-md border border-dashed border-white/10 bg-white/[0.02]"
                  style={{
                    width: `${timelineWidthPx}px`,
                    backgroundImage:
                      "repeating-linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02) 1px, transparent 1px, transparent 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 1px, transparent 1px, transparent 100%)",
                    backgroundSize: `${minorGridWidth}px 100%, ${majorGridWidth}px 100%`,
                  }}
                  onClick={(event) => {
                    handleSeekClick(event);
                    setSelectedTimelineClip(null, null);
                  }}
                  onDragOver={audioDragAndDrop.handleTrackDragOver}
                  onDragLeave={audioDragAndDrop.handleTrackDragLeave}
                  onDrop={audioDragAndDrop.handleTrackDrop}
                >
                  {renderedAudioClips.length === 0 ? (
                    <div className="absolute inset-0 grid place-items-center text-xs text-[#6b7280]">
                      从素材库拖拽音频到此轨道
                    </div>
                  ) : null}

                  {renderedAudioClips.map((clip, index) => (
                    <ClipTimelineClipItem
                      key={clip.id}
                      clip={clip}
                      index={index}
                      compact
                      pixelsPerSecond={pixelsPerSecond}
                      selectedClipIds={selectedTimelineClipIds}
                      draggingClipId={audioDragAndDrop.draggingClipId}
                      resizingClipId={audioClipEditing.resizingClipId}
                      onClipClick={(_, appendSelection) =>
                        setSelectedTimelineClip(clip.id, "audio", appendSelection)
                      }
                      onClipDragStart={audioDragAndDrop.handleClipDragStart}
                      onClipDragEnd={audioDragAndDrop.handleClipDragEnd}
                      onClipLeftResizeStart={
                        audioClipEditing.handleClipLeftResizeStart
                      }
                      onClipResizeStart={audioClipEditing.handleClipResizeStart}
                    />
                  ))}

                  {audioDragAndDrop.dragPreview ? (
                    <ClipTimelineDragPreviewItem
                      dragPreview={audioDragAndDrop.dragPreview}
                      pixelsPerSecond={pixelsPerSecond}
                      compact
                    />
                  ) : null}
                </div>
              </div>

              <ClipTimelinePlayhead
                currentTimeX={currentTimeX}
                isScrubbing={isScrubbing}
                startOffsetPx={TIMELINE_LEFT_INSET_PX}
                disablePointerEvents={isAnyDragActive}
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
