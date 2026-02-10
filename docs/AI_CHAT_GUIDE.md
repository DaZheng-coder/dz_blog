# AI 角色扮演对话功能使用指南

## 功能概述

本项目集成了阿里云百炼的 qwen-turbo 模型，实现了 AI 角色扮演对话功能。用户可以选择不同性格的 AI 角色进行互动对话。

## 功能特性

### 1. 多角色支持

系统预置了 6 个不同性格的 AI 角色：

- **🤖 智能助手** - 友好、专业的 AI 助手
- **👨‍🏫 知识导师** - 耐心细致的老师，擅长讲解
- **🎨 诗人** - 富有文学气息，语言优美
- **🔬 科学家** - 严谨理性，注重逻辑
- **👨‍🍳 大厨** - 热情的美食专家
- **🎭 喜剧演员** - 幽默风趣，活跃气氛

### 2. 实时对话

- 支持实时发送和接收消息
- 流畅的对话体验
- 消息历史记录保存

### 3. 美观的 UI 设计

- 现代化的渐变色设计
- 响应式布局，适配各种设备
- 流畅的动画效果
- 深色模式支持

### 4. 便捷的交互

- 支持 Enter 键快速发送
- Shift + Enter 换行
- 自动滚动到最新消息
- 清空对话历史功能

## 使用步骤

### 1. 配置 API Key

首先需要配置阿里云百炼的 API Key，详细步骤请参考 [ENV_SETUP.md](../ENV_SETUP.md)

### 2. 启动应用

```bash
npm run dev
```

### 3. 进入聊天页面

- 打开浏览器访问 http://localhost:5173/
- 点击首页的"立即体验"按钮

### 4. 选择角色

在聊天页面顶部可以看到角色选择区域：
- 点击不同的角色卡片即可切换
- 每个角色都有独特的性格和对话风格
- 切换角色会清空当前对话历史

### 5. 开始对话

- 在底部输入框中输入您的消息
- 按 Enter 键或点击"发送"按钮
- AI 会根据角色设定回复您的消息

### 6. 管理对话

- **隐藏/显示角色选择**: 点击右上角"选择角色"按钮
- **清空对话**: 点击右上角"清空对话"按钮

## 技术实现

### 核心组件

#### 1. ChatPage (主页面)

位置: `src/pages/ChatPage.tsx`

功能:
- 管理对话状态
- 处理角色切换
- 协调各子组件

#### 2. MessageList (消息列表)

位置: `src/components/MessageList.tsx`

功能:
- 显示对话历史
- 自动滚动
- 加载动画

#### 3. MessageInput (消息输入)

位置: `src/components/MessageInput.tsx`

功能:
- 文本输入
- 快捷键支持
- 发送状态管理

#### 4. RoleSelector (角色选择)

位置: `src/components/RoleSelector.tsx`

功能:
- 展示可用角色
- 角色切换
- 角色详情显示

### API 服务

位置: `src/services/alibabaService.ts`

核心函数:

```typescript
// 发送普通消息
sendChatMessage(messages, characterPrompt)

// 发送流式消息（实时响应）
sendChatMessageStream(messages, characterPrompt, onChunk)
```

### 类型定义

位置: `src/types/chat.ts`

主要类型:
- `TMessage` - 消息类型
- `TCharacterConfig` - 角色配置
- `TStreamEvent` - 流式响应事件

## 自定义角色

您可以在 `src/pages/ChatPage.tsx` 中自定义角色配置：

```typescript
const CUSTOM_CHARACTER: TCharacterConfig = {
  id: "custom",
  name: "自定义角色",
  description: "角色描述",
  avatar: "😊",
  systemPrompt: "你是一个...（定义角色的性格和行为）",
};
```

将自定义角色添加到 `DEFAULT_CHARACTERS` 数组即可。

## 高级功能

### 1. 流式响应

如需实现打字机效果，可以使用流式 API:

```typescript
import { sendChatMessageStream } from "../services/alibabaService";

sendChatMessageStream(messages, prompt, (event) => {
  if (event.type === "chunk") {
    // 逐字显示内容
    console.log(event.content);
  }
});
```

### 2. 对话上下文管理

系统会自动保存对话历史，每次发送消息时会将历史记录一起发送给 AI，确保对话的连贯性。

### 3. 错误处理

系统内置了完善的错误处理机制：
- API 调用失败会显示友好的错误提示
- 网络异常会自动重试
- 配置错误会给出明确的解决方案

## 性能优化建议

### 1. 限制历史消息数量

对于长对话，建议限制发送给 API 的历史消息数量：

```typescript
const recentMessages = messages.slice(-10); // 只保留最近 10 条
```

### 2. 防抖处理

避免用户频繁点击发送按钮：

```typescript
const [isSending, setIsSending] = useState(false);

const handleSend = async () => {
  if (isSending) return;
  setIsSending(true);
  // ... 发送逻辑
  setIsSending(false);
};
```

### 3. 本地缓存

使用 localStorage 保存对话历史：

```typescript
import { useLocalStorage } from "../hooks/useLocalStorage";

const [messages, setMessages] = useLocalStorage<TMessage[]>("chat-history", []);
```

## 故障排除

### 问题 1: AI 无响应

**可能原因**:
- API Key 未配置或错误
- 网络连接问题
- API 配额不足

**解决方案**:
- 检查环境变量配置
- 查看浏览器控制台错误信息
- 验证阿里云账号状态

### 问题 2: 响应速度慢

**可能原因**:
- 网络延迟
- API 服务器负载高
- 消息历史过多

**解决方案**:
- 减少发送的历史消息数量
- 使用流式 API 提升体验
- 添加加载动画提示用户等待

### 问题 3: 角色设定不生效

**可能原因**:
- systemPrompt 设置不当
- 消息历史影响角色表现

**解决方案**:
- 优化 systemPrompt 描述
- 切换角色时清空历史
- 加强角色提示词的约束性

## 最佳实践

1. **清晰的角色定义**: 在 systemPrompt 中明确角色的性格、知识范围和回答风格
2. **适度的历史记录**: 保持对话上下文，但不要发送过多历史消息
3. **友好的错误提示**: 给用户明确的错误信息和解决建议
4. **流畅的用户体验**: 添加加载状态、动画效果等
5. **数据安全**: 不要在客户端暴露 API Key

## 未来扩展

可以考虑添加的功能：

- [ ] 对话导出功能
- [ ] 自定义角色编辑器
- [ ] 多轮对话模板
- [ ] 语音输入/输出
- [ ] 图片理解能力
- [ ] 对话分享功能
- [ ] 本地对话历史管理

## 参考资源

- [阿里云百炼官方文档](https://help.aliyun.com/zh/model-studio/)
- [React 官方文档](https://react.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [TailwindCSS 文档](https://tailwindcss.com/)
