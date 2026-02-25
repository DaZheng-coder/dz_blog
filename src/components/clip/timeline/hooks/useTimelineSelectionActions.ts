import { useCallback, type MouseEvent as ReactMouseEvent } from "react";
import type { ClipTrackClip } from "../../shared/types";

type UseTimelineSelectionActionsOptions = {
  timelineToolMode: "select" | "cut";
  selectedTimelineTrack: "video" | "audio" | "text" | "sticker" | null;
  selectedTimelineClipCount: number;
  pixelsPerSecond: number;
  setTimelineToolMode: (mode: "select" | "cut") => void;
  setSelectedTimelineClip: (
    clipId: string | null,
    track: "video" | "audio" | "text" | "sticker" | null,
    appendSelection?: boolean
  ) => void;
  previewTimelineClip: (clip: ClipTrackClip) => void;
  onSplitVideo: () => void;
  onSplitAudio: () => void;
  onSplitSticker: () => void;
  onSplitVideoClipAtTime: (clipId: string, splitTime: number) => void;
  onSplitAudioClipAtTime: (clipId: string, splitTime: number) => void;
  onSplitStickerClipAtTime: (clipId: string, splitTime: number) => void;
  onSeekClick: (event: ReactMouseEvent<HTMLDivElement>) => void;
};

export function useTimelineSelectionActions({
  timelineToolMode,
  selectedTimelineTrack,
  selectedTimelineClipCount,
  pixelsPerSecond,
  setTimelineToolMode,
  setSelectedTimelineClip,
  previewTimelineClip,
  onSplitVideo,
  onSplitAudio,
  onSplitSticker,
  onSplitVideoClipAtTime,
  onSplitAudioClipAtTime,
  onSplitStickerClipAtTime,
  onSeekClick,
}: UseTimelineSelectionActionsOptions) {
  const handleSelectTool = useCallback(() => {
    setTimelineToolMode("select");
  }, [setTimelineToolMode]);

  const handleCutTool = useCallback(() => {
    setTimelineToolMode("cut");
  }, [setTimelineToolMode]);

  const handleSplitSelected = useCallback(() => {
    if (selectedTimelineClipCount > 0) {
      onSplitVideo();
      onSplitAudio();
      onSplitSticker();
      return;
    }
    if (selectedTimelineTrack === "audio") {
      onSplitAudio();
      return;
    }
    if (selectedTimelineTrack === "sticker") {
      onSplitSticker();
      return;
    }
    onSplitVideo();
  }, [
    onSplitAudio,
    onSplitSticker,
    onSplitVideo,
    selectedTimelineClipCount,
    selectedTimelineTrack,
  ]);

  const handleTrackClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      onSeekClick(event);
      setSelectedTimelineClip(null, null);
    },
    [onSeekClick, setSelectedTimelineClip]
  );

  const handleVideoClipClick = useCallback(
    (
      event: ReactMouseEvent<HTMLElement>,
      clip: ClipTrackClip,
      appendSelection: boolean
    ) => {
      if (timelineToolMode === "cut") {
        const rect = event.currentTarget.getBoundingClientRect();
        const clickedOffsetPx = event.clientX - rect.left;
        const splitTime = clip.startSeconds + clickedOffsetPx / pixelsPerSecond;
        onSplitVideoClipAtTime(clip.id, splitTime);
        return;
      }

      setSelectedTimelineClip(clip.id, "video", appendSelection);
      if (!appendSelection) {
        previewTimelineClip(clip);
      }
    },
    [
      onSplitVideoClipAtTime,
      pixelsPerSecond,
      previewTimelineClip,
      setSelectedTimelineClip,
      timelineToolMode,
    ]
  );

  const handleAudioClipClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>, clip: ClipTrackClip, appendSelection: boolean) => {
      if (timelineToolMode === "cut") {
        const rect = event.currentTarget.getBoundingClientRect();
        const clickedOffsetPx = event.clientX - rect.left;
        const splitTime = clip.startSeconds + clickedOffsetPx / pixelsPerSecond;
        onSplitAudioClipAtTime(clip.id, splitTime);
        return;
      }
      setSelectedTimelineClip(clip.id, "audio", appendSelection);
    },
    [
      onSplitAudioClipAtTime,
      pixelsPerSecond,
      setSelectedTimelineClip,
      timelineToolMode,
    ]
  );

  const handleStickerClipClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>, clip: ClipTrackClip, appendSelection: boolean) => {
      if (timelineToolMode === "cut") {
        const rect = event.currentTarget.getBoundingClientRect();
        const clickedOffsetPx = event.clientX - rect.left;
        const splitTime = clip.startSeconds + clickedOffsetPx / pixelsPerSecond;
        onSplitStickerClipAtTime(clip.id, splitTime);
        return;
      }
      setSelectedTimelineClip(clip.id, "sticker", appendSelection);
    },
    [
      onSplitStickerClipAtTime,
      pixelsPerSecond,
      setSelectedTimelineClip,
      timelineToolMode,
    ]
  );

  return {
    handleSelectTool,
    handleCutTool,
    handleSplitSelected,
    handleTrackClick,
    handleVideoClipClick,
    handleAudioClipClick,
    handleStickerClipClick,
  };
}
