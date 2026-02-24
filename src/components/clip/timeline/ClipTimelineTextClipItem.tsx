import type {
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { TRACK_COLORS } from "./clipTimelineConfig";
import type { ClipTrackClip } from "../shared/types";
import TextIcon from "../../../assets/text.svg?react";

type ClipTimelineTextClipItemProps = {
  clip: ClipTrackClip;
  index: number;
  pixelsPerSecond: number;
  minWidthPx: number;
  timelineToolMode: "select" | "cut";
  onDragStart: (
    event: ReactDragEvent<HTMLElement>,
    clip: ClipTrackClip
  ) => void;
  onDragEnd: () => void;
  onSplitAtClientX: (
    clip: ClipTrackClip,
    clientX: number,
    rectLeft: number
  ) => void;
  onResizeLeftStart: (
    event: ReactMouseEvent<HTMLElement>,
    clip: ClipTrackClip
  ) => void;
  onResizeRightStart: (
    event: ReactMouseEvent<HTMLElement>,
    clip: ClipTrackClip
  ) => void;
  onSelect: (clipId: string, appendSelection: boolean) => void;
  isSelected: boolean;
};

export function ClipTimelineTextClipItem({
  clip,
  index,
  pixelsPerSecond,
  minWidthPx,
  timelineToolMode,
  onDragStart,
  onDragEnd,
  onSplitAtClientX,
  onResizeLeftStart,
  onResizeRightStart,
  onSelect,
  isSelected,
}: ClipTimelineTextClipItemProps) {
  const clipWidth = Math.max(
    minWidthPx,
    clip.durationSeconds * pixelsPerSecond
  );
  const clipX = clip.startSeconds * pixelsPerSecond;
  const colorClass = TRACK_COLORS[index % TRACK_COLORS.length];

  return (
    <article
      key={clip.id}
      draggable={timelineToolMode !== "cut"}
      className={`absolute left-0 top-0 flex h-4.5 items-center rounded-md border bg-gradient-to-r px-1 text-[10px] text-white/95 ${
        isSelected ? "ring-2 ring-[#67e8f9]" : ""
      } ${colorClass}`}
      style={{
        transform: `translate3d(${clipX}px, 0, 0)`,
        width: `${clipWidth}px`,
        cursor: timelineToolMode === "cut" ? "inherit" : "grab",
      }}
      title={clip.title}
      onDragStart={(event) => {
        if (timelineToolMode === "cut") {
          event.preventDefault();
          return;
        }
        onDragStart(event, clip);
      }}
      onDragEnd={onDragEnd}
      onMouseDown={(event) => {
        if (timelineToolMode === "cut") {
          return;
        }
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (timelineToolMode === "select") {
          onSelect(clip.id, event.metaKey || event.ctrlKey);
          return;
        }
        if (timelineToolMode !== "cut") {
          return;
        }
        onSplitAtClientX(
          clip,
          event.clientX,
          event.currentTarget.getBoundingClientRect().left
        );
      }}
    >
      <button
        type="button"
        className="absolute -left-1 top-0 h-full w-2 rounded-l border-r border-white/30 bg-white/15 hover:bg-white/30"
        style={{ cursor: timelineToolMode === "cut" ? "inherit" : "ew-resize" }}
        onMouseDown={(event) => onResizeLeftStart(event, clip)}
        onClick={(event) => event.stopPropagation()}
        disabled={timelineToolMode === "cut"}
        aria-label="调整文本开始时间"
      />
      <TextIcon className="h-4 w-4 fill-current" />
      <span className="truncate">{clip.title}</span>
      <button
        type="button"
        className="absolute -right-1 top-0 h-full w-2 rounded-r border-l border-white/30 bg-white/15 hover:bg-white/30"
        style={{ cursor: timelineToolMode === "cut" ? "inherit" : "ew-resize" }}
        onMouseDown={(event) => onResizeRightStart(event, clip)}
        onClick={(event) => event.stopPropagation()}
        disabled={timelineToolMode === "cut"}
        aria-label="调整文本结束时间"
      />
    </article>
  );
}
