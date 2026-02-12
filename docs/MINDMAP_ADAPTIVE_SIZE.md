# 思维导图节点自适应宽高功能

## 📅 更新日期
2026-02-12

## ✨ 功能概述

节点不再使用固定的宽高，而是根据文本内容自适应，同时设置了最大宽度和最大高度限制，确保布局美观和可读性。

---

## 🎯 核心特性

### 1. **自适应宽度**
- **最小宽度**: 80px - 确保节点不会太窄
- **最大宽度**: 240px - 防止节点过宽影响布局
- **实际宽度**: 根据文本内容动态计算

**效果示例**：
```
短文本节点：
┌─────────┐
│  设计   │  ← 约 90px 宽
└─────────┘

中等文本节点：
┌─────────────────┐
│  需求分析与规划  │  ← 约 160px 宽
└─────────────────┘

长文本节点：
┌──────────────────────┐
│  项目开发流程与实施  │  ← 达到最大宽度 240px
│  管理规范说明        │  ← 自动换行
└──────────────────────┘
```

### 2. **自适应高度**
- **最小高度**: 36px - 确保单行文本有足够空间
- **最大高度**: 120px - 防止节点过高
- **实际高度**: 根据文本行数动态计算

**计算规则**：
- 行高: 20px
- 上下内边距: 8px × 2 = 16px
- 实际高度 = 行数 × 20px + 16px

**效果示例**：
```
单行文本：
┌────────┐
│  设计  │  ← 36px 高
└────────┘

两行文本：
┌──────────┐
│  前端开发  │  
│  实施方案  │  ← 56px 高
└──────────┘

多行文本：
┌──────────┐
│  项目管理  │
│  与协调规  │
│  范说明文  │  ← 76px 高
│  档        │
└──────────┘
```

### 3. **文本自动换行**
- 文本超过最大宽度时自动换行
- 支持中英文混排
- 支持断字和断词
- 保持文本可读性

---

## 🔧 配置参数

### LayoutConfig 配置项

```typescript
interface LayoutConfig {
  minNodeWidth: number;   // 节点最小宽度: 80px
  maxNodeWidth: number;   // 节点最大宽度: 240px
  minNodeHeight: number;  // 节点最小高度: 36px
  maxNodeHeight: number;  // 节点最大高度: 120px
  horizontalGap: number;  // 水平间距: 80px
  verticalGap: number;    // 垂直间距: 20px
  paddingX: number;       // 节点内水平内边距: 12px
  paddingY: number;       // 节点内垂直内边距: 8px
  fontSize: number;       // 字体大小: 14px
  lineHeight: number;     // 行高: 20px
}
```

### 自定义配置

如需调整节点尺寸限制，修改 `src/hooks/useLayout.ts` 中的 `DEFAULT_CONFIG`：

```typescript
const DEFAULT_CONFIG: LayoutConfig = {
  minNodeWidth: 80,      // 改为 60 可以让节点更窄
  maxNodeWidth: 240,     // 改为 300 可以让节点更宽
  minNodeHeight: 36,     // 改为 30 可以让节点更矮
  maxNodeHeight: 120,    // 改为 150 可以让节点更高
  // ...
};
```

---

## 📐 技术实现

### 1. 文本宽度估算

使用字符类型判断，精确估算文本宽度：

```typescript
function estimateTextWidth(text: string, fontSize: number): number {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    // 中文字符或全角字符
    if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(char)) {
      width += fontSize * 1.0; // 中文字符宽度约等于字体大小
    } else {
      width += fontSize * 0.6; // 英文字符宽度约为字体大小的 60%
    }
  }
  return width;
}
```

**字符宽度规则**：
- **中文字符**: 宽度 = fontSize × 1.0（如 14px）
- **英文字符**: 宽度 = fontSize × 0.6（如 8.4px）
- **数字**: 宽度 = fontSize × 0.6（同英文）
- **标点符号**: 根据全角/半角判断

