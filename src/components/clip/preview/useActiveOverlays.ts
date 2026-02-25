import { useMemo } from "react";

type TimeRangeOverlay = {
  startSeconds: number;
  endSeconds: number;
};

export function useActiveOverlays<T extends TimeRangeOverlay>(
  overlays: T[],
  currentTimeSeconds: number
) {
  return useMemo(
    () =>
      overlays.filter(
        (overlay) =>
          currentTimeSeconds >= overlay.startSeconds &&
          currentTimeSeconds < overlay.endSeconds
      ),
    [currentTimeSeconds, overlays]
  );
}
