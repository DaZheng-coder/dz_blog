import {
  memo,
  useMemo,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { TRACK_COLORS } from "./clipTimelineConfig";
import { formatTime } from "./clipTimelineUtils";
import type { ClipTrackClip } from "../shared/types";

const TIMELINE_FRAME_TILE_WIDTH = 32;
const AUDIO_BAR_WIDTH = 3;
const MIN_RENDER_WIDTH_PX = 1;

type ClipTimelineClipItemProps = {
  clip: ClipTrackClip;
  index: number;
  compact?: boolean;
  pixelsPerSecond: number;
  selectedClipIds?: string[];
  timelineToolMode: "select" | "cut";
  draggingClipId: string | null;
  resizingClipId: string | null;
  onClipClick: (
    event: ReactMouseEvent<HTMLElement>,
    clip: ClipTrackClip,
    appendSelection: boolean
  ) => void;
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

export const ClipTimelineClipItem = memo(function ClipTimelineClipItem({
  clip,
  index,
  compact = false,
  pixelsPerSecond,
  selectedClipIds,
  timelineToolMode,
  draggingClipId,
  resizingClipId,
  onClipClick,
  onClipDragStart,
  onClipDragEnd,
  onClipLeftResizeStart,
  onClipResizeStart,
}: ClipTimelineClipItemProps) {
  const isCutMode = timelineToolMode === "cut";
  const clipWidth = useMemo(
    () => Math.max(clip.durationSeconds * pixelsPerSecond, MIN_RENDER_WIDTH_PX),
    [clip.durationSeconds, pixelsPerSecond]
  );
  const clipX = useMemo(
    () => clip.startSeconds * pixelsPerSecond,
    [clip.startSeconds, pixelsPerSecond]
  );
  const blockClass = compact ? "top-1 h-4 px-1 py-0" : "top-1.5 h-[3.25rem] px-2 py-1";
  const titleClass = compact ? "truncate text-[10px] font-medium leading-4" : "truncate font-medium";
  const handleClass = compact ? "w-2" : "w-3";
  const hasVideoFrames =
    !compact && clip.mediaType === "video" && (clip.frameThumbnails?.length || 0) > 0;
  const hasAudioLevels = clip.mediaType === "audio" && (clip.audioLevels?.length || 0) > 0;
  const displayedFrames = useMemo(() => {
    if (!hasVideoFrames || !clip.frameThumbnails) {
      return [];
    }
    const sourceFrames = clip.frameThumbnails;
    const sourceCount = sourceFrames.length;
    const slotCount = Math.max(1, Math.ceil(clipWidth / TIMELINE_FRAME_TILE_WIDTH));
    if (sourceCount === 1 || slotCount === 1) {
      return [sourceFrames[0]];
    }
    return Array.from({ length: slotCount }, (_, index) => {
      const ratio = index / (slotCount - 1);
      const sourceIndex = Math.min(
        sourceCount - 1,
        Math.round(ratio * (sourceCount - 1))
      );
      return sourceFrames[sourceIndex];
    });
  }, [clip.frameThumbnails, clipWidth, hasVideoFrames]);
  const displayedAudioLevels = useMemo(() => {
    if (!hasAudioLevels || !clip.audioLevels) {
      return [];
    }
    const sourceLevels = clip.audioLevels;
    const sourceCount = sourceLevels.length;
    const slotCount = Math.max(1, Math.ceil(clipWidth / AUDIO_BAR_WIDTH));
    if (sourceCount === 1 || slotCount === 1) {
      return [sourceLevels[0]];
    }
    return Array.from({ length: slotCount }, (_, levelIndex) => {
      const ratio = levelIndex / (slotCount - 1);
      const sourceIndex = Math.min(
        sourceCount - 1,
        Math.round(ratio * (sourceCount - 1))
      );
      return sourceLevels[sourceIndex];
    });
  }, [clip.audioLevels, clipWidth, hasAudioLevels]);

  return (
    <article
      draggable={!isCutMode}
      onClick={(event) => {
        event.stopPropagation();
        onClipClick(event, clip, event.metaKey || event.ctrlKey);
      }}
      onDragStart={(event) => {
        if (isCutMode) {
          event.preventDefault();
          return;
        }
        onClipDragStart(event, clip);
      }}
      onDragEnd={onClipDragEnd}
      className={`absolute left-0 rounded-md border bg-gradient-to-r text-xs text-white will-change-transform ${blockClass} ${
        TRACK_COLORS[index % TRACK_COLORS.length]
      } ${selectedClipIds?.includes(clip.id) ? "ring-2 ring-[#67e8f9]" : ""} ${
        draggingClipId === clip.id ? "opacity-60" : "opacity-100"
      }`}
      style={{
        transform: `translate3d(${clipX}px, 0, 0)`,
        width: `${clipWidth}px`,
        cursor: isCutMode ? "inherit" : "grab",
      }}
    >
      {hasVideoFrames ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
          <div className="flex h-full w-full">
            {displayedFrames.map((frame, frameIndex) => (
              <img
                key={`${clip.id}-frame-${frameIndex}`}
                src={frame}
                alt=""
                className="h-full shrink-0 object-cover"
                style={{ width: `${TIMELINE_FRAME_TILE_WIDTH}px` }}
                draggable={false}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        </div>
      ) : null}
      {hasAudioLevels ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
          <div className="flex h-full w-full items-end gap-px px-1">
            {displayedAudioLevels.map((level, levelIndex) => (
              <span
                key={`${clip.id}-audio-level-${levelIndex}`}
                className="block shrink-0 rounded-sm bg-white/55"
                style={{
                  width: compact ? "2px" : `${AUDIO_BAR_WIDTH}px`,
                  height: `${Math.max(16, level * 100)}%`,
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
        </div>
      ) : null}

      <button
        type="button"
        className={`absolute -left-1 top-0 z-20 h-full cursor-ew-resize rounded-l-md border-r border-white/25 ${handleClass} ${
          resizingClipId === clip.id
            ? "bg-[#67e8f9]/40"
            : "bg-white/15 hover:bg-[#67e8f9]/30"
        }`}
        onMouseDown={(event) => {
          if (isCutMode) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          onClipLeftResizeStart(event, clip);
        }}
        onClick={(event) => event.stopPropagation()}
        aria-label="调整片段起始"
        disabled={isCutMode}
        style={{ cursor: isCutMode ? "inherit" : "ew-resize" }}
      />
      <p
        className={`${titleClass} relative z-10 ${
          hasVideoFrames || hasAudioLevels
            ? "drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]"
            : ""
        }`}
      >
        {clip.title}
      </p>
      {!compact ? (
        <p className="relative z-10 mt-1 text-[11px] text-white/80">
          {formatTime(clip.durationSeconds)}
        </p>
      ) : null}
      <button
        type="button"
        className={`absolute -right-1 top-0 z-20 h-full cursor-ew-resize rounded-r-md border-l border-white/25 ${handleClass} ${
          resizingClipId === clip.id
            ? "bg-[#67e8f9]/40"
            : "bg-white/15 hover:bg-[#67e8f9]/30"
        }`}
        onMouseDown={(event) => {
          if (isCutMode) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          onClipResizeStart(event, clip);
        }}
        onClick={(event) => event.stopPropagation()}
        aria-label="调整片段时长"
        disabled={isCutMode}
        style={{ cursor: isCutMode ? "inherit" : "ew-resize" }}
      />
    </article>
  );
});
