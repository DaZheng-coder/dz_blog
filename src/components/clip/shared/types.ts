export type ClipMediaType = "video" | "audio";

export type ClipMediaAsset = {
  id: string;
  signature: string;
  title: string;
  durationSeconds: number;
  objectUrl: string;
  mediaType: ClipMediaType;
  coverDataUrl: string | null;
  frameThumbnails?: string[];
  audioLevels?: number[];
};

export type ClipDragAsset = Pick<
  ClipMediaAsset,
  "id" | "title" | "durationSeconds" | "objectUrl" | "mediaType"
> & {
  coverDataUrl?: string | null;
  frameThumbnails?: string[];
  audioLevels?: number[];
};

export type ClipTrackClip = {
  id: string;
  assetId: string;
  title: string;
  mediaType: ClipMediaType;
  mediaDurationSeconds: number;
  startSeconds: number;
  sourceStartSeconds: number;
  sourceEndSeconds: number;
  durationSeconds: number;
  objectUrl: string;
  frameThumbnails?: string[];
  audioLevels?: number[];
};

export type ClipTextOverlay = {
  id: string;
  text: string;
  startSeconds: number;
  endSeconds: number;
  xPercent: number;
  yPercent: number;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  color: string;
};

export type ClipStickerOverlay = {
  id: string;
  sticker: string;
  startSeconds: number;
  endSeconds: number;
  xPercent: number;
  yPercent: number;
  size: number;
};

export type ClipPreviewVideoSource = {
  sourceType: "timeline";
  durationSeconds: number;
  objectUrl: string;
  startSeconds?: number;
  timelineStartSeconds?: number;
  sourceStartSeconds?: number;
  sourceEndSeconds?: number;
  playheadSeconds?: number;
  timelinePlaying?: boolean;
};

export type ClipPreviewEmptySource = {
  sourceType: "empty";
  durationSeconds: number;
  startSeconds?: number;
  playheadSeconds?: number;
  timelinePlaying?: boolean;
};

export type ClipPreviewSource = ClipPreviewVideoSource | ClipPreviewEmptySource;

export type InspectorMetric = {
  label: string;
  value: string;
};

export type InspectorAnimation = {
  label: string;
  active?: boolean;
};

export type ColorAdjustment = {
  label: string;
  value: string;
  progress: string;
};
