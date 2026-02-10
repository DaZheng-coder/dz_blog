# React Router 路由配置指南

## 概述

本项目使用 `react-router-dom` 实现页面路由管理，将应用拆分为多个独立页面，提供更好的用户体验和代码组织。

## 安装

```bash
npm install react-router-dom
```

**版本**: react-router-dom@^6.x

## 路由结构

### 当前路由配置

```
/                   → 首页 (HomePage)
/chat               → AI 对话页面 (ChatPage)
/*                  → 404 重定向到首页
```

## 核心文件

### 1. App.tsx - 路由配置中心

```typescript
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ChatPage } from "./pages/ChatPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**关键组件说明**:
- `BrowserRouter`: 提供路由上下文，使用 HTML5 History API
- `Routes`: 路由容器，匹配当前 URL
- `Route`: 定义单个路由规则

### 2. HomePage.tsx - 首页组件

**路径**: `src/pages/HomePage.tsx`

**功能**:
- 展示项目介绍
- 技术栈特性展示
- 提供 AI 对话入口

**路由跳转**:
```typescript
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate("/chat")}>
      立即体验 →
    </button>
  );
}
```

### 3. ChatPage.tsx - AI 对话页面

**路径**: `src/pages/ChatPage.tsx`

**功能**:
- AI 角色扮演对话
- 消息列表展示
- 角色选择器

**返回首页**:
```typescript
import { useNavigate } from "react-router-dom";

export function ChatPage() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate("/")}>
      🏠 首页
    </button>
  );
}
```

## 路由导航方法

### 1. 声明式导航 - Link 组件

```typescript
import { Link } from "react-router-dom";

<Link to="/chat" className="...">
  前往对话页面
</Link>
```

**优点**:
- 语义化，易于理解
- 自动处理可访问性（a 标签）
- 支持右键"在新标签页打开"

### 2. 编程式导航 - useNavigate Hook

```typescript
import { useNavigate } from "react-router-dom";

function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    // 跳转到指定路径
    navigate("/chat");
    
    // 返回上一页
    navigate(-1);
    
    // 前进一页
    navigate(1);
    
    // 替换当前历史记录（不可返回）
    navigate("/chat", { replace: true });
  };

  return <button onClick={handleClick}>跳转</button>;
}
```

**使用场景**:
- 表单提交后跳转
- 条件判断后跳转
- 需要传递状态数据

### 3. 传递状态数据

```typescript
// 发送方
navigate("/chat", { 
  state: { 
    characterId: "teacher",
    message: "Hello" 
  } 
});

// 接收方
import { useLocation } from "react-router-dom";

function ChatPage() {
  const location = useLocation();
  const { characterId, message } = location.state || {};
  
  // 使用传递的数据
}
```

## 路由参数

### 1. URL 参数 (Path Parameters)

**定义路由**:
```typescript
<Route path="/chat/:characterId" element={<ChatPage />} />
```

**获取参数**:
```typescript
import { useParams } from "react-router-dom";

function ChatPage() {
  const { characterId } = useParams();
  // characterId: "teacher"
}
```

**导航**:
```typescript
navigate("/chat/teacher");
```

### 2. 查询参数 (Query Parameters)

**导航**:
```typescript
navigate("/chat?character=teacher&mode=stream");
```

**获取参数**:
```typescript
import { useSearchParams } from "react-router-dom";

function ChatPage() {
  const [searchParams] = useSearchParams();
  const character = searchParams.get("character"); // "teacher"
  const mode = searchParams.get("mode"); // "stream"
}
```

**设置参数**:
```typescript
const [searchParams, setSearchParams] = useSearchParams();

// 更新查询参数
setSearchParams({ character: "poet", mode: "normal" });
```

## 路由守卫

### 实现受保护路由

```typescript
import { Navigate } from "react-router-dom";

interface IProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

function ProtectedRoute({ children, isAuthenticated }: IProtectedRouteProps) {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// 使用
<Route 
  path="/chat" 
  element={
    <ProtectedRoute isAuthenticated={isLoggedIn}>
      <ChatPage />
    </ProtectedRoute>
  } 
/>
```

## 嵌套路由

### 配置嵌套路由

```typescript
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<HomePage />} />
    <Route path="chat" element={<ChatPage />} />
    <Route path="settings" element={<SettingsPage />}>
      <Route path="profile" element={<ProfileSettings />} />
      <Route path="privacy" element={<PrivacySettings />} />
    </Route>
  </Route>
