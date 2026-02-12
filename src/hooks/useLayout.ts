import { useMemo } from "react";
import type { MindMapNode, NodePosition } from "../types/mindmap";

/**
 * 思维导图布局配置
 */
interface LayoutConfig {
  minNodeWidth: number; // 节点最小宽度
  maxNodeWidth: number; // 节点最大宽度
  minNodeHeight: number; // 节点最小高度
  maxNodeHeight: number; // 节点最大高度
  horizontalGap: number; // 水平间距（层级之间）
  verticalGap: number; // 垂直间距（兄弟节点之间）
  paddingX: number; // 节点内水平内边距
  paddingY: number; // 节点内垂直内边距
  fontSize: number; // 字体大小（用于估算文本宽度）
  lineHeight: number; // 行高
}

const DEFAULT_CONFIG: LayoutConfig = {
  minNodeWidth: 100,
  maxNodeWidth: 220,
  minNodeHeight: 40,
  maxNodeHeight: 500, // 增加最大高度限制，允许更多内容
  horizontalGap: 80,
  verticalGap: 20,
  paddingX: 16,
  paddingY: 10,
  fontSize: 14,
  lineHeight: 22,
};

/**
 * 估算文本的宽度（像素）
 * 中文字符约为字体大小的1倍，英文字符约为字体大小的0.6倍
 */
function estimateTextWidth(text: string, fontSize: number): number {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    // 判断是否为中文字符或全角字符
    if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(char)) {
      width += fontSize * 1.1; // 中文字符宽度（稍微增加以避免换行）
    } else {
      width += fontSize * 0.65; // 英文字符宽度
    }
  }
  return width;
}

/**
 * 计算节点的实际尺寸（根据文本内容）
 */
function calculateNodeSize(
  text: string,
  config: LayoutConfig
): { width: number; height: number } {
  // 估算文本宽度
  const textWidth = estimateTextWidth(text, config.fontSize);
  const contentWidth = textWidth + config.paddingX * 2;

  // 确定实际宽度（在最小和最大宽度之间）
  let actualWidth = Math.max(config.minNodeWidth, contentWidth);
  actualWidth = Math.min(config.maxNodeWidth, actualWidth);

  // 如果接近最大宽度，就直接使用最大宽度，避免略微超出导致换行
  if (actualWidth > config.maxNodeWidth * 0.95) {
    actualWidth = config.maxNodeWidth;
  }

  // 计算在实际宽度下需要多少行
  const maxTextWidth = actualWidth - config.paddingX * 2;
  const lines = Math.max(1, Math.ceil(textWidth / maxTextWidth));

  // 计算实际高度（不限制最大高度，根据内容自动扩展）
  let actualHeight = lines * config.lineHeight + config.paddingY * 2;
  actualHeight = Math.max(config.minNodeHeight, actualHeight);
  // 移除最大高度限制，允许节点根据内容自动增长
  // actualHeight = Math.min(config.maxNodeHeight, actualHeight);

  return { width: actualWidth, height: actualHeight };
}

/**
 * 计算子树的高度（用于垂直居中布局）
 * 修复：确保子树高度能够容纳所有子节点，避免父节点高度大时子节点被压缩
 */
function calculateSubtreeHeight(
  node: MindMapNode,
  config: LayoutConfig
): number {
  const nodeSize = calculateNodeSize(node.text, config);

  // 如果节点收缩或没有子节点，高度就是节点本身的高度
  if (node.collapsed || !node.children || node.children.length === 0) {
    return nodeSize.height;
  }

  // 递归计算所有子节点的总高度
  const childrenHeight = node.children.reduce((sum, child) => {
    return sum + calculateSubtreeHeight(child, config);
  }, 0);

  // 加上子节点之间的间距
  const gaps = (node.children.length - 1) * config.verticalGap;
  const totalChildrenHeight = childrenHeight + gaps;

  // ✅ 关键修复：子树高度应该取父节点高度和子节点总高度的最大值
  // 这样可以确保即使父节点很高，子节点也有足够的垂直空间，不会被压缩
  return Math.max(nodeSize.height, totalChildrenHeight);
}

/**
 * 第一遍遍历：收集每个层级的最大节点宽度
 */
function collectLevelWidths(
  node: MindMapNode,
  level: number,
  config: LayoutConfig,
  levelWidths: Map<number, number>
): void {
  const nodeSize = calculateNodeSize(node.text, config);
  const currentMaxWidth = levelWidths.get(level) || 0;
  levelWidths.set(level, Math.max(currentMaxWidth, nodeSize.width));

  if (!node.collapsed && node.children && node.children.length > 0) {
    for (const child of node.children) {
      collectLevelWidths(child, level + 1, config, levelWidths);
    }
  }
}

/**
 * 第二遍遍历：基于最大宽度计算节点布局位置
 * levelWidths: 每个层级的最大节点宽度
 * levelLeftEdges: 每个层级的统一左边缘X坐标（实现左对齐）
 */
