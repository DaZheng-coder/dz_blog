import { formatDuration } from "../shared/time";
import { ClipInspectorInfoRow, ClipInspectorSection } from "./ClipInspectorCommon";

type PreviewVideoInfo = {
  objectUrl: string;
  durationSeconds: number;
  sourceStartSeconds?: number;
  sourceEndSeconds?: number;
};

type ClipInspectorPreviewVideoSectionProps = {
  info: PreviewVideoInfo;
};

export function ClipInspectorPreviewVideoSection({
  info,
}: ClipInspectorPreviewVideoSectionProps) {
  return (
    <ClipInspectorSection title="预览视频信息">
      <ClipInspectorInfoRow label="类型" value="视频" />
      <ClipInspectorInfoRow label="时长" value={formatDuration(info.durationSeconds)} />
      {typeof info.sourceStartSeconds === "number" &&
      typeof info.sourceEndSeconds === "number" ? (
        <ClipInspectorInfoRow
          label="源片段区间"
          value={`${formatDuration(info.sourceStartSeconds)} ~ ${formatDuration(
            info.sourceEndSeconds
          )}`}
        />
      ) : null}
    </ClipInspectorSection>
  );
}
