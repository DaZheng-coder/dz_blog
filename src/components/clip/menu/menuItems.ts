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
