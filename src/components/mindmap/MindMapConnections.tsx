import { memo, useMemo } from "react";
import type { MindMapNode, NodePosition } from "../../types/mindmap";

interface MindMapConnectionsProps {
  rootNode: MindMapNode;
  positions: Map<string, NodePosition>;
  isInteracting?: boolean;
  viewport?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

interface ConnectionItem {
  id: string;
  path: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * 绘制贝塞尔曲线连接线
 */
function drawConnection(fromPos: NodePosition, toPos: NodePosition): string {
  // 起点：父节点右侧中心
  const startX = fromPos.x + fromPos.width / 2;
  const startY = fromPos.y;

  // 终点：子节点左侧中心
  const endX = toPos.x - toPos.width / 2;
  const endY = toPos.y;

  // 控制点（水平贝塞尔曲线）
  const controlOffset = (endX - startX) / 2;
  const control1X = startX + controlOffset;
  const control1Y = startY;
  const control2X = endX - controlOffset;
  const control2Y = endY;

  // SVG 路径：三次贝塞尔曲线
  return `M ${startX} ${startY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${endX} ${endY}`;
}

/**
 * 递归收集所有连接线
 */
function collectConnections(
  node: MindMapNode,
  positions: Map<string, NodePosition>,
  connections: ConnectionItem[]
): void {
  const nodePos = positions.get(node.id);
  if (!nodePos || !nodePos.visible) return;

  // 如果节点未收缩且有子节点
  if (!node.collapsed && node.children && node.children.length > 0) {
    for (const child of node.children) {
      const childPos = positions.get(child.id);
      if (childPos && childPos.visible) {
        const margin = 200;
        const minX = Math.min(nodePos.x, childPos.x) - margin;
        const maxX = Math.max(nodePos.x, childPos.x) + margin;
        const minY = Math.min(nodePos.y, childPos.y) - margin;
        const maxY = Math.max(nodePos.y, childPos.y) + margin;

        connections.push({
          id: `${node.id}-${child.id}`,
          path: drawConnection(nodePos, childPos),
          minX,
          maxX,
          minY,
          maxY,
        });

        collectConnections(child, positions, connections);
      }
    }
  }
}

/**
 * 思维导图连接线组件
 * 负责渲染节点之间的连接线
 */
export const MindMapConnections = memo(function MindMapConnections({
  rootNode,
  positions,
  isInteracting = false,
  viewport,
}: MindMapConnectionsProps) {
  const allConnections = useMemo(() => {
    const result: ConnectionItem[] = [];
    collectConnections(rootNode, positions, result);
    return result;
  }, [rootNode, positions]);

  const connections = useMemo(() => {
    if (!viewport || isInteracting) {
      return allConnections;
    }

    return allConnections.filter(
      (conn) =>
        conn.maxX >= viewport.minX &&
        conn.minX <= viewport.maxX &&
        conn.maxY >= viewport.minY &&
        conn.minY <= viewport.maxY
    );
  }, [allConnections, viewport, isInteracting]);

  return (
    <g className="connections">
      {connections.map(({ id, path }) => (
        <path
          key={id}
          d={path}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          className={isInteracting ? "" : "transition-all duration-300"}
        />
      ))}
    </g>
  );
});
