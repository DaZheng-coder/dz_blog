import type { MouseEvent as ReactMouseEvent, RefObject } from "react";

type UsePreviewOverlayPointerDragOptions = {
  stageRef: RefObject<HTMLDivElement | null>;
  dragThresholdPx?: number;
  preservePointerOffset?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function usePreviewOverlayPointerDrag({
  stageRef,
  dragThresholdPx = 0,
  preservePointerOffset = true,
}: UsePreviewOverlayPointerDragOptions) {
  return (
    event: ReactMouseEvent<HTMLElement>,
    onUpdatePosition: (xPercent: number, yPercent: number) => void
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const rect = stage.getBoundingClientRect();
    const overlayRect = event.currentTarget.getBoundingClientRect();
    const overlayCenterX = overlayRect.left + overlayRect.width / 2;
    const overlayCenterY = overlayRect.top + overlayRect.height / 2;
    const dragOffsetX = preservePointerOffset ? event.clientX - overlayCenterX : 0;
    const dragOffsetY = preservePointerOffset ? event.clientY - overlayCenterY : 0;
    const startClientX = event.clientX;
    const startClientY = event.clientY;
    let didStartDrag = false;

    const updatePosition = (clientX: number, clientY: number) => {
      const centerX = clientX - dragOffsetX;
      const centerY = clientY - dragOffsetY;
      const xPercent = clamp(((centerX - rect.left) / rect.width) * 100, 0, 100);
      const yPercent = clamp(((centerY - rect.top) / rect.height) * 100, 0, 100);
      onUpdatePosition(xPercent, yPercent);
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!didStartDrag && dragThresholdPx > 0) {
        const deltaX = Math.abs(moveEvent.clientX - startClientX);
        const deltaY = Math.abs(moveEvent.clientY - startClientY);
        if (deltaX < dragThresholdPx && deltaY < dragThresholdPx) {
          return;
        }
      }
      didStartDrag = true;
      updatePosition(moveEvent.clientX, moveEvent.clientY);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };
}
