import type { SubtreeBounds } from "./geometry";
import { getHitBucketKey } from "./geometry";

export function getInsertIndexByPointerY(
  pointerY: number,
  visibleChildren: string[],
  positions: Map<string, { y: number; height: number }>,
  targetPos?: { y: number; height: number }
): number {
  if (visibleChildren.length === 0) {
    return 0;
  }

  const anchors = visibleChildren
    .map((id) => {
      const pos = positions.get(id);
      if (!pos) return null;
      return {
        top: pos.y - pos.height / 2,
        bottom: pos.y + pos.height / 2,
        center: pos.y,
      };
    })
    .filter((item): item is { top: number; bottom: number; center: number } =>
      Boolean(item)
    );

  if (anchors.length === 0) {
    return 0;
  }

  if (anchors.length === 1) {
    return pointerY < anchors[0].center ? 0 : 1;
  }

  // 仅当鼠标明显位于“父节点顶部”和“第一子节点顶部”之上时，才判为最前插入。
  // 避免第1和第2子节点间距很小时，被错误吸附到 index 0。
  if (targetPos) {
    const parentTop = targetPos.y - targetPos.height / 2;
    const firstChildTop = anchors[0].top;
    const frontBoundary = Math.min(parentTop - 4, firstChildTop - 8);
    if (pointerY <= frontBoundary) {
      return 0;
    }
  }

  if (pointerY <= anchors[0].top) {
    return 0;
  }

  const last = anchors[anchors.length - 1];
  if (pointerY >= last.bottom) {
    return anchors.length;
  }

  for (let i = 0; i < anchors.length - 1; i++) {
    const current = anchors[i];
    const next = anchors[i + 1];
    const boundaryY = (current.center + next.center) / 2;
    if (pointerY <= boundaryY) {
      return i + 1;
    }
  }

  return anchors.length;
}

export function getPreviewYByInsertIndex(
  insertIndex: number,
  visibleChildren: string[],
  positions: Map<string, { y: number; height: number }>,
  subtreeBottomMap: Map<string, number>,
  subtreeBoundsMap: Map<string, SubtreeBounds>,
  fallbackY: number
): number {
  if (visibleChildren.length === 0) {
    return fallbackY;
  }

  if (insertIndex <= 0) {
    const firstId = visibleChildren[0];
    const firstBounds = subtreeBoundsMap.get(firstId);
    if (firstBounds) {
      return firstBounds.minY - 40;
    }
    const firstPos = positions.get(firstId);
    return firstPos ? firstPos.y - 40 : fallbackY;
  }

  if (insertIndex >= visibleChildren.length) {
    const lastId = visibleChildren[visibleChildren.length - 1];
    const lastPos = positions.get(lastId);
    if (lastPos) {
      const subtreeBottom =
        subtreeBottomMap.get(lastId) ?? lastPos.y + lastPos.height / 2;
      return subtreeBottom + 40;
    }
    return fallbackY;
  }

  const prevId = visibleChildren[insertIndex - 1];
  const nextId = visibleChildren[insertIndex];
  const prevBounds = subtreeBoundsMap.get(prevId);
  const nextBounds = subtreeBoundsMap.get(nextId);

  if (prevBounds && nextBounds) {
    return (prevBounds.maxY + nextBounds.minY) / 2;
  }

  const prevPos = positions.get(prevId);
  const nextPos = positions.get(nextId);
  if (prevPos && nextPos) {
    return (prevPos.y + nextPos.y) / 2;
  }

  return fallbackY;
}

export function resolveDropTargetInBlankArea(params: {
  worldX: number;
  worldY: number;
  hitCol: number;
  hitRow: number;
  hitTestBuckets: Map<string, Array<{ id: string }>>;
  positions: Map<
    string,
    { x: number; y: number; width: number; height: number; visible: boolean }
  >;
  visibleChildrenMap: Map<string, string[]>;
  parentIdMap: Map<string, string | null>;
  draggedNodeId: string;
  subtreeBottomMap: Map<string, number>;
  subtreeBoundsMap: Map<string, SubtreeBounds>;
}): string | null {
  const {
    worldX,
    worldY,
    hitCol,
    hitRow,
    hitTestBuckets,
    positions,
    visibleChildrenMap,
    parentIdMap,
    draggedNodeId,
    subtreeBottomMap,
    subtreeBoundsMap,
  } = params;

  const candidateIds = new Set<string>();
  const radius = 2;

  for (let col = hitCol - radius; col <= hitCol + radius; col++) {
    for (let row = hitRow - radius; row <= hitRow + radius; row++) {
      const bucket = hitTestBuckets.get(getHitBucketKey(col, row));
      if (!bucket) continue;
      for (const item of bucket) {
        candidateIds.add(item.id);
        const parentId = parentIdMap.get(item.id);
        if (parentId) {
          candidateIds.add(parentId);
        }
      }
    }
  }

  let bestTargetId: string | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidateId of candidateIds) {
    if (candidateId === draggedNodeId) continue;
    const pos = positions.get(candidateId);
    if (!pos || !pos.visible) continue;

    const visibleChildren = visibleChildrenMap.get(candidateId) || [];

    if (visibleChildren.length > 0) {
      const firstId = visibleChildren[0];
      const lastId = visibleChildren[visibleChildren.length - 1];
      const firstChildPos = positions.get(firstId);
      if (!firstChildPos) continue;

      const firstBounds = subtreeBoundsMap.get(firstId);
      const minY =
        (firstBounds?.minY ?? firstChildPos.y - firstChildPos.height / 2) - 140;
      const maxY =
        (subtreeBottomMap.get(lastId) ??
          firstChildPos.y + firstChildPos.height / 2) + 140;
      const minX = pos.x + pos.width / 2 - 60;
      const maxX = firstChildPos.x + 180;

      if (worldX < minX || worldX > maxX || worldY < minY || worldY > maxY) {
        continue;
      }

      const score =
        Math.abs(worldX - firstChildPos.x) + Math.abs(worldY - pos.y) * 0.2;
      if (score < bestScore) {
        bestScore = score;
        bestTargetId = candidateId;
      }
      continue;
    }

    const centerX = pos.x + pos.width / 2 + 80;
    const minX = pos.x - pos.width / 2 - 40;
    const maxX = centerX + 120;
    const minY = pos.y - Math.max(pos.height, 140) / 2;
    const maxY = pos.y + Math.max(pos.height, 140) / 2;

    if (worldX < minX || worldX > maxX || worldY < minY || worldY > maxY) {
      continue;
    }

    const score = Math.abs(worldX - centerX) + Math.abs(worldY - pos.y) * 0.3;
    if (score < bestScore) {
      bestScore = score;
      bestTargetId = candidateId;
    }
  }

  return bestTargetId;
}
