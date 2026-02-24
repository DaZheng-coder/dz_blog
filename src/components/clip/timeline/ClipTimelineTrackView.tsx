import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useShallow } from "zustand/react/shallow";
import { useClipEditorStore } from "../store/clipEditorStore";
import { ClipTimelineLane } from "./ClipTimelineLane";
import { ClipTimelinePlayhead } from "./ClipTimelinePlayhead";
import { ClipTimelineRuler } from "./ClipTimelineRuler";
import { ClipTimelineTextClipItem } from "./ClipTimelineTextClipItem";
import { ClipTimelineToolbar } from "./ClipTimelineToolbar";
import { TRACK_COLORS } from "./clipTimelineConfig";
import { useTimelineAudioPlayback } from "./useTimelineAudioPlayback";
import { useTimelineClipEditing } from "./useTimelineClipEditing";
import { useTimelineDragAndDrop } from "./useTimelineDragAndDrop";
import { useTimelineHotkeys } from "./useTimelineHotkeys";
import { useTimelinePlayback } from "./useTimelinePlayback";
import { useTimelineSelectionActions } from "./useTimelineSelectionActions";
import type { ClipTrackClip } from "../shared/types";

export type TimelineDragPreview = {
  title: string;
  startSeconds: number;
  durationSeconds: number;
};

const TIMELINE_LEFT_INSET_PX = 20;
const TEXT_TRACK_MIN_BLOCK_WIDTH_PX = 14;
const CUT_CURSOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.2 8.1 20 20"/><path d="M20 4 8.2 15.9"/></svg>`;
const CUT_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(
  CUT_CURSOR_SVG
)}") 10 10, crosshair`;

type TextTrackEditMode = "resize-left" | "resize-right";

type TextTrackEditState = {
  overlayId: string;
  mode: TextTrackEditMode;
  startClientX: number;
  startSeconds: number;
  endSeconds: number;
};

