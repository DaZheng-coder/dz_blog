import { MIN_CLIP_WIDTH } from "./clipTimelineConfig";
import { formatTime } from "./clipTimelineUtils";
import type { TimelineDragPreview } from "./ClipTimelineTrackView";

type ClipTimelineDragPreviewItemProps = {
  dragPreview: TimelineDragPreview;
  pixelsPerSecond: number;
};

export function ClipTimelineDragPreviewItem({
  dragPreview,
  pixelsPerSecond,
}: ClipTimelineDragPreviewItemProps) {
  return (
    <article
      className="pointer-events-none absolute top-1.5 h-[3.25rem] rounded-md border border-[#67e8f9] bg-[#22d3ee]/20 px-2 py-1 text-xs text-[#d5faff]"
      style={{
        left: `${dragPreview.startSeconds * pixelsPerSecond}px`,
        width: `${Math.max(
          dragPreview.durationSeconds * pixelsPerSecond,
          MIN_CLIP_WIDTH
        )}px`,
      }}
    >
      <p className="truncate font-medium">{dragPreview.title}</p>
      <p className="mt-1 text-[11px] text-[#d5faff]/90">
        {formatTime(dragPreview.durationSeconds)}
      </p>
    </article>
  );
}
