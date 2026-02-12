import { MindMap } from "../components/MindMap";
import type { MindMapNode } from "../types/mindmap";

/**
 * 示例数据：项目开发流程
 */
const demoData: MindMapNode = {
  id: "root",
  text: "项目开发流程",
  children: [
    {
      id: "planning",
      text: "需求分析与规划",
      children: [
        {
          id: "requirements",
          text: "收集需求",
          children: [],
        },
        {
          id: "design",
          text: "系统设计",
          children: [
            {
              id: "architecture",
              text: "架构设计",
              children: [],
            },
            {
              id: "ui-design",
              text: "UI/UX 设计",
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: "development",
      text: "开发实施联合发掘开始放了假卡是否了解卡撒都会发生卡交话费是拉卡多久发货放了假卡上开发了世界",
      children: [
        {
          id: "frontend",
          text: "前端开发",
          children: [
            {
              id: "react",
              text: "React 组件",
              children: [],
            },
            {
              id: "styling",
              text: "样式设计",
              children: [],
            },
          ],
        },
        {
          id: "backend",
          text: "后端开发",
          children: [
            {
              id: "api",
              text: "API 接口",
              children: [],
            },
            {
              id: "database",
              text: "数据库设计",
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: "testing",
      text: "测试与优化",
      children: [
        {
          id: "unit-test",
          text: "单元测试",
          children: [],
        },
        {
          id: "integration-test",
          text: "集成测试",
          children: [],
        },
        {
          id: "performance",
          text: "性能优化",
          children: [],
        },
      ],
    },
    {
      id: "deployment",
      text: "部署上线",
      children: [
        {
          id: "ci-cd",
          text: "CI/CD 配置",
          children: [],
        },
        {
          id: "monitoring",
          text: "监控告警",
          children: [],
        },
      ],
    },
  ],
};

/**
 * 思维导图演示页面
 */
export function MindMapPage() {
  return (
    <div className="w-screen h-screen">
      <MindMap
        initialData={demoData}
        width={window.innerWidth}
        height={window.innerHeight}
      />
    </div>
  );
}
