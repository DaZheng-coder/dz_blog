import { memo, useState, useRef, useEffect } from "react";
import type {
  MindMapNode as MindMapNodeType,
  NodePosition,
} from "../../types/mindmap";
import { getLevelNodeStyle } from "./styles";

interface MindMapNodeProps {
  node: MindMapNodeType;
  position: NodePosition;
  isEditing: boolean;
  isSelected: boolean;
  isDragging?: boolean; // 是否正在被拖拽
  onSelect: (nodeId: string) => void;
  onToggleCollapse: (nodeId: string) => void;
  onStartEdit: (nodeId: string) => void;
  onFinishEdit: (nodeId: string, text: string) => void;
  onStartDrag: (nodeId: string, startX: number, startY: number) => void;
}

/**
 * 思维导图节点组件
 * 负责渲染单个节点及其交互功能
 */
export const MindMapNode = memo(function MindMapNode({
  node,
  position,
  isEditing,
  isSelected,
  isDragging = false,
  onSelect,
  onToggleCollapse,
  onStartEdit,
  onFinishEdit,
  onStartDrag,
}: MindMapNodeProps) {
  const { x, y, width, height, level } = position;

  const [editText, setEditText] = useState(node.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isInitialEdit = useRef(true); // 标记是否是初次进入编辑模式

  // 编辑时动态调整的尺寸（临时放大）
  const [editWidth, setEditWidth] = useState(width);
  const [editHeight, setEditHeight] = useState(height);

  // 编辑模式时自动聚焦文本框并重置尺寸为当前节点尺寸
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      // 重置编辑尺寸为节点当前尺寸（确保初始大小一致）
      setEditWidth(width);
      setEditHeight(height);
      // 标记为初次编辑，不重新计算高度
      isInitialEdit.current = true;
    }
  }, [isEditing, width, height]);

  // 根据文本内容动态调整textarea尺寸（仅在文本变化时）
  useEffect(() => {
    // 跳过初次进入编辑模式的计算
    if (isInitialEdit.current) {
      isInitialEdit.current = false;
      return;
    }

    // 只在编辑模式且文本内容变化时才重新计算
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;

      // 配置常量
      const MAX_NODE_WIDTH = 220;
      const MIN_NODE_HEIGHT = 40;
      const PADDING_X = 16;
      const FONT_SIZE = 14;

      // 1. 计算高度：基于scrollHeight，无最大高度限制
      // 临时重置高度以获取准确的scrollHeight
      textarea.style.height = "auto";

      // 使用requestAnimationFrame确保DOM更新后再读取scrollHeight
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const scrollHeight = textareaRef.current.scrollHeight;
          // scrollHeight 已经包含了 textarea 的 padding
          // 确保不小于原始节点高度和最小高度
          const newHeight = Math.max(MIN_NODE_HEIGHT, height, scrollHeight);
          setEditHeight(newHeight);
          // 立即应用高度，避免闪烁
          textareaRef.current.style.height = `${newHeight}px`;
        }
      });

      // 2. 计算宽度：使用Canvas精确测量文本宽度
      if (!measureCanvasRef.current) {
        measureCanvasRef.current = document.createElement("canvas");
      }
      const context = measureCanvasRef.current.getContext("2d");
      if (context) {
        // 获取textarea的字体样式
        const computedStyle = window.getComputedStyle(textarea);
        context.font = `${computedStyle.fontWeight} ${FONT_SIZE}px ${computedStyle.fontFamily}`;

        // 测量最长一行的宽度
        const lines = editText.split("\n");
        let maxLineWidth = 0;
        lines.forEach((line) => {
          const lineWidth = context.measureText(line || " ").width;
          maxLineWidth = Math.max(maxLineWidth, lineWidth);
        });

        // 计算需要的总宽度（文本宽度 + padding）
        const requiredWidth = maxLineWidth + PADDING_X * 2;

        // 限制在最大宽度内，但不小于原始节点宽度
        const newWidth = Math.max(
          width,
          Math.min(requiredWidth, MAX_NODE_WIDTH)
        );
        setEditWidth(newWidth);
      }
    }
  }, [isEditing, editText, width, height]);

  // 如果节点不可见，不渲染
  if (!position.visible) {
    return null;
  }
  const hasChildren = node.children && node.children.length > 0;

  // 处理编辑完成
  const handleFinishEdit = () => {
    if (editText.trim()) {
      onFinishEdit(node.id, editText.trim());
    } else {
      setEditText(node.text); // 恢复原文本
    }
  };

  // 处理单击选中节点
  const handleClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮，不选中
    if ((e.target as HTMLElement).tagName === "BUTTON") {
      return;
    }
    e.stopPropagation();
    onSelect(node.id);
  };

  // 处理双击进入编辑
  const handleDoubleClick = () => {
    onStartEdit(node.id);
  };

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只响应左键（button === 0）
    if (e.button !== 0) {
      return;
    }
    // 如果正在编辑或点击的是按钮，不触发拖拽
    if (isEditing || (e.target as HTMLElement).tagName === "BUTTON") {
      return;
    }
    e.stopPropagation();
    onStartDrag(node.id, e.clientX, e.clientY);
  };

  const { bgColor, textColor, borderColor: defaultBorderColor } =
    getLevelNodeStyle(level);
  const borderColor = isSelected
    ? "border-2 border-orange-400"
    : `border-2 ${defaultBorderColor}`;

  // 编辑模式下使用动态尺寸，非编辑模式使用原始尺寸
  const displayWidth = isEditing ? editWidth : width;
  const displayHeight = isEditing ? editHeight : height;

  return (
    <g className={isDragging ? "opacity-40" : "opacity-100"}>
      {/* 节点矩形 */}
      <foreignObject
        x={x - displayWidth / 2}
        y={y - displayHeight / 2}
        width={displayWidth}
        height={displayHeight}
      >
        <div
          className={`w-full h-full flex items-center px-3 py-2 rounded-lg cursor-move select-none ${bgColor} ${textColor} ${borderColor} relative`}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
        >
          {isEditing ? (
            /* 编辑模式 */
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleFinishEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleFinishEdit();
                } else if (e.key === "Escape") {
                  setEditText(node.text);
                  onFinishEdit(node.id, node.text);
                }
              }}
              style={{
                height: `${editHeight}px`,
              }}
              rows={1}
              className={`w-full ${bgColor} ${textColor} px-3 py-2 rounded outline-none text-sm resize-none border-0 bg-transparent leading-[22px] break-words overflow-hidden box-border min-h-10`}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            /* 显示模式 */
            <div className="flex items-center justify-center w-full">
              <span
                className="text-sm font-medium break-words text-center leading-[22px] [hyphens:auto]"
              >
                {node.text}
              </span>
            </div>
          )}
        </div>
      </foreignObject>

      {/* 展开/收缩按钮 - 位于节点右侧边缘居中 */}
      {hasChildren && !isEditing && (
        <g
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(node.id);
          }}
          className="cursor-pointer"
        >
          <circle
            cx={x + width / 2 + 10}
            cy={y}
            r="10"
            fill="white"
            stroke="#94a3b8"
            strokeWidth="2"
            className="hover:fill-gray-100 hover:stroke-blue-400 transition-all"
          />
          <text
            x={x + width / 2 + 10}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#374151"
            fontSize="14"
            fontWeight="bold"
            className="select-none"
          >
            {node.collapsed ? "+" : "−"}
          </text>
        </g>
      )}
    </g>
  );
});
