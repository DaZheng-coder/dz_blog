import type { MindMapNode, NodePosition } from '../types/mindmap';

interface MindMapConnectionsProps {
  rootNode: MindMapNode;
  positions: Map<string, NodePosition>;
}

/**
 * 绘制贝塞尔曲线连接线
 */
function drawConnection(
  fromPos: NodePosition,
  toPos: NodePosition
): string {
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
  connections: Array<{ id: string; path: string }>
): void {
  const nodePos = positions.get(node.id);
  if (!nodePos || !nodePos.visible) return;

  // 如果节点未收缩且有子节点
  if (!node.collapsed && node.children && node.children.length > 0) {
    for (const child of node.children) {
      const childPos = positions.get(child.id);
      if (childPos && childPos.visible) {
        // 添加连接线
        connections.push({
          id: `${node.id}-${child.id}`,
          path: drawConnection(nodePos, childPos),
        });

        // 递归处理子节点
        collectConnections(child, positions, connections);
      }
    }
  }
}

/**
 * 思维导图连接线组件
 * 负责渲染节点之间的连接线
 */
export function MindMapConnections({
  rootNode,
  positions,
}: MindMapConnectionsProps) {
  const connections: Array<{ id: string; path: string }> = [];
  collectConnections(rootNode, positions, connections);

  return (
    <g className="connections">
      {connections.map(({ id, path }) => (
        <path
          key={id}
          d={path}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          className="transition-all duration-300"
        />
      ))}
    </g>
  );
}
