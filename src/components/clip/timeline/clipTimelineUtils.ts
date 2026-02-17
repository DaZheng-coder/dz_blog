import { MEDIA_ASSET_MIME } from "../shared/dnd";
import type { ClipDragAsset, ClipTrackClip } from "../shared/types";

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function formatTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const remain = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
}

export function findActiveClipAtTime(
  timeSeconds: number,
  clips: ClipTrackClip[]
) {
  return (
    clips.find(
      (clip) =>
        timeSeconds >= clip.startSeconds &&
        timeSeconds < clip.startSeconds + clip.durationSeconds
    ) || null
  );
}

export function buildRulerMarks(durationSeconds: number, stepSeconds: number) {
  const marks: number[] = [];
  const duration = Math.ceil(durationSeconds);
  for (let t = 0; t <= duration; t += stepSeconds) {
    marks.push(t);
  }
  return marks;
}

export function buildRulerTickMarks(
  durationSeconds: number,
  minorStepSeconds: number,
  majorStepSeconds: number
) {
  const marks: Array<{ second: number; major: boolean }> = [];
  const duration = Math.ceil(durationSeconds);
  for (let t = 0; t <= duration; t += minorStepSeconds) {
    marks.push({ second: t, major: t % majorStepSeconds === 0 });
  }
  return marks;
}

export function isEditableElement(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  const tagName = element?.tagName.toLowerCase();
  return Boolean(
    element?.isContentEditable ||
      tagName === "input" ||
      tagName === "textarea" ||
      tagName === "select"
  );
}

export function parseDragAsset(
  raw: string,
  fallback: ClipDragAsset | null
): ClipDragAsset | null {
  if (raw) {
    return JSON.parse(raw) as ClipDragAsset;
  }
  return fallback;
}

export function readDragAssetFromDataTransfer(
  dataTransfer: DataTransfer,
  fallback: ClipDragAsset | null
) {
  const rawAsset = dataTransfer.getData(MEDIA_ASSET_MIME);
  return parseDragAsset(rawAsset, fallback);
}
