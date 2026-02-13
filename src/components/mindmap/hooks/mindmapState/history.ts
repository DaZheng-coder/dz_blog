import type { MindMapAction, MindMapNode } from "../../../../types/mindmap";
import { applyMindMapAction } from "./reducer";

interface MindMapHistoryState {
  past: MindMapNode[];
  present: MindMapNode | null;
  future: MindMapNode[];
}

type MindMapHistoryAction =
  | { type: "APPLY"; action: MindMapAction }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; data: MindMapNode | null };

const MAX_HISTORY = 100;

export function createInitialHistoryState(
  initialData: MindMapNode | null
): MindMapHistoryState {
  return {
    past: [],
    present: initialData,
    future: [],
  };
}

export function historyReducer(
  state: MindMapHistoryState,
  action: MindMapHistoryAction
): MindMapHistoryState {
  switch (action.type) {
    case "APPLY": {
      const { present } = state;
      if (!present) {
        return state;
      }

      const nextPresent = applyMindMapAction(present, action.action);
      if (nextPresent === present || !nextPresent) {
        return state;
      }

      const nextPast = [...state.past, present];
      const trimmedPast =
        nextPast.length > MAX_HISTORY
          ? nextPast.slice(nextPast.length - MAX_HISTORY)
          : nextPast;

      return {
        past: trimmedPast,
        present: nextPresent,
        future: [],
      };
    }

    case "UNDO": {
      if (state.past.length === 0 || !state.present) {
        return state;
      }

      const previous = state.past[state.past.length - 1];
      const nextPast = state.past.slice(0, -1);
      return {
        past: nextPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }

    case "REDO": {
      if (state.future.length === 0 || !state.present) {
        return state;
      }

      const [next, ...restFuture] = state.future;
      return {
        past: [...state.past, state.present],
        present: next,
        future: restFuture,
      };
    }

    case "RESET":
      return createInitialHistoryState(action.data);

    default:
      return state;
  }
}
