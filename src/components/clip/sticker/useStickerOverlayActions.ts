import { useCallback } from "react";
import type { ClipStickerOverlay } from "../shared/types";
import { useClipEditorStore } from "../store/clipEditorStore";

const DEFAULT_STICKER_OVERLAY_DURATION_SECONDS = 3;
const DEFAULT_STICKER_OVERLAY_STYLE = {
  xPercent: 50,
  yPercent: 50,
  size: 48,
} as const;

export function useStickerOverlayActions() {
  const stickerOverlays = useClipEditorStore((state) => state.stickerOverlays);
  const timelineCurrentTimeSeconds = useClipEditorStore(
    (state) => state.timelineCurrentTimeSeconds
  );
  const addStickerOverlay = useClipEditorStore((state) => state.addStickerOverlay);
  const setStickerOverlays = useClipEditorStore(
    (state) => state.setStickerOverlays
  );

  const addStickerOverlayAtCurrentTime = useCallback(
    (sticker: string) => {
      const value = sticker.trim();
      if (!value) {
        return null;
      }
      const startSeconds = Math.max(0, timelineCurrentTimeSeconds || 0);
      return addStickerOverlay({
        sticker: value,
        startSeconds,
        endSeconds: startSeconds + DEFAULT_STICKER_OVERLAY_DURATION_SECONDS,
        ...DEFAULT_STICKER_OVERLAY_STYLE,
      });
    },
    [addStickerOverlay, timelineCurrentTimeSeconds]
  );

  const updateStickerOverlay = useCallback(
    (overlayId: string, patch: Partial<ClipStickerOverlay>) => {
      setStickerOverlays((prev) =>
        prev.map((overlay) =>
          overlay.id === overlayId ? { ...overlay, ...patch } : overlay
        )
      );
    },
    [setStickerOverlays]
  );

  const removeStickerOverlay = useCallback(
    (overlayId: string) => {
      setStickerOverlays((prev) => prev.filter((overlay) => overlay.id !== overlayId));
    },
    [setStickerOverlays]
  );

  return {
    stickerOverlays,
    timelineCurrentTimeSeconds,
    setStickerOverlays,
    addStickerOverlayAtCurrentTime,
    updateStickerOverlay,
    removeStickerOverlay,
  };
}
