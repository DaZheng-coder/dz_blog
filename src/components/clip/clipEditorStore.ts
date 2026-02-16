import { create } from "zustand";
import type { ClipDragAsset, ClipPreviewSource, ClipTrackClip } from "./types";

type TimelineFramePayload = {
  timeSeconds: number;
  activeClip: ClipTrackClip | null;
  isPlaying: boolean;
};

type ClipEditorStore = {
  draggingAsset: ClipDragAsset | null;
  timelineClips: ClipTrackClip[];
  selectedTimelineClipId: string | null;
  previewSource: ClipPreviewSource | null;
  timelinePlaying: boolean;
  trackTotalDurationSeconds: number;
  setDraggingAsset: (asset: ClipDragAsset | null) => void;
  setTimelineClips: (
    updater:
      | ClipTrackClip[]
      | ((prevClips: ClipTrackClip[]) => ClipTrackClip[])
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
  selectedTimelineClipId: null,
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
    }),
  previewEmptyFrame: (timeSeconds) =>
    set({
      previewSource: {
        sourceType: "empty",
        durationSeconds: 5,
        startSeconds: timeSeconds,
      },
      selectedTimelineClipId: null,
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
        };
      }
      return state;
    }),
}));
