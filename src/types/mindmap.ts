/**
 * 思维导图节点数据结构
 */
export interface MindMapNode {
  id: string;           // 唯一标识
  text: string;         // 节点文本
  children: MindMapNode[]; // 子节点
  collapsed?: boolean;  // 是否收缩（隐藏子节点）
  style?: NodeStyle;    // 自定义样式（可选）
}

/**
 * 节点样式配置
 */
export interface NodeStyle {
  bgColor?: string;     // 背景色
  textColor?: string;   // 文字颜色
  borderColor?: string; // 边框颜色
  fontSize?: number;    // 字体大小
}

/**
 * 节点布局位置信息（计算后的渲染坐标）
 */
export interface NodePosition {
  id: string;
  x: number;            // 节点中心 X 坐标
  y: number;            // 节点中心 Y 坐标
  width: number;        // 节点宽度
  height: number;       // 节点高度
  level: number;        // 节点层级（0 为根节点）
  visible: boolean;     // 是否可见（父节点收缩时子节点不可见）
}

/**
 * 画布变换状态
 */
export interface ViewTransform {
  scale: number;        // 缩放比例
  translateX: number;   // X 轴平移距离
  translateY: number;   // Y 轴平移距离
}

/**
 * 拖拽状态
 */
export interface DragState {
  isDragging: boolean;
  draggedNodeId: string | null;
  dragStartX: number;
  dragStartY: number;
  currentX: number;
  currentY: number;
  targetNodeId: string | null; // 拖拽目标节点（将成为其子节点）
}

/**
 * 编辑状态
 */
export interface EditState {
  isEditing: boolean;
  editingNodeId: string | null;
  editingText: string;
}

/**
 * 操作类型枚举
 */
export enum ActionType {
  UPDATE_NODE = 'UPDATE_NODE',
  ADD_CHILD = 'ADD_CHILD',
  ADD_SIBLING = 'ADD_SIBLING',
  DELETE_NODE = 'DELETE_NODE',
  TOGGLE_COLLAPSE = 'TOGGLE_COLLAPSE',
  MOVE_NODE = 'MOVE_NODE',
}

/**
 * 状态更新 Action
 */
export type MindMapAction =
  | { type: ActionType.UPDATE_NODE; nodeId: string; text: string }
  | { type: ActionType.ADD_CHILD; parentId: string; newNode: MindMapNode }
  | { type: ActionType.ADD_SIBLING; nodeId: string; newNode: MindMapNode }
  | { type: ActionType.DELETE_NODE; nodeId: string }
  | { type: ActionType.TOGGLE_COLLAPSE; nodeId: string }
  | {
      type: ActionType.MOVE_NODE;
      nodeId: string;
      targetParentId: string;
      targetIndex?: number;
    };
