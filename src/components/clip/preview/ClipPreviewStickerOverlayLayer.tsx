import { type MouseEvent as ReactMouseEvent, type RefObject } from "react";
import type { ClipStickerOverlay } from "../shared/types";
import {
  ClipPreviewSelectionFrame,
  type PreviewResizeEdge,
} from "./ClipPreviewSelectionFrame";
import { useActiveOverlays } from "./useActiveOverlays";
import { usePreviewOverlayEdgeResize } from "./usePreviewOverlayEdgeResize";
import { usePreviewOverlayOutsideDismiss } from "./usePreviewOverlayOutsideDismiss";
import { usePreviewOverlayPointerDrag } from "./usePreviewOverlayPointerDrag";

const MIN_STICKER_SIZE = 16;
const MAX_STICKER_SIZE = 320;
const STICKER_RESIZE_SENSITIVITY = 0.45;
const PREVIEW_STICKER_OVERLAY_DATASET_KEYS = ["previewStickerOverlay"];

type ClipPreviewStickerOverlayLayerProps = {
  stageRef: RefObject<HTMLDivElement | null>;
  stickerOverlays: ClipStickerOverlay[];
  currentTimeSeconds: number;
  selectedStickerId: string | null;
  onSelectSticker: (sticker: ClipStickerOverlay) => void;
  onClearSelection: () => void;
  setStickerOverlays: (
    updater:
      | ClipStickerOverlay[]
      | ((prevOverlays: ClipStickerOverlay[]) => ClipStickerOverlay[])
  ) => void;
};

export function ClipPreviewStickerOverlayLayer({
  stageRef,
  stickerOverlays,
  currentTimeSeconds,
  selectedStickerId,
  onSelectSticker,
  onClearSelection,
  setStickerOverlays,
}: ClipPreviewStickerOverlayLayerProps) {
  const activeStickerOverlays = useActiveOverlays(
    stickerOverlays,
    currentTimeSeconds
  );
  const startPointerDrag = usePreviewOverlayPointerDrag({
    stageRef,
    preservePointerOffset: false,
  });
  const startEdgeResize = usePreviewOverlayEdgeResize();

  const handleStickerResizeStart = (
    event: ReactMouseEvent<HTMLDivElement>,
    overlayId: string,
    edge: PreviewResizeEdge
  ) => {
    const target = stickerOverlays.find((overlay) => overlay.id === overlayId);
    if (!target) {
      return;
    }
    const startSize = Math.max(MIN_STICKER_SIZE, target.size || 0);
    startEdgeResize(event, edge, (delta) => {
      const nextSize = Math.max(
        MIN_STICKER_SIZE,
        Math.min(MAX_STICKER_SIZE, startSize + delta * STICKER_RESIZE_SENSITIVITY)
      );

      setStickerOverlays((prev) =>
        prev.map((overlay) =>
          overlay.id === overlayId ? { ...overlay, size: nextSize } : overlay
        )
      );
    });
  };

  usePreviewOverlayOutsideDismiss({
    enabled: Boolean(selectedStickerId),
    overlayDatasetKeys: PREVIEW_STICKER_OVERLAY_DATASET_KEYS,
    onDismiss: onClearSelection,
  });

  return (
    <>
      {activeStickerOverlays.map((overlay) => (
        <div
          key={overlay.id}
          data-preview-sticker-overlay
          className={`absolute select-none ${
            selectedStickerId === overlay.id ? "cursor-move" : "cursor-pointer"
          }`}
          style={{
            left: `${overlay.xPercent}%`,
            top: `${overlay.yPercent}%`,
            transform: "translate(-50%, -50%)",
            fontSize: `${overlay.size}px`,
            lineHeight: 1,
            filter:
              selectedStickerId === overlay.id
                ? "drop-shadow(0 0 6px rgba(103,232,249,0.9))"
                : "drop-shadow(0 2px 4px rgba(0,0,0,0.65))",
          }}
          onClick={(event) => {
            event.stopPropagation();
            onSelectSticker(overlay);
          }}
          onMouseDown={(event) =>
            startPointerDrag(event, (xPercent, yPercent) => {
              setStickerOverlays((prev) =>
                prev.map((item) =>
                  item.id === overlay.id ? { ...item, xPercent, yPercent } : item
                )
              );
            })
          }
        >
          {selectedStickerId === overlay.id ? (
            <ClipPreviewSelectionFrame
              frameClassName="pointer-events-none absolute inset-[-8px] rounded border border-[#67e8f9]/90"
              topHandleClassName="absolute left-[-8px] right-[-8px] top-[-8px] h-[3px] cursor-ns-resize bg-[#67e8f9]/95"
              rightHandleClassName="absolute bottom-[-8px] right-[-8px] top-[-8px] w-[3px] cursor-ew-resize bg-[#67e8f9]/95"
              bottomHandleClassName="absolute bottom-[-8px] left-[-8px] right-[-8px] h-[3px] cursor-ns-resize bg-[#67e8f9]/95"
              leftHandleClassName="absolute bottom-[-8px] left-[-8px] top-[-8px] w-[3px] cursor-ew-resize bg-[#67e8f9]/95"
              onResizeStart={(event, edge) =>
                handleStickerResizeStart(event, overlay.id, edge)
              }
            />
          ) : null}
          {overlay.sticker}
        </div>
      ))}
    </>
  );
}
