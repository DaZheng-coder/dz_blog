import type { MouseEvent as ReactMouseEvent } from "react";

export type PreviewResizeEdge = "top" | "right" | "bottom" | "left";

type ClipPreviewSelectionFrameProps = {
  frameClassName: string;
  topHandleClassName: string;
  rightHandleClassName: string;
  bottomHandleClassName: string;
  leftHandleClassName: string;
  onResizeStart: (
    event: ReactMouseEvent<HTMLDivElement>,
    edge: PreviewResizeEdge
  ) => void;
};

export function ClipPreviewSelectionFrame({
  frameClassName,
  topHandleClassName,
  rightHandleClassName,
  bottomHandleClassName,
  leftHandleClassName,
  onResizeStart,
}: ClipPreviewSelectionFrameProps) {
  return (
    <>
      <div className={frameClassName} />
      <div
        className={topHandleClassName}
        onMouseDown={(event) => onResizeStart(event, "top")}
      />
      <div
        className={rightHandleClassName}
        onMouseDown={(event) => onResizeStart(event, "right")}
      />
      <div
        className={bottomHandleClassName}
        onMouseDown={(event) => onResizeStart(event, "bottom")}
      />
      <div
        className={leftHandleClassName}
        onMouseDown={(event) => onResizeStart(event, "left")}
      />
    </>
  );
}
