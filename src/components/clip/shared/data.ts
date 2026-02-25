import type { ColorAdjustment, InspectorAnimation, InspectorMetric } from "./types";

export type ClipMenuItemId = "import" | "text" | "sticker" | "effect" | "audio";

export type ClipMenuItem = {
  id: ClipMenuItemId;
  label: string;
};

export const menuItems: ClipMenuItem[] = [
  { id: "import", label: "导入" },
  { id: "text", label: "文本" },
  { id: "sticker", label: "贴纸" },
  { id: "effect", label: "特效" },
  { id: "audio", label: "音频" },
];

export const inspectorMetrics: InspectorMetric[] = [
  { label: "播放速度", value: "1.00x" },
  { label: "透明度", value: "100%" },
  { label: "旋转", value: "0°" },
];

export const inspectorAnimations: InspectorAnimation[] = [
  { label: "淡入", active: true },
  { label: "向左滑入" },
  { label: "放大" },
  { label: "闪白" },
];

export const colorAdjustments: ColorAdjustment[] = [
  { label: "曝光", value: "+8", progress: "42%" },
  { label: "对比度", value: "+15", progress: "58%" },
  { label: "饱和度", value: "+12", progress: "47%" },
];
