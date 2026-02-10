import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { ChatPage } from "./pages/ChatPage";

/**
 * 应用根组件
 * 配置路由结构
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 首页路由 */}
        <Route path="/" element={<HomePage />} />

        {/* AI 对话页面路由 */}
        <Route path="/chat" element={<ChatPage />} />

        {/* 404 页面 - 重定向到首页 */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
