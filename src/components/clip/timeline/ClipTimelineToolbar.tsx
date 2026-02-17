import type { SetStateAction } from "react";
import { DEFAULT_ZOOM } from "./clipTimelineConfig";
import { clamp, formatTime } from "./clipTimelineUtils";
import { timelineZoomButtonClass } from "../shared/styles";

type ClipTimelineToolbarProps = {
  currentTimeSeconds: number;
  pixelsPerSecond: number;
  minZoom: number;
  maxZoom: number;
  onSplitSelected: () => void;
  setPixelsPerSecond: (next: SetStateAction<number>) => void;
};

export function ClipTimelineToolbar({
  currentTimeSeconds,
  pixelsPerSecond,
  minZoom,
  maxZoom,
  onSplitSelected,
  setPixelsPerSecond,
}: ClipTimelineToolbarProps) {
  const zoomPercent = Math.round((pixelsPerSecond / DEFAULT_ZOOM) * 100);

  return (
    <div className="flex h-11 items-center justify-between border-b border-white/10 px-4">
      <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
        <span className="rounded bg-white/10 px-2 py-1 text-[#d1d5db]">
          主时间线
        </span>
        <span>{formatTime(currentTimeSeconds)}</span>
        <span>缩放 {zoomPercent}%</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="cursor-pointer rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#d1d5db] hover:border-[#22d3ee]/70"
          title="切割工具"
          aria-label="切割工具"
          onClick={onSplitSelected}
        >
          切割
        </button>
        <button
          className={timelineZoomButtonClass}
          onClick={() =>
            setPixelsPerSecond((prev) => clamp(prev + 2, minZoom, maxZoom))
          }
        >
          +
        </button>
        <button
          className={timelineZoomButtonClass}
          onClick={() =>
            setPixelsPerSecond((prev) => clamp(prev - 2, minZoom, maxZoom))
          }
        >
          -
        </button>
        <input
          type="range"
          min={minZoom}
          max={maxZoom}
          step={1}
          value={pixelsPerSecond}
          onChange={(event) => setPixelsPerSecond(Number(event.target.value))}
          className="h-1.5 w-28 cursor-pointer appearance-none rounded-full bg-white/15 accent-[#67e8f9]"
          aria-label="时间轴缩放"
        />
      </div>
    </div>
  );
}
