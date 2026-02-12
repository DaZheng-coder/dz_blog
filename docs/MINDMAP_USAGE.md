# 思维导图组件使用文档

## 概述

这是一个高性能、可交互的 Web 思维导图组件，基于 React + TypeScript + SVG 实现。

## 技术栈

- **框架**: React 19 + TypeScript
- **渲染**: SVG（便于样式控制和事件绑定）
- **样式**: Tailwind CSS
- **状态管理**: React Hooks（useState + useReducer）

## 核心功能

### 1. 数据驱动渲染
- 支持传入 JSON 树形结构数据
- 自动计算布局并渲染
- 标准思维导图布局（根节点居中，子节点向右侧发散）

### 2. 节点展开与收缩
- 点击节点左侧的 `+`/`−` 按钮展开或收缩子树
- 连接线动态更新
- 平滑过渡动画

### 3. 节点拖拽
- 按住节点拖拽可以移动到其他节点下
- 拖拽过程中显示蓝色虚线边框预览目标位置
- 释放鼠标后自动重组数据结构

### 4. 节点编辑
- 双击节点进入编辑模式
- 支持回车保存、Esc 取消、失焦保存
- 右键菜单支持编辑、添加子节点、删除节点

### 5. 画布操作
- 鼠标滚轮缩放（0.1x - 3x）
- 拖拽空白区域平移画布
- 实时显示缩放比例

## 快速开始

### 基本使用

```tsx
import { MindMap } from '@/components/MindMap';
import type { MindMapNode } from '@/types/mindmap';

const data: MindMapNode = {
  id: 'root',
  text: '根节点',
  children: [
    {
      id: 'child1',
      text: '子节点 1',
      children: [],
    },
    {
      id: 'child2',
      text: '子节点 2',
      children: [],
    },
  ],
};

function App() {
  return (
    <div className="w-screen h-screen">
      <MindMap 
        initialData={data} 
        width={window.innerWidth} 
        height={window.innerHeight} 
      />
    </div>
  );
}
```

### 数据结构定义

```typescript
interface MindMapNode {
  id: string;              // 唯一标识
  text: string;            // 节点文本
  children: MindMapNode[]; // 子节点数组
  collapsed?: boolean;     // 是否收缩（可选）
  style?: NodeStyle;       // 自定义样式（可选）
}
```

## 组件结构

```
src/
├── types/
│   └── mindmap.ts                 # TypeScript 类型定义
├── hooks/
│   ├── useLayout.ts               # 布局计算 Hook
│   └── useMindMapState.ts         # 状态管理 Hook
├── components/
│   ├── MindMap.tsx                # 主容器组件
│   ├── MindMapNode.tsx            # 节点渲染组件
│   └── MindMapConnections.tsx     # 连接线渲染组件
└── pages/
    └── MindMapPage.tsx            # Demo 页面
```

## 核心算法说明

### 布局算法（useLayout.ts）

采用树形递归布局算法：

1. **计算子树高度**: 递归计算每个节点的子树总高度
2. **垂直居中**: 子节点相对于父节点垂直居中排列
3. **水平间距**: 每一层级固定水平间距
4. **可见性控制**: 父节点收缩时，子节点标记为不可见

配置参数：
- `nodeWidth`: 节点宽度（默认 120px）
- `nodeHeight`: 节点高度（默认 40px）
- `horizontalGap`: 水平间距（默认 80px）
- `verticalGap`: 垂直间距（默认 20px）

### 状态管理（useMindMapState.ts）

使用 `useReducer` 管理节点树状态，支持以下操作：

- **UPDATE_NODE**: 更新节点文本
- **ADD_CHILD**: 添加子节点
- **DELETE_NODE**: 删除节点（保护根节点）
- **TOGGLE_COLLAPSE**: 切换展开/收缩
- **MOVE_NODE**: 移动节点（检测循环引用）

### 拖拽逻辑（MindMap.tsx）

1. **节点拖拽开始**: 记录起始坐标和节点信息
2. **鼠标移动**: 实时计算世界坐标，检测悬停目标
3. **释放鼠标**: 如果有目标节点，执行移动操作
4. **边界检查**: 防止移动到自己或后代节点下（避免循环）

### 画布变换

- **缩放**: 以鼠标为中心进行缩放，保持鼠标指向的世界坐标不变
- **平移**: 记录起始位置和当前平移量，计算增量

## 交互说明

| 操作 | 功能 |
|------|------|
| 双击节点 | 进入编辑模式 |
| 右键节点 | 显示操作菜单 |
| 拖拽节点 | 移动到其他节点下 |
| 鼠标滚轮 | 缩放画布 |
| 拖拽空白 | 平移画布 |
| +/− 按钮 | 展开/收缩子节点 |
| 回车键 | 保存编辑 |
| Esc 键 | 取消编辑 |

## 性能优化

1. **useMemo**: 布局计算结果缓存，避免重复计算
2. **useCallback**: 事件处理函数缓存，减少重渲染
3. **SVG 渲染**: 利用浏览器原生 SVG 性能
4. **按需渲染**: 收缩的子节点不渲染

## 扩展建议

### 添加自定义样式

修改 `NodeStyle` 接口并在 `MindMapNode.tsx` 中应用：

```typescript
interface NodeStyle {
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  fontSize?: number;
}
```

### 导出功能

可以添加 SVG 导出功能：

```typescript
function exportSVG() {
  const svgElement = svgRef.current;
  const svgString = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  // 下载或上传
}
```

### 键盘快捷键

可以添加 `useEffect` 监听键盘事件：

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') addChild(selectedNodeId);
    if (e.key === 'Delete') deleteNode(selectedNodeId);
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedNodeId]);
```

## 常见问题

### Q: 如何修改节点的默认样式？

A: 在 `MindMapNode.tsx` 中修改 `bgColor`、`textColor` 等类名。

### Q: 如何持久化数据？

A: 监听 `rootNode` 状态变化，保存到 localStorage 或后端：

```typescript
useEffect(() => {
  if (rootNode) {
    localStorage.setItem('mindmap', JSON.stringify(rootNode));
  }
}, [rootNode]);
```

### Q: 如何实现双向布局？

A: 修改 `useLayout.ts` 中的布局算法，将一半子节点布局到左侧。

## 许可证

MIT License
