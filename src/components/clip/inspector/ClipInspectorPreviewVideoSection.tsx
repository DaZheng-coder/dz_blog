import { formatDuration } from "../shared/time";

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
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-[#9ca3af]">预览视频信息</p>
      <div className="mt-2 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[#cbd5e1]">类型</span>
          <span className="rounded bg-white/10 px-2 py-0.5 text-white">视频</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#cbd5e1]">时长</span>
          <span className="rounded bg-white/10 px-2 py-0.5 text-white">
            {formatDuration(info.durationSeconds)}
          </span>
        </div>
        {typeof info.sourceStartSeconds === "number" &&
        typeof info.sourceEndSeconds === "number" ? (
          <div className="flex items-center justify-between">
            <span className="text-[#cbd5e1]">源片段区间</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-white">
              {formatDuration(info.sourceStartSeconds)} ~ {formatDuration(info.sourceEndSeconds)}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
