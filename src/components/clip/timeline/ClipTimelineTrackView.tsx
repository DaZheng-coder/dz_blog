import { useRef, type CSSProperties } from "react";
import { useShallow } from "zustand/react/shallow";
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
const CUT_CURSOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.2 8.1 20 20"/><path d="M20 4 8.2 15.9"/></svg>`;
const CUT_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(CUT_CURSOR_SVG)}") 10 10, crosshair`;

export function ClipTimelineTrackView() {
  const {
    draggingAsset,
    selectedTimelineClipId,
    selectedTimelineClipIds,
    selectedTimelineTrack,
    timelineClips,
    audioTimelineClips,
    timelinePlaying,
    timelineToolMode,
    setDraggingAsset,
    setTimelinePlaying,
    setTimelineToolMode,
    setTrackTotalDurationSeconds,
    setTimelineClips,
    setAudioTimelineClips,
    setSelectedTimelineClip,
    previewTimelineClip,
    previewEmptyFrame,
    syncTimelineFrame,
  } = useClipEditorStore(
    useShallow((state) => ({
      draggingAsset: state.draggingAsset,
      selectedTimelineClipId: state.selectedTimelineClipId,
      selectedTimelineClipIds: state.selectedTimelineClipIds,
      selectedTimelineTrack: state.selectedTimelineTrack,
      timelineClips: state.timelineClips,
      audioTimelineClips: state.audioTimelineClips,
      timelinePlaying: state.timelinePlaying,
      timelineToolMode: state.timelineToolMode,
      setDraggingAsset: state.setDraggingAsset,
      setTimelinePlaying: state.setTimelinePlaying,
      setTimelineToolMode: state.setTimelineToolMode,
      setTrackTotalDurationSeconds: state.setTrackTotalDurationSeconds,
      setTimelineClips: state.setTimelineClips,
      setAudioTimelineClips: state.setAudioTimelineClips,
      setSelectedTimelineClip: state.setSelectedTimelineClip,
      previewTimelineClip: state.previewTimelineClip,
      previewEmptyFrame: state.previewEmptyFrame,
      syncTimelineFrame: state.syncTimelineFrame,
    }))
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
    scrollLeft,
    trackViewportWidth,
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
    handleSelectTool,
    handleCutTool,
    handleTrackClick,
    handleVideoClipClick,
    handleAudioClipClick,
  } = useTimelineSelectionActions({
    timelineToolMode,
    selectedTimelineTrack,
    selectedTimelineClipCount: selectedTimelineClipIds.length,
    pixelsPerSecond,
    setTimelineToolMode,
    setSelectedTimelineClip,
    previewTimelineClip,
    onSplitVideo: videoClipEditing.splitSelectedClipAtPlayhead,
    onSplitAudio: audioClipEditing.splitSelectedClipAtPlayhead,
    onSplitVideoClipAtTime: videoClipEditing.splitClipByIdAtTime,
    onSplitAudioClipAtTime: audioClipEditing.splitClipByIdAtTime,
    onSeekClick: handleSeekClick,
  });

  return (
    <>
      <audio ref={audioRef} className="hidden" preload="auto" />
      <ClipTimelineToolbar
        timelineToolMode={timelineToolMode}
        currentTimeSeconds={currentTimeSeconds}
        pixelsPerSecond={pixelsPerSecond}
        minZoom={minZoom}
        maxZoom={maxZoom}
        onSelectTool={handleSelectTool}
        onCutTool={handleCutTool}
        setPixelsPerSecond={setPixelsPerSecond}
      />

      <div
        className={`min-h-0 flex flex-1 items-stretch px-4 select-none ${
          timelineToolMode === "cut" ? "timeline-cut-mode" : ""
        }`}
        style={
          timelineToolMode === "cut"
            ? ({ "--timeline-cut-cursor": CUT_CURSOR } as CSSProperties)
            : undefined
        }
      >
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
                  timelineToolMode={timelineToolMode}
                  draggingClipId={videoDragAndDrop.draggingClipId}
                  resizingClipId={videoClipEditing.resizingClipId}
                  dragPreview={videoDragAndDrop.dragPreview}
                  pixelsPerSecond={pixelsPerSecond}
                  timelineWidthPx={timelineWidthPx}
                  majorGridWidth={majorGridWidth}
                  minorGridWidth={minorGridWidth}
                  viewportStartPx={scrollLeft}
                  viewportWidthPx={trackViewportWidth}
                  onTrackClick={handleTrackClick}
                  onTrackDragOver={videoDragAndDrop.handleTrackDragOver}
                  onTrackDragLeave={videoDragAndDrop.handleTrackDragLeave}
                  onTrackDrop={videoDragAndDrop.handleTrackDrop}
                  onClipClick={handleVideoClipClick}
                  onClipDragStart={videoDragAndDrop.handleClipDragStart}
                  onClipDragEnd={videoDragAndDrop.handleClipDragEnd}
                  onClipLeftResizeStart={
                    videoClipEditing.handleClipLeftResizeStart
                  }
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
                  timelineToolMode={timelineToolMode}
                  draggingClipId={audioDragAndDrop.draggingClipId}
                  resizingClipId={audioClipEditing.resizingClipId}
                  dragPreview={audioDragAndDrop.dragPreview}
                  pixelsPerSecond={pixelsPerSecond}
                  timelineWidthPx={timelineWidthPx}
                  majorGridWidth={majorGridWidth}
                  minorGridWidth={minorGridWidth}
                  viewportStartPx={scrollLeft}
                  viewportWidthPx={trackViewportWidth}
                  onTrackClick={handleTrackClick}
                  onTrackDragOver={audioDragAndDrop.handleTrackDragOver}
                  onTrackDragLeave={audioDragAndDrop.handleTrackDragLeave}
                  onTrackDrop={audioDragAndDrop.handleTrackDrop}
                  onClipClick={handleAudioClipClick}
                  onClipDragStart={audioDragAndDrop.handleClipDragStart}
                  onClipDragEnd={audioDragAndDrop.handleClipDragEnd}
                  onClipLeftResizeStart={
                    audioClipEditing.handleClipLeftResizeStart
                  }
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
