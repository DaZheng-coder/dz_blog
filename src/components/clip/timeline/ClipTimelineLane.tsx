import {
  memo,
  useMemo,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import { MIN_CLIP_WIDTH } from "./clipTimelineConfig";
import { ClipTimelineClipItem } from "./ClipTimelineClipItem";
import { ClipTimelineDragPreviewItem } from "./ClipTimelineDragPreviewItem";
import type { ClipTrackClip } from "../shared/types";

type TimelineDragPreview = {
  title: string;
  startSeconds: number;
  durationSeconds: number;
};

type ClipTimelineLaneProps = {
  laneRef: RefObject<HTMLDivElement | null>;
  laneId: string;
  laneHeightClassName: string;
  laneClassName: string;
  styleBackgroundImage: string;
  emptyHint: string;
  clips: ClipTrackClip[];
  compact?: boolean;
  selectedClipIds: string[];
  draggingClipId: string | null;
  resizingClipId: string | null;
  dragPreview: TimelineDragPreview | null;
  pixelsPerSecond: number;
  timelineWidthPx: number;
  majorGridWidth: number;
  minorGridWidth: number;
  viewportStartPx?: number;
  viewportWidthPx?: number;
  onTrackClick: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onTrackDragOver: (event: ReactDragEvent<HTMLDivElement>) => void;
  onTrackDragLeave: (event: ReactDragEvent<HTMLDivElement>) => void;
  onTrackDrop: (event: ReactDragEvent<HTMLDivElement>) => void;
  onClipClick: (clip: ClipTrackClip, appendSelection: boolean) => void;
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

export const ClipTimelineLane = memo(function ClipTimelineLane({
  laneRef,
  laneId,
  laneHeightClassName,
  laneClassName,
  styleBackgroundImage,
  emptyHint,
  clips,
  compact = false,
  selectedClipIds,
  draggingClipId,
  resizingClipId,
  dragPreview,
  pixelsPerSecond,
  timelineWidthPx,
  majorGridWidth,
  minorGridWidth,
  viewportStartPx,
  viewportWidthPx,
  onTrackClick,
  onTrackDragOver,
  onTrackDragLeave,
  onTrackDrop,
  onClipClick,
  onClipDragStart,
  onClipDragEnd,
  onClipLeftResizeStart,
  onClipResizeStart,
}: ClipTimelineLaneProps) {
  const visibleClips = useMemo(() => {
    if (
      typeof viewportStartPx !== "number" ||
      typeof viewportWidthPx !== "number" ||
      viewportWidthPx <= 0
    ) {
      return clips;
    }

    const bufferPx = Math.max(240, viewportWidthPx * 0.5);
    const minX = Math.max(0, viewportStartPx - bufferPx);
    const maxX = viewportStartPx + viewportWidthPx + bufferPx;

    return clips.filter((clip) => {
      const clipStartX = clip.startSeconds * pixelsPerSecond;
      const clipEndX = clipStartX + Math.max(clip.durationSeconds * pixelsPerSecond, MIN_CLIP_WIDTH);
      return clipEndX >= minX && clipStartX <= maxX;
    });
  }, [clips, pixelsPerSecond, viewportStartPx, viewportWidthPx]);
  const clipIndexById = useMemo(() => {
    const map = new Map<string, number>();
    clips.forEach((clip, index) => {
      map.set(clip.id, index);
    });
    return map;
  }, [clips]);

  return (
    <div
      ref={laneRef}
      data-clip-track-lane={laneId}
      data-track-pps={pixelsPerSecond}
      data-track-min-clip-width={MIN_CLIP_WIDTH}
      className={`relative rounded-md select-none ${laneHeightClassName} ${laneClassName}`}
      style={{
        width: `${timelineWidthPx}px`,
        backgroundImage: styleBackgroundImage,
        backgroundSize: `${minorGridWidth}px 100%, ${majorGridWidth}px 100%`,
      }}
      onClick={onTrackClick}
      onDragOver={onTrackDragOver}
      onDragLeave={onTrackDragLeave}
      onDrop={onTrackDrop}
    >
      {clips.length === 0 ? (
        <div className="absolute inset-0 grid place-items-center text-xs text-[#6b7280]">
          {emptyHint}
        </div>
      ) : null}

      {visibleClips.map((clip) => (
        <ClipTimelineClipItem
          key={clip.id}
          clip={clip}
          index={clipIndexById.get(clip.id) ?? 0}
          compact={compact}
          pixelsPerSecond={pixelsPerSecond}
          selectedClipIds={selectedClipIds}
          draggingClipId={draggingClipId}
          resizingClipId={resizingClipId}
          onClipClick={onClipClick}
          onClipDragStart={onClipDragStart}
          onClipDragEnd={onClipDragEnd}
          onClipLeftResizeStart={onClipLeftResizeStart}
          onClipResizeStart={onClipResizeStart}
        />
      ))}

      {dragPreview ? (
        <ClipTimelineDragPreviewItem
          dragPreview={dragPreview}
          pixelsPerSecond={pixelsPerSecond}
          compact={compact}
        />
      ) : null}
    </div>
  );
});
