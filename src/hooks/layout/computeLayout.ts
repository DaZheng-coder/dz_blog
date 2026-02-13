import type { MindMapNode, NodePosition } from "../../types/mindmap";

export interface LayoutConfig {
  minNodeWidth: number;
  maxNodeWidth: number;
  minNodeHeight: number;
  maxNodeHeight: number;
  horizontalGap: number;
  verticalGap: number;
  paddingX: number;
  paddingY: number;
  fontSize: number;
  lineHeight: number;
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  minNodeWidth: 100,
  maxNodeWidth: 220,
  minNodeHeight: 40,
  maxNodeHeight: 500,
  horizontalGap: 80,
  verticalGap: 20,
  paddingX: 16,
  paddingY: 10,
  fontSize: 14,
  lineHeight: 22,
};

function estimateTextWidth(text: string, fontSize: number): number {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(char)) {
      width += fontSize * 1.1;
    } else {
      width += fontSize * 0.65;
    }
  }
  return width;
}

function calculateNodeSize(
  text: string,
  config: LayoutConfig
): { width: number; height: number } {
  const textWidth = estimateTextWidth(text, config.fontSize);
  const contentWidth = textWidth + config.paddingX * 2;

  let actualWidth = Math.max(config.minNodeWidth, contentWidth);
  actualWidth = Math.min(config.maxNodeWidth, actualWidth);

  if (actualWidth > config.maxNodeWidth * 0.95) {
    actualWidth = config.maxNodeWidth;
  }

  const maxTextWidth = actualWidth - config.paddingX * 2;
  const lines = Math.max(1, Math.ceil(textWidth / maxTextWidth));

  let actualHeight = lines * config.lineHeight + config.paddingY * 2;
  actualHeight = Math.max(config.minNodeHeight, actualHeight);

  return { width: actualWidth, height: actualHeight };
}

function getNodeSize(
  node: MindMapNode,
  config: LayoutConfig,
  nodeSizeCache: Map<string, { width: number; height: number }>
): { width: number; height: number } {
  const cached = nodeSizeCache.get(node.id);
  if (cached) {
    return cached;
  }

  const size = calculateNodeSize(node.text, config);
  nodeSizeCache.set(node.id, size);
  return size;
}

function calculateSubtreeHeight(
  node: MindMapNode,
  config: LayoutConfig,
  nodeSizeCache: Map<string, { width: number; height: number }>,
  subtreeHeightCache: Map<string, number>
): number {
  const cached = subtreeHeightCache.get(node.id);
  if (cached !== undefined) {
    return cached;
  }

  const nodeSize = getNodeSize(node, config, nodeSizeCache);

  if (node.collapsed || !node.children || node.children.length === 0) {
    subtreeHeightCache.set(node.id, nodeSize.height);
    return nodeSize.height;
  }

  const childrenHeight = node.children.reduce((sum, child) => {
    return (
      sum +
      calculateSubtreeHeight(child, config, nodeSizeCache, subtreeHeightCache)
    );
  }, 0);

  const gaps = (node.children.length - 1) * config.verticalGap;
  const totalChildrenHeight = childrenHeight + gaps;

  const subtreeHeight = Math.max(nodeSize.height, totalChildrenHeight);
  subtreeHeightCache.set(node.id, subtreeHeight);
  return subtreeHeight;
}

function collectLevelWidths(
  node: MindMapNode,
  level: number,
  config: LayoutConfig,
  levelWidths: Map<number, number>,
  nodeSizeCache: Map<string, { width: number; height: number }>
): void {
  const nodeSize = getNodeSize(node, config, nodeSizeCache);
  const currentMaxWidth = levelWidths.get(level) || 0;
  levelWidths.set(level, Math.max(currentMaxWidth, nodeSize.width));

  if (!node.collapsed && node.children && node.children.length > 0) {
    for (const child of node.children) {
      collectLevelWidths(child, level + 1, config, levelWidths, nodeSizeCache);
    }
  }
}

