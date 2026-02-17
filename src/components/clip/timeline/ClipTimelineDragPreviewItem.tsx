import { formatTime } from "./clipTimelineUtils";
import type { TimelineDragPreview } from "./ClipTimelineTrackView";

const MIN_RENDER_WIDTH_PX = 1;

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
  const x = dragPreview.startSeconds * pixelsPerSecond;
  const width = Math.max(
    dragPreview.durationSeconds * pixelsPerSecond,
    MIN_RENDER_WIDTH_PX
  );
  return (
    <article
      className={`pointer-events-none absolute left-0 rounded-md border border-[#67e8f9] bg-[#22d3ee]/20 text-xs text-[#d5faff] will-change-transform ${
        compact ? "top-1 h-4 px-1 py-0" : "top-1.5 h-[3.25rem] px-2 py-1"
      }`}
      style={{
        transform: `translate3d(${x}px, 0, 0)`,
        width: `${width}px`,
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