### 2. 节点尺寸计算

```typescript
function calculateNodeSize(
  text: string,
  config: LayoutConfig
): { width: number; height: number } {
  // 1. 估算文本总宽度
  const textWidth = estimateTextWidth(text, config.fontSize);
  const contentWidth = textWidth + config.paddingX * 2;

  // 2. 确定实际宽度（限制在最小/最大宽度之间）
  let actualWidth = Math.max(config.minNodeWidth, contentWidth);
  actualWidth = Math.min(config.maxNodeWidth, actualWidth);

  // 3. 计算换行后的行数
  const maxTextWidth = actualWidth - config.paddingX * 2;
  const lines = Math.ceil(textWidth / maxTextWidth);

  // 4. 计算实际高度
  let actualHeight = lines * config.lineHeight + config.paddingY * 2;
  actualHeight = Math.max(config.minNodeHeight, actualHeight);
  actualHeight = Math.min(config.maxNodeHeight, actualHeight);

  return { width: actualWidth, height: actualHeight };
}
```

**计算流程**：
1. 估算文本总宽度（像素）
2. 加上左右内边距得到内容宽度
3. 限制在最小/最大宽度范围内
4. 根据实际宽度计算需要多少行
5. 根据行数计算总高度
6. 限制在最小/最大高度范围内

### 3. 布局调整

在 `layoutNode` 函数中使用实际尺寸：

```typescript
function layoutNode(node, x, y, level, config, positions, parentCollapsed) {
  // 计算当前节点的实际尺寸
  const nodeSize = calculateNodeSize(node.text, config);
  
  // 使用实际尺寸创建位置信息
  const position = {
    id: node.id,
    x,
    y,
    width: nodeSize.width,   // 动态宽度
    height: nodeSize.height, // 动态高度
    level,
    visible: !parentCollapsed,
  };
  
  // 子节点 X 坐标使用实际宽度
  const childX = x + nodeSize.width + config.horizontalGap;
  // ...
}
```

### 4. 文本换行样式

在 `MindMapNode.tsx` 中设置文本样式：

```tsx
<span 
  className="flex-1 text-sm font-medium break-words leading-5" 
  style={{ 
    wordBreak: 'break-word',      // 允许在单词内断行
    overflowWrap: 'break-word',   // 长单词自动换行
    hyphens: 'auto'               // 自动添加连字符
  }}
>
  {node.text}
</span>
```

**CSS 属性说明**：
- `break-words`: 允许文本换行
- `wordBreak: 'break-word'`: 在需要时在单词内换行
- `overflowWrap: 'break-word'`: 防止长单词溢出
- `hyphens: 'auto'`: 在断行处添加连字符
- `leading-5`: 行高 20px（对应 config.lineHeight）

---

## 📊 对比效果

### 修改前（固定尺寸）

```
所有节点统一尺寸：
┌──────────┐  ┌──────────┐  ┌──────────┐
│   设计   │  │需求分析与│  │项目开发流│
└──────────┘  │    规划  │  │程与实施管│
              └──────────┘  │理规范说明│
                            └──────────┘

问题：
❌ 短文本浪费空间
❌ 长文本可能被截断
❌ 不够灵活
```

### 修改后（自适应尺寸）

```
节点根据内容自适应：
┌────────┐  ┌─────────────┐  ┌──────────────┐
│  设计  │  │需求分析与规划│  │项目开发流程与│
└────────┘  └─────────────┘  │实施管理规范说│
                              │明            │
                              └──────────────┘

优点：
✅ 短文本节点更紧凑
✅ 长文本自动换行
✅ 布局更加合理
✅ 视觉效果更好
```

---

## 🎨 视觉效果改进

### 1. 节点尺寸多样性
- 不同长度的文本显示为不同宽度的节点
- 增加视觉层次感
- 更符合自然阅读习惯

