import DeleteIcon from "../../../assets/delete.svg?react";
import { formatTimelineRangeTime } from "../shared/time";
import type { ClipTextOverlay } from "../shared/types";

type ClipMediaTextOverlayListItemProps = {
  overlay: ClipTextOverlay;
  isSelected: boolean;
  onSelect: (appendSelection: boolean) => void;
  onTextChange: (text: string) => void;
  onDelete: () => void;
};

export function ClipMediaTextOverlayListItem({
  overlay,
  isSelected,
  onSelect,
  onTextChange,
  onDelete,
}: ClipMediaTextOverlayListItemProps) {
  return (
    <div
      className={`cursor-pointer rounded border p-2 ${
        isSelected
          ? "border-[#67e8f9]/70 bg-[#22d3ee]/10 ring-1 ring-[#67e8f9]/60"
          : "border-white/10 bg-white/[0.03]"
      }`}
      onClick={(event) => onSelect(Boolean(event.metaKey || event.ctrlKey))}
    >
      <input
        className="min-w-0 w-full rounded border border-white/15 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-[#22d3ee]/70"
        value={overlay.text}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onTextChange(event.target.value)}
      />
      <div className="mt-2 flex items-center justify-between text-[11px] text-[#9ca3af]">
        <span>
          {formatTimelineRangeTime(overlay.startSeconds)}～
          {formatTimelineRangeTime(overlay.endSeconds)}
        </span>
        <button
          className="cursor-pointer rounded border border-red-400/35 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:border-red-300/70"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <DeleteIcon className="h-4 w-4 fill-current" />
        </button>
      </div>
    </div>
  );
}
