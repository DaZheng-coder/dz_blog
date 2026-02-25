import { create } from "zustand";
import type {
  ClipDragAsset,
  ClipMediaAsset,
  ClipPreviewSource,
  ClipStickerOverlay,
  ClipTextOverlay,
  ClipTrackClip,
} from "../shared/types";

type TimelineFramePayload = {
  timeSeconds: number;
  activeClip: ClipTrackClip | null;
  isPlaying: boolean;
};

type PreviewVideoInfo = {
  objectUrl: string;
  durationSeconds: number;
  sourceStartSeconds?: number;
  sourceEndSeconds?: number;
};

function sameSingleSelectedId(ids: string[], id: string) {
  return ids.length === 1 && ids[0] === id;
}

type ClipEditorStore = {
  draggingAsset: ClipDragAsset | null;
  timelineClips: ClipTrackClip[];
  audioTimelineClips: ClipTrackClip[];
  textOverlays: ClipTextOverlay[];
  stickerOverlays: ClipStickerOverlay[];
  selectedTimelineClipId: string | null;
  selectedTimelineClipIds: string[];
  selectedTimelineTrack: "video" | "audio" | "text" | "sticker" | null;
  previewSource: ClipPreviewSource | null;
  selectedPreviewVideoInfo: PreviewVideoInfo | null;
  selectedInspectorAsset: ClipMediaAsset | null;
  selectedInspectorSticker: ClipStickerOverlay | null;
  timelinePlaying: boolean;
  timelineToolMode: "select" | "cut";
  timelineCurrentTimeSeconds: number;
  trackTotalDurationSeconds: number;
  setDraggingAsset: (asset: ClipDragAsset | null) => void;
  setTimelineClips: (
    updater:
      | ClipTrackClip[]
      | ((prevClips: ClipTrackClip[]) => ClipTrackClip[])
  ) => void;
  setAudioTimelineClips: (
    updater:
      | ClipTrackClip[]
      | ((prevClips: ClipTrackClip[]) => ClipTrackClip[])
  ) => void;
  setTextOverlays: (
    updater:
      | ClipTextOverlay[]
      | ((prevOverlays: ClipTextOverlay[]) => ClipTextOverlay[])
  ) => void;
  setStickerOverlays: (
    updater:
      | ClipStickerOverlay[]
      | ((prevOverlays: ClipStickerOverlay[]) => ClipStickerOverlay[])
  ) => void;
  addTextOverlay: (overlay: Omit<ClipTextOverlay, "id">) => string;
  addStickerOverlay: (overlay: Omit<ClipStickerOverlay, "id">) => string;
  setSelectedTimelineClip: (
    clipId: string | null,
    track: "video" | "audio" | "text" | "sticker" | null,
    appendSelection?: boolean
  ) => void;
  setTimelinePlaying: (playing: boolean) => void;
  setSelectedPreviewVideoInfo: (info: PreviewVideoInfo | null) => void;
  setSelectedInspectorAsset: (asset: ClipMediaAsset | null) => void;
  setSelectedInspectorSticker: (sticker: ClipStickerOverlay | null) => void;
  setTimelineToolMode: (mode: "select" | "cut") => void;
  setTrackTotalDurationSeconds: (durationSeconds: number) => void;
  previewTimelineClip: (clip: ClipTrackClip) => void;
  previewEmptyFrame: (timeSeconds: number) => void;
  syncTimelineFrame: (payload: TimelineFramePayload) => void;
};

