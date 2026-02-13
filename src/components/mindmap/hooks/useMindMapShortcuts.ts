import { useEffect } from "react";

interface MindMapShortcutsParams {
  selectedNodeId: string | null;
  editingNodeId: string | null;
  rootNodeId: string | undefined;
  addChild: (parentId: string) => void;
  addSibling: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  onClearSelection: () => void;
  undo: () => void;
  redo: () => void;
}

export function useMindMapShortcuts({
  selectedNodeId,
  editingNodeId,
  rootNodeId,
  addChild,
  addSibling,
  deleteNode,
  onClearSelection,
  undo,
  redo,
}: MindMapShortcutsParams) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditableTarget =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      const withMeta = e.metaKey || e.ctrlKey;
      const lowerKey = e.key.toLowerCase();

      if (withMeta && !isEditableTarget) {
        if (!e.shiftKey && lowerKey === "z") {
          e.preventDefault();
          undo();
          return;
        }

        if (lowerKey === "y" || (e.shiftKey && lowerKey === "z")) {
          e.preventDefault();
          redo();
          return;
        }
      }

      if (editingNodeId || !selectedNodeId || isEditableTarget) {
        return;
      }

      switch (e.key) {
        case "Enter":
          e.preventDefault();
          if (selectedNodeId !== rootNodeId) {
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
          if (selectedNodeId !== rootNodeId) {
            if (confirm("确定要删除选中的节点吗？")) {
              deleteNode(selectedNodeId);
              onClearSelection();
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
    rootNodeId,
    addChild,
    addSibling,
    deleteNode,
    onClearSelection,
    undo,
    redo,
  ]);
}
