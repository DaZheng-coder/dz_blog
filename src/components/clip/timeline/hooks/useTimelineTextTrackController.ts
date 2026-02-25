import { useCallback, useMemo, type RefObject } from "react";
import type { ClipDragAsset, ClipTextOverlay } from "../../shared/types";
import { TRACK_COLORS } from "../utils/clipTimelineConfig";
import { useTextTrackEditing } from "./useTextTrackEditing";
import { useTimelineDragAndDrop } from "./useTimelineDragAndDrop";

type SetTextOverlays = (
  updater:
    | ClipTextOverlay[]
    | ((prevOverlays: ClipTextOverlay[]) => ClipTextOverlay[])
) => void;

type UseTimelineTextTrackControllerOptions = {
  textOverlays: ClipTextOverlay[];
  setTextOverlays: SetTextOverlays;
  selectedTimelineClipIds: string[];
  selectedTimelineTrack: "video" | "audio" | "text" | null;
  setSelectedTimelineClip: (
    clipId: string | null,
    track: "video" | "audio" | "text" | null,
    appendSelection?: boolean
  ) => void;
  draggingAsset: ClipDragAsset | null;
  pixelsPerSecond: number;
  maxTimelineSeconds: number;
  minTextDurationSeconds: number;
  timelineToolMode: "select" | "cut";
  textLaneRef: RefObject<HTMLDivElement | null>;
};

export function useTimelineTextTrackController({
  textOverlays,
  setTextOverlays,
  selectedTimelineClipIds,
  selectedTimelineTrack,
  setSelectedTimelineClip,
  draggingAsset,
  pixelsPerSecond,
  maxTimelineSeconds,
  minTextDurationSeconds,
  timelineToolMode,
  textLaneRef,
}: UseTimelineTextTrackControllerOptions) {
  const {
    textTrackClips,
    setTextTrackClips,
    handleTextTrackEditStart,
    handleSplitTextOverlayAtTime,
  } = useTextTrackEditing({
    textOverlays,
    setTextOverlays,
    pixelsPerSecond,
    maxTimelineSeconds,
    minTextDurationSeconds,
    timelineToolMode,
  });

  const textDragAndDrop = useTimelineDragAndDrop({
    clips: textTrackClips,
    setClips: setTextTrackClips,
    draggingAsset,
    pixelsPerSecond,
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

  const selectedTextClipIdSet = useMemo(
    () =>
      selectedTimelineTrack === "text"
        ? new Set(selectedTimelineClipIds)
        : new Set<string>(),
    [selectedTimelineClipIds, selectedTimelineTrack]
  );

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

  return {
    textDragAndDrop,
    renderedTextTrackClips,
    textDragPreviewToneClassName,
    selectedTextClipIdSet,
    deleteSelectedTextClips,
    handleTextTrackEditStart,
    handleSplitTextOverlayAtTime,
  };
}
