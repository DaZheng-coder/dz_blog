export type PreviewPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  level: number;
};

export function isSamePreviewPosition(
  prev: PreviewPosition | null,
  next: PreviewPosition | null
): boolean {
  if (prev === next) return true;
  if (!prev || !next) return false;

  return (
    prev.x === next.x &&
    prev.y === next.y &&
    prev.width === next.width &&
    prev.height === next.height &&
    prev.text === next.text &&
    prev.level === next.level
  );
}
