import { formatDuration } from "../shared/time";
import type { ClipMediaAsset } from "../shared/types";
import { ClipInspectorInfoRow, ClipInspectorSection } from "./ClipInspectorCommon";

type ClipInspectorAssetSectionProps = {
  asset: ClipMediaAsset;
};

export function ClipInspectorAssetSection({
  asset,
}: ClipInspectorAssetSectionProps) {
  return (
    <>
      <ClipInspectorSection title="素材信息">
        <ClipInspectorInfoRow
          label="标题"
          value={asset.title}
          className="gap-3"
          valueClassName="max-w-[70%] truncate"
        />
        <ClipInspectorInfoRow
          label="类型"
          value={asset.mediaType === "audio" ? "音频" : "视频"}
        />
        <ClipInspectorInfoRow
          label="时长"
          value={formatDuration(asset.durationSeconds)}
        />
      </ClipInspectorSection>

      <ClipInspectorSection title="封面预览">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-gradient-to-br from-[#1f2937] to-[#0f172a]">
          {asset.coverDataUrl ? (
            <img
              src={asset.coverDataUrl}
              alt={asset.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-xs text-[#9ca3af]">
              暂无封面
            </div>
          )}
        </div>
      </ClipInspectorSection>
    </>
  );
}