function layoutNode(
  node: MindMapNode,
  x: number,
  y: number,
  level: number,
  config: LayoutConfig,
  positions: Map<string, NodePosition>,
  parentCollapsed: boolean,
  levelWidths: Map<number, number>,
  levelLeftEdges: Map<number, number>
): void {
  // 计算当前节点的实际尺寸
  const nodeSize = calculateNodeSize(node.text, config);

  // 当前节点的位置信息
  const position: NodePosition = {
    id: node.id,
    x,
    y,
    width: nodeSize.width,
    height: nodeSize.height,
    level,
    visible: !parentCollapsed,
  };

  positions.set(node.id, position);

  // 如果节点收缩或没有子节点，不需要布局子节点
  if (node.collapsed || !node.children || node.children.length === 0) {
    return;
  }

  // ✅ 修复：只计算子节点的总高度，不受父节点高度影响
  // 这样可以避免父节点文本过长时，子节点被压缩或与其他节点重叠
  const childrenTotalHeight = node.children.reduce((sum, child) => {
    return sum + calculateSubtreeHeight(child, config);
  }, 0);
  const childrenGaps = (node.children.length - 1) * config.verticalGap;
  const actualChildrenHeight = childrenTotalHeight + childrenGaps;

  // 子节点从父节点中心开始，基于子节点自己的总高度垂直居中
  let currentY = y - actualChildrenHeight / 2;

  // 子节点的左边缘X坐标：确保同级节点左侧齐平
  const childLevel = level + 1;
  let childLeftEdge: number;

  if (levelLeftEdges.has(childLevel)) {
    // 如果该层级已经计算过左边缘，直接使用
    childLeftEdge = levelLeftEdges.get(childLevel)!;
  } else {
    // 否则，基于父层级的最大宽度计算子节点的左边缘
    const parentLevelMaxWidth = levelWidths.get(level) || nodeSize.width;
    // 父层级最右边缘 = 0 + parentLevelMaxWidth / 2（根节点在0）
    // 对于非根节点，需要从根节点开始累加
    // 简化处理：直接用固定间距
    if (level === 0) {
      // 根节点的子节点
      childLeftEdge = parentLevelMaxWidth / 2 + config.horizontalGap;
    } else {
      // 其他层级的子节点
      const parentLeftEdge = levelLeftEdges.get(level) || 0;
      childLeftEdge =
        parentLeftEdge + parentLevelMaxWidth + config.horizontalGap;
    }
    levelLeftEdges.set(childLevel, childLeftEdge);
  }

  // 递归布局每个子节点
  for (const child of node.children) {
    const childSize = calculateNodeSize(child.text, config);
    const childSubtreeHeight = calculateSubtreeHeight(child, config);
    const childY = currentY + childSubtreeHeight / 2;

    // 子节点的中心X坐标 = 左边缘 + 节点宽度的一半
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
      levelLeftEdges
    );

    currentY += childSubtreeHeight + config.verticalGap;
  }
}

/**
 * 计算思维导图布局
 * @param rootNode 根节点数据
 * @param config 布局配置（可选）
 * @returns 所有节点的位置信息 Map
 */
export function useLayout(
  rootNode: MindMapNode | null,
  config: Partial<LayoutConfig> = {}
): Map<string, NodePosition> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return useMemo(() => {
    const positions = new Map<string, NodePosition>();
    const levelWidths = new Map<number, number>();
    const levelLeftEdges = new Map<number, number>();

    if (!rootNode) {
      return positions;
    }

    // 第一遍遍历：收集每个层级的最大节点宽度
    collectLevelWidths(rootNode, 0, finalConfig, levelWidths);

    // 第二遍遍历：基于最大宽度布局节点
    // 根节点从 (0, 0) 开始布局（居中显示由画布变换控制）
    const rootSize = calculateNodeSize(rootNode.text, finalConfig);
    levelLeftEdges.set(0, -rootSize.width / 2); // 根节点左边缘

    layoutNode(
      rootNode,
      0,
      0,
      0,
      finalConfig,
      positions,
      false,
      levelWidths,
      levelLeftEdges
    );

    return positions;
  }, [rootNode, finalConfig]);
}

/**
 * 获取思维导图的边界框（用于画布自适应）
 */
export function getLayoutBounds(positions: Map<string, NodePosition>): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (positions.size === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  positions.forEach((pos) => {
    if (!pos.visible) return;

    const left = pos.x - pos.width / 2;
    const right = pos.x + pos.width / 2;
    const top = pos.y - pos.height / 2;
    const bottom = pos.y + pos.height / 2;

    minX = Math.min(minX, left);
    maxX = Math.max(maxX, right);
    minY = Math.min(minY, top);
    maxY = Math.max(maxY, bottom);
  });

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
