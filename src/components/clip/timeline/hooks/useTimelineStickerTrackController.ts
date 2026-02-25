import { useCallback, useMemo, type RefObject } from "react";
import type { ClipDragAsset, ClipStickerOverlay } from "../../shared/types";
import { TRACK_COLORS } from "../utils/clipTimelineConfig";
import { useStickerTrackEditing } from "./useStickerTrackEditing";
import { useTimelineDragAndDrop } from "./useTimelineDragAndDrop";

type SetStickerOverlays = (
  updater:
    | ClipStickerOverlay[]
    | ((prevOverlays: ClipStickerOverlay[]) => ClipStickerOverlay[])
) => void;

type UseTimelineStickerTrackControllerOptions = {
  stickerOverlays: ClipStickerOverlay[];
  setStickerOverlays: SetStickerOverlays;
  selectedTimelineClipIds: string[];
  selectedTimelineTrack: "video" | "audio" | "text" | "sticker" | null;
  setSelectedTimelineClip: (
    clipId: string | null,
    track: "video" | "audio" | "text" | "sticker" | null,
    appendSelection?: boolean
  ) => void;
  draggingAsset: ClipDragAsset | null;
  pixelsPerSecond: number;
  maxTimelineSeconds: number;
  minStickerDurationSeconds: number;
  timelineToolMode: "select" | "cut";
  stickerLaneRef: RefObject<HTMLDivElement | null>;
};

export function useTimelineStickerTrackController({
  stickerOverlays,
  setStickerOverlays,
  selectedTimelineClipIds,
  selectedTimelineTrack,
  setSelectedTimelineClip,
  draggingAsset,
  pixelsPerSecond,
  maxTimelineSeconds,
  minStickerDurationSeconds,
  timelineToolMode,
  stickerLaneRef,
}: UseTimelineStickerTrackControllerOptions) {
  const {
    stickerTrackClips,
    setStickerTrackClips,
    handleStickerTrackEditStart,
    handleSplitStickerOverlayAtTime,
  } = useStickerTrackEditing({
    stickerOverlays,
    setStickerOverlays,
    pixelsPerSecond,
    maxTimelineSeconds,
    minStickerDurationSeconds,
    timelineToolMode,
  });

  const stickerDragAndDrop = useTimelineDragAndDrop({
    clips: stickerTrackClips,
    setClips: setStickerTrackClips,
    draggingAsset,
    pixelsPerSecond,
    laneRef: stickerLaneRef,
    allowAssetInsert: false,
    allowOverlap: true,
  });

  const renderedStickerTrackClips =
    stickerDragAndDrop.ripplePreviewClips ?? stickerTrackClips;

  const stickerDragPreviewToneClassName = useMemo(() => {
    if (!stickerDragAndDrop.draggingClipId) {
      return "border-[#f59e0b] bg-gradient-to-r from-[#f59e0b]/35 to-[#f97316]/35";
    }
    const index = stickerTrackClips.findIndex(
      (clip) => clip.id === stickerDragAndDrop.draggingClipId
    );
    const colorClass =
      TRACK_COLORS[(index < 0 ? 0 : index) % TRACK_COLORS.length];
    return `bg-gradient-to-r ${colorClass}`;
  }, [stickerDragAndDrop.draggingClipId, stickerTrackClips]);

  const selectedStickerClipIdSet = useMemo(
    () =>
      selectedTimelineTrack === "sticker"
        ? new Set(selectedTimelineClipIds)
        : new Set<string>(),
    [selectedTimelineClipIds, selectedTimelineTrack]
  );

  const deleteSelectedStickerClips = useCallback(() => {
    if (
      selectedTimelineTrack !== "sticker" ||
      selectedTimelineClipIds.length === 0
    ) {
      return;
    }
    const selectedIdSet = new Set(selectedTimelineClipIds);
    setStickerOverlays((prev) =>
      prev.filter((overlay) => !selectedIdSet.has(overlay.id))
    );
    setSelectedTimelineClip(null, null);
  }, [
    selectedTimelineClipIds,
    selectedTimelineTrack,
    setSelectedTimelineClip,
    setStickerOverlays,
  ]);

  return {
    stickerDragAndDrop,
    renderedStickerTrackClips,
    stickerDragPreviewToneClassName,
    selectedStickerClipIdSet,
    deleteSelectedStickerClips,
    handleStickerTrackEditStart,
    handleSplitStickerOverlayAtTime,
  };
}
