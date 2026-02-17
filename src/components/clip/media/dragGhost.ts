import { formatDuration } from "../shared/time";
import type { ClipDragAsset } from "../shared/types";

export function createCardDragGhost(asset: ClipDragAsset) {
  const ghost = document.createElement("div");
  ghost.style.position = "fixed";
  ghost.style.top = "0";
  ghost.style.left = "0";
  ghost.style.pointerEvents = "none";
  ghost.style.transform = "translate3d(-9999px, -9999px, 0)";
  ghost.style.zIndex = "9999";
  ghost.style.width = "168px";
  ghost.style.height = "100px";
  ghost.style.borderRadius = "10px";
  ghost.style.border = "1px solid rgba(255,255,255,0.18)";
  ghost.style.background = "rgba(15, 21, 34, 0.96)";
  ghost.style.opacity = "0.96";
  ghost.style.boxSizing = "border-box";
  ghost.style.padding = "6px";
  ghost.style.boxShadow = "0 10px 24px rgba(0,0,0,0.32)";
  ghost.style.willChange = "transform";

  const cover = document.createElement("div");
  cover.style.height = "56px";
  cover.style.borderRadius = "7px";
  cover.style.background = "linear-gradient(135deg,#1f2937,#0f172a)";
  cover.style.backgroundSize = "cover";
  cover.style.backgroundPosition = "center";
  if (asset.coverDataUrl) {
    cover.style.backgroundImage = `url("${asset.coverDataUrl}")`;
  }

  const title = document.createElement("p");
  title.style.margin = "6px 0 0 0";
  title.style.fontSize = "12px";
  title.style.color = "#fff";
  title.style.fontWeight = "600";
  title.style.whiteSpace = "nowrap";
  title.style.overflow = "hidden";
  title.style.textOverflow = "ellipsis";
  title.textContent = asset.title;

  const duration = document.createElement("p");
  duration.style.margin = "2px 0 0 0";
  duration.style.fontSize = "11px";
  duration.style.color = "#9ca3af";
  duration.style.whiteSpace = "nowrap";
  duration.textContent = `时长 ${formatDuration(asset.durationSeconds)}`;

  ghost.append(cover, title, duration);
  return ghost;
}

export function createTrackBlockGhost(
  asset: ClipDragAsset,
  pixelsPerSecond: number,
  minClipWidth: number
) {
  const ghost = document.createElement("div");
  ghost.style.position = "fixed";
  ghost.style.top = "0";
  ghost.style.left = "0";
  ghost.style.pointerEvents = "none";
  ghost.style.transform = "translate3d(-9999px, -9999px, 0)";
  ghost.style.zIndex = "9999";
  const width = Math.max(asset.durationSeconds * pixelsPerSecond, minClipWidth);
  ghost.style.width = `${Math.round(width)}px`;
  ghost.style.height = "52px";
  ghost.style.borderRadius = "8px";
  ghost.style.border = "1px solid #22d3ee";
  ghost.style.background =
    "linear-gradient(90deg, rgba(34,211,238,0.36), rgba(14,165,233,0.36))";
  ghost.style.color = "#ffffff";
  ghost.style.padding = "6px 8px";
  ghost.style.boxSizing = "border-box";
  ghost.style.boxShadow = "0 8px 20px rgba(0,0,0,0.25)";
  ghost.style.willChange = "transform";
  ghost.innerHTML = `
    <p style="margin:0; font-size:12px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${asset.title}</p>
    <p style="margin:4px 0 0 0; font-size:11px; color:rgba(255,255,255,0.85);">${formatDuration(asset.durationSeconds)}</p>
  `;
  return ghost;
}
