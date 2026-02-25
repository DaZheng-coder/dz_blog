import type { SetStateAction } from "react";
import { DEFAULT_ZOOM } from "../utils/clipTimelineConfig";
import { clamp, formatTime } from "../utils/clipTimelineUtils";
import PointerIcon from "../../../../assets/pointer.svg?react";
import ClipIcon from "../../../../assets/clip.svg?react";
import IncreaseIcon from "../../../../assets/increase.svg?react";
import DecreaseIcon from "../../../../assets/decrease.svg?react";
import { ClipButton } from "../../shared/ClipButton";

type ClipTimelineToolbarProps = {
  timelineToolMode: "select" | "cut";
  currentTimeSeconds: number;
  pixelsPerSecond: number;
  minZoom: number;
  maxZoom: number;
  onSelectTool: () => void;
  onCutTool: () => void;
  setPixelsPerSecond: (next: SetStateAction<number>) => void;
};

export function ClipTimelineToolbar({
  timelineToolMode,
  currentTimeSeconds,
  pixelsPerSecond,
  minZoom,
  maxZoom,
  onSelectTool,
  onCutTool,
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
        <ClipButton
          variant="timeline-zoom"
          aria-label="选择工具"
          onClick={onSelectTool}
        >
          <PointerIcon
            className={`h-4 w-4 fill-current ${
              timelineToolMode === "select" ? "text-[#67e8f9]" : "text-white"
            }`}
          />
        </ClipButton>
        <ClipButton
          variant="timeline-zoom"
          aria-label="切割工具"
          onClick={onCutTool}
        >
          <ClipIcon
            className={`h-4 w-4 fill-current ${
              timelineToolMode === "cut" ? "text-[#67e8f9]" : "text-white"
            }`}
          />
        </ClipButton>
        <div className="h-5 w-[1px] bg-white/10 mx-2"></div>
        <ClipButton
          variant="timeline-zoom"
          onClick={() =>
            setPixelsPerSecond((prev) => clamp(prev + 2, minZoom, maxZoom))
          }
        >
          <IncreaseIcon className="h-4 w-4 fill-current" />
        </ClipButton>
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
        <ClipButton
          variant="timeline-zoom"
          onClick={() =>
            setPixelsPerSecond((prev) => clamp(prev - 2, minZoom, maxZoom))
          }
        >
          <DecreaseIcon className="h-4 w-4 fill-current" />
        </ClipButton>
      </div>
    </div>
  );
}
