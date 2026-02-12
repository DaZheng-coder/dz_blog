import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type {
  MindMapNode as MindMapNodeType,
  NodePosition,
} from "../../types/mindmap";
import { useMindMapState } from "../../hooks/useMindMapState";
import { useLayout, getLayoutBounds } from "../../hooks/useLayout";
import { MindMapGuidePanel } from "./MindMapGuidePanel";
import { MindMapZoomIndicator } from "./MindMapZoomIndicator";
import { MindMapDragGhost } from "./MindMapDragGhost";
import { MindMapNodeLayer } from "./MindMapNodeLayer";
import { MindMapDropPreview } from "./MindMapDropPreview";
import { isSamePreviewPosition, type PreviewPosition } from "./types";
import { MindMapConnections } from "./MindMapConnections";

interface MindMapProps {
  initialData: MindMapNodeType;
  width?: number;
  height?: number;
}

interface NodeBounds {
  id: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface SubtreeBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const HIT_TEST_CELL_SIZE = 240;

function getHitBucketKey(col: number, row: number): string {
  return `${col}:${row}`;
}

function collectVisibleNodeBounds(
  positions: Map<string, NodePosition>
): NodeBounds[] {
  const bounds: NodeBounds[] = [];
  positions.forEach((pos, id) => {
    if (!pos.visible) return;
    bounds.push({
      id,
      left: pos.x - pos.width / 2,
      right: pos.x + pos.width / 2,
      top: pos.y - pos.height / 2,
      bottom: pos.y + pos.height / 2,
    });
  });
  return bounds;
}

function buildHitBuckets(
  bounds: NodeBounds[],
  cellSize: number
): Map<string, NodeBounds[]> {
  const buckets = new Map<string, NodeBounds[]>();

  for (const item of bounds) {
    const minCol = Math.floor(item.left / cellSize);
    const maxCol = Math.floor(item.right / cellSize);
    const minRow = Math.floor(item.top / cellSize);
    const maxRow = Math.floor(item.bottom / cellSize);

    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        const key = getHitBucketKey(col, row);
        const bucket = buckets.get(key);
        if (bucket) {
          bucket.push(item);
        } else {
          buckets.set(key, [item]);
        }
      }
    }
  }

  return buckets;
}

function collectSubtreeBottom(
  rootNode: MindMapNodeType,
  positions: Map<string, NodePosition>
): Map<string, number> {
  const map = new Map<string, number>();

  const walk = (node: MindMapNodeType): number => {
    const pos = positions.get(node.id);
    if (!pos || !pos.visible) {
      return -Infinity;
    }

    let maxBottom = pos.y + pos.height / 2;
    if (!node.collapsed && node.children.length > 0) {
      for (const child of node.children) {
        maxBottom = Math.max(maxBottom, walk(child));
      }
    }

    map.set(node.id, maxBottom);
    return maxBottom;
  };

  walk(rootNode);
  return map;
}

function collectSubtreeBounds(
  rootNode: MindMapNodeType,
  positions: Map<string, NodePosition>
): Map<string, SubtreeBounds> {
  const map = new Map<string, SubtreeBounds>();

  const walk = (node: MindMapNodeType): SubtreeBounds | null => {
    const pos = positions.get(node.id);
    if (!pos || !pos.visible) {
      return null;
    }

    const current: SubtreeBounds = {
      minX: pos.x - pos.width / 2,
      maxX: pos.x + pos.width / 2,
      minY: pos.y - pos.height / 2,
      maxY: pos.y + pos.height / 2,
    };

    if (!node.collapsed && node.children.length > 0) {
      for (const child of node.children) {
        const childBounds = walk(child);
        if (!childBounds) continue;
        current.minX = Math.min(current.minX, childBounds.minX);
        current.maxX = Math.max(current.maxX, childBounds.maxX);
        current.minY = Math.min(current.minY, childBounds.minY);
        current.maxY = Math.max(current.maxY, childBounds.maxY);
      }
    }

    map.set(node.id, current);
    return current;
  };

  walk(rootNode);
  return map;
}

/**
 * 思维导图主容器组件
 * 负责整体渲染、画布操作（缩放、平移）、交互协调
 */
