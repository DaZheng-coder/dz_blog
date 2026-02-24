import { formatDuration } from "../shared/time";
import type { ClipMediaAsset } from "../shared/types";

type ClipInspectorAssetSectionProps = {
  asset: ClipMediaAsset;
};

export function ClipInspectorAssetSection({
  asset,
}: ClipInspectorAssetSectionProps) {
  return (
    <>
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <p className="text-xs text-[#9ca3af]">素材信息</p>
        <div className="mt-2 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#cbd5e1]">标题</span>
            <span className="max-w-[70%] truncate rounded bg-white/10 px-2 py-0.5 text-white">
              {asset.title}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#cbd5e1]">类型</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-white">
              {asset.mediaType === "audio" ? "音频" : "视频"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#cbd5e1]">时长</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-white">
              {formatDuration(asset.durationSeconds)}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <p className="text-xs text-[#9ca3af]">封面预览</p>
        <div className="mt-2 relative aspect-[4/3] w-full overflow-hidden rounded-md bg-gradient-to-br from-[#1f2937] to-[#0f172a]">
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
      </section>
    </>
  );
}
