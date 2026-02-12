import { useReducer, useCallback } from 'react';
import type { MindMapNode, MindMapAction } from '../types/mindmap';
import { ActionType } from '../types/mindmap';

/**
 * 深度克隆节点树
 */
function cloneNode(node: MindMapNode): MindMapNode {
  return {
    ...node,
    children: node.children.map(cloneNode),
  };
}

/**
 * 在树中查找节点
 */
function findNode(root: MindMapNode, nodeId: string): MindMapNode | null {
  if (root.id === nodeId) return root;

  for (const child of root.children) {
    const found = findNode(child, nodeId);
    if (found) return found;
  }

  return null;
}

/**
 * 查找节点的父节点
 */
function findParentNode(root: MindMapNode, nodeId: string): MindMapNode | null {
  // 根节点没有父节点
  if (root.id === nodeId) return null;

  // 检查直接子节点
  for (const child of root.children) {
    if (child.id === nodeId) return root;
  }

  // 递归查找
  for (const child of root.children) {
    const parent = findParentNode(child, nodeId);
    if (parent) return parent;
  }

  return null;
}

/**
 * 递归更新节点
 */
function updateNodeInTree(
  node: MindMapNode,
  nodeId: string,
  updater: (node: MindMapNode) => void
): MindMapNode {
  if (node.id === nodeId) {
    const updated = { ...node };
    updater(updated);
    return updated;
  }

  return {
    ...node,
    children: node.children.map((child) =>
      updateNodeInTree(child, nodeId, updater)
    ),
  };
}

/**
 * 从树中删除节点
 */
function deleteNodeInTree(node: MindMapNode, nodeId: string): MindMapNode | null {
  // 不能删除根节点
  if (node.id === nodeId) {
    return null;
  }

  return {
    ...node,
    children: node.children
      .filter((child) => child.id !== nodeId)
      .map((child) => deleteNodeInTree(child, nodeId))
      .filter((child) => child !== null) as MindMapNode[],
  };
}

/**
 * 添加同级节点
 */
function addSiblingNodeInTree(
  root: MindMapNode,
  nodeId: string,
  newNode: MindMapNode
): MindMapNode {
  // 如果是根节点，不能添加同级节点
  if (root.id === nodeId) {
    return root;
  }

  // 找到父节点
  const parent = findParentNode(root, nodeId);
  if (!parent) return root;

  // 在父节点的 children 中找到当前节点的索引
  const nodeIndex = parent.children.findIndex((child) => child.id === nodeId);
  if (nodeIndex === -1) return root;

  // 在当前节点后面插入新节点
  return updateNodeInTree(root, parent.id, (parentNode) => {
    const newChildren = [...parentNode.children];
    newChildren.splice(nodeIndex + 1, 0, newNode);
    parentNode.children = newChildren;
  });
}

/**
 * 移动节点到新父节点下
 */
function moveNodeInTree(
  root: MindMapNode,
  nodeId: string,
  targetParentId: string
): MindMapNode | null {
  // 不能移动根节点，也不能移动到自己下面
  if (root.id === nodeId || nodeId === targetParentId) {
    return root;
  }

  // 找到要移动的节点
  const nodeToMove = findNode(root, nodeId);
  if (!nodeToMove) return root;

  // 检查目标父节点是否是要移动节点的后代（避免循环引用）
  if (findNode(nodeToMove, targetParentId)) {
    return root;
  }

  // 先从树中删除节点
  let newRoot = deleteNodeInTree(root, nodeId);
  if (!newRoot) return root;

  // 将节点添加到新父节点下
  newRoot = updateNodeInTree(newRoot, targetParentId, (parent) => {
    parent.children = [...parent.children, cloneNode(nodeToMove)];
  });

  return newRoot;
}

/**
 * Reducer 函数
 */
function mindMapReducer(
  state: MindMapNode | null,
  action: MindMapAction
): MindMapNode | null {
  if (!state) return null;

  switch (action.type) {
    case ActionType.UPDATE_NODE:
      return updateNodeInTree(state, action.nodeId, (node) => {
        node.text = action.text;
      });

    case ActionType.ADD_CHILD:
      return updateNodeInTree(state, action.parentId, (node) => {
        node.children = [...node.children, action.newNode];
        node.collapsed = false; // 添加子节点时自动展开
      });

    case ActionType.ADD_SIBLING:
      return addSiblingNodeInTree(state, action.nodeId, action.newNode);

    case ActionType.DELETE_NODE:
      return deleteNodeInTree(state, action.nodeId);

    case ActionType.TOGGLE_COLLAPSE:
      return updateNodeInTree(state, action.nodeId, (node) => {
        node.collapsed = !node.collapsed;
      });

    case ActionType.MOVE_NODE:
      return moveNodeInTree(state, action.nodeId, action.targetParentId);

    default:
      return state;
  }
}

/**
 * 思维导图状态管理 Hook
 */
export function useMindMapState(initialData: MindMapNode | null) {
  const [rootNode, dispatch] = useReducer(mindMapReducer, initialData);

  // 更新节点文本
  const updateNode = useCallback((nodeId: string, text: string) => {
    dispatch({ type: ActionType.UPDATE_NODE, nodeId, text });
  }, []);

  // 添加子节点
  const addChild = useCallback((parentId: string, text: string = '新节点') => {
    const newNode: MindMapNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      children: [],
    };
    dispatch({ type: ActionType.ADD_CHILD, parentId, newNode });
  }, []);

  // 添加同级节点
  const addSibling = useCallback((nodeId: string, text: string = '新节点') => {
    const newNode: MindMapNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      children: [],
    };
    dispatch({ type: ActionType.ADD_SIBLING, nodeId, newNode });
  }, []);

  // 删除节点
  const deleteNode = useCallback((nodeId: string) => {
    dispatch({ type: ActionType.DELETE_NODE, nodeId });
  }, []);

  // 切换展开/收缩
  const toggleCollapse = useCallback((nodeId: string) => {
    dispatch({ type: ActionType.TOGGLE_COLLAPSE, nodeId });
  }, []);

  // 移动节点
  const moveNode = useCallback((nodeId: string, targetParentId: string) => {
    dispatch({ type: ActionType.MOVE_NODE, nodeId, targetParentId });
  }, []);

  return {
    rootNode,
    updateNode,
    addChild,
    addSibling,
    deleteNode,
    toggleCollapse,
    moveNode,
  };
}
