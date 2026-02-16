import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ArticleListPage } from "./pages/ArticleListPage";
import { ArticleDetailPage } from "./pages/ArticleDetailPage";
import { ChatPage } from "./pages/ChatPage";
import { HomePage } from "./pages/HomePage";
import { MindMapPage } from "./pages/MindMapPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ClipPage } from "./pages/ClipPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/mind-map" element={<MindMapPage />} />
        <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        <Route path="/articles" element={<ArticleListPage />} />
        <Route path="/articles/:slug" element={<ArticleDetailPage />} />
        <Route path="/clip" element={<ClipPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
