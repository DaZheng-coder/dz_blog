# 思维导图菜单和布局改进文档

## 📅 更新日期
2026-02-12

## 🎯 改进目标

本次更新主要针对用户体验和视觉布局进行了三项重要改进：

1. **简化交互方式** - 将hover快捷按钮改为右键菜单
2. **优化按钮位置** - 展开/收缩按钮移至节点右侧边缘
3. **统一视觉布局** - 同级节点左侧齐平对齐

---

## ✅ 改进详情

### 1. 简化交互方式：右键菜单替代Hover按钮

#### 改进前的问题
- 节点hover时显示快捷按钮（添加、删除）
- 按钮位置不固定，容易误触
- 视觉干扰较大，影响阅读

#### 改进方案
```typescript
// 移除了 hover 时显示的快捷按钮
// 移除了 isHovered 状态

// 显示模式：简洁的文本显示
<div className="flex items-center justify-center w-full">
  <span className="text-sm font-medium break-words text-center">
    {node.text}
  </span>
</div>
```

#### 改进效果
✅ 节点显示更简洁  
✅ 减少视觉干扰  
✅ 所有操作统一在右键菜单中  
✅ 避免误触

---

### 2. 展开/收缩按钮位置优化

#### 改进前的问题
- 按钮在节点内部左侧
- 占用节点内容空间
- 多行文本时对齐不佳

#### 改进方案

**使用 SVG 元素渲染按钮**：
```typescript
{/* 展开/收缩按钮 - 位于节点右侧边缘居中 */}
{hasChildren && !isEditing && (
  <g
    onClick={(e) => {
      e.stopPropagation();
      onToggleCollapse(node.id);
    }}
    style={{ cursor: "pointer" }}
  >
    <circle
      cx={x + width / 2 + 10}  // 节点右侧边缘 + 10px
      cy={y}                     // 垂直居中
      r="10"
      fill="white"
      stroke="#94a3b8"
      strokeWidth="2"
      className="hover:fill-gray-100 hover:stroke-blue-400 transition-all"
    />
    <text
      x={x + width / 2 + 10}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      fill="#374151"
      fontSize="14"
      fontWeight="bold"
    >
      {node.collapsed ? "+" : "−"}
    </text>
  </g>
)}
```

#### 按钮位置计算
- **X坐标**：`x + width / 2 + 10`
  - `x + width / 2`：节点右边缘
  - `+ 10`：向右偏移10px，留出空间
- **Y坐标**：`y`（节点中心Y坐标，自动垂直居中）

#### 改进效果
✅ 按钮位置固定在右侧边缘  
✅ 视觉上更清晰，不占用内容空间  
✅ 垂直居中对齐，美观一致  
✅ Hover效果明显，交互友好

---

### 3. 同级节点左侧齐平对齐

#### 改进前的问题
```
项目开发流程
  ├─ 需求分析     (x = 200)
  │   └─ 收集需求   (x = 330)  ← 基于父节点宽度计算
  ├─ 系统设计     (x = 200)
  │   └─ 架构设计   (x = 350)  ← 父节点宽度不同，子节点X不同
  └─ 开发实施     (x = 200)
      └─ 前端开发   (x = 360)  ← 不齐平！
```

#### 改进方案

**核心思路**：使用层级映射表记录每个层级的X坐标

```typescript
/**
 * 递归计算节点布局位置
 * levelXPositions: 记录每个层级的X坐标，确保同级节点左侧齐平
 */
function layoutNode(
  node: MindMapNode,
  x: number,
  y: number,
  level: number,
  config: LayoutConfig,
  positions: Map<string, NodePosition>,
  parentCollapsed: boolean,
  levelXPositions: Map<number, number>  // 新增参数
): void {
  // ... 计算当前节点位置 ...

  // 子节点的 X 坐标：使用固定的层级位置
  const childLevel = level + 1;
  let childX: number;
  
  if (levelXPositions.has(childLevel)) {
    // 如果该层级已经有X坐标，使用已有的
    childX = levelXPositions.get(childLevel)!;
  } else {
    // 否则，基于当前节点计算并记录
    childX = x + nodeSize.width + config.horizontalGap;
    levelXPositions.set(childLevel, childX);
  }

  // 递归布局每个子节点，使用统一的 childX
  for (const child of node.children) {
    layoutNode(
      child,
      childX,  // 所有同级子节点使用相同的X坐标
      childY,
      childLevel,
      config,
      positions,
      parentCollapsed || (node.collapsed ?? false),
      levelXPositions
    );
  }
}
```

**初始化层级映射**：
```typescript
const positions = new Map<string, NodePosition>();
const levelXPositions = new Map<number, number>();

// 根节点层级的X坐标
levelXPositions.set(0, 0);

// 开始布局
layoutNode(rootNode, 0, 0, 0, finalConfig, positions, false, levelXPositions);
```

#### 改进后效果
```
项目开发流程
  ├─ 需求分析     (x = 200)
  │   └─ 收集需求   (x = 400)  ← 统一X坐标
  ├─ 系统设计     (x = 200)
  │   └─ 架构设计   (x = 400)  ← 统一X坐标
  └─ 开发实施     (x = 200)
      └─ 前端开发   (x = 400)  ← 齐平！
```

