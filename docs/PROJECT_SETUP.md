# 项目搭建文档

## 项目概述

本项目是一个基于现代前端技术栈构建的 AI 博客应用，采用 React + Vite + TypeScript + TailwindCSS 技术栈。

## 技术栈版本

- **React**: 18.3.1
- **Vite**: 7.3.1
- **TypeScript**: 5.6.2
- **TailwindCSS**: 4.1.18
- **@tailwindcss/postcss**: 4.1.18

## 项目结构

```
ai_blog/
├── .vscode/                    # VSCode 编辑器配置
│   ├── settings.json          # 编辑器设置
│   └── extensions.json        # 推荐扩展
├── docs/                       # 项目文档
│   └── PROJECT_SETUP.md       # 项目搭建文档
├── public/                     # 公共静态资源
│   └── vite.svg               # Vite Logo
├── src/                        # 源代码目录
│   ├── assets/                # 静态资源
│   │   └── react.svg          # React Logo
│   ├── components/            # 可复用组件
│   │   └── Button.tsx         # 按钮组件示例
│   ├── hooks/                 # 自定义 Hooks
│   │   └── useLocalStorage.ts # LocalStorage Hook
│   ├── services/              # API 服务层
│   ├── types/                 # TypeScript 类型定义
│   │   └── index.ts           # 全局类型定义
│   ├── utils/                 # 工具函数
│   │   └── formatDate.ts      # 日期格式化工具
│   ├── App.tsx                # 主应用组件
│   ├── main.tsx               # 应用入口
│   └── index.css              # 全局样式（含 TailwindCSS）
├── .gitignore                 # Git 忽略文件
├── .npmrc                     # npm 配置（国内镜像）
├── eslint.config.js           # ESLint 配置
├── index.html                 # HTML 入口文件
├── package.json               # 项目依赖配置
├── postcss.config.js          # PostCSS 配置
├── README.md                  # 项目说明文档
├── tsconfig.app.json          # TypeScript 应用配置
├── tsconfig.json              # TypeScript 基础配置
├── tsconfig.node.json         # TypeScript Node 配置
└── vite.config.ts             # Vite 配置文件
```

## 关键配置说明

### 1. TailwindCSS v4 配置

TailwindCSS v4 采用了新的配置方式，不再需要独立的 `tailwind.config.js` 文件。

**postcss.config.js**:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

**src/index.css**:
```css
@import "tailwindcss";

/* 自定义主题配置 */
@theme {
  --animate-spin-slow: spin 3s linear infinite;
}
```

### 2. 国内镜像配置

创建了 `.npmrc` 文件配置淘宝镜像，加速依赖安装：

```
registry=https://registry.npmmirror.com/
```

### 3. VSCode 配置

**推荐扩展**:
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
- ES7+ React/Redux/React-Native snippets (dsznajder.es7-react-js-snippets)

**编辑器设置**:
- 保存时自动格式化
- 启用 ESLint 自动修复
- TypeScript 工作区版本
- TailwindCSS 智能提示

## 核心功能特性

### 1. 现代化 UI 设计

- 渐变背景色
- 响应式布局
- 深色模式支持
- 流畅的过渡动画
- 悬停效果和交互反馈

### 2. 组件化架构

**Button 组件示例**:
- 支持多种样式变体（primary、secondary、outline）
- 支持多种尺寸（sm、md、lg）
- TypeScript 类型安全
- TailwindCSS 样式

### 3. 自定义 Hooks

**useLocalStorage Hook**:
- 持久化状态管理
- 跨标签页同步
- 错误处理
- TypeScript 泛型支持

### 4. 工具函数

**formatDate 工具**:
- 日期格式化
- 相对时间计算（如"3天前"）
- 国际化支持

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```

## 浏览器访问

开发服务器默认运行在：http://localhost:5173/

## 代码规范

### 命名规范

- **组件**: PascalCase (如 `Button.tsx`)
- **函数**: camelCase (如 `formatDate`)
- **常量**: UPPER_CASE (如 `API_BASE_URL`)
- **接口**: I 前缀 (如 `IButtonProps`)
- **类型**: T 前缀 (如 `TUserData`)

### 目录规范

- `/src/components` - 可复用 UI 组件
- `/src/services` - API 调用和业务逻辑
- `/src/utils` - 纯函数工具
- `/src/hooks` - 自定义 React Hooks
- `/src/types` - TypeScript 类型定义
- `/docs` - 项目文档

## 已实现的功能

✅ Vite + React + TypeScript 项目初始化  
✅ TailwindCSS v4 配置和集成  
✅ 国内镜像源配置  
✅ 现代化 UI 界面设计  
✅ 响应式布局  
✅ 组件示例（Button）  
✅ 自定义 Hook 示例（useLocalStorage）  
✅ 工具函数示例（formatDate）  
✅ TypeScript 类型定义  
✅ VSCode 开发环境配置  
✅ 项目文档  
✅ 功能测试验证  

## 下一步计划

- [ ] 添加路由系统（React Router）
- [ ] 集成状态管理（Zustand 或 Redux Toolkit）
- [ ] 实现深色模式切换
- [ ] 添加更多可复用组件
- [ ] 集成 API 服务
- [ ] 添加单元测试
- [ ] 添加 E2E 测试
- [ ] 实现博客文章 CRUD 功能
- [ ] 集成 Markdown 编辑器
- [ ] 添加用户认证系统

## 注意事项

1. **TailwindCSS v4 变化**: 使用 `@import "tailwindcss"` 替代旧的 `@tailwind` 指令
2. **PostCSS 配置**: 使用 `@tailwindcss/postcss` 插件
3. **主题配置**: 使用 `@theme` 指令定义自定义主题变量
4. **国内网络**: 已配置淘宝镜像，确保依赖安装顺畅

## 问题排查

### 问题 1: TailwindCSS 样式不生效

**解决方案**: 确保安装了 `@tailwindcss/postcss` 包，并在 `postcss.config.js` 中正确配置。

### 问题 2: npm 安装失败

**解决方案**: 检查 `.npmrc` 文件是否存在，确保配置了国内镜像源。

### 问题 3: TypeScript 类型错误

**解决方案**: 确保所有依赖都已安装，运行 `npm install` 重新安装依赖。

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License

---

**创建日期**: 2026-02-10  
**最后更新**: 2026-02-10  
**维护者**: AI Blog Team
