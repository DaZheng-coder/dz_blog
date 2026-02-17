import { useCallback, useRef, useState, type DragEvent, type RefObject } from "react";
import { clamp, readDragAssetFromDataTransfer } from "./clipTimelineUtils";
import { TRACK_CLIP_MIME } from "../shared/dnd";
import type { TimelineDragPreview } from "./ClipTimelineTrackView";
import type { ClipDragAsset, ClipMediaType, ClipTrackClip } from "../shared/types";

const PREVIEW_INSERT_ID = "__preview_insert_clip__";

function sortClipsByStart(clips: ClipTrackClip[]) {
  return [...clips].sort((a, b) => a.startSeconds - b.startSeconds);
}

function normalizeInsertStart(startSeconds: number, clips: ClipTrackClip[]) {
  const safeStart = Math.max(0, startSeconds);
  const covering = clips.find(
    (clip) =>
      safeStart > clip.startSeconds &&
      safeStart < clip.startSeconds + clip.durationSeconds
  );
  if (!covering) {
    return safeStart;
  }
  return covering.startSeconds + covering.durationSeconds;
}

function buildRippleLayout(
  baseClips: ClipTrackClip[],
  insertedClip: ClipTrackClip
) {
  const sorted = sortClipsByStart(baseClips);
  const safeStart = normalizeInsertStart(insertedClip.startSeconds, sorted);
  const inserted = { ...insertedClip, startSeconds: safeStart };
  const before = sorted.filter((clip) => clip.startSeconds < safeStart);
  const after = sorted.filter((clip) => clip.startSeconds >= safeStart);

  let cursor = inserted.startSeconds + inserted.durationSeconds;
  const shiftedAfter = after.map((clip) => {
    const nextStart = Math.max(clip.startSeconds, cursor);
    cursor = nextStart + clip.durationSeconds;
    return nextStart === clip.startSeconds ? clip : { ...clip, startSeconds: nextStart };
  });

  return sortClipsByStart([...before, inserted, ...shiftedAfter]);
}

type UseTimelineDragAndDropOptions = {
  clips: ClipTrackClip[];
  setClips: (
    updater:
      | ClipTrackClip[]
      | ((prevClips: ClipTrackClip[]) => ClipTrackClip[])
  ) => void;
  draggingAsset: ClipDragAsset | null;
  pixelsPerSecond: number;
  laneRef: RefObject<HTMLDivElement | null>;
  selectedClipId?: string | null;
  onPreviewClip?: (clip: ClipTrackClip) => void;
  onAssetDropComplete?: () => void;
  acceptedMediaType?: ClipMediaType;
  onAssetClipCreated?: (payload: {
    createdClip: ClipTrackClip;
    asset: ClipDragAsset;
  }) => void;
};

