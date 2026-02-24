import { create } from "zustand";
import type {
  ClipDragAsset,
  ClipMediaAsset,
  ClipPreviewSource,
  ClipTextOverlay,
  ClipTrackClip,
} from "../shared/types";

type TimelineFramePayload = {
  timeSeconds: number;
  activeClip: ClipTrackClip | null;
  isPlaying: boolean;
};

function sameSingleSelectedId(ids: string[], id: string) {
  return ids.length === 1 && ids[0] === id;
}

type ClipEditorStore = {
  draggingAsset: ClipDragAsset | null;
  timelineClips: ClipTrackClip[];
  audioTimelineClips: ClipTrackClip[];
  textOverlays: ClipTextOverlay[];
  selectedTimelineClipId: string | null;
  selectedTimelineClipIds: string[];
  selectedTimelineTrack: "video" | "audio" | null;
  previewSource: ClipPreviewSource | null;
  selectedInspectorAsset: ClipMediaAsset | null;
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
  addTextOverlay: (overlay: Omit<ClipTextOverlay, "id">) => string;
  setSelectedTimelineClip: (
    clipId: string | null,
    track: "video" | "audio" | null,
    appendSelection?: boolean
  ) => void;
  setTimelinePlaying: (playing: boolean) => void;
  setSelectedInspectorAsset: (asset: ClipMediaAsset | null) => void;
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
  selectedTimelineClipId: null,
  selectedTimelineClipIds: [],
  selectedTimelineTrack: null,
  previewSource: null,
  selectedInspectorAsset: null,
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
  addTextOverlay: (overlay) => {
    const id = crypto.randomUUID();
    set((state) => ({
      textOverlays: [...state.textOverlays, { ...overlay, id }],
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
  setSelectedInspectorAsset: (asset) => set({ selectedInspectorAsset: asset }),
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