export function ClipTimelineTrackView() {
  const {
    draggingAsset,
    selectedTimelineClipId,
    selectedTimelineClipIds,
    selectedTimelineTrack,
    timelineClips,
    audioTimelineClips,
    textOverlays,
    timelinePlaying,
    timelineToolMode,
    setDraggingAsset,
    setTimelinePlaying,
    setTimelineToolMode,
    setTrackTotalDurationSeconds,
    setTimelineClips,
    setAudioTimelineClips,
    setTextOverlays,
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
      textOverlays: state.textOverlays,
      timelinePlaying: state.timelinePlaying,
      timelineToolMode: state.timelineToolMode,
      setDraggingAsset: state.setDraggingAsset,
      setTimelinePlaying: state.setTimelinePlaying,
      setTimelineToolMode: state.setTimelineToolMode,
      setTrackTotalDurationSeconds: state.setTrackTotalDurationSeconds,
      setTimelineClips: state.setTimelineClips,
      setAudioTimelineClips: state.setAudioTimelineClips,
      setTextOverlays: state.setTextOverlays,
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
  const textLaneRef = useRef<HTMLDivElement>(null);
  const textTrackEditStateRef = useRef<TextTrackEditState | null>(null);

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

  const deleteSelectedTextClips = useCallback(() => {
    if (selectedTimelineTrack !== "text" || selectedTimelineClipIds.length === 0) {
      return;
    }
    const selectedIdSet = new Set(selectedTimelineClipIds);
    setTextOverlays((prev) =>
      prev.filter((overlay) => !selectedIdSet.has(overlay.id))
    );
    setSelectedTimelineClip(null, null);
  }, [
    selectedTimelineClipIds,
    selectedTimelineTrack,
    setSelectedTimelineClip,
    setTextOverlays,
  ]);

  useTimelineHotkeys({
    selectedTimelineTrack,
    selectedTimelineClipCount: selectedTimelineClipIds.length,
    onDeleteVideo: videoClipEditing.deleteSelectedClip,
    onDeleteAudio: audioClipEditing.deleteSelectedClip,
    onDeleteText: deleteSelectedTextClips,
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
  const maxTimelineSeconds =
    timelineWidthPx / Math.max(pixelsPerSecond, 0.0001);
  const minTextDurationSeconds =
    TEXT_TRACK_MIN_BLOCK_WIDTH_PX / Math.max(pixelsPerSecond, 0.0001);

  const renderedVideoClips =
    videoDragAndDrop.ripplePreviewClips ?? timelineClips;
  const renderedAudioClips =
    audioDragAndDrop.ripplePreviewClips ?? audioTimelineClips;
  const textTrackItems = useMemo(
    () =>
      textOverlays
        .map((overlay) => {
          const durationSeconds = Math.max(
            0,
            overlay.endSeconds - overlay.startSeconds
          );
          return {
            id: overlay.id,
            text: overlay.text.trim() || "文本",
            startSeconds: Math.max(0, overlay.startSeconds),
            durationSeconds,
          };
        })
        .filter((overlay) => overlay.durationSeconds > 0),
    [textOverlays]
  );
  const textTrackClips = useMemo<ClipTrackClip[]>(
    () =>
      textTrackItems.map((item) => ({
        id: item.id,
        assetId: item.id,
        title: item.text,
        mediaType: "video" as const,
        mediaDurationSeconds: item.durationSeconds,
        startSeconds: item.startSeconds,
        sourceStartSeconds: 0,
        sourceEndSeconds: item.durationSeconds,
        durationSeconds: item.durationSeconds,
        objectUrl: "",
      })),
    [textTrackItems]
  );
  const setTextTrackClips = useCallback(
    (
      updater:
        | ClipTrackClip[]
        | ((prevClips: ClipTrackClip[]) => ClipTrackClip[])
    ) => {
      setTextOverlays((prev) => {
        const prevClips = prev
          .map((overlay) => {
            const durationSeconds = Math.max(
              minTextDurationSeconds,
              overlay.endSeconds - overlay.startSeconds
            );
            return {
              id: overlay.id,
              assetId: overlay.id,
              title: overlay.text.trim() || "文本",
              mediaType: "video" as const,
              mediaDurationSeconds: durationSeconds,
              startSeconds: Math.max(0, overlay.startSeconds),
              sourceStartSeconds: 0,
              sourceEndSeconds: durationSeconds,
              durationSeconds,
              objectUrl: "",
            };
          })
          .filter((clip) => clip.durationSeconds > 0);

        const nextClips =
          typeof updater === "function" ? updater(prevClips) : updater;
        const nextMap = new Map(nextClips.map((clip) => [clip.id, clip]));

        return prev.flatMap((overlay) => {
          const clip = nextMap.get(overlay.id);
          if (!clip) {
            return [];
          }
          const startSeconds = Math.max(0, clip.startSeconds);
          const durationSeconds = Math.max(
            minTextDurationSeconds,
            clip.durationSeconds
          );
          return [
            {
              ...overlay,
              startSeconds,
              endSeconds: startSeconds + durationSeconds,
            },
          ];
        });
      });
    },
    [minTextDurationSeconds, setTextOverlays]
  );
  const textDragAndDrop = useTimelineDragAndDrop({
    clips: textTrackClips,
    setClips: setTextTrackClips,
    draggingAsset,
    pixelsPerSecond: playback.pixelsPerSecond,
    laneRef: textLaneRef,
    allowAssetInsert: false,
  });
  const renderedTextTrackClips =
    textDragAndDrop.ripplePreviewClips ?? textTrackClips;
  const textDragPreviewToneClassName = useMemo(() => {
    if (!textDragAndDrop.draggingClipId) {
      return "border-[#a78bfa] bg-gradient-to-r from-[#a78bfa]/35 to-[#6366f1]/35";
    }
    const index = textTrackClips.findIndex(
      (clip) => clip.id === textDragAndDrop.draggingClipId
    );
    const colorClass =
      TRACK_COLORS[(index < 0 ? 0 : index) % TRACK_COLORS.length];
    return `bg-gradient-to-r ${colorClass}`;
  }, [textDragAndDrop.draggingClipId, textTrackClips]);
  const isAnyDragActive =
    Boolean(draggingAsset) ||
    Boolean(videoDragAndDrop.draggingClipId) ||
    Boolean(audioDragAndDrop.draggingClipId) ||
    Boolean(textDragAndDrop.draggingClipId);
  const { audioRef } = useTimelineAudioPlayback({
    audioClips: renderedAudioClips,
    currentTimeSeconds,
    isPlaying: playback.isPlaying,
  });

  const handleTextTrackEditStart = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      overlayId: string,
      mode: TextTrackEditMode,
      startSeconds: number,
      endSeconds: number
    ) => {
      if (timelineToolMode === "cut") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      textTrackEditStateRef.current = {
        overlayId,
        mode,
        startClientX: event.clientX,
        startSeconds,
        endSeconds,
      };
      document.body.style.cursor = "ew-resize";
    },
    [timelineToolMode]
  );

  const handleSplitTextOverlayAtTime = useCallback(
    (overlayId: string, splitTime: number) => {
      setTextOverlays((prev) => {
        const target = prev.find((overlay) => overlay.id === overlayId);
        if (!target) {
          return prev;
        }
        const minGap = minTextDurationSeconds;
        const clampedSplit = Math.max(
          target.startSeconds + minGap,
          Math.min(target.endSeconds - minGap, splitTime)
        );
        if (
          clampedSplit <= target.startSeconds + 0.0001 ||
          clampedSplit >= target.endSeconds - 0.0001
        ) {
          return prev;
        }

        return prev.flatMap((overlay) => {
          if (overlay.id !== overlayId) {
            return [overlay];
          }
          return [
            { ...overlay, endSeconds: clampedSplit },
            {
              ...overlay,
              id: crypto.randomUUID(),
              startSeconds: clampedSplit,
            },
          ];
        });
      });
    },
    [minTextDurationSeconds, setTextOverlays]
  );

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const state = textTrackEditStateRef.current;
      if (!state) {
        return;
      }
      const deltaSeconds =
        (event.clientX - state.startClientX) /
        Math.max(pixelsPerSecond, 0.0001);
      setTextOverlays((prev) =>
        prev.map((overlay) => {
          if (overlay.id !== state.overlayId) {
            return overlay;
          }

          if (state.mode === "resize-left") {
            const maxStart = Math.max(
              0,
              state.endSeconds - minTextDurationSeconds
            );
            const nextStart = Math.min(
              maxStart,
              Math.max(0, state.startSeconds + deltaSeconds)
            );
            return {
              ...overlay,
              startSeconds: nextStart,
            };
          }

          const minEnd = state.startSeconds + minTextDurationSeconds;
          const nextEnd = Math.max(
            minEnd,
            Math.min(maxTimelineSeconds, state.endSeconds + deltaSeconds)
          );
          return {
            ...overlay,
            endSeconds: nextEnd,
          };
        })
      );
    };

    const handleMouseUp = () => {
      if (!textTrackEditStateRef.current) {
        return;
      }
      textTrackEditStateRef.current = null;
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [
    maxTimelineSeconds,
    minTextDurationSeconds,
    pixelsPerSecond,
    setTextOverlays,
  ]);

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

  const noopClipResizeStart = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
    },
    []
  );
  const noopClipClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  }, []);

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
          <div className="flex h-6 items-center">文本轨道1</div>
          <div className="mt-2 flex h-16 items-center">视频轨道1</div>
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
                  laneRef={textLaneRef}
                  laneId="text-1"
                  laneHeightClassName="h-5"
                  laneClassName="border border-dashed border-white/12 bg-white/[0.015]"
                  styleBackgroundImage="repeating-linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02) 1px, transparent 1px, transparent 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 1px, transparent 1px, transparent 100%)"
                  emptyHint="暂无文本"
                  clips={renderedTextTrackClips}
                  compact
                  selectedClipIds={[]}
                  timelineToolMode={timelineToolMode}
                  draggingClipId={textDragAndDrop.draggingClipId}
                  resizingClipId={null}
                  dragPreview={textDragAndDrop.dragPreview}
                  pixelsPerSecond={pixelsPerSecond}
                  timelineWidthPx={timelineWidthPx}
                  majorGridWidth={majorGridWidth}
                  minorGridWidth={minorGridWidth}
                  viewportStartPx={scrollLeft}
                  viewportWidthPx={trackViewportWidth}
                  onTrackClick={handleTrackClick}
                  onTrackDragOver={textDragAndDrop.handleTrackDragOver}
                  onTrackDragLeave={textDragAndDrop.handleTrackDragLeave}
                  onTrackDrop={textDragAndDrop.handleTrackDrop}
                  onClipClick={noopClipClick}
                  onClipDragStart={textDragAndDrop.handleClipDragStart}
                  onClipDragEnd={textDragAndDrop.handleClipDragEnd}
                  onClipLeftResizeStart={noopClipResizeStart}
                  onClipResizeStart={noopClipResizeStart}
                  dragPreviewLayoutClassName="top-0 h-4.5 px-1 py-0"
                  dragPreviewToneClassName={textDragPreviewToneClassName}
                  renderClip={(clip, index) => {
                    return (
                      <ClipTimelineTextClipItem
                        key={clip.id}
                        clip={clip}
                        index={index}
                        pixelsPerSecond={pixelsPerSecond}
                        minWidthPx={TEXT_TRACK_MIN_BLOCK_WIDTH_PX}
                        timelineToolMode={timelineToolMode}
                        onDragStart={textDragAndDrop.handleClipDragStart}
                        onDragEnd={textDragAndDrop.handleClipDragEnd}
                        onSplitAtClientX={(targetClip, clientX, rectLeft) => {
                          const clickedOffsetPx = clientX - rectLeft;
                          const splitTime =
                            targetClip.startSeconds +
                            clickedOffsetPx / Math.max(pixelsPerSecond, 0.0001);
                          handleSplitTextOverlayAtTime(
                            targetClip.id,
                            splitTime
                          );
                        }}
                        onResizeLeftStart={(event, targetClip) =>
                          handleTextTrackEditStart(
                            event,
                            targetClip.id,
                            "resize-left",
                            targetClip.startSeconds,
                            targetClip.startSeconds + targetClip.durationSeconds
                          )
                        }
                        onResizeRightStart={(event, targetClip) =>
                          handleTextTrackEditStart(
                            event,
                            targetClip.id,
                            "resize-right",
                            targetClip.startSeconds,
                            targetClip.startSeconds + targetClip.durationSeconds
                          )
                        }
                        onSelect={(targetClipId, appendSelection) =>
                          setSelectedTimelineClip(
                            targetClipId,
                            "text",
                            appendSelection
                          )
                        }
                        isSelected={selectedTimelineClipIds.includes(clip.id)}
                      />
                    );
                  }}
                />

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
