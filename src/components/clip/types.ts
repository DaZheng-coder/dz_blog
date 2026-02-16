export type ClipVideoAsset = {
  id: string;
  signature: string;
  title: string;
  durationSeconds: number;
  objectUrl: string;
  coverDataUrl: string | null;
};

export type ClipDragAsset = Pick<
  ClipVideoAsset,
  "id" | "title" | "durationSeconds" | "objectUrl"
> & {
  coverDataUrl?: string | null;
};

export type ClipTrackClip = {
  id: string;
  assetId: string;
  title: string;
  startSeconds: number;
  sourceStartSeconds: number;
  sourceEndSeconds: number;
  durationSeconds: number;
  objectUrl: string;
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
