import { useEffect } from "react";
import { isEditableElement } from "./clipTimelineUtils";

type UseTimelineHotkeysOptions = {
  selectedTimelineTrack: "video" | "audio" | null;
  selectedTimelineClipCount: number;
  onDeleteVideo: () => void;
  onDeleteAudio: () => void;
};

export function useTimelineHotkeys({
  selectedTimelineTrack,
  selectedTimelineClipCount,
  onDeleteVideo,
  onDeleteAudio,
}: UseTimelineHotkeysOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isEditableElement(event.target)) {
        return;
      }
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }
      event.preventDefault();
      if (selectedTimelineClipCount > 0) {
        onDeleteVideo();
        onDeleteAudio();
        return;
      }
      if (selectedTimelineTrack === "audio") {
        onDeleteAudio();
      } else {
        onDeleteVideo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onDeleteAudio,
    onDeleteVideo,
    selectedTimelineClipCount,
    selectedTimelineTrack,
  ]);
}