</Routes>
```

### Layout 组件

```typescript
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div>
      <Header />
      <main>
        <Outlet /> {/* 子路由渲染位置 */}
      </main>
      <Footer />
    </div>
  );
}
```

## 路由懒加载

### 代码分割优化

```typescript
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// 懒加载组件
const HomePage = lazy(() => import("./pages/HomePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>加载中...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**优点**:
- 减少初始加载包大小
- 按需加载页面代码
- 提升首屏加载速度

## 路由钩子 (Hooks)

### 常用 Hooks 汇总

| Hook | 用途 | 返回值 |
|------|------|--------|
| `useNavigate` | 编程式导航 | 导航函数 |
| `useLocation` | 获取当前位置信息 | location 对象 |
| `useParams` | 获取 URL 参数 | 参数对象 |
| `useSearchParams` | 获取/设置查询参数 | [params, setParams] |
| `useMatch` | 匹配路由模式 | 匹配结果或 null |

### useLocation 示例

```typescript
import { useLocation } from "react-router-dom";

function MyComponent() {
  const location = useLocation();
  
  console.log(location.pathname);  // "/chat"
  console.log(location.search);    // "?id=123"
  console.log(location.hash);      // "#section"
  console.log(location.state);     // 传递的状态数据
  console.log(location.key);       // 唯一标识
}
```

## 404 页面

### 创建 NotFound 组件

```typescript
// src/pages/NotFoundPage.tsx
import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl mb-8">页面未找到</p>
        <button 
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}
```

### 配置 404 路由

```typescript
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/chat" element={<ChatPage />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

## 路由配置最佳实践

### 1. 集中管理路由配置

```typescript
// src/router/routes.tsx
import { RouteObject } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { ChatPage } from "../pages/ChatPage";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/chat",
    element: <ChatPage />,
  },
  {
    path: "*",
    element: <HomePage />,
  },
];

// src/App.tsx
import { useRoutes } from "react-router-dom";
import { routes } from "./router/routes";

function App() {
  const element = useRoutes(routes);
  return <BrowserRouter>{element}</BrowserRouter>;
}
```

### 2. 路由常量管理

```typescript
// src/router/paths.ts
export const ROUTES = {
  HOME: "/",
  CHAT: "/chat",
  SETTINGS: "/settings",
} as const;

// 使用
navigate(ROUTES.CHAT);
```

### 3. 类型安全的路由参数

```typescript
// src/router/types.ts
export interface IChatPageParams {
  characterId: string;
}

// 使用
const { characterId } = useParams<IChatPageParams>();
```

## 性能优化

### 1. 预加载路由

```typescript
import { lazy } from "react";

const ChatPage = lazy(() => import("./pages/ChatPage"));

// 预加载
const preloadChatPage = () => {
  import("./pages/ChatPage");
};

// 在用户可能访问前触发
<button onMouseEnter={preloadChatPage}>
  前往对话
</button>
```

### 2. 路由过渡动画

```typescript
import { useLocation } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <TransitionGroup>
      <CSSTransition
        key={location.pathname}
        timeout={300}
        classNames="fade"
      >
        <Routes location={location}>
          {/* 路由配置 */}
        </Routes>
      </CSSTransition>
    </TransitionGroup>
  );
}
```

## 调试技巧

### 1. 查看当前路由信息

```typescript
import { useLocation } from "react-router-dom";

function DebugRouter() {
  const location = useLocation();
  
  if (import.meta.env.DEV) {
    console.log("Current Route:", location.pathname);
    console.log("Search Params:", location.search);
    console.log("State:", location.state);
  }
  
  return null;
}
```

### 2. 路由变化监听

```typescript
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function RouteChangeListener() {
  const location = useLocation();

  useEffect(() => {
    console.log("Route changed to:", location.pathname);
    // 可以在这里添加页面访问统计等逻辑
  }, [location]);

  return null;
}
```

## 常见问题

### Q1: 刷新页面 404？

**原因**: 开发服务器需要配置 fallback 到 index.html

**Vite 解决方案**: Vite 默认已配置，无需额外设置

**生产环境 Nginx 配置**:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Q2: 路由跳转后页面不滚动到顶部？

**解决方案**:
```typescript
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// 在 App 中使用
<BrowserRouter>
  <ScrollToTop />
  <Routes>...</Routes>
</BrowserRouter>
```

### Q3: 如何在路由跳转前确认？

**解决方案**:
```typescript
import { useBlocker } from "react-router-dom";

function MyForm() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useBlocker(
    ({ currentLocation, nextLocation }) => {
      return (
        hasUnsavedChanges &&
        currentLocation.pathname !== nextLocation.pathname
      );
    }
  );

  // 表单逻辑
}
```

## 扩展阅读

- [React Router 官方文档](https://reactrouter.com/)
- [React Router v6 迁移指南](https://reactrouter.com/en/main/upgrading/v5)
- [路由设计最佳实践](https://reactrouter.com/en/main/start/concepts)

## 项目相关文件

- `src/App.tsx` - 路由配置
- `src/pages/HomePage.tsx` - 首页组件
- `src/pages/ChatPage.tsx` - AI 对话页面
- `package.json` - 依赖配置

---

**更新日期**: 2026-02-10  
**React Router 版本**: 6.x  
**状态**: ✅ 已完成并测试
