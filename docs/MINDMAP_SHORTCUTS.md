# 思维导图快捷键功能文档

## 📅 更新日期
2026-02-12

## ⌨️ 快捷键列表

### 1. Enter - 添加同级节点

**功能描述**：
- 在当前选中节点的下方添加一个同级节点
- 新节点默认命名为"新节点"
- 自动插入到当前节点的后面

**使用步骤**：
1. 单击任意节点进行选中（会显示橙色边框）
2. 按下 `Enter` 键
3. 新节点立即创建在当前节点下方

**限制条件**：
- ❌ 根节点不能添加同级节点（根节点是唯一的）
- ✅ 所有其他节点都可以添加同级节点

**示例**：
```
选中前：
  父节点
    ├─ 节点A  ← 选中这个
    └─ 节点B

按下 Enter 后：
  父节点
    ├─ 节点A
    ├─ 新节点  ← 新增
    └─ 节点B
```

---

### 2. Tab - 添加子节点

**功能描述**：
- 在当前选中节点下添加一个子节点
- 新节点默认命名为"新节点"
- 自动展开父节点（如果已收缩）

**使用步骤**：
1. 单击任意节点进行选中
2. 按下 `Tab` 键
3. 新子节点立即创建

**适用场景**：
- ✅ 所有节点（包括根节点）都可以添加子节点
- ✅ 已收缩的节点会自动展开

**示例**：
```
选中前：
  节点A  ← 选中这个
    ├─ 子节点1
    └─ 子节点2

按下 Tab 后：
  节点A
    ├─ 子节点1
    ├─ 子节点2
    └─ 新节点  ← 新增
```

---

### 3. Delete / Backspace - 删除节点

**功能描述**：
- 删除当前选中的节点及其所有子节点
- 删除前会弹出确认对话框
- 删除后自动取消选中状态

**使用步骤**：
1. 单击要删除的节点进行选中
2. 按下 `Delete` 或 `Backspace` 键
3. 在确认对话框中点击"确定"
4. 节点被删除，布局自动更新

**限制条件**：
- ❌ 根节点不能删除（防止数据丢失）
- ✅ 所有其他节点都可以删除
- ⚠️ 删除带子节点的节点会同时删除所有子节点

**安全机制**：
- 删除前必须确认（防止误操作）
- 根节点受保护（无法删除）

**示例**：
```
删除前：
  父节点
    ├─ 节点A  ← 选中要删除
    │   ├─ 子节点A1
    │   └─ 子节点A2
    └─ 节点B

按 Delete 并确认后：
  父节点
    └─ 节点B
```

---

## 🎯 使用技巧

### 快速建图流程

**方法一：逐层构建**
1. 选中根节点
2. 按 `Tab` 创建一级节点
3. 按 `Enter` 创建更多一级节点
4. 选中一级节点
5. 按 `Tab` 创建二级节点
6. 重复步骤 2-5 完成整个思维导图

**方法二：组合使用**
```
操作序列：
1. 选中"需求分析" → Tab → 创建"市场调研"
2. 保持选中 → Enter → 创建"需求文档"（同级）
3. 保持选中 → Enter → 创建"技术选型"（同级）
4. 选中"技术选型" → Tab → 创建"前端框架"（子节点）
```

### 快速重构

**删除不需要的分支：**
1. 选中要删除的节点
2. Delete → 确认
3. 继续选中下一个 → Delete → 确认

**快速添加多个同级节点：**
1. 选中第一个节点
2. Enter → 双击编辑 → 输入文本 → Enter 保存
3. 新节点被选中 → Enter → 双击编辑 → 输入文本
4. 重复步骤 3 快速添加多个节点

---

## 🔄 快捷键与其他操作的组合

### 与鼠标操作结合

| 鼠标操作 | + 快捷键 | 效果 |
|---------|---------|------|
| 单击选中节点 | Tab | 添加子节点 |
| 单击选中节点 | Enter | 添加同级节点 |
| 单击选中节点 | Delete | 删除节点 |
| 双击节点进入编辑 | Enter | 保存编辑 |
| 双击节点进入编辑 | Esc | 取消编辑 |

### 与右键菜单对比

| 操作 | 快捷键方式 | 右键菜单方式 | 速度对比 |
|------|-----------|------------|---------|
| 添加子节点 | 选中 → Tab (2步) | 右键 → 点击"添加子节点" (2步) | 相同 |
| 添加同级节点 | 选中 → Enter (2步) | ❌ 无此功能 | 快捷键独有 |
| 删除节点 | 选中 → Delete (2步) | 右键 → 点击"删除节点" (2步) | 相同 |

**快捷键优势**：
- ✅ 添加同级节点只能通过快捷键或悬停按钮
- ✅ 连续操作时快捷键更快（无需移动鼠标）
- ✅ 适合键盘操作习惯的用户

---

## 🎨 视觉反馈

### 选中状态
- **橙色边框**：选中的节点显示 3px 橙色实线边框
- **无选中**：默认状态无边框
- **取消选中**：点击空白区域或删除节点后取消选中

### 操作反馈
| 操作 | 视觉反馈 | 时长 |
|------|---------|------|
| 按 Enter 添加同级 | 新节点出现，自动布局更新 | 即时 |
| 按 Tab 添加子节点 | 新节点出现，父节点展开 | 即时 |
| 按 Delete 删除 | 确认对话框 → 节点消失 | 用户确认后 |

---

## 🛡️ 安全机制

### 防止误操作

