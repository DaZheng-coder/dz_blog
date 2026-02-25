import type { ClipTrackClip } from "../../shared/types";

type OverlayWithTime = {
  id: string;
  startSeconds: number;
  endSeconds: number;
};

type ToClipTitle<TOverlay extends OverlayWithTime> = (overlay: TOverlay) => string;
type ApplyClipToOverlay<TOverlay extends OverlayWithTime> = (
  overlay: TOverlay,
  clip: ClipTrackClip
) => TOverlay;

export function overlayToTrackClip<TOverlay extends OverlayWithTime>(
  overlay: TOverlay,
  minDurationSeconds: number,
  toTitle: ToClipTitle<TOverlay>
): ClipTrackClip {
  const durationSeconds = Math.max(
    minDurationSeconds,
    overlay.endSeconds - overlay.startSeconds
  );
  return {
    id: overlay.id,
    assetId: overlay.id,
    title: toTitle(overlay),
    mediaType: "video",
    mediaDurationSeconds: durationSeconds,
    startSeconds: Math.max(0, overlay.startSeconds),
    sourceStartSeconds: 0,
    sourceEndSeconds: durationSeconds,
    durationSeconds,
    objectUrl: "",
  };
}

export function overlaysToTrackClips<TOverlay extends OverlayWithTime>(
  overlays: TOverlay[],
  minDurationSeconds: number,
  toTitle: ToClipTitle<TOverlay>
): ClipTrackClip[] {
  return overlays
    .map((overlay) => overlayToTrackClip(overlay, minDurationSeconds, toTitle))
    .filter((clip) => clip.durationSeconds > 0);
}

export function applyTrackClipsToOverlays<TOverlay extends OverlayWithTime>(
  prevOverlays: TOverlay[],
  nextClips: ClipTrackClip[],
  minDurationSeconds: number,
  applyClip: ApplyClipToOverlay<TOverlay>
): TOverlay[] {
  const nextMap = new Map(nextClips.map((clip) => [clip.id, clip]));

  return prevOverlays.flatMap((overlay) => {
    const clip = nextMap.get(overlay.id);
    if (!clip) {
      return [];
    }
    const startSeconds = Math.max(0, clip.startSeconds);
    const durationSeconds = Math.max(minDurationSeconds, clip.durationSeconds);
    return [applyClip(overlay, { ...clip, startSeconds, durationSeconds })];
  });
}
