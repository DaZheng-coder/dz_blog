import { FLOATING_CARD_CLASS } from "./styles";

interface MindMapHistoryControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function MindMapHistoryControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: MindMapHistoryControlsProps) {
  const baseClass =
    "px-3 py-1.5 text-xs rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div
      className={`absolute top-4 right-32 z-10 ${FLOATING_CARD_CLASS} p-2 flex items-center gap-2`}
    >
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className={`${baseClass} bg-white border-gray-200 text-gray-700 hover:bg-gray-50`}
      >
        撤销
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className={`${baseClass} bg-white border-gray-200 text-gray-700 hover:bg-gray-50`}
      >
        重做
      </button>
    </div>
  );
}
