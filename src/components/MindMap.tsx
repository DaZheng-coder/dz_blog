import { useState, useRef, useEffect, useCallback } from "react";
import type { MindMapNode as MindMapNodeType } from "../types/mindmap";
import { useMindMapState } from "../hooks/useMindMapState";
import { useLayout, getLayoutBounds } from "../hooks/useLayout";
import { MindMapNode } from "./MindMapNode";
import { MindMapConnections } from "./MindMapConnections";

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

  // 状态管理
  const {
    rootNode,
    updateNode,
    addChild,
    addSibling,
    deleteNode,
    toggleCollapse,
    moveNode,
  } = useMindMapState(initialData);

  // 布局计算
  const positions = useLayout(rootNode);

  // 画布变换状态（缩放和平移）
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(width / 2);
  const [translateY, setTranslateY] = useState(height / 2);

  // 画布拖拽状态
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panStartTranslate, setPanStartTranslate] = useState({ x: 0, y: 0 });

  // 节点拖拽状态
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dragMousePos, setDragMousePos] = useState({ x: 0, y: 0 }); // 拖拽时的鼠标位置
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // 鼠标相对于节点的偏移量

  // 拖拽预览节点的位置和信息
  const [previewPosition, setPreviewPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    level: number;
  } | null>(null);

  // 编辑状态
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // 选中节点状态（用于键盘快捷键）
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // 初始化：自动居中显示
  useEffect(() => {
    if (positions.size > 0 && rootNode) {
      const bounds = getLayoutBounds(positions);
      const centerX = width / 2 - (bounds.minX + bounds.width / 2) * scale;
      const centerY = height / 2 - (bounds.minY + bounds.height / 2) * scale;
      setTranslateX(centerX);
      setTranslateY(centerY);
    }
  }, []); // 仅初始化时执行

  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在编辑，不处理快捷键
      if (editingNodeId) return;

      // 必须有选中的节点才能执行操作
      if (!selectedNodeId) return;

      // 防止在输入框中触发
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      switch (e.key) {
        case "Enter":
          // 添加同级节点
          e.preventDefault();
          if (selectedNodeId !== rootNode?.id) {
            addSibling(selectedNodeId);
          }
          break;

        case "Tab":
          // 添加子节点
          e.preventDefault();
          addChild(selectedNodeId);
          break;

        case "Delete":
        case "Backspace":
          // 删除节点（根节点除外）
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

  // ==================== 画布操作 ====================

  // 处理鼠标滚轮缩放
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // e.preventDefault();

      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      // 鼠标在画布中的位置
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // 计算缩放前鼠标指向的世界坐标
      const worldX = (mouseX - translateX) / scale;
      const worldY = (mouseY - translateY) / scale;

      // 缩放系数
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(3, scale * delta));

      // 计算新的平移量（保持鼠标指向的世界坐标不变）
      const newTranslateX = mouseX - worldX * newScale;
      const newTranslateY = mouseY - worldY * newScale;

      setScale(newScale);
      setTranslateX(newTranslateX);
      setTranslateY(newTranslateY);
    },
    [scale, translateX, translateY]
  );

  // 开始画布拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只有在点击空白处时才开始画布拖拽
    if (
      e.target === svgRef.current ||
      (e.target as Element).tagName === "svg"
    ) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setPanStartTranslate({ x: translateX, y: translateY });
    }
  };

  // 画布拖拽移动
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setTranslateX(panStartTranslate.x + dx);
        setTranslateY(panStartTranslate.y + dy);
      }

      // 节点拖拽时的鼠标跟随
      if (isDraggingNode && draggedNodeId) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;

        // 更新鼠标位置（屏幕坐标）
        setDragMousePos({ x: e.clientX, y: e.clientY });

        // 计算鼠标在世界坐标系中的位置
        const worldX = (e.clientX - rect.left - translateX) / scale;
        const worldY = (e.clientY - rect.top - translateY) / scale;

        // 检测是否悬停在某个节点上（作为拖拽目标）
        let targetId: string | null = null;
        positions.forEach((pos, id) => {
          if (id === draggedNodeId) return; // 排除自己

          const dx = worldX - pos.x;
          const dy = worldY - pos.y;
          const inBounds =
            Math.abs(dx) < pos.width / 2 && Math.abs(dy) < pos.height / 2;

          if (inBounds) {
            targetId = id;
          }
        });

        setDropTargetId(targetId);

        // 计算预览节点的位置
        if (targetId && rootNode) {
          const targetPos = positions.get(targetId);
          const draggedPos = positions.get(draggedNodeId);
          const draggedData = findNodeData(draggedNodeId, rootNode);

          if (targetPos && draggedPos && draggedData) {
            const targetNode = findNodeData(targetId, rootNode);

            // 计算预览节点应该在目标节点的子节点列表中的位置
            // 获取目标节点的所有可见子节点
            const targetChildren = targetNode?.children || [];
            const visibleChildren = targetChildren.filter(
              (child) => positions.get(child.id)?.visible
            );

            // 预览节点的层级是目标节点层级 + 1
            const previewLevel = targetPos.level + 1;

            // 计算预览节点的位置
            let previewX: number;
            let previewY: number;

            if (visibleChildren.length > 0) {
              // 如果目标节点已有子节点，使用第一个子节点的 X 坐标对齐
              const firstChildPos = positions.get(visibleChildren[0].id);
              if (firstChildPos) {
                previewX = firstChildPos.x;
              } else {
                previewX = targetPos.x + targetPos.width / 2 + 100;
              }

              // Y 坐标在最后一个子节点下方
              const lastChildId =
                visibleChildren[visibleChildren.length - 1].id;
              const lastChildPos = positions.get(lastChildId);
              if (lastChildPos) {
                // 计算最后一个子节点及其子树的高度
                const calculateNodeAndSubtreeHeight = (
                  nodeId: string
                ): number => {
                  const pos = positions.get(nodeId);
                  if (!pos) return 0;

                  const node = findNodeData(nodeId, rootNode);
                  if (!node || !node.children || node.children.length === 0) {
                    return pos.height;
                  }

                  // 如果节点已折叠，只返回节点自身高度
                  if (node.collapsed) {
                    return pos.height;
                  }

                  // 递归计算所有可见子节点的高度
                  let maxChildBottom = lastChildPos.y + lastChildPos.height / 2;
                  const calculateChildrenBottom = (parentNode: typeof node) => {
                    for (const child of parentNode.children) {
                      const childPos = positions.get(child.id);
                      if (childPos && childPos.visible) {
                        const childBottom = childPos.y + childPos.height / 2;
                        maxChildBottom = Math.max(maxChildBottom, childBottom);
                        if (!child.collapsed && child.children.length > 0) {
                          calculateChildrenBottom(child);
                        }
                      }
                    }
                  };

                  const lastChildNode = findNodeData(nodeId, rootNode);
                  if (lastChildNode && !lastChildNode.collapsed) {
                    calculateChildrenBottom(lastChildNode);
                  }

                  return (
                    maxChildBottom - (lastChildPos.y - lastChildPos.height / 2)
                  );
                };

                const subtreeHeight =
                  calculateNodeAndSubtreeHeight(lastChildId);
                previewY =
                  lastChildPos.y - lastChildPos.height / 2 + subtreeHeight + 40; // 垂直间距
              } else {
                previewY = targetPos.y;
              }
            } else {
              // 如果目标节点没有子节点，基于目标节点位置计算
              // X 坐标：目标节点右边 + 水平间距 + 预览节点宽度的一半
              previewX =
                targetPos.x + targetPos.width / 2 + 100 + draggedPos.width / 2;
              // Y 坐标：与目标节点对齐
              previewY = targetPos.y;
            }

            setPreviewPosition({
              x: previewX,
              y: previewY,
              width: draggedPos.width,
              height: draggedPos.height,
              text: draggedData.text,
              level: previewLevel,
            });
          } else {
            setPreviewPosition(null);
          }
        } else {
          setPreviewPosition(null);
        }
      }
    },
    [
      isPanning,
      panStart,
      panStartTranslate,
      isDraggingNode,
      draggedNodeId,
      translateX,
      translateY,
      scale,
      positions,
    ]
  );

  // 结束拖拽
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (isDraggingNode && draggedNodeId && dropTargetId) {
      // 执行节点移动
      moveNode(draggedNodeId, dropTargetId);
    }

    setIsDraggingNode(false);
    setDraggedNodeId(null);
    setDropTargetId(null);
    setPreviewPosition(null);
    setDragMousePos({ x: 0, y: 0 });
    setDragOffset({ x: 0, y: 0 });
  }, [isPanning, isDraggingNode, draggedNodeId, dropTargetId, moveNode]);

  // 监听全局鼠标事件
  useEffect(() => {
    if (isPanning || isDraggingNode) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isPanning, isDraggingNode, handleMouseMove, handleMouseUp]);

  // ==================== 节点操作 ====================

  // 开始节点拖拽
  const handleStartDrag = useCallback(
    (nodeId: string, startX: number, startY: number) => {
      const pos = positions.get(nodeId);
      if (!pos || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();

      // 计算节点中心在屏幕上的位置（世界坐标 -> 屏幕坐标）
      const nodeScreenCenterX = pos.x * scale + translateX + rect.left;
      const nodeScreenCenterY = pos.y * scale + translateY + rect.top;

      // 计算节点左上角在屏幕上的位置（考虑缩放后的尺寸）
      const scaledWidth = pos.width * scale;
      const scaledHeight = pos.height * scale;
      const nodeScreenTopLeftX = nodeScreenCenterX - scaledWidth / 2;
      const nodeScreenTopLeftY = nodeScreenCenterY - scaledHeight / 2;

      // 计算鼠标相对于节点左上角的偏移量
      const offsetX = startX - nodeScreenTopLeftX;
      const offsetY = startY - nodeScreenTopLeftY;

      console.log("offsetX", offsetX);
      console.log("offsetY", offsetY);

      setIsDraggingNode(true);
      setDraggedNodeId(nodeId);
      setDragMousePos({ x: startX, y: startY });
      setDragOffset({ x: offsetX, y: offsetY });
    },
    [positions, scale, translateX, translateY]
  );

  // 开始编辑节点
  const handleStartEdit = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
  }, []);

  // 完成编辑节点
  const handleFinishEdit = useCallback(
    (nodeId: string, text: string) => {
      updateNode(nodeId, text);
      setEditingNodeId(null);
    },
    [updateNode]
  );

  // ==================== 辅助函数 ====================

  // 查找节点数据
  const findNodeData = useCallback(
    (nodeId: string, node: MindMapNodeType): MindMapNodeType | null => {
      if (node.id === nodeId) return node;
      for (const child of node.children) {
        const found = findNodeData(nodeId, child);
        if (found) return found;
      }
      return null;
    },
    []
  );

  // 获取节点样式（与MindMapNode组件中的样式逻辑保持一致）
  const getNodeStyle = useCallback(
    (nodeId: string) => {
      const position = positions.get(nodeId);
      if (!position) {
        return {
          bgColor: "bg-gray-200",
          textColor: "text-gray-800",
          borderColor: "border-gray-300",
        };
      }

      const { level } = position;
      const isRoot = level === 0;
      const bgColor = isRoot
        ? "bg-blue-500"
        : level === 1
        ? "bg-green-500"
        : "bg-gray-200";
      const textColor = level < 2 ? "text-white" : "text-gray-800";
      const borderColor = "border-gray-300";

      return { bgColor, textColor, borderColor };
    },
    [positions]
  );

  // ==================== 递归渲染节点 ====================

  const renderNodes = (node: MindMapNodeType): React.ReactNode => {
    const position = positions.get(node.id);
    if (!position) return null;

    // 如果是拖拽目标，高亮显示
    const isDropTarget = dropTargetId === node.id;
    // 是否被选中
    const isSelected = selectedNodeId === node.id;

    return (
      <g key={node.id}>
        {/* 选中节点的高亮边框 */}
        {/* {isSelected && !isDropTarget && (
          <rect
            x={position.x - position.width / 2 - 3}
            y={position.y - position.height / 2 - 3}
            width={position.width + 6}
            height={position.height + 6}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            rx="8"
          />
        )} */}

        {/* 拖拽目标高亮指示器和插入预览 */}
        {isDropTarget && (
          <>
            {/* 高亮边框 */}
            <rect
              x={position.x - position.width / 2 - 4}
              y={position.y - position.height / 2 - 4}
              width={position.width + 8}
              height={position.height + 8}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeDasharray="5,5"
              rx="8"
              className="animate-pulse"
            />
            {/* 插入位置指示线（右侧） */}
            <line
              x1={position.x + position.width / 2 + 10}
              y1={position.y - 20}
              x2={position.x + position.width / 2 + 10}
              y2={position.y + 20}
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
              className="animate-pulse"
            />
            {/* 插入箭头 */}
            <path
              d={`M ${position.x + position.width / 2 + 10} ${
                position.y
              } l 8 -6 l 0 3 l 12 0 l 0 6 l -12 0 l 0 3 z`}
              fill="#3b82f6"
              className="animate-pulse"
            />
          </>
        )}

        {/* 节点本身 - 如果正在编辑，跳过渲染（稍后单独渲染） */}
        {editingNodeId !== node.id && (
          <MindMapNode
            node={node}
            position={position}
            isEditing={false}
            isSelected={isSelected}
            isDragging={isDraggingNode && draggedNodeId === node.id}
            onSelect={() => setSelectedNodeId(node.id)}
            onToggleCollapse={toggleCollapse}
            onStartEdit={handleStartEdit}
            onFinishEdit={handleFinishEdit}
            onStartDrag={handleStartDrag}
          />
        )}

        {/* 递归渲染子节点 */}
        {!node.collapsed && node.children.map((child) => renderNodes(child))}
      </g>
    );
  };

  if (!rootNode) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-50">
        <p className="text-gray-500">无数据</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-50 overflow-hidden">
      {/* 操作提示 */}
      <div className="absolute top-4 left-4 bg-white shadow-md rounded-lg p-3 text-xs text-gray-600 z-10 max-w-xs">
        <div className="font-semibold mb-2 text-blue-600">🎯 操作指南</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-blue-500">•</span>
            <span>单击节点：选中节点（选中后可用快捷键）</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-500">•</span>
            <span>双击节点：编辑文本</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">•</span>
            <span>拖拽节点：移动到其他节点下（显示插入预览）</span>
          </div>
          <div className="border-t border-gray-200 my-2"></div>
          <div className="font-semibold mb-1 text-green-600">⌨️ 快捷键</div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">•</span>
            <span>
              <kbd className="px-1 bg-gray-100 border rounded">Enter</kbd>{" "}
              添加同级节点
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">•</span>
            <span>
              <kbd className="px-1 bg-gray-100 border rounded">Tab</kbd>{" "}
              添加子节点
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">•</span>
            <span>
              <kbd className="px-1 bg-gray-100 border rounded">Delete</kbd>{" "}
              删除选中节点
            </span>
          </div>
          <div className="border-t border-gray-200 my-2"></div>
          <div className="flex items-center gap-2">
            <span className="text-purple-500">•</span>
            <span>滚轮：缩放画布</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-purple-500">•</span>
            <span>拖拽空白：平移画布</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-500">•</span>
            <span>+/− 按钮：展开/收缩子节点</span>
          </div>
        </div>
      </div>

      {/* 缩放比例显示 */}
      <div className="absolute top-4 right-4 bg-white shadow-md rounded-lg px-3 py-2 text-sm text-gray-700 z-10">
        缩放: {(scale * 100).toFixed(0)}%
      </div>

      {/* 拖拽预览节点（跟随鼠标） */}
      {isDraggingNode &&
        draggedNodeId &&
        rootNode &&
        (() => {
          const nodeData = findNodeData(draggedNodeId, rootNode);
          const { bgColor, textColor, borderColor } =
            getNodeStyle(draggedNodeId);

          // 获取原节点的尺寸
          const nodePosition = positions.get(draggedNodeId);
          const nodeWidth = nodePosition?.width || 120;
          const nodeHeight = nodePosition?.height || 40;

          // 节点左上角位置 = 鼠标位置 - 偏移量（因为偏移量是鼠标相对于节点左上角的偏移）
          const nodeTopLeftX = dragMousePos.x - dragOffset.x;
          const nodeTopLeftY = dragMousePos.y - dragOffset.y;

          return (
            <div
              className="fixed pointer-events-none z-50"
              style={{
                left: nodeTopLeftX,
                top: nodeTopLeftY,
                transform: `scale(${scale})`,
                transformOrigin: "left top",
              }}
            >
              <div
                className={`${bgColor} ${textColor} flex items-center justify-center rounded-lg shadow-2xl border-2 ${borderColor} opacity-90 text-sm font-medium`}
                style={{
                  width: `${nodeWidth}px`,
                  height: `${nodeHeight}px`,
                  padding: "0.5rem 0.75rem",
                  boxSizing: "border-box",
                }}
              >
                <span
                  className="break-words text-center"
                  style={{
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    lineHeight: "22px",
                  }}
                >
                  {nodeData?.text || "拖拽中..."}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1 bg-white px-2 py-1 rounded shadow">
                拖拽到目标节点以添加为子节点
              </div>
            </div>
          );
        })()}

      {/* SVG 画布 */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        className="cursor-grab active:cursor-grabbing"
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
      >
        {/* 应用变换 */}
        <g
          transform={`translate(${translateX}, ${translateY}) scale(${scale})`}
        >
          {/* 连接线 */}
          <MindMapConnections rootNode={rootNode} positions={positions} />

          {/* 节点 - 先渲染非编辑状态的节点 */}
          {renderNodes(rootNode)}

          {/* 正在编辑的节点 - 最后渲染，确保显示在最上层 */}
          {editingNodeId &&
            (() => {
              const editingNodePos = positions.get(editingNodeId);
              if (!editingNodePos || !rootNode) return null;

              const findAndRenderEditingNode = (
                node: MindMapNodeType
              ): React.ReactElement | null => {
                if (node.id === editingNodeId) {
                  const position = positions.get(node.id);
                  if (!position) return null;

                  return (
                    <MindMapNode
                      key={`editing-${node.id}`}
                      node={node}
                      position={position}
                      isEditing={true}
                      isSelected={selectedNodeId === node.id}
                      isDragging={false}
                      onSelect={() => setSelectedNodeId(node.id)}
                      onToggleCollapse={toggleCollapse}
                      onStartEdit={handleStartEdit}
                      onFinishEdit={handleFinishEdit}
                      onStartDrag={handleStartDrag}
                    />
                  );
                }

                for (const child of node.children) {
                  const result = findAndRenderEditingNode(child);
                  if (result) return result;
                }

                return null;
              };

              return findAndRenderEditingNode(rootNode);
            })()}

          {/* 拖拽预览节点（在 SVG 画布中显示插入位置） */}
          {previewPosition && isDraggingNode && (
            <g className="preview-node" style={{ pointerEvents: "none" }}>
              {/* 连接线预览 - 从目标节点到预览节点 */}
              {dropTargetId &&
                (() => {
                  const targetPos = positions.get(dropTargetId);
                  if (!targetPos) return null;

                  const startX = targetPos.x + targetPos.width / 2;
                  const startY = targetPos.y;
                  const endX = previewPosition.x - previewPosition.width / 2;
                  const endY = previewPosition.y;

                  const controlX1 = startX + (endX - startX) / 2;
                  const controlY1 = startY;
                  const controlX2 = startX + (endX - startX) / 2;
                  const controlY2 = endY;

                  return (
                    <path
                      d={`M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      opacity="0.8"
                    />
                  );
                })()}

              {/* 预览节点矩形 */}
              <foreignObject
                x={previewPosition.x - previewPosition.width / 2}
                y={previewPosition.y - previewPosition.height / 2}
                width={previewPosition.width}
                height={previewPosition.height}
              >
                <div
                  className={`w-full h-full flex items-center justify-center px-3 py-2 rounded-lg border-2 ${
                    previewPosition.level === 0
                      ? "bg-blue-500 text-white border-blue-600"
                      : previewPosition.level === 1
                      ? "bg-green-500 text-white border-green-600"
                      : "bg-gray-200 text-gray-800 border-gray-400"
                  }`}
                  style={{
                    opacity: 0.85,
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <span
                    className="text-sm font-medium break-words text-center"
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      lineHeight: "22px",
                    }}
                  >
                    {previewPosition.text}
                  </span>
                </div>
              </foreignObject>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