1. **删除确认**
   - 所有删除操作都需要确认
   - 对话框内容：`确定要删除选中的节点吗？`

2. **根节点保护**
   - 根节点不能删除（Delete 键无效）
   - 根节点不能添加同级节点（Enter 键无效）

3. **编辑模式隔离**
   - 在编辑模式下，快捷键不会触发
   - 防止编辑时意外触发操作

4. **输入框保护**
   - 在输入框中输入时，快捷键不会触发
   - 避免干扰正常输入

---

## 📊 快捷键效率对比

### 创建 10 个节点的时间对比

**传统方式（仅鼠标）：**
1. 悬停节点 → 点击 + 按钮 → 双击新节点 → 输入文本
2. 每个节点约 4 步，总共 40 步

**快捷键方式：**
1. 选中节点 → Tab/Enter → 双击 → 输入文本
2. 每个节点约 3 步，总共 30 步
3. 后续节点只需 Enter → 输入（2 步）

**效率提升：**
- 🚀 减少约 25-40% 的操作步骤
- ⚡ 手指不离键盘，操作更流畅
- 💡 特别适合大量创建节点的场景

---

## 🔧 技术实现

### 键盘事件监听

```typescript
// 全局键盘事件监听
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // 1. 检查是否在编辑模式
    if (editingNodeId) return;
    
    // 2. 检查是否有选中节点
    if (!selectedNodeId) return;
    
    // 3. 防止在输入框中触发
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }
    
    // 4. 处理快捷键
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (selectedNodeId !== rootNode?.id) {
          addSibling(selectedNodeId);
        }
        break;
      // ...
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedNodeId, editingNodeId, rootNode]);
```

### 添加同级节点实现

```typescript
// 查找父节点
function findParentNode(root: MindMapNode, nodeId: string): MindMapNode | null {
  if (root.id === nodeId) return null;
  
  for (const child of root.children) {
    if (child.id === nodeId) return root;
  }
  
  for (const child of root.children) {
    const parent = findParentNode(child, nodeId);
    if (parent) return parent;
  }
  
  return null;
}

// 在指定位置插入节点
function addSiblingNodeInTree(
  root: MindMapNode,
  nodeId: string,
  newNode: MindMapNode
): MindMapNode {
  const parent = findParentNode(root, nodeId);
  if (!parent) return root;
  
  const nodeIndex = parent.children.findIndex(child => child.id === nodeId);
  if (nodeIndex === -1) return root;
  
  // 在当前节点后插入
  const newChildren = [...parent.children];
  newChildren.splice(nodeIndex + 1, 0, newNode);
  parent.children = newChildren;
  
  return updateNodeInTree(root, parent.id, (parentNode) => {
    parentNode.children = newChildren;
  });
}
```

---

## 🎓 最佳实践

### 推荐使用场景

1. **快速建图**
   - 使用 Tab 和 Enter 组合快速构建树结构
   - 适合已有思路，需要快速记录的场景

2. **结构调整**
   - 使用 Delete 快速删除不需要的节点
   - 使用 Enter 快速添加补充节点

3. **大纲编写**
   - 将思维导图作为大纲编辑器
   - Tab 缩进，Enter 换行，类似 Markdown 编辑体验

### 不推荐场景

1. **精确拖拽**
   - 需要调整节点层级关系时，拖拽更直观
   - 快捷键只能在当前位置添加，不适合重组

2. **批量操作**
   - 需要同时操作多个节点时，鼠标选择更方便
   - 快捷键一次只能操作一个选中节点

---

## 🚀 未来增强建议

1. **方向键导航**
   - ↑↓ 选择上下同级节点
   - ←→ 选择父节点/第一个子节点

2. **更多快捷键**
   - `Ctrl + C` / `Ctrl + V` 复制粘贴节点
   - `Ctrl + Z` / `Ctrl + Y` 撤销重做
   - `F2` 重命名节点（进入编辑模式）

3. **自定义快捷键**
   - 允许用户自定义快捷键绑定
   - 支持快捷键配置导入导出

4. **命令面板**
   - `Ctrl + K` 打开命令面板
   - 模糊搜索所有命令
   - 显示对应快捷键

---

## 📖 相关文档

- [组件使用文档](./MINDMAP_USAGE.md)
- [功能更新日志](./MINDMAP_UPDATES.md)
- [功能演示指南](./MINDMAP_FEATURE_DEMO.md)

---

## 💡 常见问题

**Q: 为什么按快捷键没有反应？**
A: 请检查：
1. 是否已选中节点（节点有橙色边框）
2. 是否在编辑模式（双击节点后）
3. 是否在输入框中（焦点在输入框时快捷键不生效）

**Q: 如何取消选中节点？**
A: 点击画布空白区域即可取消选中。

**Q: 根节点按 Enter 为什么没反应？**
A: 根节点是唯一的，不能添加同级节点。可以使用 Tab 添加子节点。

**Q: Delete 键和 Backspace 有区别吗？**
A: 没有区别，两者效果相同，都是删除选中节点。

**Q: 能同时选中多个节点吗？**
A: 当前版本不支持多选。每次只能选中一个节点进行操作。

---

## 🎉 总结

快捷键功能大幅提升了思维导图的创建效率：

- ⚡ **Enter** 添加同级节点 - 横向扩展
- 🌳 **Tab** 添加子节点 - 纵向深入
- 🗑️ **Delete** 删除节点 - 快速清理

配合鼠标拖拽、双击编辑等功能，形成完整的交互体系！
