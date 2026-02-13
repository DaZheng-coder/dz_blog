import { useReducer, useCallback, useEffect } from "react";
import type { MindMapNode } from "../../../types/mindmap";
import { ActionType } from "../../../types/mindmap";
import {
  createInitialHistoryState,
  historyReducer,
} from "./mindmapState/history";

function createNode(text: string): MindMapNode {
  return {
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text,
    children: [],
  };
}

/**
 * 思维导图状态管理 Hook
 */
export function useMindMapState(initialData: MindMapNode | null) {
  const [historyState, dispatch] = useReducer(
    historyReducer,
    createInitialHistoryState(initialData)
  );

  const { present: rootNode, past, future } = historyState;

  useEffect(() => {
    dispatch({ type: "RESET", data: initialData });
  }, [initialData]);

  // 更新节点文本
  const updateNode = useCallback((nodeId: string, text: string) => {
    dispatch({
      type: "APPLY",
      action: { type: ActionType.UPDATE_NODE, nodeId, text },
    });
  }, []);

  // 添加子节点
  const addChild = useCallback((parentId: string, text: string = "新节点") => {
    const newNode = createNode(text);
    dispatch({
      type: "APPLY",
      action: { type: ActionType.ADD_CHILD, parentId, newNode },
    });
  }, []);

  // 添加同级节点
  const addSibling = useCallback((nodeId: string, text: string = "新节点") => {
    const newNode = createNode(text);
    dispatch({
      type: "APPLY",
      action: { type: ActionType.ADD_SIBLING, nodeId, newNode },
    });
  }, []);

  // 删除节点
  const deleteNode = useCallback((nodeId: string) => {
    dispatch({
      type: "APPLY",
      action: { type: ActionType.DELETE_NODE, nodeId },
    });
  }, []);

  // 切换展开/收缩
  const toggleCollapse = useCallback((nodeId: string) => {
    dispatch({
      type: "APPLY",
      action: { type: ActionType.TOGGLE_COLLAPSE, nodeId },
    });
  }, []);

  // 移动节点
  const moveNode = useCallback(
    (nodeId: string, targetParentId: string, targetIndex?: number) => {
      dispatch({
        type: "APPLY",
        action: { type: ActionType.MOVE_NODE, nodeId, targetParentId, targetIndex },
      });
    },
    []
  );

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  return {
    rootNode,
    updateNode,
    addChild,
    addSibling,
    deleteNode,
    toggleCollapse,
    moveNode,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
