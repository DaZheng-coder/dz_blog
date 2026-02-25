import type { MouseEvent as ReactMouseEvent } from "react";
import type { PreviewResizeEdge } from "./ClipPreviewSelectionFrame";

function resolveSignedDelta(
  edge: PreviewResizeEdge,
  deltaX: number,
  deltaY: number
) {
  if (edge === "top") {
    return -deltaY;
  }
  if (edge === "bottom") {
    return deltaY;
  }
  if (edge === "left") {
    return -deltaX;
  }
  return deltaX;
}

export function usePreviewOverlayEdgeResize() {
  return (
    event: ReactMouseEvent<HTMLElement>,
    edge: PreviewResizeEdge,
    onResizeByDelta: (signedDelta: number) => void
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      onResizeByDelta(resolveSignedDelta(edge, deltaX, deltaY));
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };
}
