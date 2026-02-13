import type { MindMapNode } from "../../../../types/mindmap";

export function cloneNode(node: MindMapNode): MindMapNode {
  return {
    ...node,
    children: node.children.map(cloneNode),
  };
}

export function findNode(
  root: MindMapNode,
  nodeId: string
): MindMapNode | null {
  if (root.id === nodeId) return root;

  for (const child of root.children) {
    const found = findNode(child, nodeId);
    if (found) return found;
  }

  return null;
}

export function findParentNode(
  root: MindMapNode,
  nodeId: string
): MindMapNode | null {
  if (root.id === nodeId) return null;

  for (const child of root.children) {
    if (child.id === nodeId) return root;
  }

  for (const child of root.children) {
    const parent = findParentNode(child, nodeId);
    if (parent) return parent;
  }

  return null;
}

export function updateNodeInTree(
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

export function deleteNodeInTree(
  node: MindMapNode,
  nodeId: string
): MindMapNode | null {
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

export function addSiblingNodeInTree(
  root: MindMapNode,
  nodeId: string,
  newNode: MindMapNode
): MindMapNode {
  if (root.id === nodeId) {
    return root;
  }

  const parent = findParentNode(root, nodeId);
  if (!parent) return root;

  const nodeIndex = parent.children.findIndex((child) => child.id === nodeId);
  if (nodeIndex === -1) return root;

  return updateNodeInTree(root, parent.id, (parentNode) => {
    const newChildren = [...parentNode.children];
    newChildren.splice(nodeIndex + 1, 0, newNode);
    parentNode.children = newChildren;
  });
}

export function moveNodeInTree(
  root: MindMapNode,
  nodeId: string,
  targetParentId: string
): MindMapNode | null {
  if (root.id === nodeId || nodeId === targetParentId) {
    return root;
  }

  const nodeToMove = findNode(root, nodeId);
  if (!nodeToMove) return root;

  if (findNode(nodeToMove, targetParentId)) {
    return root;
  }

  let newRoot = deleteNodeInTree(root, nodeId);
  if (!newRoot) return root;

  newRoot = updateNodeInTree(newRoot, targetParentId, (parent) => {
    parent.children = [...parent.children, cloneNode(nodeToMove)];
  });

  return newRoot;
}
