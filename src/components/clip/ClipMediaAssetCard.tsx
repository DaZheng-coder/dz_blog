import type { DragEvent as ReactDragEvent } from "react";
import { formatDuration } from "./time";
import type { ClipVideoAsset } from "./types";

type ClipMediaAssetCardProps = {
  asset: ClipVideoAsset;
  onDragStart: (event: ReactDragEvent<HTMLElement>, asset: ClipVideoAsset) => void;
  onDragEnd: () => void;
};

export function ClipMediaAssetCard({
  asset,
  onDragStart,
  onDragEnd,
}: ClipMediaAssetCardProps) {
  return (
    <article
      draggable
      onDragStart={(event) => onDragStart(event, asset)}
      onDragEnd={onDragEnd}
      className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] p-2 transition hover:border-[#22d3ee]/50"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-gradient-to-br from-[#1f2937] to-[#0f172a]">
        {asset.coverDataUrl ? (
          <img
            src={asset.coverDataUrl}
            alt={asset.title}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-[#9ca3af]">
            暂无封面
          </div>
        )}
      </div>
      <p className="mt-1.5 truncate text-xs text-white">{asset.title}</p>
      <p className="text-[11px] text-[#9ca3af]">时长 {formatDuration(asset.durationSeconds)}</p>
    </article>
  );
}
