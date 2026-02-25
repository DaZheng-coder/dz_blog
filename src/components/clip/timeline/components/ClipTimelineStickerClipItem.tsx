import type {
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import type { ClipTrackClip } from "../../shared/types";
import { ClipTimelineTextClipItem } from "./ClipTimelineTextClipItem";
import StickerIcon from "../../../../assets/sticker.svg?react";

type ClipTimelineStickerClipItemProps = {
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

export function ClipTimelineStickerClipItem(
  props: ClipTimelineStickerClipItemProps
) {
  return (
    <ClipTimelineTextClipItem
      {...props}
      leadingIcon={<StickerIcon className="h-3.5 w-3.5 fill-current mr-0.5" />}
      leftResizeAriaLabel="调整贴纸开始时间"
      rightResizeAriaLabel="调整贴纸结束时间"
    />
  );
}
