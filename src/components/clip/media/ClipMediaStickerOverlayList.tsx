import { useMemo } from "react";
import DeleteIcon from "../../../assets/delete.svg?react";
import type { ClipStickerOverlay } from "../shared/types";
import { formatTimelineRangeTime } from "../shared/time";

type ClipMediaStickerOverlayListProps = {
  stickerOverlays: ClipStickerOverlay[];
  selectedStickerId: string | null;
  onAddSticker: (sticker: string) => void;
  onSelectSticker: (sticker: ClipStickerOverlay) => void;
  onUpdateStickerOverlay: (
    overlayId: string,
    patch: Partial<ClipStickerOverlay>
  ) => void;
  onDeleteStickerOverlay: (overlayId: string) => void;
};

const PRESET_STICKERS = ["😀", "😍", "🔥", "✨", "🎉", "👍", "💡", "🚀"];

function toInputNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export function ClipMediaStickerOverlayList({
  stickerOverlays,
  selectedStickerId,
  onAddSticker,
  onSelectSticker,
  onUpdateStickerOverlay,
  onDeleteStickerOverlay,
}: ClipMediaStickerOverlayListProps) {
  const sortedStickerOverlays = useMemo(
    () =>
      [...stickerOverlays].sort((a, b) => {
        if (a.startSeconds !== b.startSeconds) {
          return a.startSeconds - b.startSeconds;
        }
        return a.id.localeCompare(b.id);
      }),
    [stickerOverlays]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {PRESET_STICKERS.map((sticker) => (
          <button
            key={sticker}
            className="cursor-pointer rounded border border-white/15 bg-white/5 px-2 py-1 text-lg hover:border-[#22d3ee]/60"
            onClick={() => onAddSticker(sticker)}
          >
            {sticker}
          </button>
        ))}
      </div>

      {sortedStickerOverlays.length === 0 ? (
        <p className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs text-[#9ca3af]">
          暂无贴纸，请先添加一个。
        </p>
      ) : (
        <div className="space-y-2">
          {sortedStickerOverlays.map((overlay) => (
            <div
              key={overlay.id}
              className={`grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-2 rounded border p-2 ${
                selectedStickerId === overlay.id
                  ? "border-[#22d3ee]/70 bg-[#22d3ee]/10"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
              onClick={() => onSelectSticker(overlay)}
            >
              <span className="text-2xl">{overlay.sticker}</span>
              <div className="space-y-1 text-[11px] text-[#9ca3af]">
                <div>
                  {formatTimelineRangeTime(overlay.startSeconds)}～
                  {formatTimelineRangeTime(overlay.endSeconds)}
                </div>
                <label className="inline-flex items-center gap-1">
                  大小
                  <input
                    type="number"
                    step={1}
                    className="w-20 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-[#22d3ee]/70"
                    value={toInputNumber(overlay.size)}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      onUpdateStickerOverlay(overlay.id, {
                        size: Math.max(16, Number(event.target.value) || 16),
                      })
                    }
                  />
                </label>
              </div>
              <button
                className="cursor-pointer rounded border border-red-400/35 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:border-red-300/70"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteStickerOverlay(overlay.id);
                }}
              >
                <DeleteIcon className="h-4 w-4 fill-current" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
