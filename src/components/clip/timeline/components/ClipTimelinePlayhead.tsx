import type { MouseEvent as ReactMouseEvent } from "react";

type ClipTimelinePlayheadProps = {
  currentTimeX: number;
  isScrubbing: boolean;
  startOffsetPx?: number;
  disablePointerEvents?: boolean;
  onPlayheadMouseDown: (event: ReactMouseEvent<HTMLDivElement>) => void;
};

export function ClipTimelinePlayhead({
  currentTimeX,
  isScrubbing,
  startOffsetPx = 0,
  disablePointerEvents = false,
  onPlayheadMouseDown,
}: ClipTimelinePlayheadProps) {
  const clampedTimeX = Math.max(0, currentTimeX);
  return (
    <div
      className={`absolute bottom-0 top-0 left-0 z-30 will-change-transform ${
        disablePointerEvents ? "pointer-events-none" : ""
      } ${
        isScrubbing ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{ transform: `translate3d(${clampedTimeX + startOffsetPx}px, 0, 0)` }}
      onMouseDown={onPlayheadMouseDown}
    >
      <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-[#67e8f9]" />
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1.5">
        <div className="h-2.5 w-2.5 bg-[#67e8f9]" />
        <div className="mx-auto h-0 w-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#67e8f9]" />
      </div>
      <div className="absolute bottom-0 left-1/2 top-0 w-4 -translate-x-1/2" />
    </div>
  );
}
