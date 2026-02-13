import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type RefObject,
  type MouseEvent as ReactMouseEvent,
  type SetStateAction,
} from "react";
import type { MindMapNode, NodePosition } from "../../../types/mindmap";
import { isSamePreviewPosition, type PreviewPosition } from "../types";
import {
  getInsertIndexByPointerY,
  getPreviewYByInsertIndex,
  resolveDropTargetInBlankArea,
} from "../dragInsert";
import { HIT_TEST_CELL_SIZE, getHitBucketKey, type SubtreeBounds } from "../geometry";
import {
  buildHitBuckets,
  buildParentIdMap,
  buildVisibleChildrenMap,
  collectSubtreeBottom,
  collectVisibleNodeBounds,
} from "../geometry";

interface UseMindMapCanvasInteractionParams {
  svgRef: RefObject<SVGSVGElement | null>;
  rootNode: MindMapNode | null;
  positions: Map<string, NodePosition>;
  nodeMap: Map<string, MindMapNode>;
  subtreeBoundsMap: Map<string, SubtreeBounds>;
  scale: number;
  translateX: number;
  translateY: number;
  viewRef: MutableRefObject<{
    scale: number;
    translateX: number;
    translateY: number;
  }>;
  applyTransform: (nextTranslateX: number, nextTranslateY: number, nextScale: number) => void;
  setTranslateX: Dispatch<SetStateAction<number>>;
  setTranslateY: Dispatch<SetStateAction<number>>;
  moveNode: (nodeId: string, targetParentId: string, targetIndex?: number) => void;
}

export function useMindMapCanvasInteraction({
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
}: UseMindMapCanvasInteractionParams) {
  const parentIdMap = useMemo(() => buildParentIdMap(rootNode), [rootNode]);
  const visibleChildrenMap = useMemo(
    () => buildVisibleChildrenMap(nodeMap, positions),
    [nodeMap, positions]
  );
  const subtreeBottomMap = useMemo(() => {
    if (!rootNode) {
      return new Map<string, number>();
    }
    return collectSubtreeBottom(rootNode, positions);
  }, [rootNode, positions]);
  const visibleNodeBounds = useMemo(
    () => collectVisibleNodeBounds(positions),
    [positions]
  );
  const hitTestBuckets = useMemo(
    () => buildHitBuckets(visibleNodeBounds, HIT_TEST_CELL_SIZE),
    [visibleNodeBounds]
  );
  const enableLargeNodePanOptimization = nodeMap.size > 500;

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panStartTranslate, setPanStartTranslate] = useState({ x: 0, y: 0 });

  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null);
  const [dragMousePos, setDragMousePos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [previewPosition, setPreviewPosition] =
    useState<PreviewPosition | null>(null);

  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const panPreviewRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
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
    [
      svgRef,
      enableLargeNodePanOptimization,
      viewRef,
      translateX,
      translateY,
    ]
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

      if (!targetId) {
        targetId = resolveDropTargetInBlankArea({
          worldX,
          worldY,
          hitCol,
          hitRow,
          hitTestBuckets,
          positions,
          visibleChildrenMap,
          parentIdMap,
          draggedNodeId,
          subtreeBottomMap,
          subtreeBoundsMap,
        });
      }

      setDropTargetId((prev) => (prev === targetId ? prev : targetId));

      if (!targetId) {
        setDropInsertIndex((prev) => (prev === null ? prev : null));
        setPreviewPosition((prev) => (prev === null ? prev : null));
        return;
      }

      const targetPos = positions.get(targetId);
      const draggedPos = positions.get(draggedNodeId);
      const draggedData = nodeMap.get(draggedNodeId);
      const targetNode = nodeMap.get(targetId);

      if (!targetPos || !draggedPos || !draggedData || !targetNode) {
        setDropInsertIndex((prev) => (prev === null ? prev : null));
        setPreviewPosition((prev) => (prev === null ? prev : null));
        return;
      }

      const visibleChildren = visibleChildrenMap.get(targetId) || [];
      const insertIndex =
        visibleChildren.length === 0
          ? targetNode.children.length
          : getInsertIndexByPointerY(worldY, visibleChildren, positions, targetPos);
      setDropInsertIndex((prev) => (prev === insertIndex ? prev : insertIndex));

      const previewLevel = targetPos.level + 1;
      let previewX: number;
      let previewY: number;

      if (visibleChildren.length > 0) {
        const firstChildPos = positions.get(visibleChildren[0]);
        previewX = firstChildPos
          ? firstChildPos.x
          : targetPos.x + targetPos.width / 2 + 100;
        previewY = getPreviewYByInsertIndex(
          insertIndex,
          visibleChildren,
          positions,
          subtreeBottomMap,
          subtreeBoundsMap,
          targetPos.y
        );
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
      applyTransform,
      viewRef,
      setTranslateX,
      setTranslateY,
      isDraggingNode,
      draggedNodeId,
      svgRef,
      hitTestBuckets,
      positions,
      visibleChildrenMap,
      parentIdMap,
      subtreeBottomMap,
      subtreeBoundsMap,
      nodeMap,
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
      moveNode(
        draggedNodeId,
        dropTargetId,
        dropInsertIndex === null ? undefined : dropInsertIndex
      );
    }

    setIsDraggingNode(false);
    setDraggedNodeId(null);
    setDropTargetId(null);
    setDropInsertIndex(null);
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
    setTranslateX,
    setTranslateY,
    isDraggingNode,
    draggedNodeId,
    dropTargetId,
    dropInsertIndex,
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
      setDropInsertIndex(null);
      setDragMousePos({ x: startX, y: startY });
      setDragOffset({
        x: startX - nodeScreenTopLeftX,
        y: startY - nodeScreenTopLeftY,
      });
    },
    [positions, svgRef, scale, translateX, translateY]
  );

  return {
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
  };
}
