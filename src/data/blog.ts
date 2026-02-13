import aiChatInterfaceRetroMarkdown from "../content/articles/ai-chat-interface-retro.md?raw";
import buildInPublicWeekly01Markdown from "../content/articles/build-in-public-weekly-01.md?raw";
import mindmapArchitectureDesignMarkdown from "../content/articles/mindmap-architecture-design.md?raw";
import mindmapLayoutNotesMarkdown from "../content/articles/mindmap-layout-notes.md?raw";
import reactMarkdownRenderCheckMarkdown from "../content/articles/react-markdown-render-check.md?raw";

export type WorkExperience = {
  id: string;
  period: string;
  role: string;
  company: string;
  summary: string;
  highlights: string[];
};

export type ProjectStatus = "Active" | "Building" | "Archived";

export type BlogProject = {
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  status: ProjectStatus;
  techStack: string[];
  screenshots: {
    src: string;
    alt: string;
    caption: string;
  }[];
  details: string[];
};

export type BlogArticle = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  tags: string[];
  content: string;
};

export const workExperiences: WorkExperience[] = [
  {
    id: "exp-2026",
    period: "2025.11 - 至今",
    role: "独立开发者",
    company: "公开构建中",
    summary: "围绕 AI 对话与知识可视化持续迭代产品，保持高频发布。",
    highlights: [
      "完成聊天与思维导图双核心模块联动",
      "建立可复用的前端组件与交互规范",
      "每周记录构建日志并公开路线图",
    ],
  },
  {
    id: "exp-2025",
    period: "2024.03 - 2025.10",
    role: "前端工程师",
    company: "SaaS 团队",
    summary: "负责业务中台与数据工作台前端架构升级。",
    highlights: [
      "推动 TypeScript 全量迁移",
      "优化核心页面性能，首屏渲染显著提升",
      "落地设计系统并统一组件风格",
    ],
  },
  {
    id: "exp-2024",
    period: "2022.07 - 2024.02",
    role: "全栈工程师",
    company: "创业团队",
    summary: "从 0 到 1 搭建内容产品，覆盖前后端与部署链路。",
    highlights: [
      "设计内容发布与检索能力",
      "实现自动化构建与发布流程",
      "支持多角色协作与权限管理",
    ],
  },
];

export const projects: BlogProject[] = [
  {
    slug: "ai-chat-journal",
    title: "AI 对话日志",
    subtitle: "面向公开构建的对话式记录系统",
    summary: "通过自然语言记录研发决策、实验结果和迭代计划。",
    status: "Active",
    techStack: ["React", "TypeScript", "Tailwind CSS", "Vite"],
    screenshots: [
      {
        src: "/screenshots/ai-chat-overview.svg",
        alt: "AI 对话日志概览截图",
        caption: "多轮对话与时间轴同步展示",
      },
      {
        src: "/screenshots/ai-chat-detail.svg",
        alt: "AI 对话日志详情截图",
        caption: "单条对话的上下文与标签管理",
      },
    ],
    details: [
      "支持按日期和主题检索历史对话，便于复盘。",
      "通过标签系统标记关键决策，快速定位上下文。",
      "后续计划接入自动摘要和每周报告生成。",
    ],
  },
  {
    slug: "mindmap-workbench",
    title: "MindMap Workbench",
    subtitle: "从想法到结构化方案的可视化工作台",
    summary: "将对话结果沉淀为可编辑脑图，支持节点拖拽与布局优化。",
    status: "Building",
    techStack: ["React", "SVG", "State Machine", "Custom Hooks"],
    screenshots: [
      {
        src: "/screenshots/mindmap-main.svg",
        alt: "思维导图工作台截图",
        caption: "中心主题与分支节点编辑",
      },
      {
        src: "/screenshots/mindmap-layout.svg",
        alt: "思维导图布局截图",
        caption: "拖拽后自动校正的连接线布局",
      },
    ],
    details: [
      "提供键盘快捷操作，提高结构化整理效率。",
      "节点布局采用几何约束，减少连线遮挡。",
      "计划加入导出为 PNG / Markdown 的能力。",
    ],
  },
  {
    slug: "build-log-site",
    title: "Build Log Site",
    subtitle: "公开构建过程的个人博客系统",
    summary: "以时间线展示项目与工作经历，强调决策过程透明化。",
    status: "Archived",
    techStack: ["React Router", "Markdown", "SEO", "RSS"],
    screenshots: [
      {
        src: "/screenshots/build-log-home.svg",
        alt: "构建日志首页截图",
        caption: "时间线首页与项目卡片联动",
      },
    ],
    details: [
      "聚焦记录真实的迭代历程，而非仅展示结果。",
      "积累技术写作模板，提高复盘与分享效率。",
      "后续会重启为当前站点的内容引擎。",
    ],
  },
];

export const articles: BlogArticle[] = [
  {
    slug: "mindmap-architecture-design",
    title: "MindMap 架构设计总结：从单体组件到可维护分层",
    publishedAt: "2026-02-13",
    tags: ["MindMap", "Architecture", "Frontend", "Performance"],
    excerpt:
      "总结当前 MindMap 的分层设计、数据流、性能策略与后续演进方向。",
    content: mindmapArchitectureDesignMarkdown,
  },
  {
    slug: "react-markdown-render-check",
    title: "ReactMarkdown 渲染验证：文本、图片、表格",
    publishedAt: "2026-02-13",
    tags: ["Markdown", "ReactMarkdown", "GFM"],
    excerpt: "用于验证 react-markdown 在当前站点中对文本、图片与表格的渲染效果。",
    content: reactMarkdownRenderCheckMarkdown,
  },
  {
    slug: "build-in-public-weekly-01",
    title: "公开构建周报 #01：从功能堆叠到问题导向",
    publishedAt: "2026-02-10",
    tags: ["Build in Public", "Product", "Workflow"],
    excerpt:
      "这一周我把目标从“多做功能”改成“优先解决真实问题”，并重排了交付节奏。",
    content: buildInPublicWeekly01Markdown,
  },
  {
    slug: "mindmap-layout-notes",
    title: "思维导图布局笔记：为什么我放弃平均分布",
    publishedAt: "2026-02-05",
    tags: ["MindMap", "Frontend", "Visualization"],
    excerpt:
      "在节点数量增长后，平均分布会让连线交叉严重。我改用了约束驱动的布局策略。",
    content: mindmapLayoutNotesMarkdown,
  },
  {
    slug: "ai-chat-interface-retro",
    title: "AI 对话界面复盘：减少视觉噪音后的转化变化",
    publishedAt: "2026-01-28",
    tags: ["AI Chat", "UI", "Conversion"],
    excerpt: "通过收敛色彩和减少按钮数量，对话入口点击率有了更稳定的提升。",
    content: aiChatInterfaceRetroMarkdown,
  },
].sort((a, b) => (a.publishedAt > b.publishedAt ? -1 : 1));

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug);
}
