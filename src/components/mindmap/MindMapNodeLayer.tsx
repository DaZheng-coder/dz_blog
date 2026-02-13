import { memo, useCallback, useMemo, type ReactNode } from "react";
import type { MindMapNode, NodePosition } from "../../types/mindmap";
import { MindMapNode as MindMapNodeItem } from "./MindMapNode";
import type { SubtreeBounds, WorldViewport } from "./geometry";

interface MindMapNodeLayerProps {
  rootNode: MindMapNode;
  positions: Map<string, NodePosition>;
  nodeMap: Map<string, MindMapNode>;
  subtreeBoundsMap: Map<string, SubtreeBounds>;
  viewport?: WorldViewport;
  isInteracting: boolean;
  dropTargetId: string | null;
  selectedNodeId: string | null;
  editingNodeId: string | null;
  isDraggingNode: boolean;
  draggedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onToggleCollapse: (nodeId: string) => void;
  onStartEdit: (nodeId: string) => void;
  onFinishEdit: (nodeId: string, text: string) => void;
  onStartDrag: (nodeId: string, startX: number, startY: number) => void;
}

export const MindMapNodeLayer = memo(function MindMapNodeLayer({
  rootNode,
  positions,
  nodeMap,
  subtreeBoundsMap,
  viewport,
  isInteracting,
  dropTargetId,
  selectedNodeId,
  editingNodeId,
  isDraggingNode,
  draggedNodeId,
  onSelectNode,
  onToggleCollapse,
  onStartEdit,
  onFinishEdit,
  onStartDrag,
}: MindMapNodeLayerProps) {
  const isBoundsInViewport = useCallback(
    (bounds: SubtreeBounds | null | undefined) => {
      if (!viewport || !bounds) return true;
      const margin = 220;
      return (
        bounds.maxX + margin >= viewport.minX &&
        bounds.minX - margin <= viewport.maxX &&
        bounds.maxY + margin >= viewport.minY &&
        bounds.minY - margin <= viewport.maxY
      );
    },
    [viewport]
  );

  const isInViewport = useCallback(
    (position: NodePosition) => {
      if (!viewport) return true;
      const margin = 220;
      const left = position.x - position.width / 2 - margin;
      const right = position.x + position.width / 2 + margin;
      const top = position.y - position.height / 2 - margin;
      const bottom = position.y + position.height / 2 + margin;

      return (
        right >= viewport.minX &&
        left <= viewport.maxX &&
        bottom >= viewport.minY &&
        top <= viewport.maxY
      );
    },
    [viewport]
  );

  const nodesTree = useMemo(() => {
    const renderNode = (node: MindMapNode): ReactNode => {
      const subtreeBounds = subtreeBoundsMap.get(node.id);
      if (!isBoundsInViewport(subtreeBounds)) {
        return null;
      }

      const position = positions.get(node.id);
      if (!position) return null;

      const isDropTarget = dropTargetId === node.id;
      const isSelected = selectedNodeId === node.id;
      const visibleInViewport = isInViewport(position);

      return (
        <g key={node.id}>
          {visibleInViewport && isDropTarget && (
            <>
              <rect
                x={position.x - position.width / 2 - 4}
                y={position.y - position.height / 2 - 4}
                width={position.width + 8}
                height={position.height + 8}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeDasharray="5,5"
                rx="8"
                className={isInteracting ? "" : "animate-pulse"}
              />
              <line
                x1={position.x + position.width / 2 + 10}
                y1={position.y - 20}
                x2={position.x + position.width / 2 + 10}
                y2={position.y + 20}
                stroke="#3b82f6"
                strokeWidth="4"
                strokeLinecap="round"
                className={isInteracting ? "" : "animate-pulse"}
              />
              <path
                d={`M ${position.x + position.width / 2 + 10} ${
                  position.y
                } l 8 -6 l 0 3 l 12 0 l 0 6 l -12 0 l 0 3 z`}
                fill="#3b82f6"
                className={isInteracting ? "" : "animate-pulse"}
              />
            </>
          )}

          {visibleInViewport && editingNodeId !== node.id && (
            <MindMapNodeItem
              node={node}
              position={position}
              isEditing={false}
              isSelected={isSelected}
              isDragging={isDraggingNode && draggedNodeId === node.id}
              onSelect={onSelectNode}
              onToggleCollapse={onToggleCollapse}
              onStartEdit={onStartEdit}
              onFinishEdit={onFinishEdit}
              onStartDrag={onStartDrag}
            />
          )}

          {!node.collapsed && node.children.map((child) => renderNode(child))}
        </g>
      );
    };

    return renderNode(rootNode);
  }, [
    rootNode,
    positions,
    dropTargetId,
    selectedNodeId,
    editingNodeId,
    isDraggingNode,
    draggedNodeId,
    onSelectNode,
    onToggleCollapse,
    onStartEdit,
    onFinishEdit,
    onStartDrag,
    isInteracting,
    subtreeBoundsMap,
    isBoundsInViewport,
    isInViewport,
  ]);

  const editingNodeElement = useMemo(() => {
    if (!editingNodeId) {
      return null;
    }

    const editingNode = nodeMap.get(editingNodeId);
    const position = positions.get(editingNodeId);
    if (!editingNode || !position) {
      return null;
    }

    return (
      <MindMapNodeItem
        key={`editing-${editingNode.id}`}
        node={editingNode}
        position={position}
        isEditing={true}
        isSelected={selectedNodeId === editingNode.id}
        isDragging={false}
        onSelect={onSelectNode}
        onToggleCollapse={onToggleCollapse}
        onStartEdit={onStartEdit}
        onFinishEdit={onFinishEdit}
        onStartDrag={onStartDrag}
      />
    );
  }, [
    editingNodeId,
    nodeMap,
    positions,
    selectedNodeId,
    onSelectNode,
    onToggleCollapse,
    onStartEdit,
    onFinishEdit,
    onStartDrag,
  ]);

  return (
    <>
      {nodesTree}
      {editingNodeElement}
    </>
  );
});
