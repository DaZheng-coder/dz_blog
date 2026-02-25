import { useEffect } from "react";

type UsePreviewOverlayOutsideDismissOptions = {
  enabled: boolean;
  overlayDatasetKeys: string[];
  onDismiss: () => void;
};

export function usePreviewOverlayOutsideDismiss({
  enabled,
  overlayDatasetKeys,
  onDismiss,
}: UsePreviewOverlayOutsideDismissOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleDocumentPointerDown = (event: PointerEvent) => {
      const path = event.composedPath();
      const clickedInsideOverlay = path.some((node) => {
        if (!(node instanceof HTMLElement)) {
          return false;
        }
        return overlayDatasetKeys.some((key) => node.dataset[key] !== undefined);
      });
      const clickedInsideInspector = path.some((node) => {
        if (!(node instanceof HTMLElement)) {
          return false;
        }
        return node.dataset.clipInspector !== undefined;
      });
      if (clickedInsideOverlay || clickedInsideInspector) {
        return;
      }
      onDismiss();
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown, true);
    return () => {
      document.removeEventListener(
        "pointerdown",
        handleDocumentPointerDown,
        true
      );
    };
  }, [enabled, onDismiss, overlayDatasetKeys]);
}
