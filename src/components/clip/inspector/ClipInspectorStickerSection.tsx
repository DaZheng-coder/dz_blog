import { formatTimelineRangeTime } from "../shared/time";
import type { ClipStickerOverlay } from "../shared/types";
import { ClipInspectorInfoRow, ClipInspectorSection } from "./ClipInspectorCommon";

type ClipInspectorStickerSectionProps = {
  sticker: ClipStickerOverlay;
};

export function ClipInspectorStickerSection({
  sticker,
}: ClipInspectorStickerSectionProps) {
  return (
    <ClipInspectorSection title="贴纸信息">
      <ClipInspectorInfoRow
        label="内容"
        value={
          <img
            src={sticker.sticker}
            alt="贴纸"
            className="h-7 w-7 object-contain"
            draggable={false}
          />
        }
      />
      <ClipInspectorInfoRow
        label="时间区间"
        value={`${formatTimelineRangeTime(sticker.startSeconds)} ~ ${formatTimelineRangeTime(
          sticker.endSeconds
        )}`}
      />
      <ClipInspectorInfoRow label="大小" value={`${Math.round(sticker.size)} px`} />
      <ClipInspectorInfoRow
        label="位置"
        value={`${Math.round(sticker.xPercent)}%, ${Math.round(sticker.yPercent)}%`}
      />
    </ClipInspectorSection>
  );
}
