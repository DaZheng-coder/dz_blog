# 思维导图布局修复文档

## 📅 更新日期
2026-02-12

## 🐛 问题描述

在实现节点自适应宽高后，出现了以下问题：

1. **文本换行不美观**
   - 换行后的文本左对齐，视觉上不协调
   - 文本行高不一致
   - 多行文本显示拥挤

2. **节点内容布局问题**
   - 节点内容居中对齐不合理
   - 展开/收缩按钮与文本对齐有问题
   - 编辑模式下输入框样式不统一

3. **文本宽度估算不准确**
   - 部分文本出现不必要的换行
   - 节点宽度计算偏小

---

## ✅ 修复方案

### 1. **优化节点内容布局**

**修改前**：
```tsx
<div className="flex items-center justify-center ...">
  <button>+/-</button>
  <span className="flex-1 ...">文本</span>
</div>
```

**修改后**：
```tsx
<div className="flex items-start gap-2 w-full">
  {/* 按钮固定在顶部 */}
  <button className="mt-0.5 ...">+/-</button>
  
  {/* 文本容器居中 */}
  <div className="flex-1 flex items-center justify-center">
    <span className="text-center" style={{ lineHeight: '22px' }}>
      文本
    </span>
  </div>
</div>
```

**改进点**：
- ✅ 外层容器使用 `items-start` 顶部对齐
- ✅ 按钮添加 `mt-0.5` 微调位置
- ✅ 文本包裹在居中容器中
- ✅ 文本设置为居中对齐 `text-center`
- ✅ 统一行高为 22px

### 2. **改进文本宽度估算**

**修改前**：
```typescript
if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(char)) {
  width += fontSize * 1.0; // 中文
} else {
  width += fontSize * 0.6; // 英文
}
```

**修改后**：
```typescript
if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(char)) {
  width += fontSize * 1.1; // 中文（稍微增加）
} else {
  width += fontSize * 0.65; // 英文（稍微增加）
}
```

**改进点**：
- ✅ 中文字符宽度从 1.0 增加到 1.1
- ✅ 英文字符宽度从 0.6 增加到 0.65
- ✅ 减少不必要的换行

### 3. **优化节点尺寸计算**

**新增逻辑**：
```typescript
// 如果接近最大宽度，就直接使用最大宽度
if (actualWidth > config.maxNodeWidth * 0.95) {
  actualWidth = config.maxNodeWidth;
}

// 确保至少有一行
const lines = Math.max(1, Math.ceil(textWidth / maxTextWidth));
```

**改进点**：
- ✅ 避免略微超出最大宽度导致不必要的换行
- ✅ 确保行数至少为 1

### 4. **调整默认配置参数**

**修改前**：
```typescript
const DEFAULT_CONFIG = {
  minNodeWidth: 80,
  maxNodeWidth: 240,
  minNodeHeight: 36,
  maxNodeHeight: 120,
  paddingX: 12,
  paddingY: 8,
  fontSize: 14,
  lineHeight: 20,
};
```

**修改后**：
```typescript
const DEFAULT_CONFIG = {
  minNodeWidth: 100,    // 增加最小宽度
  maxNodeWidth: 220,    // 减少最大宽度
  minNodeHeight: 40,    // 增加最小高度
  maxNodeHeight: 100,   // 减少最大高度
  paddingX: 16,         // 增加水平内边距
  paddingY: 10,         // 增加垂直内边距
  fontSize: 14,         // 保持不变
  lineHeight: 22,       // 增加行高
};
```

**改进点**：
- ✅ 更大的最小宽度，避免节点过窄
- ✅ 更合理的最大宽度，避免节点过宽
- ✅ 更大的内边距，文本不会太挤
- ✅ 更大的行高，多行文本更易读

### 5. **统一编辑模式样式**

**添加样式**：
```tsx
<input
  className="... text-sm text-center"
  // ...
/>
```

**改进点**：
- ✅ 编辑模式下文本居中
- ✅ 字体大小统一为 text-sm
- ✅ 与显示模式保持一致

---

## 📊 效果对比

### 修复前的问题

```
┌──────────────────┐
│ − 测试与优化    │  ← 左对齐，不美观
│    新节点        │  ← 换行太挤
│    新节点        │
│    新节点        │
└──────────────────┘

问题：
❌ 文本左对齐，视觉不协调
❌ 行间距太小，拥挤
❌ 展开按钮与文本对齐不佳
```

### 修复后的效果

```
┌──────────────────┐
│ −   测试与优化   │  ← 居中对齐，美观
│     新节点       │  ← 行间距合理
│     新节点       │
│     新节点       │
└──────────────────┘

改进：
✅ 文本居中对齐，视觉协调
✅ 行间距增加，易读性好
✅ 展开按钮位置合理
```

---

## 🎨 视觉改进

### 1. 文本对齐方式
- **修复前**：默认左对齐，换行后视觉混乱
- **修复后**：居中对齐，换行后视觉统一

### 2. 节点尺寸
- **修复前**：最小宽度 80px，节点可能过窄
- **修复后**：最小宽度 100px，更加舒适

