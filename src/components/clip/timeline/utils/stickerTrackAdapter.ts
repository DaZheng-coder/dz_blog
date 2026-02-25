import type { ClipStickerOverlay, ClipTrackClip } from "../../shared/types";
import {
  applyTrackClipsToOverlays,
  overlaysToTrackClips,
  overlayToTrackClip,
} from "./overlayTrackAdapter";

export function toStickerTrackClip(
  overlay: ClipStickerOverlay,
  minDurationSeconds: number
): ClipTrackClip {
  return overlayToTrackClip(overlay, minDurationSeconds, () => "贴纸");
}

export function toStickerTrackClips(
  overlays: ClipStickerOverlay[],
  minDurationSeconds: number
): ClipTrackClip[] {
  return overlaysToTrackClips(overlays, minDurationSeconds, () => "贴纸");
}

export function applyStickerTrackClipsToOverlays(
  prevOverlays: ClipStickerOverlay[],
  nextClips: ClipTrackClip[],
  minDurationSeconds: number
): ClipStickerOverlay[] {
  return applyTrackClipsToOverlays(
    prevOverlays,
    nextClips,
    minDurationSeconds,
    (overlay, clip) => ({
      ...overlay,
      startSeconds: clip.startSeconds,
      endSeconds: clip.startSeconds + clip.durationSeconds,
    })
  );
}
