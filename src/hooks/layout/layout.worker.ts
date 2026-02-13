import type { MindMapNode, NodePosition } from "../../types/mindmap";
import type { LayoutConfig } from "./computeLayout";
import { computeLayout } from "./computeLayout";

type LayoutWorkerRequest = {
  requestId: number;
  rootNode: MindMapNode | null;
  config: LayoutConfig;
};

type LayoutWorkerResponse = {
  requestId: number;
  entries: Array<[string, NodePosition]>;
};

self.onmessage = (event: MessageEvent<LayoutWorkerRequest>) => {
  const { requestId, rootNode, config } = event.data;
  const positions = computeLayout(rootNode, config);
  const response: LayoutWorkerResponse = {
    requestId,
    entries: Array.from(positions.entries()),
  };
  self.postMessage(response);
};

export {};
