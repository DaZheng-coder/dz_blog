import { useEffect } from "react";
import { isEditableElement } from "./clipTimelineUtils";

type UseTimelineHotkeysOptions = {
  selectedTimelineTrack: "video" | "audio" | "text" | null;
  selectedTimelineClipCount: number;
  onDeleteVideo: () => void;
  onDeleteAudio: () => void;
  onDeleteText: () => void;
};

export function useTimelineHotkeys({
  selectedTimelineTrack,
  selectedTimelineClipCount,
  onDeleteVideo,
  onDeleteAudio,
  onDeleteText,
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
        onDeleteText();
        return;
      }
      if (selectedTimelineTrack === "audio") {
        onDeleteAudio();
      } else if (selectedTimelineTrack === "text") {
        onDeleteText();
      } else {
        onDeleteVideo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onDeleteAudio,
    onDeleteText,
    onDeleteVideo,
    selectedTimelineClipCount,
    selectedTimelineTrack,
  ]);
}
