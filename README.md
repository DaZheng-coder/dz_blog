# AI Blog

一个基于现代前端技术栈构建的 AI 博客项目，集成了阿里云百炼的 AI 对话功能。

## ✨ 核心功能

### 🤖 AI 角色扮演对话

体验基于阿里云百炼 qwen-turbo 模型的智能对话：

- **6 种预设角色**：智能助手、知识导师、诗人、科学家、大厨、喜剧演员
- **实时对话**：流畅的消息发送和接收
- **角色切换**：一键切换不同性格的 AI 角色
- **对话历史**：自动保存对话记录
- **美观界面**：现代化渐变设计，支持深色模式

[查看详细使用指南 →](./docs/AI_CHAT_GUIDE.md)

## 技术栈

- **React 19** - 用户界面库
- **Vite 7** - 下一代前端构建工具
- **TypeScript 5** - JavaScript 的超集，提供类型安全
- **TailwindCSS 4** - 实用优先的 CSS 框架
- **React Router 6** - 声明式路由管理
- **Axios** - 基于 Promise 的 HTTP 客户端
- **阿里云百炼** - 企业级 AI 模型服务

## 特性

- ⚡ 极速开发体验 - Vite 提供闪电般的热更新
- 🎨 现代化 UI - 使用 TailwindCSS 4 构建美观的响应式界面
- 🔒 类型安全 - TypeScript 提供完整的类型检查
- 📦 组件化开发 - React 组件化架构
- 🛣️ 路由管理 - React Router 实现页面导航
- 🌐 网络请求 - Axios 统一管理 API 调用
- 🌗 深色模式支持 - 内置亮色/暗色主题切换
- 📱 响应式设计 - 适配各种设备尺寸
- 🤖 AI 对话 - 集成阿里云百炼 AI 模型

## 项目结构

```
ai_blog/
├── src/
│   ├── components/     # 可复用组件
│   │   ├── Button.tsx
│   │   ├── MessageList.tsx      # 消息列表
│   │   ├── MessageInput.tsx     # 消息输入
│   │   └── RoleSelector.tsx     # 角色选择
│   ├── pages/          # 页面组件
│   │   ├── HomePage.tsx         # 首页
│   │   └── ChatPage.tsx         # AI 对话页面
│   ├── hooks/          # 自定义 React Hooks
│   │   └── useLocalStorage.ts
│   ├── services/       # API 服务层
│   │   └── alibabaService.ts    # 阿里云 API
│   ├── utils/          # 工具函数
│   │   └── formatDate.ts
│   ├── types/          # TypeScript 类型定义
│   │   ├── index.ts
│   │   └── chat.ts              # 对话相关类型
│   ├── assets/         # 静态资源
│   ├── App.tsx         # 主应用组件
│   ├── main.tsx        # 应用入口
│   └── index.css       # 全局样式
├── public/             # 公共静态资源
├── docs/               # 项目文档
│   ├── PROJECT_SETUP.md         # 项目搭建文档
│   └── AI_CHAT_GUIDE.md         # AI 对话使用指南
├── ENV_SETUP.md        # 环境变量配置指南
└── ...配置文件
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件并配置阿里云百炼 API Key：

```bash
VITE_ALIBABA_API_KEY=your_api_key_here
```

详细配置步骤请查看 [ENV_SETUP.md](./ENV_SETUP.md)

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用。

### 4. 体验 AI 对话

- 点击首页的"立即体验"按钮
- 选择一个 AI 角色
- 开始对话！

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 代码规范

### 命名规范

- **组件命名**: PascalCase (如 `Button.tsx`)
- **函数命名**: camelCase (如 `formatDate`)
- **常量命名**: UPPER_CASE (如 `API_BASE_URL`)
- **接口命名**: I 前缀 (如 `IUserService`)
- **类型定义**: T 前缀 (如 `TUserData`)

### 目录规范

- `/src/components` - 可复用 UI 组件
- `/src/services` - API 调用和业务逻辑
- `/src/utils` - 纯函数工具
- `/src/hooks` - 自定义 React Hooks
- `/src/types` - TypeScript 类型定义
- `/docs` - 项目文档

## 开发指南

### 创建新组件

组件应该：
- 使用 TypeScript 定义 Props 接口
- 包含必要的注释说明
- 遵循单一职责原则
- 使用 TailwindCSS 进行样式设计

示例：

```tsx
import { FC } from 'react';

interface IButtonProps {
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

/**
 * 通用按钮组件
 */
export const Button: FC<IButtonProps> = ({ variant = 'primary', onClick }) => {
  return (
    <button 
      className={`px-4 py-2 rounded ${variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'}`}
      onClick={onClick}
    >
      Click Me
    </button>
  );
};
```

### 使用自定义 Hooks

项目包含实用的自定义 Hooks，如 `useLocalStorage`：

```tsx
import { useLocalStorage } from './hooks/useLocalStorage';

function MyComponent() {
  const [name, setName] = useLocalStorage('name', 'Guest');
  
  return (
    <input 
      value={name} 
      onChange={(e) => setName(e.target.value)} 
    />
  );
}
```

## 文档

- [AI 对话使用指南](./docs/AI_CHAT_GUIDE.md) - AI 对话功能详细说明
- [React Router 路由指南](./docs/ROUTER_GUIDE.md) - 路由配置和使用方法
- [Axios 迁移文档](./docs/AXIOS_MIGRATION.md) - 网络请求库迁移说明
- [CORS 问题修复](./docs/CORS_FIX.md) - 跨域问题解决方案
- [环境变量配置](./ENV_SETUP.md) - API Key 配置指南
- [项目搭建过程](./docs/PROJECT_SETUP.md) - 项目初始化步骤

## 依赖管理

项目配置了国内镜像源（淘宝镜像）以加速依赖安装。配置文件：`.npmrc`

## Git 提交规范

遵循语义化提交信息格式：

- `feat:` 新功能
- `fix:` 修复 Bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具链更新

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
