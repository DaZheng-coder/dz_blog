import { useEffect } from "react";
import { isEditableElement } from "../utils/clipTimelineUtils";

type UseTimelineHotkeysOptions = {
  selectedTimelineTrack: "video" | "audio" | "text" | "sticker" | null;
  selectedTimelineClipCount: number;
  onDeleteVideo: () => void;
  onDeleteAudio: () => void;
  onDeleteText: () => void;
  onDeleteSticker: () => void;
};

export function useTimelineHotkeys({
  selectedTimelineTrack,
  selectedTimelineClipCount,
  onDeleteVideo,
  onDeleteAudio,
  onDeleteText,
  onDeleteSticker,
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
        onDeleteSticker();
        return;
      }
      if (selectedTimelineTrack === "audio") {
        onDeleteAudio();
      } else if (selectedTimelineTrack === "text") {
        onDeleteText();
      } else if (selectedTimelineTrack === "sticker") {
        onDeleteSticker();
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
    onDeleteSticker,
    selectedTimelineClipCount,
    selectedTimelineTrack,
  ]);
}
