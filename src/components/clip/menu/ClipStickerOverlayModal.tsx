import DeleteIcon from "../../../assets/delete.svg?react";
import type { ClipStickerOverlay } from "../shared/types";

type ClipStickerOverlayModalProps = {
  isOpen: boolean;
  currentTimeSeconds: number;
  overlays: ClipStickerOverlay[];
  onClose: () => void;
  onAdd: (sticker: string) => void;
  onUpdate: (overlayId: string, patch: Partial<ClipStickerOverlay>) => void;
  onDelete: (overlayId: string) => void;
};

const PRESET_STICKERS = ["😀", "😍", "🔥", "✨", "🎉", "👍", "💡", "🚀"];

function toInputNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export function ClipStickerOverlayModal({
  isOpen,
  currentTimeSeconds,
  overlays,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}: ClipStickerOverlayModalProps) {
  if (!isOpen) {
    return null;
  }

  const sortedOverlays = [...overlays].sort(
    (a, b) => a.startSeconds - b.startSeconds
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-white/15 bg-[#0b111b] p-4 text-[#e5e7eb] shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">贴纸管理</h3>
            <p className="text-xs text-[#9ca3af]">
              当前时间：{currentTimeSeconds.toFixed(2)}s
            </p>
          </div>
          <button
            className="cursor-pointer rounded border border-white/15 px-2 py-0.5 text-xs text-[#9ca3af] hover:border-[#22d3ee]/60"
            onClick={onClose}
          >
            关闭
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          {PRESET_STICKERS.map((sticker) => (
            <button
              key={sticker}
              className="cursor-pointer rounded border border-white/15 bg-white/5 px-2 py-1 text-lg hover:border-[#22d3ee]/60"
              onClick={() => onAdd(sticker)}
            >
              {sticker}
            </button>
          ))}
        </div>

        <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
          {sortedOverlays.length === 0 ? (
            <p className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs text-[#9ca3af]">
              还没有贴纸，先添加一个试试。
            </p>
          ) : null}

          {sortedOverlays.map((overlay) => (
            <div
              key={overlay.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-2 rounded border border-white/10 bg-white/[0.03] p-2"
            >
              <span className="text-2xl">{overlay.sticker}</span>
              <label className="flex items-center gap-1 text-[11px] text-[#9ca3af]">
                大小
                <input
                  type="number"
                  step={1}
                  className="w-20 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-[#22d3ee]/70"
                  value={toInputNumber(overlay.size)}
                  onChange={(event) =>
                    onUpdate(overlay.id, {
                      size: Math.max(16, Number(event.target.value) || 16),
                    })
                  }
                />
              </label>
              <label className="flex items-center gap-1 text-[11px] text-[#9ca3af]">
                开始
                <input
                  type="number"
                  step={0.1}
                  className="w-20 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-[#22d3ee]/70"
                  value={toInputNumber(overlay.startSeconds)}
                  onChange={(event) => {
                    const start = Math.max(0, Number(event.target.value) || 0);
                    const end = Math.max(start, overlay.endSeconds);
                    onUpdate(overlay.id, {
                      startSeconds: start,
                      endSeconds: end,
                    });
                  }}
                />
              </label>
              <label className="flex items-center gap-1 text-[11px] text-[#9ca3af]">
                结束
                <input
                  type="number"
                  step={0.1}
                  className="w-20 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-[#22d3ee]/70"
                  value={toInputNumber(overlay.endSeconds)}
                  onChange={(event) => {
                    const end = Math.max(
                      overlay.startSeconds,
                      Number(event.target.value) || 0
                    );
                    onUpdate(overlay.id, { endSeconds: end });
                  }}
                />
              </label>
              <button
                className="cursor-pointer rounded border border-red-400/35 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:border-red-300/70"
                onClick={() => onDelete(overlay.id)}
              >
                <DeleteIcon className="h-4 w-4 fill-current" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