export const useClipEditorStore = create<ClipEditorStore>((set) => ({
  draggingAsset: null,
  timelineClips: [],
  audioTimelineClips: [],
  textOverlays: [],
  stickerOverlays: [],
  selectedTimelineClipId: null,
  selectedTimelineClipIds: [],
  selectedTimelineTrack: null,
  previewSource: null,
  selectedPreviewVideoInfo: null,
  selectedInspectorAsset: null,
  selectedInspectorSticker: null,
  timelinePlaying: false,
  timelineToolMode: "select",
  timelineCurrentTimeSeconds: 0,
  trackTotalDurationSeconds: 0,
  setDraggingAsset: (asset) => set({ draggingAsset: asset }),
  setTimelineClips: (updater) =>
    set((state) => ({
      timelineClips:
        typeof updater === "function"
          ? updater(state.timelineClips)
          : updater,
    })),
  setAudioTimelineClips: (updater) =>
    set((state) => ({
      audioTimelineClips:
        typeof updater === "function"
          ? updater(state.audioTimelineClips)
          : updater,
    })),
  setTextOverlays: (updater) =>
    set((state) => ({
      textOverlays:
        typeof updater === "function" ? updater(state.textOverlays) : updater,
    })),
  setStickerOverlays: (updater) =>
    set((state) => ({
      stickerOverlays:
        typeof updater === "function"
          ? updater(state.stickerOverlays)
          : updater,
    })),
  addTextOverlay: (overlay) => {
    const id = crypto.randomUUID();
    set((state) => ({
      textOverlays: [...state.textOverlays, { ...overlay, id }],
    }));
    return id;
  },
  addStickerOverlay: (overlay) => {
    const id = crypto.randomUUID();
    set((state) => ({
      stickerOverlays: [...state.stickerOverlays, { ...overlay, id }],
    }));
    return id;
  },
  setSelectedTimelineClip: (clipId, track, appendSelection = false) =>
    set((state) => {
      if (!clipId || !track) {
        return {
          selectedTimelineClipId: null,
          selectedTimelineClipIds: [],
          selectedTimelineTrack: null,
        };
      }
      if (!appendSelection) {
        return {
          selectedTimelineClipId: clipId,
          selectedTimelineClipIds: [clipId],
          selectedTimelineTrack: track,
        };
      }

      const exists = state.selectedTimelineClipIds.includes(clipId);
      const nextIds = exists
        ? state.selectedTimelineClipIds.filter((id) => id !== clipId)
        : [...state.selectedTimelineClipIds, clipId];
      return {
        selectedTimelineClipId: nextIds[nextIds.length - 1] || null,
        selectedTimelineClipIds: nextIds,
        selectedTimelineTrack: nextIds.length > 0 ? track : null,
      };
    }),
  setTimelinePlaying: (playing) => set({ timelinePlaying: playing }),
  setSelectedPreviewVideoInfo: (info) => set({ selectedPreviewVideoInfo: info }),
  setSelectedInspectorAsset: (asset) => set({ selectedInspectorAsset: asset }),
  setSelectedInspectorSticker: (sticker) =>
    set({ selectedInspectorSticker: sticker }),
  setTimelineToolMode: (mode) => set({ timelineToolMode: mode }),
  setTrackTotalDurationSeconds: (durationSeconds) =>
    set({ trackTotalDurationSeconds: durationSeconds }),
  previewTimelineClip: (clip) =>
    set({
      previewSource: {
        sourceType: "timeline",
        durationSeconds: clip.durationSeconds,
        objectUrl: clip.objectUrl,
        timelineStartSeconds: clip.startSeconds,
        sourceStartSeconds: clip.sourceStartSeconds,
        sourceEndSeconds: clip.sourceEndSeconds,
      },
      selectedTimelineClipId: clip.id,
      selectedTimelineClipIds: [clip.id],
      selectedTimelineTrack: "video",
    }),
  previewEmptyFrame: (timeSeconds) =>
    set({
      previewSource: {
        sourceType: "empty",
        durationSeconds: 5,
        startSeconds: timeSeconds,
      },
      selectedTimelineClipId: null,
      selectedTimelineClipIds: [],
      selectedTimelineTrack: null,
    }),
  syncTimelineFrame: ({ timeSeconds, activeClip, isPlaying }) =>
    set((state) => {
      if (activeClip) {
        const selectedTimelineClipId =
          state.selectedTimelineClipId === activeClip.id
            ? state.selectedTimelineClipId
            : activeClip.id;
        const selectedTimelineClipIds = sameSingleSelectedId(
          state.selectedTimelineClipIds,
          activeClip.id
        )
          ? state.selectedTimelineClipIds
          : [activeClip.id];
        const selectedTimelineTrack =
          state.selectedTimelineTrack === "video"
            ? state.selectedTimelineTrack
            : "video";
        return {
          previewSource: {
            sourceType: "timeline",
            durationSeconds: activeClip.durationSeconds,
            objectUrl: activeClip.objectUrl,
            timelineStartSeconds: activeClip.startSeconds,
            sourceStartSeconds: activeClip.sourceStartSeconds,
            sourceEndSeconds: activeClip.sourceEndSeconds,
            playheadSeconds: timeSeconds,
            timelinePlaying: isPlaying,
          },
          timelineCurrentTimeSeconds: timeSeconds,
          selectedTimelineClipId,
          selectedTimelineClipIds,
          selectedTimelineTrack,
        };
      }
      if (isPlaying) {
        const selectedTimelineClipId =
          state.selectedTimelineClipId === null
            ? state.selectedTimelineClipId
            : null;
        const selectedTimelineClipIds =
          state.selectedTimelineClipIds.length === 0
            ? state.selectedTimelineClipIds
            : [];
        const selectedTimelineTrack =
          state.selectedTimelineTrack === null ? state.selectedTimelineTrack : null;
        return {
          previewSource: {
            sourceType: "empty",
            durationSeconds: 5,
            startSeconds: timeSeconds,
            playheadSeconds: timeSeconds,
            timelinePlaying: isPlaying,
          },
          timelineCurrentTimeSeconds: timeSeconds,
          selectedTimelineClipId,
          selectedTimelineClipIds,
          selectedTimelineTrack,
        };
      }
      return state.timelineCurrentTimeSeconds === timeSeconds
        ? state
        : {
            timelineCurrentTimeSeconds: timeSeconds,
          };
    }),
}));
