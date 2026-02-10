# 项目更新日志

## [2026-02-10] - 路由系统重构

### ✨ 新增功能

#### 1. React Router 集成
- 安装 `react-router-dom@6.x`
- 实现声明式路由管理
- 支持页面导航和历史记录

#### 2. 页面拆分
- **首页 (HomePage)**: 
  - 路径: `/`
  - 功能: 项目介绍、技术栈展示、AI 对话入口
  - 文件: `src/pages/HomePage.tsx`

- **AI 对话页面 (ChatPage)**:
  - 路径: `/chat`
  - 功能: AI 角色扮演对话
  - 文件: `src/pages/ChatPage.tsx`
  - 新增: 返回首页按钮 (🏠 首页)

#### 3. 路由导航
- 首页 → AI 对话: 点击"立即体验 →"按钮
- AI 对话 → 首页: 点击"🏠 首页"按钮
- 404 处理: 未匹配路由重定向到首页

### 🔧 技术改进

#### 路由配置 (App.tsx)
```typescript
// 之前: 手动状态管理
const [currentPage, setCurrentPage] = useState<TPage>("home");
if (currentPage === "chat") {
  return <ChatPage />;
}

// 之后: React Router 声明式路由
<BrowserRouter>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/chat" element={<ChatPage />} />
    <Route path="*" element={<HomePage />} />
  </Routes>
</BrowserRouter>
```

#### 导航方式
```typescript
// 之前: 状态切换
onClick={() => setCurrentPage("chat")}

// 之后: 路由导航
const navigate = useNavigate();
onClick={() => navigate("/chat")}
```

### 📚 文档更新

#### 新增文档
- `docs/ROUTER_GUIDE.md` - React Router 完整使用指南
  - 路由配置方法
  - 导航方式（声明式 vs 编程式）
  - 路由参数传递
  - 路由守卫
  - 嵌套路由
  - 懒加载优化
  - 常见问题解决

#### 更新文档
- `README.md` - 更新技术栈和项目结构
  - 新增 React Router 6
  - 更新页面组件列表
  - 新增文档索引

### 🎯 优势

1. **更好的用户体验**
   - 支持浏览器前进/后退按钮
   - URL 可分享和收藏
   - 页面刷新保持当前路由

2. **代码组织更清晰**
   - 页面组件独立管理
   - 路由配置集中化
   - 易于扩展新页面

3. **SEO 友好**
   - 每个页面有独立 URL
   - 支持服务端渲染（SSR）准备

4. **开发体验提升**
   - 声明式路由配置
   - 类型安全的路由参数
   - 丰富的路由钩子

### 📦 依赖变更

```json
{
  "dependencies": {
    "react-router-dom": "^6.x"  // 新增
  }
}
```

### 🧪 测试结果

✅ 首页加载正常  
✅ 首页 → AI 对话页面跳转成功  
✅ AI 对话页面 → 首页跳转成功  
✅ URL 变化正确 (`/` ↔ `/chat`)  
✅ 浏览器前进/后退按钮工作正常  
✅ 页面刷新保持当前路由  

### 🔜 后续计划

- [ ] 添加路由过渡动画
- [ ] 实现路由懒加载优化
- [ ] 添加更多页面（设置、历史记录等）
- [ ] 实现路由权限控制
- [ ] 添加面包屑导航

---

## [2026-02-10] - Axios 网络请求迁移

### 🔄 网络请求库迁移

#### 从 Fetch 迁移到 Axios
- 安装 `axios` 依赖
- 重构 `src/services/alibabaService.ts`
- 创建 Axios 实例配置
- 实现请求/响应拦截器

#### 优势
- 自动 JSON 转换
- 统一错误处理
- 请求/响应拦截器
- 超时控制
- 取消请求支持

#### 保留 Fetch
- 流式请求（SSE）继续使用 Fetch
- 原因: Axios 处理 SSE 相对复杂

### 📚 文档
- `docs/AXIOS_MIGRATION.md` - 详细迁移说明

---

## [2026-02-10] - CORS 跨域问题修复

### 🔧 问题修复

#### Vite 代理配置
- 配置 `vite.config.ts` 代理规则
- 开发环境使用代理路径 `/api/alibaba`
- 避免浏览器 CORS 限制

#### 工作原理
```
浏览器 → Vite 代理 (/api/alibaba) → 阿里云 API
```

### 📚 文档
- `docs/CORS_FIX.md` - CORS 问题详细解决方案
  - 问题原因分析
  - Vite 代理配置
  - 生产环境部署方案
  - 常见问题解答

---

## [2026-02-10] - AI 对话功能实现

### ✨ 核心功能

#### AI 角色扮演对话
- 6 种预设角色（智能助手、知识导师、诗人、科学家、大厨、喜剧演员）
- 实时消息发送和接收
- 角色切换功能
- 对话历史管理

#### 组件架构
- `MessageList.tsx` - 消息列表展示
- `MessageInput.tsx` - 消息输入组件
- `RoleSelector.tsx` - 角色选择器
- `ChatPage.tsx` - 对话页面主组件

#### API 集成
- 阿里云百炼 qwen-turbo 模型
- 支持流式和非流式响应
- 错误处理和重试机制

### 📚 文档
- `docs/AI_CHAT_GUIDE.md` - AI 对话功能使用指南
- `ENV_SETUP.md` - 环境变量配置指南

---

## [2026-02-10] - 项目初始化

### 🎉 项目创建

#### 技术栈
- React 19
- Vite 7
- TypeScript 5
- TailwindCSS 4

#### 项目结构
- 组件化架构
- TypeScript 类型系统
- ESLint 代码规范
- 国内镜像源配置

### 📚 文档
- `docs/PROJECT_SETUP.md` - 项目搭建详细步骤
- `README.md` - 项目说明文档

---

## 版本说明

**当前版本**: 0.1.0  
**最后更新**: 2026-02-10  
**状态**: 开发中 🚧

## 贡献者

- AI Assistant - 项目开发和文档编写
- User - 需求提出和测试反馈
