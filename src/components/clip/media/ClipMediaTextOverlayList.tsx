import { useMemo } from "react";
import type { ClipTextOverlay } from "../shared/types";
import { ClipMediaTextOverlayListItem } from "./ClipMediaTextOverlayListItem";

type ClipMediaTextOverlayListProps = {
  newText: string;
  currentTimeSeconds: number;
  textOverlays: ClipTextOverlay[];
  selectedTextClipIds: string[];
  onNewTextChange: (value: string) => void;
  onAddText: () => void;
  onSelectTextOverlay: (overlayId: string, appendSelection: boolean) => void;
  onUpdateTextOverlay: (overlayId: string, text: string) => void;
  onDeleteTextOverlay: (overlayId: string) => void;
};

export function ClipMediaTextOverlayList({
  newText,
  currentTimeSeconds,
  textOverlays,
  selectedTextClipIds,
  onNewTextChange,
  onAddText,
  onSelectTextOverlay,
  onUpdateTextOverlay,
  onDeleteTextOverlay,
}: ClipMediaTextOverlayListProps) {
  const sortedTextOverlays = useMemo(
    () =>
      [...textOverlays].sort((a, b) => {
        if (a.startSeconds !== b.startSeconds) {
          return a.startSeconds - b.startSeconds;
        }
        return a.id.localeCompare(b.id);
      }),
    [textOverlays]
  );

  const selectedTextClipIdSet = useMemo(
    () => new Set(selectedTextClipIds),
    [selectedTextClipIds]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          className="min-w-0 w-full flex-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-white outline-none placeholder:text-[#6b7280] focus:border-[#22d3ee]/70"
          placeholder="输入文本后添加到当前时间"
          value={newText}
          onChange={(event) => onNewTextChange(event.target.value)}
        />
        <button
          className="cursor-pointer rounded border border-[#22d3ee]/45 bg-[#22d3ee]/15 px-3 py-1 text-xs text-[#b9f6ff] hover:border-[#22d3ee]/80 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!newText.trim()}
          onClick={onAddText}
        >
          添加
        </button>
      </div>
      <div className="text-[11px] text-[#6b7280]">
        当前时间：{currentTimeSeconds.toFixed(2)}s
      </div>
      {sortedTextOverlays.length === 0 ? (
        <p className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs text-[#9ca3af]">
          暂无文本，请先添加一条。
        </p>
      ) : (
        <div className="space-y-2">
          {sortedTextOverlays.map((overlay) => {
            const isSelected = selectedTextClipIdSet.has(overlay.id);
            return (
              <ClipMediaTextOverlayListItem
                key={overlay.id}
                overlay={overlay}
                isSelected={isSelected}
                onSelect={(appendSelection) =>
                  onSelectTextOverlay(overlay.id, appendSelection)
                }
                onTextChange={(text) => onUpdateTextOverlay(overlay.id, text)}
                onDelete={() => onDeleteTextOverlay(overlay.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