export function MindMap({
  initialData,
  width = 1200,
  height = 800,
}: MindMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const contentRef = useRef<SVGGElement>(null);

  const {
    rootNode,
    updateNode,
    addChild,
    addSibling,
    deleteNode,
    toggleCollapse,
    moveNode,
  } = useMindMapState(initialData);

  const positions = useLayout(rootNode);

  const nodeMap = useMemo(() => {
    const map = new Map<string, MindMapNodeType>();
    if (!rootNode) {
      return map;
    }

    const stack: MindMapNodeType[] = [rootNode];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) break;
      map.set(current.id, current);

      for (let i = current.children.length - 1; i >= 0; i--) {
        stack.push(current.children[i]);
      }
    }

    return map;
  }, [rootNode]);

  const visibleNodeBounds = useMemo(
    () => collectVisibleNodeBounds(positions),
    [positions]
  );
  const hitTestBuckets = useMemo(
    () => buildHitBuckets(visibleNodeBounds, HIT_TEST_CELL_SIZE),
    [visibleNodeBounds]
  );

  const subtreeBottomMap = useMemo(() => {
    if (!rootNode) {
      return new Map<string, number>();
    }
    return collectSubtreeBottom(rootNode, positions);
  }, [rootNode, positions]);
  const subtreeBoundsMap = useMemo(() => {
    if (!rootNode) {
      return new Map<string, SubtreeBounds>();
    }
    return collectSubtreeBounds(rootNode, positions);
  }, [rootNode, positions]);
  const visibleChildrenMap = useMemo(() => {
    const map = new Map<string, string[]>();
    nodeMap.forEach((node, id) => {
      map.set(
        id,
        node.children
          .filter((child) => positions.get(child.id)?.visible)
          .map((child) => child.id)
      );
    });
    return map;
  }, [nodeMap, positions]);

  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(width / 2);
  const [translateY, setTranslateY] = useState(height / 2);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panStartTranslate, setPanStartTranslate] = useState({ x: 0, y: 0 });

  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dragMousePos, setDragMousePos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [previewPosition, setPreviewPosition] =
    useState<PreviewPosition | null>(null);

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const viewRef = useRef({ scale: 1, translateX: width / 2, translateY: height / 2 });
  const panPreviewRef = useRef<{ x: number; y: number } | null>(null);
  const enableLargeNodePanOptimization = nodeMap.size > 500;
  const isInteracting = isPanning || isDraggingNode;
  const worldViewport = useMemo(() => {
    const minX = (0 - translateX) / scale;
    const maxX = (width - translateX) / scale;
    const minY = (0 - translateY) / scale;
    const maxY = (height - translateY) / scale;
    return { minX, maxX, minY, maxY };
  }, [translateX, translateY, scale, width, height]);

  const applyTransform = useCallback(
    (nextTranslateX: number, nextTranslateY: number, nextScale: number) => {
      if (!contentRef.current) return;
      contentRef.current.setAttribute(
        "transform",
        `translate(${nextTranslateX}, ${nextTranslateY}) scale(${nextScale})`
      );
    },
    []
  );

  useEffect(() => {
    viewRef.current = { scale, translateX, translateY };
    if (!isPanning && enableLargeNodePanOptimization) {
      applyTransform(translateX, translateY, scale);
    }
  }, [
    scale,
    translateX,
    translateY,
    isPanning,
    enableLargeNodePanOptimization,
    applyTransform,
  ]);

  useEffect(() => {
    if (positions.size > 0 && rootNode) {
      const bounds = getLayoutBounds(positions);
      const centerX = width / 2 - (bounds.minX + bounds.width / 2) * scale;
      const centerY = height / 2 - (bounds.minY + bounds.height / 2) * scale;
      setTranslateX(centerX);
      setTranslateY(centerY);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingNodeId || !selectedNodeId) return;

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      switch (e.key) {
        case "Enter":
          e.preventDefault();
          if (selectedNodeId !== rootNode?.id) {
            addSibling(selectedNodeId);
          }
          break;

        case "Tab":
          e.preventDefault();
          addChild(selectedNodeId);
          break;

        case "Delete":
        case "Backspace":
          e.preventDefault();
          if (selectedNodeId !== rootNode?.id) {
            if (confirm("确定要删除选中的节点吗？")) {
              deleteNode(selectedNodeId);
              setSelectedNodeId(null);
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedNodeId,
    editingNodeId,
    rootNode,
    addChild,
    addSibling,
    deleteNode,
  ]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - translateX) / scale;
      const worldY = (mouseY - translateY) / scale;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(3, scale * delta));

      setScale(newScale);
      setTranslateX(mouseX - worldX * newScale);
      setTranslateY(mouseY - worldY * newScale);
    },
    [scale, translateX, translateY]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (
        e.target === svgRef.current ||
        (e.target as Element).tagName === "svg"
      ) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        if (enableLargeNodePanOptimization) {
          setPanStartTranslate({
            x: viewRef.current.translateX,
            y: viewRef.current.translateY,
          });
          panPreviewRef.current = null;
        } else {
          setPanStartTranslate({ x: translateX, y: translateY });
        }
      }
    },
    [enableLargeNodePanOptimization, translateX, translateY]
  );

  const processPointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (isPanning) {
        const dx = clientX - panStart.x;
        const dy = clientY - panStart.y;
        const nextTranslateX = panStartTranslate.x + dx;
        const nextTranslateY = panStartTranslate.y + dy;
        if (enableLargeNodePanOptimization) {
          panPreviewRef.current = { x: nextTranslateX, y: nextTranslateY };
          applyTransform(nextTranslateX, nextTranslateY, viewRef.current.scale);
        } else {
          setTranslateX(nextTranslateX);
          setTranslateY(nextTranslateY);
        }
      }

      if (!isDraggingNode || !draggedNodeId) {
        return;
      }

      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      setDragMousePos((prev) =>
        prev.x === clientX && prev.y === clientY ? prev : { x: clientX, y: clientY }
      );

      const activeTranslateX =
        panPreviewRef.current?.x ?? viewRef.current.translateX;
      const activeTranslateY =
        panPreviewRef.current?.y ?? viewRef.current.translateY;
      const activeScale = viewRef.current.scale;

      const worldX = (clientX - rect.left - activeTranslateX) / activeScale;
      const worldY = (clientY - rect.top - activeTranslateY) / activeScale;

      const hitCol = Math.floor(worldX / HIT_TEST_CELL_SIZE);
      const hitRow = Math.floor(worldY / HIT_TEST_CELL_SIZE);
      const bucketKey = getHitBucketKey(hitCol, hitRow);
      const candidates = hitTestBuckets.get(bucketKey) || [];

      let targetId: string | null = null;
      for (const bounds of candidates) {
        if (bounds.id === draggedNodeId) continue;
        if (
          worldX >= bounds.left &&
          worldX <= bounds.right &&
          worldY >= bounds.top &&
          worldY <= bounds.bottom
        ) {
          targetId = bounds.id;
        }
      }

      setDropTargetId((prev) => (prev === targetId ? prev : targetId));

      if (!targetId) {
        setPreviewPosition((prev) => (prev === null ? prev : null));
        return;
      }

      const targetPos = positions.get(targetId);
      const draggedPos = positions.get(draggedNodeId);
      const draggedData = nodeMap.get(draggedNodeId);
      const targetNode = nodeMap.get(targetId);

      if (!targetPos || !draggedPos || !draggedData || !targetNode) {
        setPreviewPosition((prev) => (prev === null ? prev : null));
        return;
      }

      const visibleChildren = visibleChildrenMap.get(targetId) || [];

      const previewLevel = targetPos.level + 1;
      let previewX: number;
      let previewY: number;

      if (visibleChildren.length > 0) {
        const firstChildPos = positions.get(visibleChildren[0]);
        previewX = firstChildPos
          ? firstChildPos.x
          : targetPos.x + targetPos.width / 2 + 100;

        const lastChildId = visibleChildren[visibleChildren.length - 1];
        const lastChildPos = positions.get(lastChildId);
        if (lastChildPos) {
          const subtreeBottom =
            subtreeBottomMap.get(lastChildId) ??
            lastChildPos.y + lastChildPos.height / 2;
          const subtreeTop = lastChildPos.y - lastChildPos.height / 2;
          previewY = subtreeTop + (subtreeBottom - subtreeTop) + 40;
        } else {
          previewY = targetPos.y;
        }
      } else {
        previewX =
          targetPos.x + targetPos.width / 2 + 100 + draggedPos.width / 2;
        previewY = targetPos.y;
      }

      const nextPreview: PreviewPosition = {
        x: previewX,
        y: previewY,
        width: draggedPos.width,
        height: draggedPos.height,
        text: draggedData.text,
        level: previewLevel,
      };

      setPreviewPosition((prev) =>
        isSamePreviewPosition(prev, nextPreview) ? prev : nextPreview
      );
    },
    [
      isPanning,
      panStart,
      panStartTranslate,
      enableLargeNodePanOptimization,
      isDraggingNode,
      draggedNodeId,
      applyTransform,
      hitTestBuckets,
      positions,
      nodeMap,
      subtreeBottomMap,
      visibleChildrenMap,
    ]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      pendingPointerRef.current = { x: e.clientX, y: e.clientY };
      if (pointerFrameRef.current !== null) {
        return;
      }

      pointerFrameRef.current = window.requestAnimationFrame(() => {
        pointerFrameRef.current = null;
        const point = pendingPointerRef.current;
        if (!point) {
          return;
        }
        processPointerMove(point.x, point.y);
      });
    },
    [processPointerMove]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      if (enableLargeNodePanOptimization) {
        const panPreview = panPreviewRef.current;
        if (panPreview) {
          setTranslateX(panPreview.x);
          setTranslateY(panPreview.y);
        }
        panPreviewRef.current = null;
      }
      setIsPanning(false);
    }

    if (isDraggingNode && draggedNodeId && dropTargetId) {
      moveNode(draggedNodeId, dropTargetId);
    }

    setIsDraggingNode(false);
    setDraggedNodeId(null);
    setDropTargetId(null);
    setPreviewPosition(null);
    setDragMousePos({ x: 0, y: 0 });
    setDragOffset({ x: 0, y: 0 });
    pendingPointerRef.current = null;
    if (pointerFrameRef.current !== null) {
      window.cancelAnimationFrame(pointerFrameRef.current);
      pointerFrameRef.current = null;
    }
  }, [
    isPanning,
    enableLargeNodePanOptimization,
    isDraggingNode,
    draggedNodeId,
    dropTargetId,
    moveNode,
  ]);

  useEffect(() => {
    if (!isPanning && !isDraggingNode) {
      return;
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning, isDraggingNode, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return () => {
      if (pointerFrameRef.current !== null) {
        window.cancelAnimationFrame(pointerFrameRef.current);
      }
    };
  }, []);

  const handleStartDrag = useCallback(
    (nodeId: string, startX: number, startY: number) => {
      const pos = positions.get(nodeId);
      if (!pos || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const nodeScreenCenterX = pos.x * scale + translateX + rect.left;
      const nodeScreenCenterY = pos.y * scale + translateY + rect.top;
      const scaledWidth = pos.width * scale;
      const scaledHeight = pos.height * scale;
      const nodeScreenTopLeftX = nodeScreenCenterX - scaledWidth / 2;
      const nodeScreenTopLeftY = nodeScreenCenterY - scaledHeight / 2;

      setIsDraggingNode(true);
      setDraggedNodeId(nodeId);
      setDragMousePos({ x: startX, y: startY });
      setDragOffset({
        x: startX - nodeScreenTopLeftX,
        y: startY - nodeScreenTopLeftY,
      });
    },
    [positions, scale, translateX, translateY]
  );

  const handleStartEdit = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
  }, []);

  const handleFinishEdit = useCallback(
    (nodeId: string, text: string) => {
      updateNode(nodeId, text);
      setEditingNodeId(null);
    },
    [updateNode]
  );

  if (!rootNode) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-50">
        <p className="text-gray-500">无数据</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-50 overflow-hidden">
      <MindMapGuidePanel />
      <MindMapZoomIndicator scale={scale} />

      <MindMapDragGhost
        isDraggingNode={isDraggingNode}
        draggedNodeId={draggedNodeId}
        isInteracting={isInteracting}
        scale={scale}
        dragMousePos={dragMousePos}
        dragOffset={dragOffset}
        positions={positions}
        nodeMap={nodeMap}
      />

      <svg
        ref={svgRef}
        width={width}
        height={height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        className={
          isPanning
            ? "cursor-grabbing active:cursor-grabbing"
            : "cursor-grab active:cursor-grabbing"
        }
      >
        <g
          ref={contentRef}
          transform={`translate(${translateX}, ${translateY}) scale(${scale})`}
        >
          <MindMapConnections
            rootNode={rootNode}
            positions={positions}
            viewport={worldViewport}
            isInteracting={isInteracting}
          />

          <MindMapNodeLayer
            rootNode={rootNode}
            positions={positions}
            nodeMap={nodeMap}
            subtreeBoundsMap={subtreeBoundsMap}
            viewport={worldViewport}
            isInteracting={isInteracting}
            dropTargetId={dropTargetId}
            selectedNodeId={selectedNodeId}
            editingNodeId={editingNodeId}
            isDraggingNode={isDraggingNode}
            draggedNodeId={draggedNodeId}
            onSelectNode={setSelectedNodeId}
            onToggleCollapse={toggleCollapse}
            onStartEdit={handleStartEdit}
            onFinishEdit={handleFinishEdit}
            onStartDrag={handleStartDrag}
          />

          <MindMapDropPreview
            previewPosition={previewPosition}
            isDraggingNode={isDraggingNode}
            dropTargetId={dropTargetId}
            positions={positions}
            isInteracting={isInteracting}
          />
        </g>
      </svg>
    </div>
  );
}
