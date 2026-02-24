import { useState } from "react";
import type { ClipTextOverlay } from "../shared/types";
import DeleteIcon from "../../../assets/delete.svg?react";

type ClipTextOverlayModalProps = {
  isOpen: boolean;
  currentTimeSeconds: number;
  overlays: ClipTextOverlay[];
  onClose: () => void;
  onAdd: (text: string) => void;
  onUpdate: (overlayId: string, patch: Partial<ClipTextOverlay>) => void;
  onDelete: (overlayId: string) => void;
};

function toInputNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export function ClipTextOverlayModal({
  isOpen,
  currentTimeSeconds,
  overlays,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}: ClipTextOverlayModalProps) {
  const [newText, setNewText] = useState("");

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
            <h3 className="text-sm font-semibold">文本管理</h3>
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

        <div className="mb-3 flex items-center gap-2">
          <input
            className="min-w-0 flex-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-white outline-none placeholder:text-[#6b7280] focus:border-[#22d3ee]/70"
            placeholder="输入文本后添加到当前时间"
            value={newText}
            onChange={(event) => setNewText(event.target.value)}
          />
          <button
            className="cursor-pointer rounded border border-[#22d3ee]/45 bg-[#22d3ee]/15 px-3 py-1 text-xs text-[#b9f6ff] hover:border-[#22d3ee]/80 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!newText.trim()}
            onClick={() => {
              const text = newText.trim();
              if (!text) {
                return;
              }
              onAdd(text);
              setNewText("");
            }}
          >
            添加文本
          </button>
        </div>

        <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
          {sortedOverlays.length === 0 ? (
            <p className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs text-[#9ca3af]">
              还没有文本，先添加一个试试。
            </p>
          ) : null}

          {sortedOverlays.map((overlay) => (
            <div
              key={overlay.id}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded border border-white/10 bg-white/[0.03] p-2"
            >
              <input
                className="min-w-0 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-[#22d3ee]/70"
                value={overlay.text}
                onChange={(event) =>
                  onUpdate(overlay.id, { text: event.target.value })
                }
              />
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
