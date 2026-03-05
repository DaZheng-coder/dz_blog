import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ArticleListPage } from "./pages/ArticleListPage";
import { ArticleDetailPage } from "./pages/ArticleDetailPage";
import { GlobalChatEntry } from "./components/layout/GlobalChatEntry";
import { ChatPage } from "./pages/ChatPage";
import { HomePage } from "./pages/HomePage";
import { MindMapPage } from "./pages/MindMapPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ClipPage } from "./pages/ClipPage";
import { ThreeDPage } from "./pages/ThreeDPage";
import { ModelInspectorPage } from "./pages/ModelInspectorPage";

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
        <Route path="/three-d" element={<ThreeDPage />} />
        <Route path="/model-inspector" element={<ModelInspectorPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      <GlobalChatEntry />
    </BrowserRouter>
  );
}

export default App;
