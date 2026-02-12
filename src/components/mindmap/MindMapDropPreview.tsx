import type { NodePosition } from "../../types/mindmap";
import type { PreviewPosition } from "./types";
import { getLevelNodeStyle } from "./styles";

interface MindMapDropPreviewProps {
  previewPosition: PreviewPosition | null;
  isDraggingNode: boolean;
  isInteracting?: boolean;
  dropTargetId: string | null;
  positions: Map<string, NodePosition>;
}

export function MindMapDropPreview({
  previewPosition,
  isDraggingNode,
  isInteracting = false,
  dropTargetId,
  positions,
}: MindMapDropPreviewProps) {
  if (!previewPosition || !isDraggingNode) {
    return null;
  }

  const { bgColor, textColor, borderColor } = getLevelNodeStyle(
    previewPosition.level,
    "preview"
  );

  return (
    <g className="preview-node pointer-events-none">
      {dropTargetId &&
        (() => {
          const targetPos = positions.get(dropTargetId);
          if (!targetPos) return null;

          const startX = targetPos.x + targetPos.width / 2;
          const startY = targetPos.y;
          const endX = previewPosition.x - previewPosition.width / 2;
          const endY = previewPosition.y;
          const controlX = startX + (endX - startX) / 2;

          return (
            <path
              d={`M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.8"
            />
          );
        })()}

      <foreignObject
        x={previewPosition.x - previewPosition.width / 2}
        y={previewPosition.y - previewPosition.height / 2}
        width={previewPosition.width}
        height={previewPosition.height}
      >
        <div
          className={`w-full h-full flex items-center justify-center px-3 py-2 rounded-lg border-2 ${bgColor} ${textColor} ${borderColor} ${isInteracting ? "opacity-90 shadow-none" : "opacity-[0.85] shadow-[0_8px_16px_rgba(0,0,0,0.2)]"}`}
        >
          <span className="text-sm font-medium break-words text-center leading-[22px]">
            {previewPosition.text}
          </span>
        </div>
      </foreignObject>
    </g>
  );
}
