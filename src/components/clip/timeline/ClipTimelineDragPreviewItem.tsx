import { MIN_CLIP_WIDTH } from "./clipTimelineConfig";
import { formatTime } from "./clipTimelineUtils";
import type { TimelineDragPreview } from "./ClipTimelineTrackView";

type ClipTimelineDragPreviewItemProps = {
  dragPreview: TimelineDragPreview;
  pixelsPerSecond: number;
  compact?: boolean;
};

export function ClipTimelineDragPreviewItem({
  dragPreview,
  pixelsPerSecond,
  compact = false,
}: ClipTimelineDragPreviewItemProps) {
  return (
    <article
      className={`pointer-events-none absolute rounded-md border border-[#67e8f9] bg-[#22d3ee]/20 text-xs text-[#d5faff] ${
        compact ? "top-1 h-4 px-1 py-0" : "top-1.5 h-[3.25rem] px-2 py-1"
      }`}
      style={{
        left: `${dragPreview.startSeconds * pixelsPerSecond}px`,
        width: `${Math.max(
          dragPreview.durationSeconds * pixelsPerSecond,
          MIN_CLIP_WIDTH
        )}px`,
      }}
    >
      <p className={compact ? "truncate text-[10px] font-medium leading-4" : "truncate font-medium"}>
        {dragPreview.title}
      </p>
      {!compact ? (
        <p className="mt-1 text-[11px] text-[#d5faff]/90">
          {formatTime(dragPreview.durationSeconds)}
        </p>
      ) : null}
    </article>
  );
}
