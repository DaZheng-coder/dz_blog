import { useEffect, useMemo, useRef, useState } from "react";
import type { MindMapNode, NodePosition } from "../types/mindmap";
import {
  computeLayout,
  countNodes,
  DEFAULT_LAYOUT_CONFIG,
  type LayoutConfig,
} from "./layout/computeLayout";

const LAYOUT_WORKER_NODE_THRESHOLD = 500;

export function useLayout(
  rootNode: MindMapNode | null,
  config: Partial<LayoutConfig> = {}
): Map<string, NodePosition> {
  const finalConfig = useMemo(
    () => ({ ...DEFAULT_LAYOUT_CONFIG, ...config }),
    [
      config.minNodeWidth,
      config.maxNodeWidth,
      config.minNodeHeight,
      config.maxNodeHeight,
      config.horizontalGap,
      config.verticalGap,
      config.paddingX,
      config.paddingY,
      config.fontSize,
      config.lineHeight,
    ]
  );

  const workerRef = useRef<Worker | null>(null);
  const workerRequestIdRef = useRef(0);
  const [workerPositions, setWorkerPositions] = useState<
    Map<string, NodePosition>
  >(new Map());

  const nodeCount = useMemo(() => countNodes(rootNode), [rootNode]);
  const useWorker = nodeCount > LAYOUT_WORKER_NODE_THRESHOLD;

  const syncPositions = useMemo(() => {
    if (useWorker) {
      return new Map<string, NodePosition>();
    }
    return computeLayout(rootNode, finalConfig);
  }, [useWorker, rootNode, finalConfig]);

  useEffect(() => {
    if (!useWorker || !rootNode) {
      return;
    }

    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("./layout/layout.worker.ts", import.meta.url),
        { type: "module" }
      );
    }

    workerRequestIdRef.current += 1;
    const currentRequestId = workerRequestIdRef.current;

    const worker = workerRef.current;
    worker.onmessage = (
      event: MessageEvent<{
        requestId: number;
        entries: Array<[string, NodePosition]>;
      }>
    ) => {
      if (event.data.requestId !== workerRequestIdRef.current) {
        return;
      }
      setWorkerPositions(new Map(event.data.entries));
    };

    worker.postMessage({
      requestId: currentRequestId,
      rootNode,
      config: finalConfig,
    });
  }, [useWorker, rootNode, finalConfig]);

  useEffect(() => {
    if (!useWorker) {
      setWorkerPositions(new Map());
    }
  }, [useWorker, rootNode]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  return useWorker ? workerPositions : syncPositions;
}

export function getLayoutBounds(positions: Map<string, NodePosition>): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (positions.size === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  positions.forEach((pos) => {
    if (!pos.visible) return;

    const left = pos.x - pos.width / 2;
    const right = pos.x + pos.width / 2;
    const top = pos.y - pos.height / 2;
    const bottom = pos.y + pos.height / 2;

    minX = Math.min(minX, left);
    maxX = Math.max(maxX, right);
    minY = Math.min(minY, top);
    maxY = Math.max(maxY, bottom);
  });

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
