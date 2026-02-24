import { formatDuration } from "../shared/time";
import type { ClipDragAsset } from "../shared/types";

function ensureCommonGhostStyle(ghost: HTMLElement) {
  if (ghost.dataset.ghostBaseReady === "1") {
    return;
  }
  ghost.dataset.ghostBaseReady = "1";
  ghost.style.position = "fixed";
  ghost.style.top = "0";
  ghost.style.left = "0";
  ghost.style.pointerEvents = "none";
  ghost.style.transform = "translate3d(-9999px, -9999px, 0)";
  ghost.style.zIndex = "9999";
  ghost.style.boxSizing = "border-box";
  ghost.style.willChange = "transform";
}

export function createCardDragGhost(
  asset: ClipDragAsset,
  existingGhost?: HTMLElement | null
) {
  const ghost = existingGhost ?? document.createElement("div");
  ensureCommonGhostStyle(ghost);

  if (ghost.dataset.ghostKind !== "card") {
    ghost.dataset.ghostKind = "card";
    ghost.style.width = "168px";
    ghost.style.height = "100px";
    ghost.style.borderRadius = "10px";
    ghost.style.border = "1px solid rgba(255,255,255,0.18)";
    ghost.style.background = "rgba(15, 21, 34, 0.96)";
    ghost.style.opacity = "0.96";
    ghost.style.padding = "6px";
    ghost.style.boxShadow = "0 10px 24px rgba(0,0,0,0.32)";
    ghost.innerHTML = "";

    const cover = document.createElement("div");
    cover.dataset.ghostRole = "cover";
    cover.style.height = "56px";
    cover.style.borderRadius = "7px";
    cover.style.background = "linear-gradient(135deg,#1f2937,#0f172a)";
    cover.style.backgroundSize = "cover";
    cover.style.backgroundPosition = "center";

    const title = document.createElement("p");
    title.dataset.ghostRole = "title";
    title.style.margin = "6px 0 0 0";
    title.style.fontSize = "12px";
    title.style.color = "#fff";
    title.style.fontWeight = "600";
    title.style.whiteSpace = "nowrap";
    title.style.overflow = "hidden";
    title.style.textOverflow = "ellipsis";

    const duration = document.createElement("p");
    duration.dataset.ghostRole = "duration";
    duration.style.margin = "2px 0 0 0";
    duration.style.fontSize = "11px";
    duration.style.color = "#9ca3af";
    duration.style.whiteSpace = "nowrap";

    ghost.append(cover, title, duration);
  }

  const cover = ghost.querySelector<HTMLElement>('[data-ghost-role="cover"]');
  const title = ghost.querySelector<HTMLElement>('[data-ghost-role="title"]');
  const duration = ghost.querySelector<HTMLElement>('[data-ghost-role="duration"]');

  if (cover) {
    cover.style.backgroundImage = asset.coverDataUrl
      ? `url("${asset.coverDataUrl}")`
      : "linear-gradient(135deg,#1f2937,#0f172a)";
  }
  if (title) {
    title.textContent = asset.title;
  }
  if (duration) {
    duration.textContent = `时长 ${formatDuration(asset.durationSeconds)}`;
  }

  return ghost;
}

export function createTrackBlockGhost(
  asset: ClipDragAsset,
  pixelsPerSecond: number,
  minClipWidth: number,
  existingGhost?: HTMLElement | null
) {
  const ghost = existingGhost ?? document.createElement("div");
  ensureCommonGhostStyle(ghost);

  if (ghost.dataset.ghostKind !== "track") {
    ghost.dataset.ghostKind = "track";
    ghost.style.height = "52px";
    ghost.style.borderRadius = "8px";
    ghost.style.border = "1px solid #22d3ee";
    ghost.style.background =
      "linear-gradient(90deg, rgba(34,211,238,0.36), rgba(14,165,233,0.36))";
    ghost.style.color = "#ffffff";
    ghost.style.padding = "6px 8px";
    ghost.style.boxShadow = "0 8px 20px rgba(0,0,0,0.25)";
    ghost.innerHTML = `
      <p data-ghost-role="title" style="margin:0; font-size:12px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"></p>
      <p data-ghost-role="duration" style="margin:4px 0 0 0; font-size:11px; color:rgba(255,255,255,0.85);"></p>
    `;
  }

  const width = Math.max(asset.durationSeconds * pixelsPerSecond, minClipWidth);
  ghost.style.width = `${Math.round(width)}px`;
  const title = ghost.querySelector<HTMLElement>('[data-ghost-role="title"]');
  const duration = ghost.querySelector<HTMLElement>('[data-ghost-role="duration"]');
  if (title) {
    title.textContent = asset.title;
  }
  if (duration) {
    duration.textContent = formatDuration(asset.durationSeconds);
  }

  return ghost;
}
