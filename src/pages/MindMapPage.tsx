import { MindMap } from "../components/mindMap/MindMap";
import { useEffect, useMemo, useState } from "react";
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

function generateLargeMindMapData(totalNodes: number): MindMapNode {
  const root: MindMapNode = {
    id: "large-root",
    text: `性能测试场景（${totalNodes}节点）`,
    children: [],
  };

  if (totalNodes <= 1) {
    return root;
  }

  const queue: MindMapNode[] = [root];
  let createdCount = 1;

  while (queue.length > 0 && createdCount < totalNodes) {
    const currentNode = queue.shift();
    if (!currentNode) {
      break;
    }

    const remain = totalNodes - createdCount;
    const childCount = Math.min(4, remain);

    for (let i = 0; i < childCount; i++) {
      createdCount += 1;
      const childNode: MindMapNode = {
        id: `large-node-${createdCount}`,
        text: `节点 ${createdCount}`,
        children: [],
      };
      currentNode.children.push(childNode);
      queue.push(childNode);
    }
  }

  return root;
}

function generateDeepMindMapData(totalNodes: number): MindMapNode {
  const root: MindMapNode = {
    id: "deep-root",
    text: `深层级性能测试场景（${totalNodes}节点）`,
    children: [],
  };

  if (totalNodes <= 1) {
    return root;
  }

  let createdCount = 1;
  const candidates: Array<{ node: MindMapNode; depth: number }> = [];
  const backboneGroups = 12; // 顶层先铺宽，确保横向展开
  const backboneDepth = 16; // 每组继续加深，确保纵向层级

  // 1) 先创建多条深链：根节点宽 + 每条链深
  for (let g = 0; g < backboneGroups && createdCount < totalNodes; g++) {
    createdCount += 1;
    const branchRoot: MindMapNode = {
      id: `deep-node-${createdCount}`,
      text: `主分支 ${g + 1}`,
      children: [],
    };
    root.children.push(branchRoot);
    candidates.push({ node: branchRoot, depth: 1 });

    let current = branchRoot;
    for (let d = 0; d < backboneDepth && createdCount < totalNodes; d++) {
      createdCount += 1;
      const chainNode: MindMapNode = {
        id: `deep-node-${createdCount}`,
        text: `深链${g + 1}-${d + 1}`,
        children: [],
      };
      current.children.push(chainNode);
      current = chainNode;
      candidates.push({ node: chainNode, depth: d + 2 });
    }
  }

  // 2) 填充剩余节点：深度优先，同时周期性扩展次深分支，兼顾宽度
  while (createdCount < totalNodes && candidates.length > 0) {
    candidates.sort((a, b) => b.depth - a.depth);
    const pickIndex =
      createdCount % 5 === 0 ? Math.min(10, candidates.length - 1) : 0;
    const selected = candidates[pickIndex];
    const { node: parent, depth } = selected;

    const maxChildren = depth <= 3 ? 6 : depth <= 10 ? 4 : depth <= 18 ? 3 : 2;
    if (parent.children.length >= maxChildren) {
      candidates.splice(pickIndex, 1);
      continue;
    }

    createdCount += 1;
    const child: MindMapNode = {
      id: `deep-node-${createdCount}`,
      text:
        depth >= 18 ? `深层分支 ${createdCount}` : `横向分支 ${createdCount}`,
      children: [],
    };
    parent.children.push(child);
    candidates.unshift({ node: child, depth: depth + 1 });
  }

  return root;
}

function generateBalancedHugeMindMapData(totalNodes: number): MindMapNode {
  const root: MindMapNode = {
    id: "huge-root",
    text: `超大规模均匀场景（${totalNodes}节点）`,
    children: [],
  };

  if (totalNodes <= 1) {
    return root;
  }

  // 按层权重分配节点，保证既有深度又有宽度，整体分布更均匀
  const levelWeights = [
    6, 18, 54, 120, 240, 420, 640, 900, 1200, 1450, 1600, 1450, 1100, 700, 101,
  ];
  const totalWeight = levelWeights.reduce((sum, weight) => sum + weight, 0);
  const remainingNodes = totalNodes - 1;

  const levelCounts = levelWeights.map((weight) =>
    Math.max(1, Math.floor((weight / totalWeight) * remainingNodes))
  );

  let allocated = levelCounts.reduce((sum, count) => sum + count, 0);
  let delta = remainingNodes - allocated;

  // 中间层优先修正，尽量保持“橄榄形”宽度分布
  const rebalanceOrder = [10, 9, 11, 8, 12, 7, 13, 6, 14, 5, 4, 3, 2, 1, 0];

  while (delta > 0) {
    for (const index of rebalanceOrder) {
      if (delta <= 0) break;
      levelCounts[index] += 1;
      delta -= 1;
    }
  }

  while (delta < 0) {
    for (const index of rebalanceOrder) {
      if (delta >= 0) break;
      if (levelCounts[index] > 1) {
        levelCounts[index] -= 1;
        delta += 1;
      }
    }
  }

  const levels: MindMapNode[][] = [[root]];
  let createdCount = 1;

  for (let levelIndex = 0; levelIndex < levelCounts.length; levelIndex++) {
    const parentLevel = levels[levelIndex];
    const nextLevelCount = levelCounts[levelIndex];
    const nextLevel: MindMapNode[] = [];

    for (let i = 0; i < nextLevelCount; i++) {
      createdCount += 1;
      const node: MindMapNode = {
        id: `huge-node-${createdCount}`,
        text: `层${levelIndex + 1}-节点${i + 1}`,
        children: [],
      };

      const parent = parentLevel[i % parentLevel.length];
      parent.children.push(node);
      nextLevel.push(node);
    }

    levels.push(nextLevel);
  }

  return root;
}

/**
 * 思维导图演示页面
 */
export function MindMapPage() {
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const [scene, setScene] = useState<
    "demo" | "large-500" | "deep-1000" | "huge-10000"
  >("demo");
  const largeData500 = useMemo(() => generateLargeMindMapData(500), []);
  const deepData1000 = useMemo(() => generateDeepMindMapData(1000), []);
  const hugeData10000 = useMemo(
    () => generateBalancedHugeMindMapData(10000),
    []
  );

  const currentData =
    scene === "demo"
      ? demoData
      : scene === "large-500"
      ? largeData500
      : scene === "deep-1000"
      ? deepData1000
      : hugeData10000;

  useEffect(() => {
    let frameId: number | null = null;

    const updateViewport = () => {
      frameId = null;
      setViewport((prev) => {
        const nextWidth = window.innerWidth;
        const nextHeight = window.innerHeight;
        if (prev.width === nextWidth && prev.height === nextHeight) {
          return prev;
        }
        return { width: nextWidth, height: nextHeight };
      });
    };

    const handleResize = () => {
      if (frameId !== null) {
        return;
      }
      frameId = window.requestAnimationFrame(updateViewport);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen">
      <div className="absolute top-16 right-4 z-20 bg-white shadow-md rounded-lg p-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setScene("demo")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            scene === "demo"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          默认场景
        </button>
        <button
          type="button"
          onClick={() => setScene("large-500")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            scene === "large-500"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          500 节点
        </button>
        <button
          type="button"
          onClick={() => setScene("deep-1000")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            scene === "deep-1000"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          1000 节点（深层级）
        </button>
        <button
          type="button"
          onClick={() => setScene("huge-10000")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            scene === "huge-10000"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          10000 节点（均匀深宽）
        </button>
      </div>

      <MindMap
        key={scene}
        initialData={currentData}
        width={viewport.width}
        height={viewport.height}
      />
    </div>
  );
}
