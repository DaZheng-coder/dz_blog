import { FLOATING_CARD_CLASS } from "./styles";

interface MindMapZoomIndicatorProps {
  scale: number;
}

export function MindMapZoomIndicator({ scale }: MindMapZoomIndicatorProps) {
  return (
    <div
      className={`absolute top-4 right-4 ${FLOATING_CARD_CLASS} px-3 py-2 text-sm text-gray-700 z-10`}
    >
      缩放: {(scale * 100).toFixed(0)}%
    </div>
  );
}
