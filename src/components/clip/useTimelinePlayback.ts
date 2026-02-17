import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  DEFAULT_ZOOM,
  FRAME_EMIT_INTERVAL_SECONDS,
  MAX_ZOOM,
  MIN_ZOOM,
  PLAYHEAD_PADDING,
  RULER_MINOR_STEP_SECONDS,
  RULER_STEP_SECONDS,
} from "./clipTimelineConfig";
import {
  buildRulerMarks,
  buildRulerTickMarks,
  clamp,
  findActiveClipAtTime,
} from "./clipTimelineUtils";
import type { ClipTrackClip } from "./types";

type UseTimelinePlaybackOptions = {
  clips: ClipTrackClip[];
  playing?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  onTrackDurationChange?: (durationSeconds: number) => void;
  onPreviewClip?: (clip: ClipTrackClip) => void;
  onPreviewEmptyFrame?: (timeSeconds: number) => void;
  onTimelineFrame?: (payload: {
    timeSeconds: number;
    activeClip: ClipTrackClip | null;
    isPlaying: boolean;
  }) => void;
};

export function useTimelinePlayback({
  clips,
  playing,
  onPlayingChange,
  onTrackDurationChange,
  onPreviewClip,
  onPreviewEmptyFrame,
  onTimelineFrame,
}: UseTimelinePlaybackOptions) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const laneRef = useRef<HTMLDivElement>(null);
  const trackViewportRef = useRef<HTMLDivElement>(null);
  const playStartRef = useRef<{ timestamp: number; base: number } | null>(null);
  const playheadDragOffsetPxRef = useRef(0);
  const scrubbingFromPlayheadRef = useRef(false);
  const currentTimeRef = useRef(0);
  const lastFrameRef = useRef<{
    clipId: string | null;
    isPlaying: boolean;
    timeSeconds: number;
  }>({
    clipId: null,
    isPlaying: false,
    timeSeconds: -1,
  });

  const [pixelsPerSecond, setPixelsPerSecond] = useState(DEFAULT_ZOOM);
  const [internalPlaying, setInternalPlaying] = useState(false);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [trackViewportWidth, setTrackViewportWidth] = useState(0);
  const isPlaying = typeof playing === "boolean" ? playing : internalPlaying;

  const updatePlaying = useCallback(
    (nextPlaying: boolean) => {
      if (isPlaying === nextPlaying) {
        return;
      }
      if (typeof playing !== "boolean") {
        setInternalPlaying(nextPlaying);
      }
      onPlayingChange?.(nextPlaying);
    },
    [isPlaying, onPlayingChange, playing]
  );

  const maxClipEndSeconds = useMemo(
    () =>
      clips.reduce(
        (maxEnd, clip) =>
          Math.max(maxEnd, clip.startSeconds + clip.durationSeconds),
        0
      ),
    [clips]
  );

  useEffect(() => {
    onTrackDurationChange?.(maxClipEndSeconds);
  }, [maxClipEndSeconds, onTrackDurationChange]);

  const trackDurationSeconds = useMemo(() => {
    const trailingPaddingSeconds =
      trackViewportWidth > 0 ? trackViewportWidth / pixelsPerSecond / 3 : 0;
    if (maxClipEndSeconds > 0) {
      return Math.max(1, maxClipEndSeconds + trailingPaddingSeconds);
    }
    const viewportDuration =
      trackViewportWidth > 0 ? trackViewportWidth / pixelsPerSecond : 60;
    return Math.max(1, viewportDuration);
  }, [maxClipEndSeconds, pixelsPerSecond, trackViewportWidth]);

  const timelineWidthPx = useMemo(() => {
    const byContent = trackDurationSeconds * pixelsPerSecond;
    return Math.max(trackViewportWidth, byContent);
  }, [pixelsPerSecond, trackDurationSeconds, trackViewportWidth]);

  const zoomBounds = useMemo(() => {
    const safeDuration = Math.max(1, trackDurationSeconds);
    const fitZoom =
      trackViewportWidth > 0 ? trackViewportWidth / safeDuration : DEFAULT_ZOOM;
    const dynamicMin = clamp(Math.round(fitZoom * 0.5), MIN_ZOOM, DEFAULT_ZOOM);
    const dynamicMax = clamp(Math.round(fitZoom * 8), DEFAULT_ZOOM, MAX_ZOOM * 4);
    return {
      minZoom: dynamicMin,
      maxZoom: Math.max(dynamicMin + 1, dynamicMax),
    };
  }, [trackDurationSeconds, trackViewportWidth]);

  useEffect(() => {
    setPixelsPerSecond((prev) => clamp(prev, zoomBounds.minZoom, zoomBounds.maxZoom));
  }, [zoomBounds.maxZoom, zoomBounds.minZoom]);

  const rulerMarks = useMemo(
    () => buildRulerMarks(trackDurationSeconds, RULER_STEP_SECONDS),
    [trackDurationSeconds]
  );

  const rulerTickMarks = useMemo(
    () =>
      buildRulerTickMarks(
        trackDurationSeconds,
        RULER_MINOR_STEP_SECONDS,
        RULER_STEP_SECONDS
      ),
    [trackDurationSeconds]
  );

  const currentTimeX = currentTimeSeconds * pixelsPerSecond;
  const majorGridWidth = pixelsPerSecond * RULER_STEP_SECONDS;
  const minorGridWidth = pixelsPerSecond * RULER_MINOR_STEP_SECONDS;

  const findActiveClipAt = useCallback(
    (timeSeconds: number) => findActiveClipAtTime(timeSeconds, clips),
    [clips]
  );

  const emitTimelineFrame = useCallback(
    (timeSeconds: number, playingFrame: boolean, force = false) => {
      if (!onTimelineFrame) {
        return;
      }
      const activeClip = findActiveClipAt(timeSeconds);
      const clipId = activeClip?.id || null;
      if (
        !force &&
        lastFrameRef.current.clipId === clipId &&
        lastFrameRef.current.isPlaying === playingFrame &&
        Math.abs(lastFrameRef.current.timeSeconds - timeSeconds) <
          FRAME_EMIT_INTERVAL_SECONDS
      ) {
        return;
      }
      lastFrameRef.current = {
        clipId,
        isPlaying: playingFrame,
        timeSeconds,
      };
      onTimelineFrame({
        timeSeconds,
        activeClip,
        isPlaying: playingFrame,
      });
    },
    [findActiveClipAt, onTimelineFrame]
  );

  useEffect(() => {
    currentTimeRef.current = currentTimeSeconds;
  }, [currentTimeSeconds]);

  useEffect(() => {
    const viewport = trackViewportRef.current;
    if (!viewport) {
      return;
    }
    const update = () => setTrackViewportWidth(viewport.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const timeFromClientX = useCallback(
    (clientX: number) => {
      const lane = laneRef.current;
      if (!lane) {
        return 0;
      }
      const rect = lane.getBoundingClientRect();
      const x = clientX - rect.left;
      return clamp(x / pixelsPerSecond, 0, trackDurationSeconds);
    },
    [pixelsPerSecond, trackDurationSeconds]
  );

  const scrollPlayheadIntoView = useCallback(
    (timeSeconds: number) => {
      const scroller = scrollRef.current;
      if (!scroller) {
        return;
      }
      const x = timeSeconds * pixelsPerSecond;
      const leftBound = scroller.scrollLeft + PLAYHEAD_PADDING;
      const rightBound =
        scroller.scrollLeft + scroller.clientWidth - PLAYHEAD_PADDING;

      if (x < leftBound) {
        scroller.scrollLeft = Math.max(0, x - PLAYHEAD_PADDING);
      } else if (x > rightBound) {
        scroller.scrollLeft = Math.max(
          0,
          x - scroller.clientWidth + PLAYHEAD_PADDING
        );
      }
    },
    [pixelsPerSecond]
  );

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const nextTime = timeFromClientX(clientX);
      setCurrentTimeSeconds(nextTime);
      if (isPlaying) {
        playStartRef.current = {
          timestamp: performance.now(),
          base: nextTime,
        };
      }
      scrollPlayheadIntoView(nextTime);
      return nextTime;
    },
    [isPlaying, scrollPlayheadIntoView, timeFromClientX]
  );

  const handleSeekClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const nextTime = seekFromClientX(event.clientX);
    const activeClip = findActiveClipAt(nextTime);
    if (activeClip) {
      onPreviewClip?.(activeClip);
    } else {
      onPreviewEmptyFrame?.(nextTime);
    }
    emitTimelineFrame(nextTime, isPlaying, true);
  };

  const handleSeekMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    scrubbingFromPlayheadRef.current = false;
    playheadDragOffsetPxRef.current = 0;
    setIsScrubbing(true);
    const nextTime = seekFromClientX(event.clientX);
    const activeClip = findActiveClipAt(nextTime);
    if (activeClip) {
      onPreviewClip?.(activeClip);
    } else {
      onPreviewEmptyFrame?.(nextTime);
    }
    emitTimelineFrame(nextTime, isPlaying, true);
  };

  const handlePlayheadMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const lane = laneRef.current;
    const scrollLeft = scrollRef.current?.scrollLeft || 0;
    if (lane) {
      const rect = lane.getBoundingClientRect();
      const playheadClientX =
        rect.left - scrollLeft + currentTimeRef.current * pixelsPerSecond;
      playheadDragOffsetPxRef.current = event.clientX - playheadClientX;
    } else {
      playheadDragOffsetPxRef.current = 0;
    }
    scrubbingFromPlayheadRef.current = true;
    setIsScrubbing(true);
    const nextTime = seekFromClientX(
      event.clientX - playheadDragOffsetPxRef.current
    );
    emitTimelineFrame(nextTime, isPlaying, true);
  };

  useEffect(() => {
    if (!isScrubbing) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const clientX = scrubbingFromPlayheadRef.current
        ? event.clientX - playheadDragOffsetPxRef.current
        : event.clientX;
      const nextTime = seekFromClientX(clientX);
      const activeClip = findActiveClipAt(nextTime);
      if (activeClip) {
        onPreviewClip?.(activeClip);
      } else {
        onPreviewEmptyFrame?.(nextTime);
      }
      emitTimelineFrame(nextTime, isPlaying, true);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      scrubbingFromPlayheadRef.current = false;
      playheadDragOffsetPxRef.current = 0;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    emitTimelineFrame,
    findActiveClipAt,
    isPlaying,
    isScrubbing,
    onPreviewClip,
    onPreviewEmptyFrame,
    seekFromClientX,
  ]);

  useEffect(() => {
    if (!isScrubbing) {
      return;
    }
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isScrubbing]);

  useEffect(() => {
    if (!isPlaying) {
      playStartRef.current = null;
      return;
    }

    if (!playStartRef.current) {
      playStartRef.current = {
        timestamp: performance.now(),
        base: currentTimeRef.current,
      };
    }

    let rafId = 0;
    const animate = (timestamp: number) => {
      if (!playStartRef.current) {
        return;
      }

      const elapsed =
        (timestamp - playStartRef.current.timestamp) / 1000 +
        playStartRef.current.base;
      const nextTime = Math.min(elapsed, trackDurationSeconds);
      setCurrentTimeSeconds(nextTime);
      scrollPlayheadIntoView(nextTime);
      emitTimelineFrame(nextTime, true);

      if (nextTime >= trackDurationSeconds) {
        updatePlaying(false);
        playStartRef.current = null;
        return;
      }

      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(rafId);
  }, [
    isPlaying,
    trackDurationSeconds,
    scrollPlayheadIntoView,
    emitTimelineFrame,
    updatePlaying,
  ]);

  useEffect(() => {
    emitTimelineFrame(currentTimeSeconds, isPlaying, true);
  }, [currentTimeSeconds, emitTimelineFrame, isPlaying]);

  return {
    scrollRef,
    laneRef,
    trackViewportRef,
    currentTimeRef,
    isPlaying,
    emitTimelineFrame,
    currentTimeSeconds,
    currentTimeX,
    pixelsPerSecond,
    majorGridWidth,
    minorGridWidth,
    timelineWidthPx,
    minZoom: zoomBounds.minZoom,
    maxZoom: zoomBounds.maxZoom,
    rulerMarks,
    rulerTickMarks,
    isScrubbing,
    setPixelsPerSecond,
    handleSeekClick,
    handleSeekMouseDown,
    handlePlayheadMouseDown,
  };
}