export function useTimelineDragAndDrop({
  clips,
  setClips,
  draggingAsset,
  pixelsPerSecond,
  laneRef,
  selectedClipId,
  onPreviewClip,
  onAssetDropComplete,
  acceptedMediaType,
  onAssetClipCreated,
}: UseTimelineDragAndDropOptions) {
  const dragOffsetSecondsRef = useRef(0);
  const dragPreviewSignatureRef = useRef("");
  const ripplePreviewSignatureRef = useRef("");
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<TimelineDragPreview | null>(null);
  const [ripplePreviewClips, setRipplePreviewClips] = useState<
    ClipTrackClip[] | null
  >(null);

  const timeFromClientX = useCallback(
    (clientX: number) => {
      const lane = laneRef.current;
      if (!lane) {
        return 0;
      }
      const rect = lane.getBoundingClientRect();
      const x = clientX - rect.left;
      return Math.max(0, x / pixelsPerSecond);
    },
    [laneRef, pixelsPerSecond]
  );

  const quantizeTimeToPixel = useCallback(
    (seconds: number) => Math.round(seconds * pixelsPerSecond) / pixelsPerSecond,
    [pixelsPerSecond]
  );

  const createPreviewSignature = (preview: TimelineDragPreview | null) =>
    preview
      ? `${preview.title}|${preview.startSeconds.toFixed(4)}|${preview.durationSeconds.toFixed(4)}`
      : "";

  const createRippleSignature = (nextClips: ClipTrackClip[] | null) =>
    nextClips
      ? nextClips
          .map(
            (clip) =>
              `${clip.id}:${clip.startSeconds.toFixed(4)}:${clip.durationSeconds.toFixed(4)}`
          )
          .join("|")
      : "";

  const applyDragState = useCallback(
    (
      nextPreview: TimelineDragPreview | null,
      nextRipplePreviewClips: ClipTrackClip[] | null
    ) => {
      const nextPreviewSignature = createPreviewSignature(nextPreview);
      if (dragPreviewSignatureRef.current !== nextPreviewSignature) {
        dragPreviewSignatureRef.current = nextPreviewSignature;
        setDragPreview(nextPreview);
      }

      const nextRippleSignature = createRippleSignature(nextRipplePreviewClips);
      if (ripplePreviewSignatureRef.current !== nextRippleSignature) {
        ripplePreviewSignatureRef.current = nextRippleSignature;
        setRipplePreviewClips(nextRipplePreviewClips);
      }
    },
    []
  );

  const clearDragState = useCallback(() => {
    dragPreviewSignatureRef.current = "";
    ripplePreviewSignatureRef.current = "";
    setDragPreview(null);
    setRipplePreviewClips(null);
  }, []);

  const dropSecondsFromEvent = (event: DragEvent<HTMLDivElement>) =>
    quantizeTimeToPixel(timeFromClientX(event.clientX));

  const handleTrackDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const movingClipId =
      event.dataTransfer.getData(TRACK_CLIP_MIME) || draggingClipId;
    const dropSeconds = dropSecondsFromEvent(event);

    if (movingClipId) {
      let movedClipForPreview: ClipTrackClip | null = null;
      setClips((prev) => {
        const movingClip = prev.find((clip) => clip.id === movingClipId);
        if (!movingClip) {
          return prev;
        }

        const baseClips = prev.filter((clip) => clip.id !== movingClipId);
        const targetStart = Math.max(0, dropSeconds - dragOffsetSecondsRef.current);
        const layout = buildRippleLayout(baseClips, {
          ...movingClip,
          startSeconds: targetStart,
        });
        movedClipForPreview =
          layout.find((clip) => clip.id === movingClipId) || null;
        return layout;
      });
      if (movedClipForPreview && selectedClipId === movingClipId) {
        onPreviewClip?.(movedClipForPreview);
      }
      setDraggingClipId(null);
      clearDragState();
      return;
    }

    try {
      const assetFromData = readDragAssetFromDataTransfer(
        event.dataTransfer,
        draggingAsset
      );

      if (!assetFromData) {
        return;
      }
      if (acceptedMediaType && assetFromData.mediaType !== acceptedMediaType) {
        clearDragState();
        return;
      }

      const durationSeconds = clamp(assetFromData.durationSeconds || 1, 1, 600);
      let createdClipForPreview: ClipTrackClip | null = null;
      setClips((prev) => {
        const createdClip: ClipTrackClip = {
          id: crypto.randomUUID(),
          assetId: assetFromData.id,
          title: assetFromData.title,
          mediaType: assetFromData.mediaType,
          mediaDurationSeconds: durationSeconds,
          durationSeconds,
          startSeconds: dropSeconds,
          sourceStartSeconds: 0,
          sourceEndSeconds: durationSeconds,
          objectUrl: assetFromData.objectUrl,
          frameThumbnails: assetFromData.frameThumbnails || [],
          audioLevels: assetFromData.audioLevels || [],
        };
        const layout = buildRippleLayout(prev, createdClip);
        createdClipForPreview = layout.find((clip) => clip.id === createdClip.id) || null;
        return layout;
      });
      if (createdClipForPreview) {
        onPreviewClip?.(createdClipForPreview);
        onAssetClipCreated?.({
          createdClip: createdClipForPreview,
          asset: assetFromData,
        });
      }
      clearDragState();
      onAssetDropComplete?.();
    } catch {
      clearDragState();
    }
  };

  const handleTrackDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const dropSeconds = dropSecondsFromEvent(event);
    const movingClipId =
      event.dataTransfer.getData(TRACK_CLIP_MIME) || draggingClipId;

    if (movingClipId) {
      const movingClip = clips.find((clip) => clip.id === movingClipId);
      if (!movingClip) {
        clearDragState();
        return;
      }

      const targetStart = Math.max(0, dropSeconds - dragOffsetSecondsRef.current);
      const baseClips = clips.filter((clip) => clip.id !== movingClipId);
      const layout = buildRippleLayout(baseClips, {
        ...movingClip,
        startSeconds: targetStart,
      });
      const movedPreview = layout.find((clip) => clip.id === movingClipId) || null;

      if (!movedPreview) {
        clearDragState();
        return;
      }
      applyDragState(
        {
          title: movedPreview.title,
          startSeconds: movedPreview.startSeconds,
          durationSeconds: movedPreview.durationSeconds,
        },
        layout.filter((clip) => clip.id !== movingClipId)
      );
      return;
    }

    try {
      const assetFromData = readDragAssetFromDataTransfer(
        event.dataTransfer,
        draggingAsset
      );

      if (!assetFromData) {
        clearDragState();
        return;
      }
      if (acceptedMediaType && assetFromData.mediaType !== acceptedMediaType) {
        clearDragState();
        return;
      }

      const durationSeconds = clamp(assetFromData.durationSeconds || 1, 1, 600);
      const previewInsert: ClipTrackClip = {
        id: PREVIEW_INSERT_ID,
        assetId: assetFromData.id,
        title: assetFromData.title,
        mediaType: assetFromData.mediaType,
        mediaDurationSeconds: durationSeconds,
        durationSeconds,
        startSeconds: dropSeconds,
        sourceStartSeconds: 0,
        sourceEndSeconds: durationSeconds,
        objectUrl: assetFromData.objectUrl,
        frameThumbnails: assetFromData.frameThumbnails || [],
        audioLevels: assetFromData.audioLevels || [],
      };
      const layout = buildRippleLayout(clips, previewInsert);
      const insertedPreview =
        layout.find((clip) => clip.id === PREVIEW_INSERT_ID) || null;
      if (!insertedPreview) {
        clearDragState();
        return;
      }
      applyDragState(
        {
          title: assetFromData.title,
          startSeconds: insertedPreview.startSeconds,
          durationSeconds,
        },
        layout.filter((clip) => clip.id !== PREVIEW_INSERT_ID)
      );
    } catch {
      clearDragState();
    }
  };

  const handleTrackDragLeave = (event: DragEvent<HTMLDivElement>) => {
    const lane = laneRef.current;
    const nextTarget = event.relatedTarget as Node | null;
    if (lane && nextTarget && lane.contains(nextTarget)) {
      return;
    }
    clearDragState();
  };

  const handleClipDragStart = (
    event: DragEvent<HTMLElement>,
    clip: ClipTrackClip
  ) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(TRACK_CLIP_MIME, clip.id);
    dragOffsetSecondsRef.current = clamp(
      event.nativeEvent.offsetX / pixelsPerSecond,
      0,
      clip.durationSeconds
    );
    setDraggingClipId(clip.id);
  };

  const handleClipDragEnd = () => {
    setDraggingClipId(null);
    clearDragState();
  };

  return {
    dragPreview,
    ripplePreviewClips,
    draggingClipId,
    clearDragState,
    handleTrackDrop,
    handleTrackDragOver,
    handleTrackDragLeave,
    handleClipDragStart,
    handleClipDragEnd,
  };
}
