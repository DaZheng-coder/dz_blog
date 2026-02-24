import { useCallback, useEffect, useMemo, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { ClipTextOverlay, ClipTrackClip } from "../shared/types";
import {
  applyTextTrackClipsToOverlays,
  toTextTrackClips,
} from "./textTrackAdapter";

type TextTrackEditMode = "resize-left" | "resize-right";

type TextTrackEditState = {
  overlayId: string;
  mode: TextTrackEditMode;
  startClientX: number;
  startSeconds: number;
  endSeconds: number;
};

type UseTextTrackEditingOptions = {
  textOverlays: ClipTextOverlay[];
  setTextOverlays: (
    updater:
      | ClipTextOverlay[]
      | ((prevOverlays: ClipTextOverlay[]) => ClipTextOverlay[])
  ) => void;
  pixelsPerSecond: number;
  maxTimelineSeconds: number;
  minTextDurationSeconds: number;
  timelineToolMode: "select" | "cut";
};

export function useTextTrackEditing({
  textOverlays,
  setTextOverlays,
  pixelsPerSecond,
  maxTimelineSeconds,
  minTextDurationSeconds,
  timelineToolMode,
}: UseTextTrackEditingOptions) {
  const textTrackEditStateRef = useRef<TextTrackEditState | null>(null);

  const textTrackClips = useMemo<ClipTrackClip[]>(
    () => toTextTrackClips(textOverlays, minTextDurationSeconds),
    [minTextDurationSeconds, textOverlays]
  );

  const setTextTrackClips = useCallback(
    (
      updater:
        | ClipTrackClip[]
        | ((prevClips: ClipTrackClip[]) => ClipTrackClip[])
    ) => {
      setTextOverlays((prev) => {
        const prevClips = toTextTrackClips(prev, minTextDurationSeconds);
        const nextClips =
          typeof updater === "function" ? updater(prevClips) : updater;
        return applyTextTrackClipsToOverlays(
          prev,
          nextClips,
          minTextDurationSeconds
        );
      });
    },
    [minTextDurationSeconds, setTextOverlays]
  );

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
            const maxStart = Math.max(0, state.endSeconds - minTextDurationSeconds);
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

  return {
    textTrackClips,
    setTextTrackClips,
    handleTextTrackEditStart,
    handleSplitTextOverlayAtTime,
  };
}
