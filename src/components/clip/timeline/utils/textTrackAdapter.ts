import type { ClipTextOverlay, ClipTrackClip } from "../../shared/types";

export function toTextTrackClip(
  overlay: ClipTextOverlay,
  minDurationSeconds: number
): ClipTrackClip {
  const durationSeconds = Math.max(
    minDurationSeconds,
    overlay.endSeconds - overlay.startSeconds
  );
  return {
    id: overlay.id,
    assetId: overlay.id,
    title: overlay.text.trim() || "文本",
    mediaType: "video",
    mediaDurationSeconds: durationSeconds,
    startSeconds: Math.max(0, overlay.startSeconds),
    sourceStartSeconds: 0,
    sourceEndSeconds: durationSeconds,
    durationSeconds,
    objectUrl: "",
  };
}

export function toTextTrackClips(
  overlays: ClipTextOverlay[],
  minDurationSeconds: number
): ClipTrackClip[] {
  return overlays
    .map((overlay) => toTextTrackClip(overlay, minDurationSeconds))
    .filter((clip) => clip.durationSeconds > 0);
}

export function applyTextTrackClipsToOverlays(
  prevOverlays: ClipTextOverlay[],
  nextClips: ClipTrackClip[],
  minDurationSeconds: number
): ClipTextOverlay[] {
  const nextMap = new Map(nextClips.map((clip) => [clip.id, clip]));

  return prevOverlays.flatMap((overlay) => {
    const clip = nextMap.get(overlay.id);
    if (!clip) {
      return [];
    }
    const startSeconds = Math.max(0, clip.startSeconds);
    const durationSeconds = Math.max(minDurationSeconds, clip.durationSeconds);
    return [
      {
        ...overlay,
        startSeconds,
        endSeconds: startSeconds + durationSeconds,
      },
    ];
  });
}
