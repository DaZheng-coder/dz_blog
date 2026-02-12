import type { MindMapNode, NodePosition } from "../../types/mindmap";
import { getLevelNodeStyle } from "./styles";

interface MindMapDragGhostProps {
  isDraggingNode: boolean;
  draggedNodeId: string | null;
  isInteracting?: boolean;
  scale: number;
  dragMousePos: { x: number; y: number };
  dragOffset: { x: number; y: number };
  positions: Map<string, NodePosition>;
  nodeMap: Map<string, MindMapNode>;
}

export function MindMapDragGhost({
  isDraggingNode,
  draggedNodeId,
  isInteracting = false,
  scale,
  dragMousePos,
  dragOffset,
  positions,
  nodeMap,
}: MindMapDragGhostProps) {
  if (!isDraggingNode || !draggedNodeId) {
    return null;
  }

  const nodeData = nodeMap.get(draggedNodeId);
  const nodePosition = positions.get(draggedNodeId);
  const nodeWidth = nodePosition?.width || 120;
  const nodeHeight = nodePosition?.height || 40;
  const nodeTopLeftX = dragMousePos.x - dragOffset.x;
  const nodeTopLeftY = dragMousePos.y - dragOffset.y;
  const nodeLevel = nodePosition?.level ?? 2;
  const { bgColor, textColor, borderColor } = getLevelNodeStyle(nodeLevel);

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: nodeTopLeftX,
        top: nodeTopLeftY,
        transform: `scale(${scale})`,
        transformOrigin: "left top",
      }}
    >
      <div
        className={`${bgColor} ${textColor} flex items-center justify-center rounded-lg border-2 ${borderColor} opacity-90 text-sm font-medium px-3 py-2 box-border ${
          isInteracting ? "shadow-lg" : "shadow-2xl"
        }`}
        style={{
          width: `${nodeWidth}px`,
          height: `${nodeHeight}px`,
        }}
      >
        <span className="break-words text-center leading-[22px]">
          {nodeData?.text || "拖拽中..."}
        </span>
      </div>
      <div className="text-xs text-gray-600 mt-1 bg-white px-2 py-1 rounded shadow">
        拖拽到目标节点以添加为子节点
      </div>
    </div>
  );
}
