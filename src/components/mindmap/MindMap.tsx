import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { MindMapNode as MindMapNodeType } from "../../types/mindmap";
import { useMindMapState } from "./hooks/useMindMapState";
import { useLayout, getLayoutBounds } from "../../hooks/useLayout";
import { MindMapGuidePanel } from "./MindMapGuidePanel";
import { MindMapZoomIndicator } from "./MindMapZoomIndicator";
import { MindMapDragGhost } from "./MindMapDragGhost";
import { MindMapNodeLayer } from "./MindMapNodeLayer";
import { MindMapDropPreview } from "./MindMapDropPreview";
import { MindMapConnections } from "./MindMapConnections";
import {
  buildNodeMap,
  collectSubtreeBounds,
  getWorldViewport,
  type SubtreeBounds,
} from "./geometry";
import { useMindMapShortcuts } from "./hooks/useMindMapShortcuts";
import { useMindMapCanvasInteraction } from "./hooks/useMindMapCanvasInteraction";

interface MindMapProps {
  initialData: MindMapNodeType;
  width?: number;
  height?: number;
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
    undo,
    redo,
  } = useMindMapState(initialData);

  const positions = useLayout(rootNode);

  const nodeMap = useMemo(() => buildNodeMap(rootNode), [rootNode]);
  const subtreeBoundsMap = useMemo(() => {
    if (!rootNode) {
      return new Map<string, SubtreeBounds>();
    }
    return collectSubtreeBounds(rootNode, positions);
  }, [rootNode, positions]);

  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(width / 2);
  const [translateY, setTranslateY] = useState(height / 2);

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const hasAutoCenteredRef = useRef(false);
  const lastRootIdRef = useRef<string | null>(null);
  const viewRef = useRef({
    scale: 1,
    translateX: width / 2,
    translateY: height / 2,
  });
  const viewportSizeRef = useRef({ width, height });
  const worldViewport = useMemo(
    () => getWorldViewport(translateX, translateY, scale, width, height),
    [translateX, translateY, scale, width, height]
  );

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

  const {
    enableLargeNodePanOptimization,
    isPanning,
    isDraggingNode,
    draggedNodeId,
    dropTargetId,
    dragMousePos,
    dragOffset,
    previewPosition,
    handleMouseDown,
    handleStartDrag,
  } = useMindMapCanvasInteraction({
    svgRef,
    rootNode,
    positions,
    nodeMap,
    subtreeBoundsMap,
    scale,
    translateX,
    translateY,
    viewRef,
    applyTransform,
    setTranslateX,
    setTranslateY,
    moveNode,
  });
  const isInteracting = isPanning || isDraggingNode;

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
    if (lastRootIdRef.current !== rootNode?.id) {
      lastRootIdRef.current = rootNode?.id ?? null;
      hasAutoCenteredRef.current = false;
    }

    if (!rootNode || positions.size === 0 || hasAutoCenteredRef.current) {
      return;
    }

    const bounds = getLayoutBounds(positions);
    const centerX = width / 2 - (bounds.minX + bounds.width / 2) * scale;
    const centerY = height / 2 - (bounds.minY + bounds.height / 2) * scale;
    setTranslateX(centerX);
    setTranslateY(centerY);
    hasAutoCenteredRef.current = true;
  }, [positions, rootNode, width, height, scale]);

  useEffect(() => {
    const prev = viewportSizeRef.current;
    if (prev.width === width && prev.height === height) {
      return;
    }

    const deltaX = (width - prev.width) / 2;
    const deltaY = (height - prev.height) / 2;

    viewportSizeRef.current = { width, height };

    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    setTranslateX((current) => current + deltaX);
    setTranslateY((current) => current + deltaY);
  }, [width, height]);

  useEffect(() => {
    if (selectedNodeId && !nodeMap.has(selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId, nodeMap]);

  useMindMapShortcuts({
    selectedNodeId,
    editingNodeId,
    rootNodeId: rootNode?.id,
    addChild,
    addSibling,
    deleteNode,
    onClearSelection: () => setSelectedNodeId(null),
    undo,
    redo,
  });

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
