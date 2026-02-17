import { useEffect, useRef } from "react";
import { useClipEditorStore } from "../store/clipEditorStore";
import { ClipTimelineLane } from "./ClipTimelineLane";
import { ClipTimelinePlayhead } from "./ClipTimelinePlayhead";
import { ClipTimelineRuler } from "./ClipTimelineRuler";
import { ClipTimelineToolbar } from "./ClipTimelineToolbar";
import { useTimelineAudioPlayback } from "./useTimelineAudioPlayback";
import { useTimelineClipEditing } from "./useTimelineClipEditing";
import { useTimelineDragAndDrop } from "./useTimelineDragAndDrop";
import { useTimelineHotkeys } from "./useTimelineHotkeys";
import { useTimelinePlayback } from "./useTimelinePlayback";
import { useTimelineSelectionActions } from "./useTimelineSelectionActions";

export type TimelineDragPreview = {
  title: string;
  startSeconds: number;
  durationSeconds: number;
};

const TIMELINE_LEFT_INSET_PX = 20;

export function ClipTimelineTrackView() {
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

  useTimelineHotkeys({
    selectedTimelineTrack,
    selectedTimelineClipCount: selectedTimelineClipIds.length,
    onDeleteVideo: videoClipEditing.deleteSelectedClip,
    onDeleteAudio: audioClipEditing.deleteSelectedClip,
  });

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

  const {
    handleSplitSelected,
    handleTrackClick,
    handleVideoClipClick,
    handleAudioClipClick,
  } = useTimelineSelectionActions({
    selectedTimelineTrack,
    selectedTimelineClipCount: selectedTimelineClipIds.length,
    setSelectedTimelineClip,
    previewTimelineClip,
    onSplitVideo: videoClipEditing.splitSelectedClipAtPlayhead,
    onSplitAudio: audioClipEditing.splitSelectedClipAtPlayhead,
    onSeekClick: handleSeekClick,
  });

  return (
    <>
      <audio ref={audioRef} className="hidden" preload="auto" />
      <ClipTimelineToolbar
        currentTimeSeconds={currentTimeSeconds}
        pixelsPerSecond={pixelsPerSecond}
        minZoom={minZoom}
        maxZoom={maxZoom}
        onSplitSelected={handleSplitSelected}
        setPixelsPerSecond={setPixelsPerSecond}
      />

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
                <ClipTimelineLane
                  laneRef={laneRef}
                  laneId="video-1"
                  laneHeightClassName="h-16"
                  laneClassName="border border-dashed border-white/15"
                  styleBackgroundImage="repeating-linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 1px, transparent 1px, transparent 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08) 1px, transparent 1px, transparent 100%)"
                  emptyHint="从素材库拖拽视频到此轨道"
                  clips={renderedVideoClips}
                  selectedClipIds={selectedTimelineClipIds}
                  draggingClipId={videoDragAndDrop.draggingClipId}
                  resizingClipId={videoClipEditing.resizingClipId}
                  dragPreview={videoDragAndDrop.dragPreview}
                  pixelsPerSecond={pixelsPerSecond}
                  timelineWidthPx={timelineWidthPx}
                  majorGridWidth={majorGridWidth}
                  minorGridWidth={minorGridWidth}
                  onTrackClick={handleTrackClick}
                  onTrackDragOver={videoDragAndDrop.handleTrackDragOver}
                  onTrackDragLeave={videoDragAndDrop.handleTrackDragLeave}
                  onTrackDrop={videoDragAndDrop.handleTrackDrop}
                  onClipClick={handleVideoClipClick}
                  onClipDragStart={videoDragAndDrop.handleClipDragStart}
                  onClipDragEnd={videoDragAndDrop.handleClipDragEnd}
                  onClipLeftResizeStart={videoClipEditing.handleClipLeftResizeStart}
                  onClipResizeStart={videoClipEditing.handleClipResizeStart}
                />

                <ClipTimelineLane
                  laneRef={audioLaneRef}
                  laneId="audio-1"
                  laneHeightClassName="h-6"
                  laneClassName="border border-dashed border-white/10 bg-white/[0.02]"
                  styleBackgroundImage="repeating-linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02) 1px, transparent 1px, transparent 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 1px, transparent 1px, transparent 100%)"
                  emptyHint="从素材库拖拽音频到此轨道"
                  clips={renderedAudioClips}
                  compact
                  selectedClipIds={selectedTimelineClipIds}
                  draggingClipId={audioDragAndDrop.draggingClipId}
                  resizingClipId={audioClipEditing.resizingClipId}
                  dragPreview={audioDragAndDrop.dragPreview}
                  pixelsPerSecond={pixelsPerSecond}
                  timelineWidthPx={timelineWidthPx}
                  majorGridWidth={majorGridWidth}
                  minorGridWidth={minorGridWidth}
                  onTrackClick={handleTrackClick}
                  onTrackDragOver={audioDragAndDrop.handleTrackDragOver}
                  onTrackDragLeave={audioDragAndDrop.handleTrackDragLeave}
                  onTrackDrop={audioDragAndDrop.handleTrackDrop}
                  onClipClick={handleAudioClipClick}
                  onClipDragStart={audioDragAndDrop.handleClipDragStart}
                  onClipDragEnd={audioDragAndDrop.handleClipDragEnd}
                  onClipLeftResizeStart={audioClipEditing.handleClipLeftResizeStart}
                  onClipResizeStart={audioClipEditing.handleClipResizeStart}
                />
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
