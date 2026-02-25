import type { MouseEvent as ReactMouseEvent } from "react";
import { formatTime } from "../utils/clipTimelineUtils";

type ClipTimelineRulerProps = {
  rulerMarks: number[];
  rulerTickMarks: Array<{ second: number; major: boolean }>;
  pixelsPerSecond: number;
  timelineWidthPx: number;
  onSeekClick: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onSeekMouseDown: (event: ReactMouseEvent<HTMLDivElement>) => void;
};

export function ClipTimelineRuler({
  rulerMarks,
  rulerTickMarks,
  pixelsPerSecond,
  timelineWidthPx,
  onSeekClick,
  onSeekMouseDown,
}: ClipTimelineRulerProps) {
  return (
    <div
      className="relative mb-3 h-10 cursor-pointer pt-3 text-[11px] text-[#6b7280]"
      style={{ width: `${timelineWidthPx}px` }}
      onMouseDown={onSeekMouseDown}
      onClick={onSeekClick}
    >
      {rulerTickMarks.map((tick) => (
        <span
          key={`tick-${tick.second}`}
          className={`absolute bottom-0 -translate-x-1/2 border-l ${
            tick.major ? "h-3 border-white/45" : "h-2 border-white/25"
          }`}
          style={{ left: `${tick.second * pixelsPerSecond}px` }}
          aria-hidden="true"
        />
      ))}
      {rulerMarks.map((mark) => (
        <span
          key={mark}
          className="absolute -translate-x-1/2"
          style={{ left: `${mark * pixelsPerSecond}px` }}
        >
          {formatTime(mark)}
        </span>
      ))}
    </div>
  );
}
