import { useEffect, useMemo, useRef, useState } from "react";
import type { ClipPreviewSource } from "./types";

const DRIFT_SYNC_THRESHOLD_PLAYING = 0.35;
const DRIFT_SYNC_THRESHOLD_PAUSED = 0.04;

type UseClipPreviewControllerOptions = {
  previewSource: ClipPreviewSource | null;
  timelinePlaying?: boolean;
  onToggleTimelinePlaying?: (playing: boolean) => void;
};

export function useClipPreviewController({
  previewSource,
  timelinePlaying,
  onToggleTimelinePlaying,
}: UseClipPreviewControllerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineSourceKeyRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayTime, setDisplayTime] = useState(0);
  const emptyPlayStartRef = useRef<{ timestamp: number; base: number } | null>(
    null
  );

  const isEmptySource = previewSource?.sourceType === "empty";
  const previewObjectUrl =
    previewSource && previewSource.sourceType !== "empty"
      ? previewSource.objectUrl
      : undefined;

  const segment = useMemo(() => {
    if (!previewSource) {
      return null;
    }
    const start =
      previewSource.sourceType === "timeline"
        ? previewSource.sourceStartSeconds || 0
        : 0;
    const end =
      previewSource.sourceType === "timeline"
        ? previewSource.sourceEndSeconds ?? start + previewSource.durationSeconds
        : start + previewSource.durationSeconds;
    const duration = Math.max(end - start, 0.1);
    return {
      start,
      end,
      duration,
    };
  }, [previewSource]);

  const effectivePlaying =
    typeof timelinePlaying === "boolean"
      ? timelinePlaying
      : Boolean(previewSource?.timelinePlaying ?? isPlaying);
  const timelineCurrentSeconds =
    typeof previewSource?.playheadSeconds === "number"
      ? previewSource.playheadSeconds
      : 0;

  useEffect(() => {
    if (isEmptySource) {
      return;
    }

    const video = videoRef.current;
    if (!video || !segment) {
      return;
    }

    const handleLoadedMetadata = () => {
      video.currentTime = segment.start;
      setDisplayTime(0);
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      if (video.currentTime >= segment.end) {
        video.currentTime = segment.end;
        video.pause();
        setIsPlaying(false);
      }
      const offset = Math.max(
        0,
        Math.min(video.currentTime - segment.start, segment.duration)
      );
      setDisplayTime(offset);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [isEmptySource, previewObjectUrl, segment]);

  useEffect(() => {
    if (!isEmptySource || !segment || !isPlaying) {
      emptyPlayStartRef.current = null;
      return;
    }

    if (!emptyPlayStartRef.current) {
      emptyPlayStartRef.current = {
        timestamp: performance.now(),
        base: displayTime,
      };
    }

    let rafId = 0;
    const animate = (timestamp: number) => {
      if (!emptyPlayStartRef.current) {
        return;
      }

      const elapsed =
        emptyPlayStartRef.current.base +
        (timestamp - emptyPlayStartRef.current.timestamp) / 1000;
      const nextTime = Math.min(elapsed, segment.duration);
      setDisplayTime(nextTime);

      if (nextTime >= segment.duration) {
        setIsPlaying(false);
        emptyPlayStartRef.current = null;
        return;
      }
      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(rafId);
  }, [displayTime, isEmptySource, isPlaying, segment]);

  useEffect(() => {
    if (previewSource?.sourceType === "timeline") {
      return;
    }
    timelineSourceKeyRef.current = null;
  }, [previewSource?.sourceType]);

  useEffect(() => {
    if (!previewSource || previewSource.sourceType !== "timeline") {
      return;
    }
    const video = videoRef.current;
    if (!video || !segment) {
      return;
    }

    const sourceKey = `${previewSource.objectUrl}-${segment.start}-${segment.end}-${previewSource.timelineStartSeconds || 0}`;
    const sourceChanged = timelineSourceKeyRef.current !== sourceKey;
    timelineSourceKeyRef.current = sourceKey;

    if (typeof previewSource.playheadSeconds === "number") {
      const timelineStart = previewSource.timelineStartSeconds || 0;
      const sourceStart = previewSource.sourceStartSeconds || segment.start;
      const sourceTimeFromTimeline =
        sourceStart + (previewSource.playheadSeconds - timelineStart);
      const target = Math.min(
        segment.end,
        Math.max(segment.start, sourceTimeFromTimeline)
      );
      const drift = Math.abs(video.currentTime - target);
      const threshold = effectivePlaying
        ? DRIFT_SYNC_THRESHOLD_PLAYING
        : DRIFT_SYNC_THRESHOLD_PAUSED;
      if (sourceChanged || drift > threshold) {
        video.currentTime = target;
      }
    } else if (sourceChanged) {
      video.currentTime = segment.start;
    }

    if (effectivePlaying) {
      if (video.paused) {
        const playPromise = video.play();
        if (playPromise) {
          void playPromise.catch(() => {
            // Fallback to frame-by-frame sync when autoplay is blocked.
          });
        }
      }
    } else if (!video.paused) {
      video.pause();
    }
  }, [effectivePlaying, previewSource, segment]);

  const togglePlayPause = () => {
    if (onToggleTimelinePlaying) {
      onToggleTimelinePlaying(!effectivePlaying);
      return;
    }
    if (!segment) {
      return;
    }
    if (isEmptySource) {
      setIsPlaying((prev) => {
        if (!prev && displayTime >= segment.duration) {
          setDisplayTime(0);
          emptyPlayStartRef.current = {
            timestamp: performance.now(),
            base: 0,
          };
        } else if (!prev) {
          emptyPlayStartRef.current = {
            timestamp: performance.now(),
            base: displayTime,
          };
        } else {
          emptyPlayStartRef.current = null;
        }
        return !prev;
      });
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused) {
      if (video.currentTime >= segment.end) {
        video.currentTime = segment.start;
      }
      void video.play();
    } else {
      video.pause();
    }
  };

  const seekBy = (deltaSeconds: number) => {
    if (!segment) {
      return;
    }
    if (isEmptySource) {
      const nextTime = Math.min(
        segment.duration,
        Math.max(0, displayTime + deltaSeconds)
      );
      setDisplayTime(nextTime);
      if (isPlaying) {
        emptyPlayStartRef.current = {
          timestamp: performance.now(),
          base: nextTime,
        };
      }
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }
    const nextTime = Math.min(
      segment.end,
      Math.max(segment.start, video.currentTime + deltaSeconds)
    );
    video.currentTime = nextTime;
    setDisplayTime(Math.max(0, nextTime - segment.start));
  };

  return {
    videoRef,
    isEmptySource,
    effectivePlaying,
    timelineCurrentSeconds,
    togglePlayPause,
    seekBy,
  };
}
