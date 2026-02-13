import type {
  MindMapNode as MindMapNodeType,
  NodePosition,
} from "../../types/mindmap";

export interface NodeBounds {
  id: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface SubtreeBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface WorldViewport {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const HIT_TEST_CELL_SIZE = 240;

export function getHitBucketKey(col: number, row: number): string {
  return `${col}:${row}`;
}

export function collectVisibleNodeBounds(
  positions: Map<string, NodePosition>
): NodeBounds[] {
  const bounds: NodeBounds[] = [];
  positions.forEach((pos, id) => {
    if (!pos.visible) return;
    bounds.push({
      id,
      left: pos.x - pos.width / 2,
      right: pos.x + pos.width / 2,
      top: pos.y - pos.height / 2,
      bottom: pos.y + pos.height / 2,
    });
  });
  return bounds;
}

export function buildHitBuckets(
  bounds: NodeBounds[],
  cellSize: number
): Map<string, NodeBounds[]> {
  const buckets = new Map<string, NodeBounds[]>();

  for (const item of bounds) {
    const minCol = Math.floor(item.left / cellSize);
    const maxCol = Math.floor(item.right / cellSize);
    const minRow = Math.floor(item.top / cellSize);
    const maxRow = Math.floor(item.bottom / cellSize);

    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        const key = getHitBucketKey(col, row);
        const bucket = buckets.get(key);
        if (bucket) {
          bucket.push(item);
        } else {
          buckets.set(key, [item]);
        }
      }
    }
  }

  return buckets;
}

export function collectSubtreeBottom(
  rootNode: MindMapNodeType,
  positions: Map<string, NodePosition>
): Map<string, number> {
  const map = new Map<string, number>();

  const walk = (node: MindMapNodeType): number => {
    const pos = positions.get(node.id);
    if (!pos || !pos.visible) {
      return -Infinity;
    }

    let maxBottom = pos.y + pos.height / 2;
    if (!node.collapsed && node.children.length > 0) {
      for (const child of node.children) {
        maxBottom = Math.max(maxBottom, walk(child));
      }
    }

    map.set(node.id, maxBottom);
    return maxBottom;
  };

  walk(rootNode);
  return map;
}

export function collectSubtreeBounds(
  rootNode: MindMapNodeType,
  positions: Map<string, NodePosition>
): Map<string, SubtreeBounds> {
  const map = new Map<string, SubtreeBounds>();

  const walk = (node: MindMapNodeType): SubtreeBounds | null => {
    const pos = positions.get(node.id);
    if (!pos || !pos.visible) {
      return null;
    }

    const current: SubtreeBounds = {
      minX: pos.x - pos.width / 2,
      maxX: pos.x + pos.width / 2,
      minY: pos.y - pos.height / 2,
      maxY: pos.y + pos.height / 2,
    };

    if (!node.collapsed && node.children.length > 0) {
      for (const child of node.children) {
        const childBounds = walk(child);
        if (!childBounds) continue;
        current.minX = Math.min(current.minX, childBounds.minX);
        current.maxX = Math.max(current.maxX, childBounds.maxX);
        current.minY = Math.min(current.minY, childBounds.minY);
        current.maxY = Math.max(current.maxY, childBounds.maxY);
      }
    }

    map.set(node.id, current);
    return current;
  };

  walk(rootNode);
  return map;
}

export function buildNodeMap(
  rootNode: MindMapNodeType | null
): Map<string, MindMapNodeType> {
  const map = new Map<string, MindMapNodeType>();
  if (!rootNode) {
    return map;
  }

  const stack: MindMapNodeType[] = [rootNode];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;
    map.set(current.id, current);

    for (let i = current.children.length - 1; i >= 0; i--) {
      stack.push(current.children[i]);
    }
  }

  return map;
}

export function buildParentIdMap(
  rootNode: MindMapNodeType | null
): Map<string, string | null> {
  const map = new Map<string, string | null>();
  if (!rootNode) {
    return map;
  }

  const stack: Array<{ node: MindMapNodeType; parentId: string | null }> = [
    { node: rootNode, parentId: null },
  ];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;
    map.set(current.node.id, current.parentId);

    for (let i = current.node.children.length - 1; i >= 0; i--) {
      stack.push({
        node: current.node.children[i],
        parentId: current.node.id,
      });
    }
  }

  return map;
}

export function buildVisibleChildrenMap(
  nodeMap: Map<string, MindMapNodeType>,
  positions: Map<string, NodePosition>
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  nodeMap.forEach((node, id) => {
    map.set(
      id,
      node.children
        .filter((child) => positions.get(child.id)?.visible)
        .map((child) => child.id)
    );
  });
  return map;
}

export function getWorldViewport(
  translateX: number,
  translateY: number,
  scale: number,
  width: number,
  height: number
): WorldViewport {
  return {
    minX: (0 - translateX) / scale,
    maxX: (width - translateX) / scale,
    minY: (0 - translateY) / scale,
    maxY: (height - translateY) / scale,
  };
}
