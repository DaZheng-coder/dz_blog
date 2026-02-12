# Web 思维导图组件 - 完整技术方案文档

## 📋 文档信息

- **项目名称**：Web MindMap Component
- **技术栈**：React + TypeScript + SVG + Tailwind CSS
- **版本**：v1.0.0
- **最后更新**：2026-02-12
- **文档类型**：技术设计方案

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术架构](#2-技术架构)
3. [核心模块设计](#3-核心模块设计)
4. [数据结构设计](#4-数据结构设计)
5. [布局算法实现](#5-布局算法实现)
6. [交互功能实现](#6-交互功能实现)
7. [状态管理方案](#7-状态管理方案)
8. [渲染优化策略](#8-渲染优化策略)
9. [开发规范](#9-开发规范)
10. [测试方案](#10-测试方案)
11. [部署指南](#11-部署指南)
12. [性能指标](#12-性能指标)
13. [未来规划](#13-未来规划)

---

## 1. 项目概述

### 1.1 项目背景

Web 思维导图组件是一个高性能、可交互的前端可视化组件，用于在浏览器中展示和编辑树状结构数据。支持节点的增删改查、拖拽重组、展开收缩等功能。

### 1.2 核心目标

- **高性能渲染**：支持大量节点的流畅渲染和交互
- **丰富交互**：支持鼠标、键盘、触摸等多种交互方式
- **灵活定制**：支持样式定制、布局配置、功能扩展
- **数据驱动**：基于 JSON 数据自动生成思维导图
- **易于集成**：可作为独立组件集成到任何 React 项目

### 1.3 技术选型

| 技术栈       | 版本 | 用途     | 选型理由             |
| ------------ | ---- | -------- | -------------------- |
| React        | 18.x | 前端框架 | 组件化开发、高效渲染 |
| TypeScript   | 5.x  | 类型系统 | 类型安全、代码提示   |
| SVG          | -    | 图形渲染 | 矢量图形、易于交互   |
| Tailwind CSS | 3.x  | 样式方案 | 原子化 CSS、快速开发 |
| Vite         | 5.x  | 构建工具 | 快速编译、热更新     |

### 1.4 功能特性

**核心功能**：

- ✅ 数据驱动渲染
- ✅ 树状布局算法
- ✅ 节点展开/收缩
- ✅ 节点拖拽移动
- ✅ 节点编辑（增删改）
- ✅ 画布缩放/平移
- ✅ 键盘快捷键
- ✅ 右键上下文菜单
- ✅ 自适应节点尺寸
- ✅ 同级节点对齐

**交互特性**：

- 🎯 单击选中节点
- 🎯 双击编辑节点
- 🎯 右键显示菜单
- 🎯 拖拽改变层级
- 🎯 滚轮缩放画布
- 🎯 拖拽平移画布
- 🎯 快捷键操作

---

## 2. 技术架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         应用层 (App)                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              MindMapPage (演示页面)                     │  │
│  │  - 初始化数据                                           │  │
│  │  - 页面布局                                             │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────┐
│                      组件层 (Components)                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              MindMap (主容器组件)                       │  │
│  │  - 画布管理 (缩放、平移)                                │  │
│  │  - 事件协调 (拖拽、点击)                                │  │
│  │  - 状态管理                                             │  │
│  └───────┬──────────────────────┬─────────────────────────┘  │
│          │                      │                             │
│  ┌───────▼───────┐      ┌──────▼──────────┐                 │
│  │  MindMapNode  │      │ MindMapConnections│                │
│  │  - 节点渲染   │      │  - 连接线绘制    │                │
│  │  - 节点交互   │      │  - 贝塞尔曲线    │                │
│  └───────────────┘      └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────┐
│                      逻辑层 (Hooks)                           │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ useMindMapState  │  │   useLayout      │                 │
│  │  - 数据管理      │  │  - 布局计算      │                 │
│  │  - CRUD操作      │  │  - 位置计算      │                 │
│  │  - Reducer       │  │  - 坐标转换      │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────┐
│                    数据层 (Types & Data)                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              TypeScript 类型定义                         │  │
│  │  - MindMapNode    (节点数据)                            │  │
│  │  - NodePosition   (位置信息)                            │  │
│  │  - MindMapAction  (操作类型)                            │  │
│  │  - ViewTransform  (画布状态)                            │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 模块依赖关系

```
MindMapPage
    └── MindMap (主组件)
        ├── useMindMapState (状态管理)
        │   └── types/mindmap (类型定义)
        ├── useLayout (布局计算)
        │   └── types/mindmap
        ├── MindMapNode (节点组件)
        │   └── types/mindmap
        └── MindMapConnections (连接线组件)
            └── types/mindmap
```

### 2.3 数据流向

```
用户操作 (点击/拖拽/键盘)
    ↓
事件处理器 (MindMap/MindMapNode)
    ↓
状态更新 (useMindMapState - Reducer)
    ↓
数据变更 (MindMapNode 树结构)
    ↓
布局重算 (useLayout - useMemo)
    ↓
位置更新 (NodePosition Map)
    ↓
组件重渲染 (React Reconciliation)
    ↓
SVG 更新 (节点 + 连接线)
```

---

## 3. 核心模块设计

### 3.1 主容器组件 (MindMap.tsx)

**职责**：

- 管理画布变换状态（缩放、平移）
- 处理全局事件（鼠标、滚轮、键盘）
- 协调节点交互（拖拽、选中、编辑）
- 渲染整个思维导图

**核心状态**：

```typescript
// 画布变换
const [scale, setScale] = useState(1);
const [translateX, setTranslateX] = useState(0);
const [translateY, setTranslateY] = useState(0);

// 画布拖拽
const [isPanning, setIsPanning] = useState(false);

// 节点拖拽
const [isDraggingNode, setIsDraggingNode] = useState(false);
const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
const [dropTargetId, setDropTargetId] = useState<string | null>(null);

// 编辑状态
const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

// 选中状态
const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
```

**关键方法**：

1. **画布缩放**

```typescript
const handleWheel = useCallback(
  (e: React.WheelEvent) => {
    e.preventDefault();
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    // 鼠标位置
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;

    // 缩放因子
    const zoomFactor = 1.1;
    const newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
    const clampedScale = Math.max(0.1, Math.min(newScale, 3));

    // 计算新的平移量，保持鼠标下的点不变
    const newTranslateX =
      mouseX - ((mouseX - translateX) / scale) * clampedScale;
    const newTranslateY =
      mouseY - ((mouseY - translateY) / scale) * clampedScale;

    setScale(clampedScale);
    setTranslateX(newTranslateX);
    setTranslateY(newTranslateY);
  },
  [scale, translateX, translateY]
);
```

2. **画布平移**

```typescript
const handleMouseMove = useCallback(
  (e: MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setTranslateX(panStartTranslate.x + dx);
      setTranslateY(panStartTranslate.y + dy);
    }
  },
  [isPanning, panStart, panStartTranslate]
);
```

3. **键盘快捷键**

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (editingNodeId || !selectedNodeId) return;

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (selectedNodeId !== rootNode?.id) {
          addSibling(selectedNodeId);
        }
        break;
      case "Tab":
        e.preventDefault();
        addChild(selectedNodeId);
        break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        if (selectedNodeId !== rootNode?.id) {
          deleteNode(selectedNodeId);
        }
        break;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [selectedNodeId, editingNodeId, rootNode]);
```

### 3.2 节点组件 (MindMapNode.tsx)

**职责**：

- 渲染单个节点的视图
- 处理节点的用户交互
- 显示右键上下文菜单
- 渲染展开/收缩按钮

**组件接口**：

```typescript
interface MindMapNodeProps {
  node: MindMapNode; // 节点数据
  position: NodePosition; // 位置信息
  isEditing: boolean; // 是否编辑中
  isSelected: boolean; // 是否选中
  onSelect: () => void; // 选中回调
  onToggleCollapse: (nodeId: string) => void; // 展开/收缩
  onStartEdit: (nodeId: string) => void; // 开始编辑
  onFinishEdit: (nodeId: string, text: string) => void; // 完成编辑
  onStartDrag: (nodeId: string, startX: number, startY: number) => void; // 开始拖拽
  onAddChild: (parentId: string) => void; // 添加子节点
  onAddSibling: (siblingOfId: string) => void; // 添加同级节点
  onDelete: (nodeId: string) => void; // 删除节点
}
```

**渲染结构**：

```tsx
<g>
  {/* 节点矩形 (foreignObject) */}
  <foreignObject x={...} y={...} width={...} height={...}>
    <div className="节点容器">
      {isEditing ? (
        <input type="text" value={editText} />
      ) : (
        <span>{node.text}</span>
      )}
    </div>

    {/* 右键菜单 */}
    {showMenu && (
      <div className="context-menu">
        <button>编辑节点</button>
        <button>添加子节点 (Tab)</button>
        <button>添加同级节点 (Enter)</button>
        <button>删除节点 (Delete)</button>
      </div>
    )}
  </foreignObject>

  {/* 展开/收缩按钮 (SVG 圆形) */}
  {hasChildren && (
    <g onClick={onToggleCollapse}>
      <circle cx={...} cy={...} r="10" />
      <text>{collapsed ? "+" : "−"}</text>
    </g>
  )}
</g>
```

### 3.3 连接线组件 (MindMapConnections.tsx)

**职责**：

- 绘制父子节点之间的连接线
- 使用贝塞尔曲线实现平滑连接

**算法实现**：

```typescript
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
```

**渲染优化**：

- 只渲染可见节点的连接线
- 收缩节点的子树连接线不渲染
- 使用 CSS transition 实现平滑动画

---

## 4. 数据结构设计

### 4.1 核心数据类型

#### 4.1.1 MindMapNode (节点数据)

```typescript
export interface MindMapNode {
  id: string; // 唯一标识 (必需)
  text: string; // 节点文本 (必需)
  children: MindMapNode[]; // 子节点数组 (必需)
  collapsed?: boolean; // 是否收缩 (可选，默认 false)
  style?: NodeStyle; // 自定义样式 (可选)
}
```

**设计要点**：

- `id` 必须全局唯一，建议使用 `node_${timestamp}_${random}`
- `children` 为数组，支持任意数量的子节点
- `collapsed` 控制子树的显示/隐藏
- 数据结构支持递归，可表示任意深度的树

#### 4.1.2 NodePosition (位置信息)

```typescript
export interface NodePosition {
  id: string; // 节点ID
  x: number; // 节点中心 X 坐标
  y: number; // 节点中心 Y 坐标
  width: number; // 节点宽度
  height: number; // 节点高度
  level: number; // 节点层级 (0 = 根节点)
  visible: boolean; // 是否可见
}
```

**设计要点**：

- 坐标 (x, y) 表示节点的**中心点**，便于计算
- 布局算法计算后生成，不存储在原始数据中
- `visible` 用于优化渲染（父节点收缩时子节点不可见）

#### 4.1.3 MindMapAction (操作类型)

```typescript
export enum ActionType {
  UPDATE_NODE = "UPDATE_NODE", // 更新节点文本
  ADD_CHILD = "ADD_CHILD", // 添加子节点
  ADD_SIBLING = "ADD_SIBLING", // 添加同级节点
  DELETE_NODE = "DELETE_NODE", // 删除节点
  TOGGLE_COLLAPSE = "TOGGLE_COLLAPSE", // 展开/收缩
  MOVE_NODE = "MOVE_NODE", // 移动节点
}

export type MindMapAction =
  | { type: ActionType.UPDATE_NODE; nodeId: string; text: string }
  | { type: ActionType.ADD_CHILD; parentId: string; newNode: MindMapNode }
  | { type: ActionType.ADD_SIBLING; nodeId: string; newNode: MindMapNode }
  | { type: ActionType.DELETE_NODE; nodeId: string }
  | { type: ActionType.TOGGLE_COLLAPSE; nodeId: string }
  | { type: ActionType.MOVE_NODE; nodeId: string; targetParentId: string };
```

**设计要点**：

- 使用 TypeScript 联合类型确保类型安全
- 每个 Action 包含必要的参数
- 用于 Reducer 模式的状态管理

### 4.2 数据流转

```
原始数据 (MindMapNode 树)
    ↓
布局计算 (useLayout Hook)
    ↓
位置数据 (Map<string, NodePosition>)
    ↓
渲染组件 (MindMapNode)
    ↓
SVG 元素 (foreignObject + circle)
```

---

## 5. 布局算法实现

### 5.1 算法概述

**核心思想**：

- 递归遍历树结构
- 计算每个节点的位置坐标
- 同级节点左侧齐平对齐
- 子树垂直居中布局

**算法特点**：

- 时间复杂度：O(n)，n 为节点总数
- 空间复杂度：O(d)，d 为树的深度
- 支持动态节点尺寸
- 支持自适应文本宽度

### 5.2 布局配置

```typescript
interface LayoutConfig {
  minNodeWidth: number; // 节点最小宽度 (100px)
  maxNodeWidth: number; // 节点最大宽度 (220px)
  minNodeHeight: number; // 节点最小高度 (40px)
  maxNodeHeight: number; // 节点最大高度 (100px)
  horizontalGap: number; // 水平间距 (80px)
  verticalGap: number; // 垂直间距 (20px)
  paddingX: number; // 水平内边距 (16px)
  paddingY: number; // 垂直内边距 (10px)
  fontSize: number; // 字体大小 (14px)
  lineHeight: number; // 行高 (22px)
}
```

### 5.3 文本宽度估算

**目的**：根据文本内容估算节点所需宽度

**算法**：

```typescript
function estimateTextWidth(text: string, fontSize: number): number {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    // 判断是否为中文字符或全角字符
    if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(char)) {
      width += fontSize * 1.1; // 中文字符宽度
    } else {
      width += fontSize * 0.65; // 英文字符宽度
    }
  }
  return width;
}
```

**说明**：

- 中文字符宽度约为字体大小的 1.1 倍
- 英文字符宽度约为字体大小的 0.65 倍
- 考虑中英文混排情况

### 5.4 节点尺寸计算

```typescript
function calculateNodeSize(
  text: string,
  config: LayoutConfig
): { width: number; height: number } {
  // 1. 估算文本宽度
  const textWidth = estimateTextWidth(text, config.fontSize);
  const contentWidth = textWidth + config.paddingX * 2;

  // 2. 确定实际宽度（在最小和最大宽度之间）
  let actualWidth = Math.max(config.minNodeWidth, contentWidth);
  actualWidth = Math.min(config.maxNodeWidth, actualWidth);

  // 3. 接近最大宽度时直接使用最大宽度，避免略微超出
  if (actualWidth > config.maxNodeWidth * 0.95) {
    actualWidth = config.maxNodeWidth;
  }

  // 4. 计算需要多少行
  const maxTextWidth = actualWidth - config.paddingX * 2;
  const lines = Math.max(1, Math.ceil(textWidth / maxTextWidth));

  // 5. 计算实际高度
  let actualHeight = lines * config.lineHeight + config.paddingY * 2;
  actualHeight = Math.max(config.minNodeHeight, actualHeight);
  actualHeight = Math.min(config.maxNodeHeight, actualHeight);

  return { width: actualWidth, height: actualHeight };
}
```

### 5.5 子树高度计算

**目的**：计算一个节点及其所有子节点占据的总高度

```typescript
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

  // 返回节点高度和子树高度的较大值
  return Math.max(nodeSize.height, childrenHeight + gaps);
}
```

### 5.6 节点布局算法（核心）

```typescript
function layoutNode(
  node: MindMapNode,
  x: number,
  y: number,
  level: number,
  config: LayoutConfig,
  positions: Map<string, NodePosition>,
  parentCollapsed: boolean,
  levelXPositions: Map<number, number> // 层级X坐标映射
): void {
  // 1. 计算当前节点的实际尺寸
  const nodeSize = calculateNodeSize(node.text, config);

  // 2. 记录当前节点的位置信息
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

  // 3. 如果节点收缩或没有子节点，不需要布局子节点
  if (node.collapsed || !node.children || node.children.length === 0) {
    return;
  }

  // 4. 计算子节点的起始 Y 坐标（使子树垂直居中）
  const subtreeHeight = calculateSubtreeHeight(node, config);
  let currentY = y - subtreeHeight / 2 + nodeSize.height / 2;

  // 5. 计算子节点的 X 坐标（同级对齐）
  const childLevel = level + 1;
  let childX: number;

  if (levelXPositions.has(childLevel)) {
    // 该层级已有X坐标，使用已有的（实现同级对齐）
    childX = levelXPositions.get(childLevel)!;
  } else {
    // 计算并记录新层级的X坐标
    childX = x + nodeSize.width + config.horizontalGap;
    levelXPositions.set(childLevel, childX);
  }

  // 6. 递归布局每个子节点
  for (const child of node.children) {
    const childSubtreeHeight = calculateSubtreeHeight(child, config);
    const childY = currentY + childSubtreeHeight / 2;

    layoutNode(
      child,
      childX, // 所有同级子节点使用相同的X坐标
      childY,
      childLevel,
      config,
      positions,
      parentCollapsed || (node.collapsed ?? false),
      levelXPositions
    );

    currentY += childSubtreeHeight + config.verticalGap;
  }
}
```

### 5.7 布局初始化

```typescript
export function useLayout(
  rootNode: MindMapNode | null,
  config?: Partial<LayoutConfig>
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return useMemo(() => {
    const positions = new Map<string, NodePosition>();
    const levelXPositions = new Map<number, number>();

    if (!rootNode) {
      return positions;
    }

    // 根节点从 (0, 0) 开始布局
    levelXPositions.set(0, 0);
    layoutNode(
      rootNode,
      0,
      0,
      0,
      finalConfig,
      positions,
      false,
      levelXPositions
    );

    return positions;
  }, [rootNode, finalConfig]);
}
```

### 5.8 布局效果示例

```
输入数据：
{
  id: "root",
  text: "项目开发",
  children: [
    { id: "1", text: "需求分析", children: [...] },
    { id: "2", text: "系统设计", children: [...] },
    { id: "3", text: "开发实施", children: [...] }
  ]
}

输出布局：
┌─────────────┐ (x=0, y=0)
│  项目开发   │
└─────────────┘
      │
      ├─── ┌─────────────┐ (x=300, y=-120)
      │    │  需求分析   │
      │    └─────────────┘
      │          └─── [子节点...]
      │
      ├─── ┌─────────────┐ (x=300, y=0)
      │    │  系统设计   │
      │    └─────────────┘
      │          └─── [子节点...]
      │
      └─── ┌─────────────┐ (x=300, y=120)
           │  开发实施   │
           └─────────────┘
                 └─── [子节点...]

特点：
- 根节点居中 (0, 0)
- 所有一级子节点 X 坐标相同 (300)，实现左侧齐平
- 子节点垂直分布，间距均匀
- 子树整体垂直居中对齐父节点
```

---

## 6. 交互功能实现

### 6.1 画布缩放

**实现方式**：SVG transform 变换

**核心代码**：

```typescript
<svg>
  <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>
    {/* 所有节点和连接线 */}
  </g>
</svg>
```

**缩放算法**：

```typescript
// 鼠标滚轮事件
handleWheel(e) {
  const mouseX = e.clientX - svgRect.left;
  const mouseY = e.clientY - svgRect.top;

  // 计算新缩放比例
  const newScale = e.deltaY < 0 ? scale * 1.1 : scale / 1.1;
  const clampedScale = clamp(newScale, 0.1, 3);

  // 计算新平移量（保持鼠标下的点位置不变）
  const newTranslateX = mouseX - ((mouseX - translateX) / scale) * clampedScale;
  const newTranslateY = mouseY - ((mouseY - translateY) / scale) * clampedScale;

  setScale(clampedScale);
  setTranslateX(newTranslateX);
  setTranslateY(newTranslateY);
}
```

### 6.2 画布平移

**实现方式**：拖拽空白区域

**状态管理**：

```typescript
const [isPanning, setIsPanning] = useState(false);
const [panStart, setPanStart] = useState({ x: 0, y: 0 });
const [panStartTranslate, setPanStartTranslate] = useState({ x: 0, y: 0 });
```

**事件处理**：

```typescript
// 鼠标按下（在空白处）
handleMouseDown(e) {
  if (e.target === svgRef.current) {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    setPanStartTranslate({ x: translateX, y: translateY });
  }
}

// 鼠标移动
handleMouseMove(e) {
  if (isPanning) {
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    setTranslateX(panStartTranslate.x + dx);
    setTranslateY(panStartTranslate.y + dy);
  }
}

// 鼠标释放
handleMouseUp() {
  setIsPanning(false);
}
```

### 6.3 节点拖拽

**实现流程**：

1. 鼠标按下节点 → 开始拖拽
2. 鼠标移动 → 显示预览和目标高亮
3. 鼠标释放 → 执行节点移动操作

**状态管理**：

```typescript
const [isDraggingNode, setIsDraggingNode] = useState(false);
const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
const [dropTargetId, setDropTargetId] = useState<string | null>(null);
const [dragMousePos, setDragMousePos] = useState({ x: 0, y: 0 });
```

**拖拽检测**：

```typescript
handleMouseMove(e) {
  if (isDraggingNode && draggedNodeId) {
    // 更新鼠标位置（用于预览）
    setDragMousePos({ x: e.clientX, y: e.clientY });

    // 计算鼠标在世界坐标系中的位置
    const worldX = (e.clientX - rect.left - translateX) / scale;
    const worldY = (e.clientY - rect.top - translateY) / scale;

    // 检测鼠标是否悬停在某个节点上
    let targetId = null;
    for (const [id, pos] of positions.entries()) {
      if (id === draggedNodeId) continue;
      if (!pos.visible) continue;

      if (
        worldX > pos.x - pos.width / 2 &&
        worldX < pos.x + pos.width / 2 &&
        worldY > pos.y - pos.height / 2 &&
        worldY < pos.y + pos.height / 2
      ) {
        targetId = id;
        break;
      }
    }
    setDropTargetId(targetId);
  }
}
```

**拖拽预览**：

```tsx
{
  isDraggingNode && draggedNodeId && (
    <div
      className="fixed bg-blue-500 text-white px-3 py-1 rounded-md shadow-lg opacity-80"
      style={{
        left: dragMousePos.x + 10,
        top: dragMousePos.y + 10,
        transform: `scale(${scale})`,
      }}
    >
      {positions.get(draggedNodeId)?.text}
      <div className="text-xs">拖拽到目标节点以添加为子节点</div>
    </div>
  );
}
```

**目标高亮**：

```tsx
{
  isDropTarget && (
    <>
      {/* 高亮边框 */}
      <rect
        x={position.x - position.width / 2 - 4}
        y={position.y - position.height / 2 - 4}
        width={position.width + 8}
        height={position.height + 8}
        fill="rgba(59, 130, 246, 0.1)"
        stroke="#3b82f6"
        strokeWidth="3"
        strokeDasharray="5,5"
        className="animate-pulse"
      />
      {/* 插入位置指示线 */}
      <line
        x1={position.x + position.width / 2 + 10}
        y1={position.y - 20}
        x2={position.x + position.width / 2 + 10}
        y2={position.y + 20}
        stroke="#3b82f6"
        strokeWidth="4"
        className="animate-pulse"
      />
    </>
  );
}
```

### 6.4 节点编辑

**编辑模式切换**：

- 双击节点 → 进入编辑模式
- 右键菜单"编辑" → 进入编辑模式
- 回车或失焦 → 保存并退出编辑模式
- Esc → 取消编辑

**实现**：

```tsx
{
  isEditing ? (
    <input
      ref={inputRef}
      type="text"
      value={editText}
      onChange={(e) => setEditText(e.target.value)}
      onBlur={() => onFinishEdit(node.id, editText)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onFinishEdit(node.id, editText);
        } else if (e.key === "Escape") {
          onFinishEdit(node.id, node.text);
        }
      }}
      className="w-full bg-white text-gray-800 px-2 py-1 rounded"
      autoFocus
    />
  ) : (
    <span>{node.text}</span>
  );
}
```

### 6.5 右键菜单

**显示/隐藏**：

```typescript
const [showMenu, setShowMenu] = useState(false);

const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setShowMenu(!showMenu);
};
```

**菜单结构**：

```tsx
{
  showMenu && (
    <div className="context-menu">
      {/* 编辑 */}
      <button onClick={() => onStartEdit(node.id)}>
        <span>✏️</span> 编辑节点
      </button>

      {/* 添加子节点 */}
      <button onClick={() => onAddChild(node.id)}>
        <span>➕</span> 添加子节点 (Tab)
      </button>

      {/* 添加同级节点（根节点除外） */}
      {!isRoot && (
        <button onClick={() => onAddSibling(node.id)}>
          <span>➕</span> 添加同级节点 (Enter)
        </button>
      )}

      {/* 删除节点（根节点除外） */}
      {!isRoot && (
        <button onClick={() => onDelete(node.id)}>
          <span>🗑️</span> 删除节点 (Delete)
        </button>
      )}
    </div>
  );
}
```

### 6.6 键盘快捷键

**支持的快捷键**：

| 快捷键                 | 功能         | 说明                     |
| ---------------------- | ------------ | ------------------------ |
| `Enter`                | 添加同级节点 | 需先选中节点，根节点除外 |
| `Tab`                  | 添加子节点   | 需先选中节点             |
| `Delete` / `Backspace` | 删除节点     | 需先选中节点，根节点除外 |
| `双击`                 | 编辑节点     | 直接双击节点             |
| `滚轮`                 | 缩放画布     | 以鼠标位置为中心缩放     |
| `拖拽空白`             | 平移画布     | -                        |
| `拖拽节点`             | 移动节点     | 拖拽到目标节点上         |

**实现**：

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (editingNodeId || !selectedNodeId) return;

    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      return;
    }

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (selectedNodeId !== rootNode?.id) {
          addSibling(selectedNodeId);
        }
        break;
      case "Tab":
        e.preventDefault();
        addChild(selectedNodeId);
        break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        if (selectedNodeId !== rootNode?.id) {
          if (confirm("确定要删除选中的节点吗？")) {
            deleteNode(selectedNodeId);
            setSelectedNodeId(null);
          }
        }
        break;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [selectedNodeId, editingNodeId, rootNode, addChild, addSibling, deleteNode]);
```

---

## 7. 状态管理方案

### 7.1 Reducer 模式

**选择理由**：

- 数据修改逻辑复杂（增删改查、移动）
- 需要保证数据不可变性
- 便于调试和测试

**Reducer 结构**：

```typescript
function mindMapReducer(
  state: MindMapNode | null,
  action: MindMapAction
): MindMapNode | null {
  if (!state) return null;

  switch (action.type) {
    case ActionType.UPDATE_NODE:
      return updateNodeInTree(state, action.nodeId, (node) => {
        node.text = action.text;
      });

    case ActionType.ADD_CHILD:
      return updateNodeInTree(state, action.parentId, (node) => {
        node.children = [...node.children, action.newNode];
        node.collapsed = false;
      });

    case ActionType.ADD_SIBLING:
      // 找到父节点，在兄弟节点后插入
      return addSiblingInTree(state, action.nodeId, action.newNode);

    case ActionType.DELETE_NODE:
      return deleteNodeInTree(state, action.nodeId);

    case ActionType.TOGGLE_COLLAPSE:
      return updateNodeInTree(state, action.nodeId, (node) => {
        node.collapsed = !node.collapsed;
      });

    case ActionType.MOVE_NODE:
      return moveNodeInTree(state, action.nodeId, action.targetParentId);

    default:
      return state;
  }
}
```

### 7.2 不可变更新

**核心原则**：

- 永远返回新对象，不修改原对象
- 使用浅拷贝 + 递归更新
- 保证 React 能正确检测变化

**辅助函数**：

1. **深度克隆**

```typescript
function cloneNode(node: MindMapNode): MindMapNode {
  return {
    ...node,
    children: node.children.map(cloneNode),
  };
}
```

2. **查找节点**

```typescript
function findNode(root: MindMapNode, nodeId: string): MindMapNode | null {
  if (root.id === nodeId) return root;

  for (const child of root.children) {
    const found = findNode(child, nodeId);
    if (found) return found;
  }

  return null;
}
```

3. **更新节点**

```typescript
function updateNodeInTree(
  node: MindMapNode,
  nodeId: string,
  updater: (node: MindMapNode) => void
): MindMapNode {
  if (node.id === nodeId) {
    const updated = { ...node };
    updater(updated);
    return updated;
  }

  return {
    ...node,
    children: node.children.map((child) =>
      updateNodeInTree(child, nodeId, updater)
    ),
  };
}
```

4. **删除节点**

```typescript
function deleteNodeInTree(
  node: MindMapNode,
  nodeId: string
): MindMapNode | null {
  if (node.id === nodeId) {
    return null; // 不能删除根节点（在 reducer 中检查）
  }

  return {
    ...node,
    children: node.children
      .filter((child) => child.id !== nodeId)
      .map((child) => deleteNodeInTree(child, nodeId))
      .filter((child) => child !== null) as MindMapNode[],
  };
}
```

5. **移动节点**

```typescript
function moveNodeInTree(
  root: MindMapNode,
  nodeId: string,
  targetParentId: string
): MindMapNode | null {
  // 1. 检查非法操作
  if (root.id === nodeId || nodeId === targetParentId) {
    return root;
  }

  // 2. 找到要移动的节点
  const nodeToMove = findNode(root, nodeId);
  if (!nodeToMove) return root;

  // 3. 检查目标是否是要移动节点的后代（避免循环）
  if (findNode(nodeToMove, targetParentId)) {
    return root;
  }

  // 4. 先从树中删除节点
  let newRoot = deleteNodeInTree(root, nodeId);
  if (!newRoot) return root;

  // 5. 将节点添加到新父节点下
  newRoot = updateNodeInTree(newRoot, targetParentId, (parent) => {
    parent.children = [...parent.children, cloneNode(nodeToMove)];
  });

  return newRoot;
}
```

### 7.3 自定义 Hook

```typescript
export function useMindMapState(initialData: MindMapNode | null) {
  const [rootNode, dispatch] = useReducer(mindMapReducer, initialData);

  const updateNode = useCallback((nodeId: string, text: string) => {
    dispatch({ type: ActionType.UPDATE_NODE, nodeId, text });
  }, []);

  const addChild = useCallback((parentId: string, text: string = "新节点") => {
    const newNode: MindMapNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      children: [],
    };
    dispatch({ type: ActionType.ADD_CHILD, parentId, newNode });
  }, []);

  const addSibling = useCallback(
    (siblingOfId: string, text: string = "新节点") => {
      const newNode: MindMapNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text,
        children: [],
      };
      dispatch({ type: ActionType.ADD_SIBLING, nodeId: siblingOfId, newNode });
    },
    []
  );

  const deleteNode = useCallback((nodeId: string) => {
    dispatch({ type: ActionType.DELETE_NODE, nodeId });
  }, []);

  const toggleCollapse = useCallback((nodeId: string) => {
    dispatch({ type: ActionType.TOGGLE_COLLAPSE, nodeId });
  }, []);

  const moveNode = useCallback((nodeId: string, targetParentId: string) => {
    dispatch({ type: ActionType.MOVE_NODE, nodeId, targetParentId });
  }, []);

  return {
    rootNode,
    updateNode,
    addChild,
    addSibling,
    deleteNode,
    toggleCollapse,
    moveNode,
  };
}
```

---

## 8. 渲染优化策略

### 8.1 useMemo 优化

**布局计算优化**：

```typescript
export function useLayout(rootNode: MindMapNode | null) {
  const positions = useMemo(() => {
    const positions = new Map<string, NodePosition>();
    const levelXPositions = new Map<number, number>();

    if (!rootNode) return positions;

    layoutNode(
      rootNode,
      0,
      0,
      0,
      DEFAULT_CONFIG,
      positions,
      false,
      levelXPositions
    );

    return positions;
  }, [rootNode]); // 仅在 rootNode 变化时重新计算

  return positions;
}
```

**说明**：

- 布局计算开销大（O(n)），使用 `useMemo` 缓存结果
- 只有当节点树数据变化时才重新计算
- 避免每次渲染都重新计算

### 8.2 useCallback 优化

**事件处理器优化**：

```typescript
const handleMouseMove = useCallback(
  (e: MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setTranslateX(panStartTranslate.x + dx);
      setTranslateY(panStartTranslate.y + dy);
    }
  },
  [isPanning, panStart, panStartTranslate]
);
```

**说明**：

- 避免每次渲染创建新函数
- 减少子组件不必要的重渲染
- 依赖项明确，便于维护

### 8.3 条件渲染

**可见性检查**：

```typescript
const renderNodes = (node: MindMapNodeType): React.ReactNode => {
  const position = positions.get(node.id);
  if (!position || !position.visible) return null; // 不渲染不可见节点

  return (
    <g key={node.id}>
      <MindMapNode {...props} />
      {!node.collapsed && node.children.map(renderNodes)}
    </g>
  );
};
```

**说明**：

- 收缩节点的子树不渲染，节省性能
- 使用 `visible` 标记控制渲染
- 减少 DOM 节点数量

### 8.4 SVG 优化

**连接线优化**：

```typescript
// 只收集可见节点的连接线
function collectConnections(
  node: MindMapNode,
  positions: Map<string, NodePosition>
) {
  const nodePos = positions.get(node.id);
  if (!nodePos || !nodePos.visible) return [];

  const connections = [];

  if (!node.collapsed && node.children) {
    for (const child of node.children) {
      const childPos = positions.get(child.id);
      if (childPos && childPos.visible) {
        connections.push({
          id: `${node.id}-${child.id}`,
          path: drawConnection(nodePos, childPos),
        });
        connections.push(...collectConnections(child, positions));
      }
    }
  }

  return connections;
}
```

**CSS 动画优化**：

```css
.node {
  transition: all 0.3s ease;
  will-change: transform;
}

.connection {
  transition: d 0.3s ease;
}
```

### 8.5 事件委托

**减少事件监听器**：

```typescript
// 在父容器上监听，而不是每个节点
<svg onMouseDown={handleMouseDown} onWheel={handleWheel}>
  <g transform={...}>
    {/* 所有节点 */}
  </g>
</svg>
```

---

## 9. 开发规范

### 9.1 代码风格

**TypeScript 规范**：

- 所有组件使用 TypeScript
- 明确标注参数和返回值类型
- 使用接口定义复杂对象类型
- 避免使用 `any` 类型

**命名规范**：

- 组件名：PascalCase（如 `MindMapNode`）
- 函数名：camelCase（如 `handleClick`）
- 常量名：UPPER_CASE（如 `DEFAULT_CONFIG`）
- 接口名：I 前缀（如 `IMindMapNode`）或直接 PascalCase
- 类型名：T 前缀（如 `TNodePosition`）或直接 PascalCase

**注释规范**：

```typescript
/**
 * 思维导图主容器组件
 * 负责整体渲染、画布操作（缩放、平移）、交互协调
 *
 * @param props - 组件属性
 * @param props.initialData - 初始数据
 * @param props.width - 画布宽度
 * @param props.height - 画布高度
 */
export function MindMap({ initialData, width, height }: MindMapProps) {
  // ...
}
```

### 9.2 文件组织

```
src/
├── components/           # 组件
│   ├── MindMap.tsx       # 主容器组件
│   ├── MindMapNode.tsx   # 节点组件
│   └── MindMapConnections.tsx  # 连接线组件
├── hooks/                # 自定义 Hooks
│   ├── useMindMapState.ts  # 状态管理
│   └── useLayout.ts        # 布局计算
├── types/                # 类型定义
│   └── mindmap.ts        # 思维导图相关类型
├── pages/                # 页面
│   └── MindMapPage.tsx   # 演示页面
└── utils/                # 工具函数（如需要）
```

### 9.3 Git 提交规范

**Commit 消息格式**：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**：

```
feat(layout): 实现同级节点左侧对齐

- 新增 levelXPositions 映射表
- 修改 layoutNode 算法
- 确保同级节点使用相同X坐标

Closes #123
```

### 9.4 代码审查清单

**功能审查**：

- [ ] 功能是否完整实现
- [ ] 边界情况是否处理
- [ ] 错误处理是否完善
- [ ] 用户体验是否流畅

**代码质量**：

- [ ] 代码是否符合规范
- [ ] 类型定义是否完整
- [ ] 注释是否清晰
- [ ] 是否有重复代码

**性能审查**：

- [ ] 是否有不必要的重渲染
- [ ] 是否使用了优化手段
- [ ] 大数据量下是否流畅

**测试审查**：

- [ ] 是否有单元测试
- [ ] 测试覆盖率是否足够
- [ ] 是否测试了边界情况

---

## 10. 测试方案

### 10.1 单元测试

**测试工具**：

- Jest - 测试框架
- React Testing Library - 组件测试
- @testing-library/user-event - 用户交互模拟

**测试用例**：

1. **数据结构测试**

```typescript
describe("MindMapNode", () => {
  test("should create node with required fields", () => {
    const node: MindMapNode = {
      id: "test-1",
      text: "Test Node",
      children: [],
    };
    expect(node).toBeDefined();
    expect(node.id).toBe("test-1");
    expect(node.text).toBe("Test Node");
  });

  test("should support collapsed property", () => {
    const node: MindMapNode = {
      id: "test-1",
      text: "Test",
      children: [],
      collapsed: true,
    };
    expect(node.collapsed).toBe(true);
  });
});
```

2. **布局算法测试**

```typescript
describe("calculateNodeSize", () => {
  test("should calculate size for short text", () => {
    const size = calculateNodeSize("测试", DEFAULT_CONFIG);
    expect(size.width).toBeGreaterThanOrEqual(DEFAULT_CONFIG.minNodeWidth);
    expect(size.height).toBe(DEFAULT_CONFIG.minNodeHeight);
  });

  test("should wrap long text", () => {
    const longText = "这是一个非常长的文本，应该会换行显示";
    const size = calculateNodeSize(longText, DEFAULT_CONFIG);
    expect(size.height).toBeGreaterThan(DEFAULT_CONFIG.minNodeHeight);
  });

  test("should respect max width", () => {
    const veryLongText = "非常长的文本".repeat(20);
    const size = calculateNodeSize(veryLongText, DEFAULT_CONFIG);
    expect(size.width).toBeLessThanOrEqual(DEFAULT_CONFIG.maxNodeWidth);
  });
});
```

3. **状态管理测试**

```typescript
describe("mindMapReducer", () => {
  const initialState: MindMapNode = {
    id: "root",
    text: "Root",
    children: [{ id: "child-1", text: "Child 1", children: [] }],
  };

  test("should update node text", () => {
    const action: MindMapAction = {
      type: ActionType.UPDATE_NODE,
      nodeId: "child-1",
      text: "Updated",
    };
    const newState = mindMapReducer(initialState, action);
    expect(newState?.children[0].text).toBe("Updated");
    expect(newState).not.toBe(initialState); // 不可变更新
  });

  test("should add child node", () => {
    const newNode: MindMapNode = {
      id: "child-2",
      text: "Child 2",
      children: [],
    };
    const action: MindMapAction = {
      type: ActionType.ADD_CHILD,
      parentId: "root",
      newNode,
    };
    const newState = mindMapReducer(initialState, action);
    expect(newState?.children).toHaveLength(2);
    expect(newState?.children[1].id).toBe("child-2");
  });

  test("should delete node", () => {
    const action: MindMapAction = {
      type: ActionType.DELETE_NODE,
      nodeId: "child-1",
    };
    const newState = mindMapReducer(initialState, action);
    expect(newState?.children).toHaveLength(0);
  });

  test("should toggle collapse", () => {
    const action: MindMapAction = {
      type: ActionType.TOGGLE_COLLAPSE,
      nodeId: "root",
    };
    const newState = mindMapReducer(initialState, action);
    expect(newState?.collapsed).toBe(true);
  });
});
```

### 10.2 集成测试

**测试场景**：

1. **完整操作流程**

```typescript
describe("MindMap Integration", () => {
  test("should add, edit, and delete node", async () => {
    const { getByText, getByRole } = render(<MindMap initialData={testData} />);

    // 1. 选中节点
    const node = getByText("Test Node");
    await userEvent.click(node);

    // 2. 添加子节点（Tab键）
    await userEvent.keyboard("{Tab}");
    expect(getByText("新节点")).toBeInTheDocument();

    // 3. 编辑节点（双击）
    const newNode = getByText("新节点");
    await userEvent.dblClick(newNode);
    const input = getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "Updated Node{Enter}");
    expect(getByText("Updated Node")).toBeInTheDocument();

    // 4. 删除节点（Delete键）
    await userEvent.click(getByText("Updated Node"));
    await userEvent.keyboard("{Delete}");
    expect(queryByText("Updated Node")).not.toBeInTheDocument();
  });
});
```

2. **拖拽操作测试**

```typescript
describe("Node Dragging", () => {
  test("should move node to new parent", async () => {
    // 测试拖拽逻辑
  });
});
```

### 10.3 E2E 测试

**测试工具**：Playwright 或 Cypress

**测试场景**：

1. 页面加载和初始渲染
2. 画布缩放和平移
3. 节点的增删改查
4. 快捷键操作
5. 右键菜单
6. 拖拽移动节点

### 10.4 性能测试

**测试指标**：

- 初始渲染时间
- 操作响应时间
- 内存占用
- FPS（帧率）

**测试方法**：

```typescript
describe("Performance", () => {
  test("should render large tree quickly", () => {
    const largeTree = generateLargeTree(1000); // 1000个节点
    const start = performance.now();
    render(<MindMap initialData={largeTree} />);
    const end = performance.now();
    expect(end - start).toBeLessThan(1000); // 1秒内完成
  });
});
```

---

## 11. 部署指南

### 11.1 构建配置

**Vite 配置** (`vite.config.ts`):

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
});
```

### 11.2 构建命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 运行测试
npm run test

# 代码检查
npm run lint
```

### 11.3 部署流程

**1. 本地构建**

```bash
npm run build
```

**2. 部署到静态服务器**

```bash
# 部署到 Nginx
cp -r dist/* /var/www/html/

# 部署到云服务
# Vercel / Netlify / GitHub Pages
```

**3. 配置 Nginx**

```nginx
server {
  listen 80;
  server_name mindmap.example.com;

  root /var/www/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # 启用 Gzip 压缩
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

  # 缓存静态资源
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

### 11.4 环境变量

**开发环境** (`.env.development`):

```
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_TITLE=MindMap Dev
```

**生产环境** (`.env.production`):

```
VITE_API_BASE_URL=https://api.example.com
VITE_APP_TITLE=MindMap
```

---

## 12. 性能指标

### 12.1 渲染性能

| 节点数量 | 初始渲染 | 操作响应 | 内存占用 |
| -------- | -------- | -------- | -------- |
| 10       | < 50ms   | < 16ms   | < 10MB   |
| 50       | < 100ms  | < 16ms   | < 20MB   |
| 100      | < 200ms  | < 16ms   | < 30MB   |
| 500      | < 500ms  | < 16ms   | < 100MB  |
| 1000     | < 1s     | < 32ms   | < 200MB  |

### 12.2 交互性能

| 操作     | 目标时间 | 实际时间 |
| -------- | -------- | -------- |
| 点击选中 | < 16ms   | ~10ms    |
| 双击编辑 | < 16ms   | ~12ms    |
| 添加节点 | < 100ms  | ~50ms    |
| 删除节点 | < 100ms  | ~60ms    |
| 拖拽移动 | 60fps    | 60fps    |
| 画布缩放 | 60fps    | 60fps    |
| 画布平移 | 60fps    | 60fps    |

### 12.3 优化建议

**大数据量优化**：

1. 虚拟渲染（只渲染可视区域）
2. 分层加载（按层级懒加载）
3. 节点池复用
4. Web Worker 计算布局

**内存优化**：

1. 及时清理事件监听器
2. 避免闭包陷阱
3. 使用 WeakMap 存储临时数据

**渲染优化**：

1. 使用 React.memo 优化组件
2. 避免内联函数和对象
3. 合理使用 useMemo 和 useCallback

---

## 13. 未来规划

### 13.1 功能扩展

**短期规划（1-3 个月）**：

- [ ] 节点样式自定义（颜色、字体、图标）
- [ ] 导出为图片（PNG/SVG）
- [ ] 导入/导出 JSON 数据
- [ ] 撤销/重做功能
- [ ] 搜索和定位节点
- [ ] 节点折叠动画

**中期规划（3-6 个月）**：

- [ ] 协作编辑（多人实时）
- [ ] 云端存储和同步
- [ ] 模板系统
- [ ] 节点关联（非树形连接）
- [ ] 富文本节点（Markdown 支持）
- [ ] 附件和链接

**长期规划（6-12 个月）**：

- [ ] 移动端适配（触摸手势）
- [ ] AI 辅助生成思维导图
- [ ] 数据分析和洞察
- [ ] 插件系统
- [ ] 多种布局模式（鱼骨图、组织架构图）

### 13.2 技术改进

**性能优化**：

- 虚拟渲染技术
- Canvas 渲染模式（大数据量）
- Web Worker 后台计算
- 增量更新算法

**架构优化**：

- 微前端架构
- 组件库独立发布
- API 层抽象
- 状态管理升级（Zustand/Jotai）

**工程化**：

- 自动化测试覆盖
- CI/CD 流程完善
- 性能监控系统
- 错误追踪系统

### 13.3 生态建设

**开发者工具**：

- Chrome DevTools 扩展
- VS Code 扩展
- CLI 工具

**社区建设**：

- 开源贡献指南
- 示例和教程
- API 文档网站
- Discord/Slack 社区

---

## 14. 附录

### 14.1 常见问题

**Q: 如何更改节点的默认样式？**
A: 修改 `MindMapNode.tsx` 中的样式类名或配置。

**Q: 如何限制节点的最大层级？**
A: 在 `addChild` 方法中检查 `level` 属性。

**Q: 如何导出思维导图为图片？**
A: 使用 `html2canvas` 或 `dom-to-image` 库。

**Q: 如何实现自动保存？**
A: 监听 `rootNode` 变化，使用 `debounce` 防抖后保存。

### 14.2 参考资源

**官方文档**：

- React: https://react.dev/
- TypeScript: https://www.typescriptlang.org/
- SVG: https://developer.mozilla.org/en-US/docs/Web/SVG

**相关库**：

- d3.js（数据可视化）
- react-flow（流程图）
- mind-elixir（思维导图）

**设计参考**：

- XMind
- MindMeister
- Coggle

### 14.3 贡献指南

**如何贡献**：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

**贡献规范**：

- 遵循代码规范
- 添加单元测试
- 更新相关文档
- 通过 CI 检查

---

## 15. 变更日志

### v1.0.0 (2026-02-12)

**新增功能**：

- ✅ 基础思维导图渲染
- ✅ 节点增删改查
- ✅ 节点拖拽移动
- ✅ 画布缩放和平移
- ✅ 键盘快捷键
- ✅ 右键上下文菜单
- ✅ 自适应节点尺寸
- ✅ 同级节点对齐
- ✅ 展开/收缩按钮优化

**优化改进**：

- ✅ 布局算法优化
- ✅ 渲染性能优化
- ✅ 交互体验优化
- ✅ 代码结构优化

**文档完善**：

- ✅ 技术方案文档
- ✅ API 文档
- ✅ 使用指南
- ✅ 开发文档

---

## 📞 联系方式

- **项目仓库**：https://github.com/example/mindmap
- **问题反馈**：https://github.com/example/mindmap/issues
- **邮箱**：dev@example.com

---

**文档版本**：v1.0.0  
**最后更新**：2026-02-12  
**维护者**：开发团队

---

© 2026 MindMap Project. All Rights Reserved.