### 3. 内边距
- **修复前**：paddingX: 12px, paddingY: 8px，略显拥挤
- **修复后**：paddingX: 16px, paddingY: 10px，更加宽松

### 4. 行高
- **修复前**：lineHeight: 20px，多行文本紧凑
- **修复后**：lineHeight: 22px，多行文本舒适

---

## 🔧 技术细节

### 布局逻辑优化

**外层容器**：
```tsx
<div className="h-full w-full flex items-center px-3 py-2">
  {/* 内容 */}
</div>
```
- 使用 `items-center` 垂直居中
- 移除 `justify-center`，让内部内容自行控制水平对齐

**内容容器**：
```tsx
<div className="flex items-start gap-2 w-full">
  {/* 按钮 */}
  {/* 文本容器 */}
</div>
```
- 使用 `items-start` 顶部对齐
- 按钮和文本容器在顶部对齐
- gap-2 提供合理间距

**文本容器**：
```tsx
<div className="flex-1 flex items-center justify-center">
  <span className="text-center" style={{ lineHeight: '22px' }}>
    {node.text}
  </span>
</div>
```
- flex-1 占据剩余空间
- items-center 和 justify-center 实现完全居中
- text-center 确保多行文本居中对齐
- lineHeight 与配置保持一致

### CSS 样式优化

**文本样式**：
```css
.text-center {
  text-align: center;
}

break-words {
  word-break: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}
```

**行高控制**：
```css
line-height: 22px; /* 与 config.lineHeight 一致 */
```

---

## ✅ 验证结果

### 功能测试
- [x] 短文本节点显示正常
- [x] 长文本节点换行美观
- [x] 展开/收缩按钮位置正确
- [x] 连接线位置准确
- [x] 编辑模式样式统一
- [x] 快捷键操作正常
- [x] 拖拽功能正常

### 视觉测试
- [x] 文本居中对齐
- [x] 多行文本行间距合理
- [x] 节点内边距舒适
- [x] 整体布局协调

### 性能测试
- [x] 布局计算速度正常
- [x] 渲染流畅无卡顿
- [x] 大量节点时性能良好

---

## 📝 配置建议

### 推荐配置（当前默认值）

```typescript
const RECOMMENDED_CONFIG = {
  minNodeWidth: 100,     // 最小宽度
  maxNodeWidth: 220,     // 最大宽度
  minNodeHeight: 40,     // 最小高度
  maxNodeHeight: 100,    // 最大高度
  paddingX: 16,          // 水平内边距
  paddingY: 10,          // 垂直内边距
  fontSize: 14,          // 字体大小
  lineHeight: 22,        // 行高
};
```

### 紧凑布局配置

```typescript
const COMPACT_CONFIG = {
  minNodeWidth: 80,
  maxNodeWidth: 200,
  minNodeHeight: 36,
  maxNodeHeight: 80,
  paddingX: 12,
  paddingY: 8,
  fontSize: 12,
  lineHeight: 18,
};
```

### 宽松布局配置

```typescript
const SPACIOUS_CONFIG = {
  minNodeWidth: 120,
  maxNodeWidth: 280,
  minNodeHeight: 48,
  maxNodeHeight: 120,
  paddingX: 20,
  paddingY: 12,
  fontSize: 16,
  lineHeight: 24,
};
```

---

## 🎓 最佳实践

### 1. 文本长度建议
- **最佳长度**：4-12 个中文字符（或 8-24 个英文字符）
- **推荐最大长度**：20 个中文字符
- **超长文本**：建议拆分为多个节点

### 2. 换行策略
- **单行文本**：尽量保持在最大宽度内
- **两行文本**：最常见，视觉效果最好
- **三行及以上**：考虑精简文本或拆分节点

### 3. 节点层级
- **根节点**：简短明确（3-8 个字）
- **一级节点**：清晰具体（4-10 个字）
- **二级及以下**：详细说明（可以稍长）

---

## 🔮 未来优化方向

### 1. 自适应字体大小
根据节点层级自动调整字体大小：
```typescript
const fontSize = isRoot ? 16 : level === 1 ? 14 : 12;
```

### 2. 自定义文本对齐
允许用户选择文本对齐方式：
- 居中对齐（当前默认）
- 左对齐
- 右对齐

### 3. 动态行高
根据字体大小自动计算行高：
```typescript
const lineHeight = fontSize * 1.5;
```

### 4. 文本溢出处理
超过最大高度时显示省略号：
```css
.text-overflow-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}
```

---

## 📖 相关文档

- [节点自适应宽高功能](./MINDMAP_ADAPTIVE_SIZE.md)
- [快捷键功能文档](./MINDMAP_SHORTCUTS.md)
- [拖拽功能更新](./MINDMAP_UPDATES.md)

---

## 🎉 总结

通过本次修复，思维导图的视觉效果和布局质量得到了显著提升：

✅ **文本显示**：居中对齐，换行美观，行间距合理  
✅ **节点布局**：内边距舒适，尺寸适中，视觉协调  
✅ **连接线**：位置准确，连接正确  
✅ **整体效果**：专业美观，易读性强  

所有修改都经过充分测试，保持向后兼容，不影响现有功能！
