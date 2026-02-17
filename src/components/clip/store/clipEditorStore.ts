import { create } from "zustand";
import type {
  ClipDragAsset,
  ClipPreviewSource,
  ClipTrackClip,
} from "../shared/types";

type TimelineFramePayload = {
  timeSeconds: number;
  activeClip: ClipTrackClip | null;
  isPlaying: boolean;
};

type ClipEditorStore = {
  draggingAsset: ClipDragAsset | null;
  timelineClips: ClipTrackClip[];
  audioTimelineClips: ClipTrackClip[];
  selectedTimelineClipId: string | null;
  selectedTimelineClipIds: string[];
  selectedTimelineTrack: "video" | "audio" | null;
  previewSource: ClipPreviewSource | null;
  timelinePlaying: boolean;
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
  setSelectedTimelineClip: (
    clipId: string | null,
    track: "video" | "audio" | null,
    appendSelection?: boolean
  ) => void;
  setTimelinePlaying: (playing: boolean) => void;
  setTrackTotalDurationSeconds: (durationSeconds: number) => void;
  previewTimelineClip: (clip: ClipTrackClip) => void;
  previewEmptyFrame: (timeSeconds: number) => void;
  syncTimelineFrame: (payload: TimelineFramePayload) => void;
};

export const useClipEditorStore = create<ClipEditorStore>((set) => ({
  draggingAsset: null,
  timelineClips: [],
  audioTimelineClips: [],
  selectedTimelineClipId: null,
  selectedTimelineClipIds: [],
  selectedTimelineTrack: null,
  previewSource: null,
  timelinePlaying: false,
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
          selectedTimelineClipId: activeClip.id,
          selectedTimelineClipIds: [activeClip.id],
          selectedTimelineTrack: "video",
        };
      }
      if (isPlaying) {
        return {
          previewSource: {
            sourceType: "empty",
            durationSeconds: 5,
            startSeconds: timeSeconds,
            playheadSeconds: timeSeconds,
            timelinePlaying: isPlaying,
          },
          selectedTimelineClipId: null,
          selectedTimelineClipIds: [],
          selectedTimelineTrack: null,
        };
      }
      return state;
    }),
}));