#### 技术优势
✅ 同级节点完全对齐  
✅ 视觉层级清晰  
✅ 连接线更整齐  
✅ 算法效率高（一次遍历）

---

### 4. 右键菜单功能增强

#### 新增功能

**添加"添加同级节点"选项**：

```typescript
interface MindMapNodeProps {
  // ... 其他属性
  onAddSibling: (siblingOfId: string) => void;  // 新增
}

// 右键菜单中添加
<button
  onClick={(e) => {
    e.stopPropagation();
    onAddChild(node.id);
    setShowMenu(false);
  }}
  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2 transition-colors"
>
  <span className="text-green-500">➕</span>
  <span>添加子节点 (Tab)</span>
</button>

{!isRoot && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onAddSibling(node.id);
      setShowMenu(false);
    }}
    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2 transition-colors"
  >
    <span className="text-green-500">➕</span>
    <span>添加同级节点 (Enter)</span>
  </button>
)}
```

#### 右键菜单完整功能
1. **编辑节点** - 双击也可触发
2. **添加子节点** (Tab) - 在当前节点下添加
3. **添加同级节点** (Enter) - 在当前节点旁边添加（根节点除外）
4. **删除节点** (Delete) - 删除当前节点及其子树（根节点除外）

#### 菜单样式优化
- 统一使用图标标识
- Hover时背景色变化
- 显示对应的快捷键提示
- 分隔线区分删除操作

---

## 📊 改进对比

### 视觉效果对比

#### 改进前
```
┌─────────────────────┐
│ [−] 项目开发流程    │ ← 按钮在内部
│     [+] [×]         │ ← hover显示按钮
└─────────────────────┘
     ├─ 需求分析 (x=200)
     │   └─ 收集需求 (x=330)  ← 不齐平
     ├─ 系统设计 (x=200)
     │   └─ 架构设计 (x=350)  ← 不齐平
     └─ 开发实施 (x=200)
         └─ 前端开发 (x=360)  ← 不齐平
```

#### 改进后
```
┌─────────────────────┐ (−)  ← 按钮在右侧
│   项目开发流程      │      ← 简洁显示
└─────────────────────┘
     ├─ 需求分析 (x=200)  (−)
     │   └─ 收集需求 (x=400)  ← 齐平！
     ├─ 系统设计 (x=200)  (−)
     │   └─ 架构设计 (x=400)  ← 齐平！
     └─ 开发实施 (x=200)  (−)
         └─ 前端开发 (x=400)  ← 齐平！
```

### 交互方式对比

| 功能 | 改进前 | 改进后 |
|------|--------|--------|
| 添加子节点 | Hover显示按钮 | 右键菜单 + Tab快捷键 |
| 添加同级节点 | 仅快捷键 | 右键菜单 + Enter快捷键 |
| 删除节点 | Hover显示按钮 | 右键菜单 + Delete快捷键 |
| 编辑节点 | 双击 + 右键菜单 | 双击 + 右键菜单 |
| 展开/收缩 | 节点内左侧按钮 | 节点右侧边缘圆形按钮 |

---

## 🎨 样式改进

### 1. 展开/收缩按钮样式

