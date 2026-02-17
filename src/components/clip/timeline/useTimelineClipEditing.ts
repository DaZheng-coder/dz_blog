import {
  useCallback,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import { clamp, findActiveClipAtTime } from "./clipTimelineUtils";
import type { ClipTrackClip } from "../shared/types";

const MIN_CLIP_DURATION_SECONDS = 0.2;

type UseTimelineClipEditingOptions = {
  clips: ClipTrackClip[];
  setClips: (
    updater:
      | ClipTrackClip[]
      | ((prevClips: ClipTrackClip[]) => ClipTrackClip[])
  ) => void;
  pixelsPerSecond: number;
  selectedClipId?: string | null;
  selectedClipIds?: string[];
  draggingClipId: string | null;
  clearDragState: () => void;
  isPlaying: boolean;
  currentTimeRef: RefObject<number>;
  onPreviewClip?: (clip: ClipTrackClip) => void;
  onPreviewEmptyFrame?: (timeSeconds: number) => void;
  emitTimelineFrame: (
    timeSeconds: number,
    playingFrame: boolean,
    force?: boolean
  ) => void;
  clearSelection?: () => void;
};

export function useTimelineClipEditing({
  clips,
  setClips,
  pixelsPerSecond,
  selectedClipId,
  selectedClipIds = [],
  draggingClipId,
  clearDragState,
  isPlaying,
  currentTimeRef,
  onPreviewClip,
  onPreviewEmptyFrame,
  emitTimelineFrame,
  clearSelection,
}: UseTimelineClipEditingOptions) {
  const [resizingClipId, setResizingClipId] = useState<string | null>(null);

  const handleClipResizeStart = (
    event: ReactMouseEvent<HTMLElement>,
    clip: ClipTrackClip
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const originClientX = event.clientX;
    const originDuration = clip.durationSeconds;
    const originSourceEnd = clip.sourceEndSeconds;
    const maxExtendRight = Math.max(
      0,
      clip.mediaDurationSeconds - clip.sourceEndSeconds
    );
    setResizingClipId(clip.id);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaSeconds = (moveEvent.clientX - originClientX) / pixelsPerSecond;
      const nextDuration = clamp(
        originDuration + deltaSeconds,
        MIN_CLIP_DURATION_SECONDS,
        originDuration + maxExtendRight
      );
      const nextSourceEnd = originSourceEnd + (nextDuration - originDuration);

      let resizedForPreview: ClipTrackClip | null = null;
      setClips((prev) =>
        prev.map((item) => {
          if (item.id !== clip.id) {
            return item;
          }
          const updated = {
            ...item,
            durationSeconds: nextDuration,
            sourceEndSeconds: nextSourceEnd,
          };
          resizedForPreview = updated;
          return updated;
        })
      );

      if (resizedForPreview && selectedClipId === clip.id) {
        onPreviewClip?.(resizedForPreview);
      }
      emitTimelineFrame(currentTimeRef.current || 0, isPlaying, true);
    };

    const handleMouseUp = () => {
      setResizingClipId(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleClipLeftResizeStart = (
    event: ReactMouseEvent<HTMLElement>,
    clip: ClipTrackClip
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const originClientX = event.clientX;
    const originStart = clip.startSeconds;
    const originDuration = clip.durationSeconds;
    const originSourceStart = clip.sourceStartSeconds;
    const maxExtendLeft = Math.min(originSourceStart, originStart);
    setResizingClipId(clip.id);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaSeconds = (moveEvent.clientX - originClientX) / pixelsPerSecond;
      const trimFromLeft = clamp(
        deltaSeconds,
        -maxExtendLeft,
        originDuration - MIN_CLIP_DURATION_SECONDS
      );
      const nextStart = originStart + trimFromLeft;
      const nextSourceStart = originSourceStart + trimFromLeft;
      const nextDuration = originDuration - trimFromLeft;

      let resizedForPreview: ClipTrackClip | null = null;
      setClips((prev) =>
        prev.map((item) => {
          if (item.id !== clip.id) {
            return item;
          }
          const updated = {
            ...item,
            startSeconds: nextStart,
            sourceStartSeconds: nextSourceStart,
            durationSeconds: nextDuration,
          };
          resizedForPreview = updated;
          return updated;
        })
      );

      if (resizedForPreview && selectedClipId === clip.id) {
        onPreviewClip?.(resizedForPreview);
      }
      emitTimelineFrame(currentTimeRef.current || 0, isPlaying, true);
    };

    const handleMouseUp = () => {
      setResizingClipId(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const splitSelectedClipAtPlayhead = useCallback(() => {
    const splitTime = currentTimeRef.current || 0;
    const selectedIds = selectedClipIds.length
      ? selectedClipIds
      : selectedClipId
        ? [selectedClipId]
        : [];
    const selectedIdSet = new Set(selectedIds);
    const hasExplicitSelection = selectedIdSet.size > 0;
    const fallbackTargetClipId = findActiveClipAtTime(splitTime, clips)?.id;
    if (!hasExplicitSelection && !fallbackTargetClipId) {
      return;
    }

    let rightClipForPreview: ClipTrackClip | null = null;
    let didSplit = false;

    setClips((prev) => {
      const next = [...prev];
      for (let index = 0; index < next.length; index += 1) {
        const clip = next[index];
        const isTargetClip = hasExplicitSelection
          ? selectedIdSet.has(clip.id)
          : clip.id === fallbackTargetClipId;
        if (!isTargetClip) {
          continue;
        }

        const clipStart = clip.startSeconds;
        const clipEnd = clip.startSeconds + clip.durationSeconds;
        if (splitTime <= clipStart || splitTime >= clipEnd) {
          continue;
        }

        const leftDurationSeconds = splitTime - clipStart;
        const rightDurationSeconds = clipEnd - splitTime;
        if (leftDurationSeconds <= 0 || rightDurationSeconds <= 0) {
          continue;
        }

        const leftClip: ClipTrackClip = {
          ...clip,
          durationSeconds: leftDurationSeconds,
          sourceEndSeconds: clip.sourceStartSeconds + leftDurationSeconds,
        };
        const rightClip: ClipTrackClip = {
          ...clip,
          id: crypto.randomUUID(),
          startSeconds: splitTime,
          sourceStartSeconds: clip.sourceStartSeconds + leftDurationSeconds,
          sourceEndSeconds: clip.sourceEndSeconds,
          durationSeconds: rightDurationSeconds,
        };

        didSplit = true;
        rightClipForPreview = rightClip;
        next.splice(index, 1, leftClip, rightClip);
        index += 1;
      }
      return didSplit ? next : prev;
    });

    if (!didSplit || !rightClipForPreview) {
      return;
    }

    onPreviewClip?.(rightClipForPreview);
    emitTimelineFrame(splitTime, isPlaying, true);
  }, [
    clips,
    currentTimeRef,
    emitTimelineFrame,
    isPlaying,
    onPreviewClip,
    selectedClipId,
    selectedClipIds,
    setClips,
  ]);

  const deleteSelectedClip = useCallback(() => {
    const targetClipIds = selectedClipIds.length
      ? selectedClipIds
      : selectedClipId
        ? [selectedClipId]
        : [];
    if (targetClipIds.length === 0) {
      return;
    }

    const targetIdSet = new Set(targetClipIds);
    const nextClips = clips.filter((clip) => !targetIdSet.has(clip.id));
    if (nextClips.length === clips.length) {
      return;
    }

    setClips(nextClips);
    if (draggingClipId && targetIdSet.has(draggingClipId)) {
      clearDragState();
    }
    clearSelection?.();

    const currentTime = currentTimeRef.current || 0;
    const activeClip = findActiveClipAtTime(currentTime, nextClips);
    if (activeClip) {
      onPreviewClip?.(activeClip);
    } else {
      onPreviewEmptyFrame?.(currentTime);
    }
    emitTimelineFrame(currentTime, isPlaying, true);
  }, [
    clearDragState,
    clips,
    currentTimeRef,
    draggingClipId,
    emitTimelineFrame,
    isPlaying,
    onPreviewClip,
    onPreviewEmptyFrame,
    selectedClipId,
    selectedClipIds,
    setClips,
    clearSelection,
  ]);

  return {
    resizingClipId,
    handleClipResizeStart,
    handleClipLeftResizeStart,
    splitSelectedClipAtPlayhead,
    deleteSelectedClip,
  };
}
