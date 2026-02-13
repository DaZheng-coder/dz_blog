# MindMap 架构设计总结：从单体组件到可维护分层

这篇文章总结当前 `MindMap` 的实现架构，目标是回答三个问题：

1. 为什么要拆分模块，而不是继续堆在一个大组件里？
2. 当前代码如何在「可维护性」和「性能」之间平衡？
3. 下一步还有哪些可落地优化点？

## 一、模块分层总览

当前实现位于 `src/components/mindMap`，核心分层如下：

### 1. 容器层（协调交互与渲染）

- `MindMap.tsx`

职责：
- 管理画布状态（缩放、平移、拖拽、选中、编辑）
- 串联布局结果、节点层、连线层、拖拽预览
- 处理全局交互生命周期（鼠标移动 RAF、mouseup 收口）

### 2. 状态层（树结构与历史）

- `hooks/useMindMapState.ts`
- `hooks/mindmapState/treeOperations.ts`
- `hooks/mindmapState/reducer.ts`
- `hooks/mindmapState/history.ts`

职责：
- 对节点树做纯函数更新（增删改、移动、折叠）
- Action 归一到 reducer
- 提供撤销/重做历史栈（past/present/future）

### 3. 布局层（几何计算）

- `src/hooks/useLayout.ts`

职责：
- 文本测量与节点尺寸估算
- 子树高度计算与层级横向布局
- 输出 `positions: Map<id, NodePosition>`

### 4. 几何索引层（命中与可见性）

- `geometry.ts`

职责：
- 构建 `nodeMap`、可见子节点映射
- 生成 hit-test bucket（降低拖拽命中成本）
- 计算子树边界与 world viewport

### 5. 展示层（可替换 UI 组件）

- `MindMapNodeLayer.tsx`：节点渲染与裁剪
- `MindMapConnections.tsx`：贝塞尔连线
- `MindMapNode.tsx`：单节点展示与编辑
- `MindMapDragGhost.tsx` / `MindMapDropPreview.tsx`：拖拽反馈
- `MindMapGuidePanel.tsx` / `MindMapZoomIndicator.tsx` / `MindMapHistoryControls.tsx`：浮层 UI

## 二、核心数据流

一次节点更新的大致链路：

1. 用户操作触发（点击、键盘、拖拽）
2. `MindMap.tsx` 调用 `useMindMapState` 暴露的 action
3. reducer 返回新的树结构 `rootNode`
4. `useLayout(rootNode)` 重新计算布局 `positions`
5. `NodeLayer / Connections` 基于新 `positions` 渲染

关键点：
- 「树状态」和「布局结果」分离，保证状态清晰
- 布局结果以 `Map` 提供 O(1) 节点查找
- 视口裁剪在渲染层生效，减少大规模节点的 DOM/SVG 开销

## 三、为什么这样拆：解决的具体问题

早期单文件方案的问题通常是：

- 状态更新、几何计算、事件处理耦合在一起
- 修改一个交互容易影响别的分支
- 性能优化难以定位和复用

当前拆分后收益：

- **可读性**：每个文件只做一件事（状态 / 布局 / 命中 / UI）
- **可测试性**：`treeOperations`、`historyReducer` 都是纯函数，便于单测
- **可扩展性**：后续接入导出、协同、虚拟化，不必重写核心状态

## 四、已落地的性能策略

当前代码中已经实现的关键优化：

1. **命中网格化（Hit Buckets）**
拖拽时不再扫描全部节点，而是先按格子过滤候选节点。

2. **视口裁剪**
`MindMapNodeLayer` 和 `MindMapConnections` 均根据 world viewport 做过滤，避免离屏渲染。

3. **交互降级**
拖拽/平移进行中，减少动画与过渡，优先保证帧率。

4. **大节点平移优化**
节点数大于阈值时，直接更新 `<g transform>` 进行预览，mouseup 再提交状态。

5. **布局缓存**
`useLayout` 中缓存节点尺寸与子树高度，降低重复计算。

6. **Pointer Move RAF 节流**
高频鼠标移动统一进 `requestAnimationFrame`，避免主线程被事件风暴打满。

## 五、当前架构的边界与后续建议

### 1. 虚拟化仍可继续深化

当前是“视口裁剪渲染”，下一步可做“分块虚拟化 + 分段渲染优先级”。

### 2. 状态可进一步解耦

如果后续要接多人协作，可将 `history` 与 `domain state` 分离成 command/event 模式。

### 3. 布局可异步化

当节点规模继续提升（例如 10k+ 且频繁编辑），可考虑：
- Web Worker 布局计算
- 增量布局（仅重算受影响子树）

### 4. 连接线可引入分层缓存

对稳定区域缓存 path，拖拽时只重算局部路径，降低大图更新成本。

## 六、结语

`MindMap` 当前架构的关键不是“拆了多少文件”，而是形成了一个可持续迭代的边界：

- 状态更新有统一入口
- 布局是可替换模块
- 几何索引与渲染解耦
- 交互优化可按规模分级开启

这使得它已经从“功能可用”进入“工程可维护”的阶段。