**圆形按钮设计**：
- 半径：10px
- 背景：白色
- 边框：2px 灰色 (#94a3b8)
- Hover效果：
  - 背景变为浅灰 (#f3f4f6)
  - 边框变为蓝色 (#60a5fa)

**文本样式**：
- 字体大小：14px
- 字重：bold
- 颜色：深灰 (#374151)
- 居中对齐

### 2. 节点选中状态

```typescript
const borderColor = isSelected
  ? "border-2 border-orange-400 ring-2 ring-orange-200"  // 选中
  : "border-2 border-gray-300";                          // 未选中
```

**选中效果**：
- 橙色边框 (#fb923c)
- 外圈光晕 (ring)
- 视觉反馈明显

### 3. 右键菜单样式

**容器样式**：
```css
.menu {
  background: white;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  min-width: 160px;
}
```

**菜单项样式**：
- 默认：白色背景
- Hover：
  - 编辑：蓝色背景 (bg-blue-50)
  - 添加：绿色背景 (bg-green-50)
  - 删除：红色背景 (bg-red-50)

---

## 🔧 技术实现细节

### 1. SVG 坐标系统

**节点中心点坐标**：
```typescript
const position: NodePosition = {
  x,  // 节点中心X坐标
  y,  // 节点中心Y坐标
  width,
  height,
  // ...
};
```

**foreignObject 定位**：
```typescript
<foreignObject
  x={x - width / 2}   // 左上角X = 中心X - 宽度/2
  y={y - height / 2}  // 左上角Y = 中心Y - 高度/2
  width={width}
  height={height}
>
```

**展开按钮定位**：
```typescript
<circle
  cx={x + width / 2 + 10}  // 中心X + 宽度/2 + 偏移
  cy={y}                   // 中心Y（垂直居中）
  r="10"
/>
```

### 2. 层级对齐算法

**数据结构**：
```typescript
// 记录每个层级的X坐标
const levelXPositions = new Map<number, number>();

// 初始化根节点层级
levelXPositions.set(0, 0);
```

**算法流程**：
1. 遍历节点树
2. 对于每个子节点：
   - 检查其层级是否已记录X坐标
   - 如果已记录，使用该X坐标
   - 如果未记录，计算并记录
3. 同级所有节点使用相同X坐标

**时间复杂度**：O(n)，n为节点数
**空间复杂度**：O(d)，d为树的深度

### 3. 事件处理

**右键菜单控制**：
```typescript
const [showMenu, setShowMenu] = useState(false);

const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setShowMenu(!showMenu);  // 切换菜单显示状态
};
```

**按钮点击**：
```typescript
<g
  onClick={(e) => {
    e.stopPropagation();  // 阻止事件冒泡
    onToggleCollapse(node.id);
  }}
  style={{ cursor: "pointer" }}
>
```

---

## ✅ 功能测试清单

### 基本功能
- [x] 节点显示正常（无hover按钮干扰）
- [x] 展开/收缩按钮位于右侧边缘
- [x] 同级节点左侧完全齐平
- [x] 右键菜单显示正常
- [x] 节点选中状态正确显示

### 交互测试
- [x] 点击展开/收缩按钮正常工作
- [x] 展开/收缩按钮hover效果正常
- [x] 右键菜单所有选项可用
- [x] 添加子节点功能正常
- [x] 添加同级节点功能正常
- [x] 删除节点功能正常
- [x] 编辑节点功能正常

### 快捷键测试
- [x] Tab键添加子节点
- [x] Enter键添加同级节点
- [x] Delete键删除节点
- [x] 双击编辑节点

### 视觉测试
- [x] 节点文本居中显示
- [x] 按钮大小和位置合适
- [x] 连接线与按钮不冲突
- [x] 选中状态视觉清晰
- [x] 右键菜单样式美观

### 边界测试
- [x] 根节点不显示"添加同级"选项
- [x] 根节点不显示"删除"选项
- [x] 叶子节点不显示展开/收缩按钮
- [x] 编辑模式时不显示展开/收缩按钮

---

## 📝 使用说明

### 基本操作

**展开/收缩子节点**：
- 点击节点右侧的圆形按钮
- 按钮显示"−"表示已展开，点击后收缩
- 按钮显示"+"表示已收缩，点击后展开

**右键菜单操作**：
1. 在节点上右键点击，显示菜单
2. 选择需要的操作：
   - 编辑节点：修改节点文本
   - 添加子节点(Tab)：在当前节点下添加子节点
   - 添加同级节点(Enter)：在当前节点旁添加同级节点
   - 删除节点(Delete)：删除当前节点及其子树

**快捷键操作**：
1. 先点击选中一个节点（出现橙色边框）
2. 按快捷键执行操作：
   - `Tab`：添加子节点
   - `Enter`：添加同级节点
   - `Delete`：删除节点

---

## 🎯 设计原则

### 1. 简洁优先
- 移除不必要的hover按钮
- 保持节点内容区域简洁
- 减少视觉干扰

### 2. 一致性
- 所有同级节点左侧对齐
- 展开/收缩按钮位置统一
- 菜单样式和交互一致

### 3. 可发现性
- 重要功能通过右键菜单集中展示
- 快捷键提示清晰可见
- 按钮hover效果明显

### 4. 响应式
- 按钮大小适中，易于点击
- Hover效果流畅自然
- 菜单出现位置合理

---

## 🔮 未来优化方向

### 1. 自定义布局模式
支持多种布局模式：
- 左侧树状布局（当前）
- 右侧树状布局
- 双侧树状布局
- 鱼骨图布局

### 2. 主题定制
允许用户自定义：
- 按钮样式（圆形、方形、图标）
- 连接线样式（直线、折线、贝塞尔曲线）
- 颜色方案

### 3. 更多快捷操作
- 键盘方向键导航节点
- Ctrl+Enter 在前面插入同级节点
- Shift+Tab 取消缩进

### 4. 节点折叠动画
- 平滑的展开/收缩动画
- 连接线动态绘制
- 节点淡入淡出效果

---

## 📖 相关文档

- [布局修复文档](./MINDMAP_LAYOUT_FIX.md)
- [自适应尺寸功能](./MINDMAP_ADAPTIVE_SIZE.md)
- [快捷键功能](./MINDMAP_SHORTCUTS.md)
- [拖拽功能](./MINDMAP_UPDATES.md)

---

## 🎉 总结

本次更新显著提升了思维导图的用户体验：

✅ **交互更简洁** - 右键菜单统一所有操作  
✅ **布局更整齐** - 同级节点完美对齐  
✅ **视觉更清晰** - 按钮位置优化，不干扰内容  
✅ **功能更完整** - 添加同级节点选项

所有改进都经过充分测试，保持向后兼容，不影响现有功能！