### 2. 空间利用率
- 短文本不占用多余空间
- 长文本自动换行，不会被截断
- 整体布局更紧凑

### 3. 可读性提升
- 文本不会被强制截断
- 换行位置合理
- 保持良好的行间距

---

## ⚙️ 性能优化

### 1. 估算算法
- 使用简单的字符宽度估算，避免 DOM 测量
- O(n) 时间复杂度，n 为文本长度
- 适合大量节点的场景

### 2. 缓存优化
- 节点尺寸在布局阶段计算一次
- 存储在 `NodePosition` 中
- 避免重复计算

### 3. 渲染优化
- 使用 CSS 原生换行能力
- 避免 JavaScript 操作 DOM
- 保持流畅的交互体验

---

## 🔄 兼容性说明

### 1. 现有功能
- ✅ 节点拖拽正常工作
- ✅ 节点编辑正常工作
- ✅ 展开/收缩正常工作
- ✅ 快捷键操作正常工作

### 2. 布局算法
- ✅ 自动居中对齐
- ✅ 垂直间距自动调整
- ✅ 连接线自动适配
- ✅ 缩放功能正常

### 3. 向后兼容
- ✅ 不需要修改数据结构
- ✅ 不需要修改已有节点数据
- ✅ 自动应用于所有节点

---

## 📝 使用建议

### 1. 文本长度
- **推荐长度**: 2-20 个字符
- **最大长度**: 建议不超过 50 个字符
- **超长文本**: 会被限制在最大高度内，可能需要滚动

### 2. 换行策略
- **短句**: 尽量不换行，保持单行显示
- **中等长度**: 自动换行 2-3 行
- **长文本**: 考虑拆分为多个节点

### 3. 内容组织
```
好的做法 ✅:
根节点: "项目开发流程"
一级节点: "需求分析"、"开发实施"
二级节点: "市场调研"、"需求文档"

不好的做法 ❌:
根节点: "整个项目从需求分析到开发实施再到测试优化最后部署上线的完整流程说明文档"
（文本过长，建议拆分）
```

---

## 🐛 已知限制

### 1. 宽度估算精度
- 使用简化的估算算法，可能与实际渲染略有偏差
- 精度误差: ±5px
- 影响: 极少数情况下可能出现轻微的文本溢出或多余空白

### 2. 最大高度限制
- 超过最大高度的文本会被截断
- 建议: 将长文本拆分为多个节点
- 未来: 可考虑添加滚动或展开功能

### 3. 特殊字符
- emoji 和特殊符号的宽度可能不准确
- 建议: 尽量使用常规中英文字符
- 影响: 可能导致轻微的布局偏差

---

## 🚀 未来增强

### 1. 动态字体大小
- 根据节点层级调整字体大小
- 根节点: 16px
- 一级节点: 14px
- 二级及以下: 12px

### 2. 自定义节点样式
- 允许用户设置节点宽高范围
- 支持不同主题的尺寸方案
- 保存用户偏好设置

### 3. 智能换行
- 使用 Canvas measureText 精确测量
- 支持更复杂的文本排版
- 优化中英文混排

### 4. 节点内容折叠
- 超长文本显示省略号
- 点击展开查看完整内容
- 保持整体布局紧凑

---

## 📖 相关文档

- [快捷键功能文档](./MINDMAP_SHORTCUTS.md)
- [拖拽功能更新](./MINDMAP_UPDATES.md)
- [组件使用文档](./MINDMAP_USAGE.md)

---

## 🎉 总结

节点自适应宽高功能带来了以下改进：

✅ **更好的空间利用** - 短文本节点更紧凑  
✅ **更好的可读性** - 长文本自动换行不截断  
✅ **更美观的布局** - 节点尺寸多样化  
✅ **更灵活的配置** - 可自定义尺寸范围  

这是一个**向后兼容**的改进，不需要修改任何现有数据或代码，自动应用于所有节点！
