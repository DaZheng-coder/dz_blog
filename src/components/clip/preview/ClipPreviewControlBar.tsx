import { formatDuration } from "../shared/time";
import {
  FastForwardIcon,
  PauseIcon,
  PlayIcon,
  RewindIcon,
} from "./icons";

const SEEK_STEP_SECONDS = 2;

type ClipPreviewControlBarProps = {
  currentTimeSeconds: number;
  totalDurationSeconds: number;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onSeekBy: (seconds: number) => void;
};

export function ClipPreviewControlBar({
  currentTimeSeconds,
  totalDurationSeconds,
  isPlaying,
  onTogglePlayPause,
  onSeekBy,
}: ClipPreviewControlBarProps) {
  return (
    <div className="mt-2 relative flex items-center justify-center rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs text-[#d1d5db]">
      <div className="flex items-center gap-2">
        <button
          className="cursor-pointer rounded border border-white/15 bg-white/5 p-2 hover:border-[#22d3ee]/70"
          onClick={() => onSeekBy(-SEEK_STEP_SECONDS)}
          aria-label="快退2秒"
          title="快退 2 秒"
        >
          <RewindIcon />
        </button>
        <button
          className="cursor-pointer rounded border border-white/15 bg-white/5 p-2 hover:border-[#22d3ee]/70"
          onClick={onTogglePlayPause}
          aria-label={isPlaying ? "暂停" : "播放"}
          title={isPlaying ? "暂停" : "播放"}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          className="cursor-pointer rounded border border-white/15 bg-white/5 p-2 hover:border-[#22d3ee]/70"
          onClick={() => onSeekBy(SEEK_STEP_SECONDS)}
          aria-label="快进2秒"
          title="快进 2 秒"
        >
          <FastForwardIcon />
        </button>
      </div>
      <div className="text-right text-[#9ca3af] absolute right-3">
        <p>
          {formatDuration(currentTimeSeconds)} /{" "}
          {formatDuration(totalDurationSeconds)}
        </p>
        <p className="text-[11px] text-[#6b7280]">
          总时长 {formatDuration(totalDurationSeconds)}
        </p>
      </div>
    </div>
  );
}
