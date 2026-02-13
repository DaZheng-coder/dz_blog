import type { MindMapAction, MindMapNode } from "../../../../types/mindmap";
import { ActionType } from "../../../../types/mindmap";
import {
  addSiblingNodeInTree,
  deleteNodeInTree,
  moveNodeInTree,
  updateNodeInTree,
} from "./treeOperations";

export function applyMindMapAction(
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
        node.collapsed = false;
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
