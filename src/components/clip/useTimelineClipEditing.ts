import {
  useCallback,
  useEffect,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import { clamp, findActiveClipAtTime, isEditableElement } from "./clipTimelineUtils";
import type { ClipTrackClip } from "./types";

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
};

export function useTimelineClipEditing({
  clips,
  setClips,
  pixelsPerSecond,
  selectedClipId,
  draggingClipId,
  clearDragState,
  isPlaying,
  currentTimeRef,
  onPreviewClip,
  onPreviewEmptyFrame,
  emitTimelineFrame,
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
    setResizingClipId(clip.id);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaSeconds = (moveEvent.clientX - originClientX) / pixelsPerSecond;
      const nextDuration = clamp(
        originDuration + deltaSeconds,
        MIN_CLIP_DURATION_SECONDS,
        originDuration
      );
      const nextSourceEnd = originSourceEnd - (originDuration - nextDuration);

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
    setResizingClipId(clip.id);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaSeconds = (moveEvent.clientX - originClientX) / pixelsPerSecond;
      const trimFromLeft = clamp(
        deltaSeconds,
        0,
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
    const targetClipId =
      selectedClipId || findActiveClipAtTime(splitTime, clips)?.id;
    if (!targetClipId) {
      return;
    }

    let rightClipForPreview: ClipTrackClip | null = null;
    let didSplit = false;

    setClips((prev) => {
      const index = prev.findIndex((clip) => clip.id === targetClipId);
      if (index < 0) {
        return prev;
      }

      const clip = prev[index];
      const clipStart = clip.startSeconds;
      const clipEnd = clip.startSeconds + clip.durationSeconds;
      if (splitTime <= clipStart || splitTime >= clipEnd) {
        return prev;
      }

      const leftDurationSeconds = splitTime - clipStart;
      const rightDurationSeconds = clipEnd - splitTime;
      if (leftDurationSeconds <= 0 || rightDurationSeconds <= 0) {
        return prev;
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
      return [
        ...prev.slice(0, index),
        leftClip,
        rightClip,
        ...prev.slice(index + 1),
      ];
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
    setClips,
  ]);

  const deleteSelectedClip = useCallback(() => {
    if (!selectedClipId) {
      return;
    }

    const nextClips = clips.filter((clip) => clip.id !== selectedClipId);
    if (nextClips.length === clips.length) {
      return;
    }

    setClips(nextClips);
    if (draggingClipId === selectedClipId) {
      clearDragState();
    }

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
    setClips,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (isEditableElement(event.target)) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelectedClip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelectedClip]);

  return {
    resizingClipId,
    handleClipResizeStart,
    handleClipLeftResizeStart,
    splitSelectedClipAtPlayhead,
  };
}
