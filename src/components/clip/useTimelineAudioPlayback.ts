import { useEffect, useRef } from "react";
import { findActiveClipAtTime } from "./clipTimelineUtils";
import type { ClipTrackClip } from "./types";

const AUDIO_SYNC_DRIFT_SECONDS = 0.15;

type UseTimelineAudioPlaybackOptions = {
  audioClips: ClipTrackClip[];
  currentTimeSeconds: number;
  isPlaying: boolean;
};

export function useTimelineAudioPlayback({
  audioClips,
  currentTimeSeconds,
  isPlaying,
}: UseTimelineAudioPlaybackOptions) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeAudioClipIdRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const activeAudioClip = findActiveClipAtTime(currentTimeSeconds, audioClips);
    if (!activeAudioClip) {
      activeAudioClipIdRef.current = null;
      if (!audio.paused) {
        audio.pause();
      }
      return;
    }

    const clipStart = activeAudioClip.startSeconds;
    const clipOffset = currentTimeSeconds - clipStart;
    const targetSourceTime = Math.min(
      activeAudioClip.sourceEndSeconds,
      Math.max(
        activeAudioClip.sourceStartSeconds,
        activeAudioClip.sourceStartSeconds + clipOffset
      )
    );

    const clipChanged = activeAudioClipIdRef.current !== activeAudioClip.id;
    activeAudioClipIdRef.current = activeAudioClip.id;

    const sameSource = audio.src === activeAudioClip.objectUrl;
    if (!sameSource) {
      audio.src = activeAudioClip.objectUrl;
    }

    const syncAudioTime = () => {
      if (Math.abs(audio.currentTime - targetSourceTime) > AUDIO_SYNC_DRIFT_SECONDS) {
        audio.currentTime = targetSourceTime;
      }
    };

    if (!sameSource || clipChanged) {
      const handleLoadedMetadata = () => {
        audio.currentTime = targetSourceTime;
        if (isPlaying) {
          const playPromise = audio.play();
          if (playPromise) {
            void playPromise.catch(() => {
              // ignore autoplay rejections
            });
          }
        }
      };
      audio.addEventListener("loadedmetadata", handleLoadedMetadata, {
        once: true,
      });
      audio.load();
    } else {
      syncAudioTime();
      if (isPlaying) {
        if (audio.paused) {
          const playPromise = audio.play();
          if (playPromise) {
            void playPromise.catch(() => {
              // ignore autoplay rejections
            });
          }
        }
      } else if (!audio.paused) {
        audio.pause();
      }
    }
  }, [audioClips, currentTimeSeconds, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, []);

  return {
    audioRef,
  };
}
