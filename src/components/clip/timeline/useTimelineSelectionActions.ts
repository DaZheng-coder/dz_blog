import { useCallback, type MouseEvent as ReactMouseEvent } from "react";
import type { ClipTrackClip } from "../shared/types";

type UseTimelineSelectionActionsOptions = {
  selectedTimelineTrack: "video" | "audio" | null;
  selectedTimelineClipCount: number;
  setSelectedTimelineClip: (
    clipId: string | null,
    track: "video" | "audio" | null,
    appendSelection?: boolean
  ) => void;
  previewTimelineClip: (clip: ClipTrackClip) => void;
  onSplitVideo: () => void;
  onSplitAudio: () => void;
  onSeekClick: (event: ReactMouseEvent<HTMLDivElement>) => void;
};

export function useTimelineSelectionActions({
  selectedTimelineTrack,
  selectedTimelineClipCount,
  setSelectedTimelineClip,
  previewTimelineClip,
  onSplitVideo,
  onSplitAudio,
  onSeekClick,
}: UseTimelineSelectionActionsOptions) {
  const handleSplitSelected = useCallback(() => {
    if (selectedTimelineClipCount > 0) {
      onSplitVideo();
      onSplitAudio();
      return;
    }
    if (selectedTimelineTrack === "audio") {
      onSplitAudio();
      return;
    }
    onSplitVideo();
  }, [onSplitAudio, onSplitVideo, selectedTimelineClipCount, selectedTimelineTrack]);

  const handleTrackClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      onSeekClick(event);
      setSelectedTimelineClip(null, null);
    },
    [onSeekClick, setSelectedTimelineClip]
  );

  const handleVideoClipClick = useCallback(
    (clip: ClipTrackClip, appendSelection: boolean) => {
      setSelectedTimelineClip(clip.id, "video", appendSelection);
      if (!appendSelection) {
        previewTimelineClip(clip);
      }
    },
    [previewTimelineClip, setSelectedTimelineClip]
  );

  const handleAudioClipClick = useCallback(
    (clip: ClipTrackClip, appendSelection: boolean) => {
      setSelectedTimelineClip(clip.id, "audio", appendSelection);
    },
    [setSelectedTimelineClip]
  );

  return {
    handleSplitSelected,
    handleTrackClick,
    handleVideoClipClick,
    handleAudioClipClick,
  };
}
