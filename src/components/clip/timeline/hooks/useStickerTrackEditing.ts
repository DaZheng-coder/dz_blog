import { useCallback, useEffect, useMemo, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { ClipStickerOverlay, ClipTrackClip } from "../../shared/types";
import {
  applyStickerTrackClipsToOverlays,
  toStickerTrackClips,
} from "../utils/stickerTrackAdapter";

type StickerTrackEditMode = "resize-left" | "resize-right";

type StickerTrackEditState = {
  overlayId: string;
  mode: StickerTrackEditMode;
  startClientX: number;
  startSeconds: number;
  endSeconds: number;
};

type UseStickerTrackEditingOptions = {
  stickerOverlays: ClipStickerOverlay[];
  setStickerOverlays: (
    updater:
      | ClipStickerOverlay[]
      | ((prevOverlays: ClipStickerOverlay[]) => ClipStickerOverlay[])
  ) => void;
  pixelsPerSecond: number;
  maxTimelineSeconds: number;
  minStickerDurationSeconds: number;
  timelineToolMode: "select" | "cut";
};

export function useStickerTrackEditing({
  stickerOverlays,
  setStickerOverlays,
  pixelsPerSecond,
  maxTimelineSeconds,
  minStickerDurationSeconds,
  timelineToolMode,
}: UseStickerTrackEditingOptions) {
  const stickerTrackEditStateRef = useRef<StickerTrackEditState | null>(null);

  const stickerTrackClips = useMemo<ClipTrackClip[]>(
    () => toStickerTrackClips(stickerOverlays, minStickerDurationSeconds),
    [minStickerDurationSeconds, stickerOverlays]
  );

  const setStickerTrackClips = useCallback(
    (
      updater:
        | ClipTrackClip[]
        | ((prevClips: ClipTrackClip[]) => ClipTrackClip[])
    ) => {
      setStickerOverlays((prev) => {
        const prevClips = toStickerTrackClips(prev, minStickerDurationSeconds);
        const nextClips =
          typeof updater === "function" ? updater(prevClips) : updater;
        return applyStickerTrackClipsToOverlays(
          prev,
          nextClips,
          minStickerDurationSeconds
        );
      });
    },
    [minStickerDurationSeconds, setStickerOverlays]
  );

  const handleStickerTrackEditStart = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      overlayId: string,
      mode: StickerTrackEditMode,
      startSeconds: number,
      endSeconds: number
    ) => {
      if (timelineToolMode === "cut") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      stickerTrackEditStateRef.current = {
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

  const handleSplitStickerOverlayAtTime = useCallback(
    (overlayId: string, splitTime: number) => {
      setStickerOverlays((prev) => {
        const target = prev.find((overlay) => overlay.id === overlayId);
        if (!target) {
          return prev;
        }
        const minGap = minStickerDurationSeconds;
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
    [minStickerDurationSeconds, setStickerOverlays]
  );

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const state = stickerTrackEditStateRef.current;
      if (!state) {
        return;
      }
      const deltaSeconds =
        (event.clientX - state.startClientX) /
        Math.max(pixelsPerSecond, 0.0001);
      setStickerOverlays((prev) =>
        prev.map((overlay) => {
          if (overlay.id !== state.overlayId) {
            return overlay;
          }

          if (state.mode === "resize-left") {
            const maxStart = Math.max(
              0,
              state.endSeconds - minStickerDurationSeconds
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

          const minEnd = state.startSeconds + minStickerDurationSeconds;
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
      if (!stickerTrackEditStateRef.current) {
        return;
      }
      stickerTrackEditStateRef.current = null;
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
    minStickerDurationSeconds,
    pixelsPerSecond,
    setStickerOverlays,
  ]);

  return {
    stickerTrackClips,
    setStickerTrackClips,
    handleStickerTrackEditStart,
    handleSplitStickerOverlayAtTime,
  };
}