function layoutNode(
  node: MindMapNode,
  x: number,
  y: number,
  level: number,
  config: LayoutConfig,
  positions: Map<string, NodePosition>,
  parentCollapsed: boolean,
  levelWidths: Map<number, number>,
  levelLeftEdges: Map<number, number>,
  nodeSizeCache: Map<string, { width: number; height: number }>,
  subtreeHeightCache: Map<string, number>
): void {
  const nodeSize = getNodeSize(node, config, nodeSizeCache);

  positions.set(node.id, {
    id: node.id,
    x,
    y,
    width: nodeSize.width,
    height: nodeSize.height,
    level,
    visible: !parentCollapsed,
  });

  if (node.collapsed || !node.children || node.children.length === 0) {
    return;
  }

  const childrenTotalHeight = node.children.reduce((sum, child) => {
    return (
      sum +
      calculateSubtreeHeight(child, config, nodeSizeCache, subtreeHeightCache)
    );
  }, 0);
  const childrenGaps = (node.children.length - 1) * config.verticalGap;
  const actualChildrenHeight = childrenTotalHeight + childrenGaps;

  let currentY = y - actualChildrenHeight / 2;

  const childLevel = level + 1;
  let childLeftEdge: number;

  if (levelLeftEdges.has(childLevel)) {
    childLeftEdge = levelLeftEdges.get(childLevel)!;
  } else {
    const parentLevelMaxWidth = levelWidths.get(level) || nodeSize.width;
    if (level === 0) {
      childLeftEdge = parentLevelMaxWidth / 2 + config.horizontalGap;
    } else {
      const parentLeftEdge = levelLeftEdges.get(level) || 0;
      childLeftEdge =
        parentLeftEdge + parentLevelMaxWidth + config.horizontalGap;
    }
    levelLeftEdges.set(childLevel, childLeftEdge);
  }

  for (const child of node.children) {
    const childSize = getNodeSize(child, config, nodeSizeCache);
    const childSubtreeHeight = calculateSubtreeHeight(
      child,
      config,
      nodeSizeCache,
      subtreeHeightCache
    );
    const childY = currentY + childSubtreeHeight / 2;
    const childCenterX = childLeftEdge + childSize.width / 2;

    layoutNode(
      child,
      childCenterX,
      childY,
      childLevel,
      config,
      positions,
      parentCollapsed || (node.collapsed ?? false),
      levelWidths,
      levelLeftEdges,
      nodeSizeCache,
      subtreeHeightCache
    );

    currentY += childSubtreeHeight + config.verticalGap;
  }
}

export function computeLayout(
  rootNode: MindMapNode | null,
  config: LayoutConfig
): Map<string, NodePosition> {
  const positions = new Map<string, NodePosition>();
  const levelWidths = new Map<number, number>();
  const levelLeftEdges = new Map<number, number>();
  const nodeSizeCache = new Map<string, { width: number; height: number }>();
  const subtreeHeightCache = new Map<string, number>();

  if (!rootNode) {
    return positions;
  }

  collectLevelWidths(rootNode, 0, config, levelWidths, nodeSizeCache);

  const rootSize = getNodeSize(rootNode, config, nodeSizeCache);
  levelLeftEdges.set(0, -rootSize.width / 2);

  layoutNode(
    rootNode,
    0,
    0,
    0,
    config,
    positions,
    false,
    levelWidths,
    levelLeftEdges,
    nodeSizeCache,
    subtreeHeightCache
  );

  return positions;
}

export function countNodes(rootNode: MindMapNode | null): number {
  if (!rootNode) return 0;
  let count = 0;
  const stack: MindMapNode[] = [rootNode];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    count += 1;
    for (let i = current.children.length - 1; i >= 0; i--) {
      stack.push(current.children[i]);
    }
  }
  return count;
}
