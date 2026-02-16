import type { DragEvent as ReactDragEvent, MouseEvent as ReactMouseEvent } from "react";
import { MIN_CLIP_WIDTH, TRACK_COLORS } from "./clipTimelineConfig";
import { formatTime } from "./clipTimelineUtils";
import type { ClipTrackClip } from "./types";

type ClipTimelineClipItemProps = {
  clip: ClipTrackClip;
  index: number;
  pixelsPerSecond: number;
  selectedClipId?: string | null;
  draggingClipId: string | null;
  resizingClipId: string | null;
  onClipClick: (clip: ClipTrackClip) => void;
  onClipDragStart: (
    event: ReactDragEvent<HTMLElement>,
    clip: ClipTrackClip
  ) => void;
  onClipDragEnd: () => void;
  onClipLeftResizeStart: (
    event: ReactMouseEvent<HTMLElement>,
    clip: ClipTrackClip
  ) => void;
  onClipResizeStart: (
    event: ReactMouseEvent<HTMLElement>,
    clip: ClipTrackClip
  ) => void;
};

export function ClipTimelineClipItem({
  clip,
  index,
  pixelsPerSecond,
  selectedClipId,
  draggingClipId,
  resizingClipId,
  onClipClick,
  onClipDragStart,
  onClipDragEnd,
  onClipLeftResizeStart,
  onClipResizeStart,
}: ClipTimelineClipItemProps) {
  return (
    <article
      draggable
      onClick={(event) => {
        event.stopPropagation();
        onClipClick(clip);
      }}
      onDragStart={(event) => onClipDragStart(event, clip)}
      onDragEnd={onClipDragEnd}
      className={`absolute top-1.5 h-[3.25rem] cursor-grab rounded-md border bg-gradient-to-r px-2 py-1 text-xs text-white ${
        TRACK_COLORS[index % TRACK_COLORS.length]
      } ${selectedClipId === clip.id ? "ring-2 ring-[#67e8f9]" : ""} ${
        draggingClipId === clip.id ? "opacity-60" : "opacity-100"
      }`}
      style={{
        left: `${clip.startSeconds * pixelsPerSecond}px`,
        width: `${Math.max(
          clip.durationSeconds * pixelsPerSecond,
          MIN_CLIP_WIDTH
        )}px`,
      }}
    >
      <button
        type="button"
        className={`absolute -left-1 top-0 h-full w-3 cursor-ew-resize rounded-l-md border-r border-white/25 ${
          resizingClipId === clip.id
            ? "bg-[#67e8f9]/40"
            : "bg-white/15 hover:bg-[#67e8f9]/30"
        }`}
        onMouseDown={(event) => onClipLeftResizeStart(event, clip)}
        onClick={(event) => event.stopPropagation()}
        aria-label="调整片段起始"
      />
      <p className="truncate font-medium">{clip.title}</p>
      <p className="mt-1 text-[11px] text-white/80">{formatTime(clip.durationSeconds)}</p>
      <button
        type="button"
        className={`absolute -right-1 top-0 h-full w-3 cursor-ew-resize rounded-r-md border-l border-white/25 ${
          resizingClipId === clip.id
            ? "bg-[#67e8f9]/40"
            : "bg-white/15 hover:bg-[#67e8f9]/30"
        }`}
        onMouseDown={(event) => onClipResizeStart(event, clip)}
        onClick={(event) => event.stopPropagation()}
        aria-label="调整片段时长"
      />
    </article>
  );
}
