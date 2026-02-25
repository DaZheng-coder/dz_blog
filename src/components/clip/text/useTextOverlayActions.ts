import { useCallback } from "react";
import type { ClipTextOverlay } from "../shared/types";
import { useClipEditorStore } from "../store/clipEditorStore";

const DEFAULT_TEXT_OVERLAY_DURATION_SECONDS = 3;
const DEFAULT_TEXT_OVERLAY_STYLE = {
  xPercent: 50,
  yPercent: 85,
  fontSize: 30,
  letterSpacing: 0,
  lineHeight: 1.2,
  color: "#ffffff",
} as const;

export function useTextOverlayActions() {
  const textOverlays = useClipEditorStore((state) => state.textOverlays);
  const timelineCurrentTimeSeconds = useClipEditorStore(
    (state) => state.timelineCurrentTimeSeconds
  );
  const addTextOverlay = useClipEditorStore((state) => state.addTextOverlay);
  const setTextOverlays = useClipEditorStore((state) => state.setTextOverlays);

  const addTextOverlayAtCurrentTime = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content) {
        return null;
      }
      const startSeconds = Math.max(0, timelineCurrentTimeSeconds || 0);
      return addTextOverlay({
        text: content,
        startSeconds,
        endSeconds: startSeconds + DEFAULT_TEXT_OVERLAY_DURATION_SECONDS,
        ...DEFAULT_TEXT_OVERLAY_STYLE,
      });
    },
    [addTextOverlay, timelineCurrentTimeSeconds]
  );

  const updateTextOverlay = useCallback(
    (overlayId: string, patch: Partial<ClipTextOverlay>) => {
      setTextOverlays((prev) =>
        prev.map((overlay) =>
          overlay.id === overlayId ? { ...overlay, ...patch } : overlay
        )
      );
    },
    [setTextOverlays]
  );

  const removeTextOverlay = useCallback(
    (overlayId: string) => {
      setTextOverlays((prev) => prev.filter((overlay) => overlay.id !== overlayId));
    },
    [setTextOverlays]
  );

  return {
    textOverlays,
    timelineCurrentTimeSeconds,
    addTextOverlayAtCurrentTime,
    updateTextOverlay,
    removeTextOverlay,
  };
}
