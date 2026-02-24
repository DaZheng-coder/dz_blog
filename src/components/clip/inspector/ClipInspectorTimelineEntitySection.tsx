import { formatDuration } from "../shared/time";
import type { ClipTextOverlay, ClipTrackClip } from "../shared/types";

type InspectorNumberInputRowProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

function InspectorNumberInputRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: InspectorNumberInputRowProps) {
  return (
    <label className="flex items-center justify-between gap-2 text-[11px]">
      <span className="text-[#cbd5e1]">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(
            Math.max(min, Math.min(max, Number(event.target.value) || min))
          )
        }
        className="w-20 rounded border border-white/15 bg-white/5 px-2 pr-2 py-1 text-right text-xs text-white outline-none focus:border-[#22d3ee]/70"
      />
    </label>
  );
}

type SelectedTimelineEntity =
  | { kind: "video"; clip: ClipTrackClip }
  | { kind: "audio"; clip: ClipTrackClip }
  | { kind: "text"; overlay: ClipTextOverlay };

type ClipInspectorTimelineEntitySectionProps = {
  entity: SelectedTimelineEntity;
  onUpdateTextOverlayStyle: (
    overlayId: string,
    patch: Partial<
      Pick<
        ClipTextOverlay,
        "fontSize" | "letterSpacing" | "lineHeight" | "color"
      >
    >
  ) => void;
};

export function ClipInspectorTimelineEntitySection({
  entity,
  onUpdateTextOverlayStyle,
}: ClipInspectorTimelineEntitySectionProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-[#9ca3af]">时间线片段信息</p>
      <div className="mt-2 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#cbd5e1]">标题</span>
          <span className="max-w-[70%] truncate rounded bg-white/10 px-2 py-0.5 text-white">
            {entity.kind === "text"
              ? entity.overlay.text || "文本"
              : entity.clip.title}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#cbd5e1]">轨道</span>
          <span className="rounded bg-white/10 px-2 py-0.5 text-white">
            {entity.kind === "video"
              ? "视频轨道"
              : entity.kind === "audio"
              ? "音频轨道"
              : "文本轨道"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#cbd5e1]">开始时间</span>
          <span className="rounded bg-white/10 px-2 py-0.5 text-white">
            {formatDuration(
              entity.kind === "text"
                ? entity.overlay.startSeconds
                : entity.clip.startSeconds
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#cbd5e1]">时长</span>
          <span className="rounded bg-white/10 px-2 py-0.5 text-white">
            {formatDuration(
              entity.kind === "text"
                ? entity.overlay.endSeconds - entity.overlay.startSeconds
                : entity.clip.durationSeconds
            )}
          </span>
        </div>
        {entity.kind !== "text" ? (
          <div className="flex items-center justify-between">
            <span className="text-[#cbd5e1]">源片段区间</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-white">
              {formatDuration(entity.clip.sourceStartSeconds)} ~{" "}
              {formatDuration(entity.clip.sourceEndSeconds)}
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[#cbd5e1]">字体大小</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                {Math.round(entity.overlay.fontSize)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#cbd5e1]">字间距</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                {(entity.overlay.letterSpacing ?? 0).toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#cbd5e1]">行高</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                {(entity.overlay.lineHeight ?? 1.2).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#cbd5e1]">颜色</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                {entity.overlay.color}
              </span>
            </div>
            <div className="space-y-2 rounded border border-white/10 bg-black/20 p-2">
              <p className="text-[11px] text-[#94a3b8]">文本样式</p>

              <InspectorNumberInputRow
                label="字体大小"
                value={Math.round(entity.overlay.fontSize)}
                min={12}
                max={120}
                step={1}
                onChange={(value) =>
                  onUpdateTextOverlayStyle(entity.overlay.id, {
                    fontSize: value,
                  })
                }
              />

              <InspectorNumberInputRow
                label="字间距"
                value={Number((entity.overlay.letterSpacing ?? 0).toFixed(1))}
                min={-8}
                max={24}
                step={0.5}
                onChange={(value) =>
                  onUpdateTextOverlayStyle(entity.overlay.id, {
                    letterSpacing: value,
                  })
                }
              />

              <InspectorNumberInputRow
                label="行高"
                value={Number((entity.overlay.lineHeight ?? 1.2).toFixed(2))}
                min={0.8}
                max={2.4}
                step={0.05}
                onChange={(value) =>
                  onUpdateTextOverlayStyle(entity.overlay.id, {
                    lineHeight: value,
                  })
                }
              />

              <label className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-[#cbd5e1]">颜色</span>
                <input
                  type="color"
                  value={entity.overlay.color || "#ffffff"}
                  onChange={(event) =>
                    onUpdateTextOverlayStyle(entity.overlay.id, {
                      color: event.target.value,
                    })
                  }
                  className="h-6 w-10 cursor-pointer rounded border border-white/20 bg-transparent p-0"
                />
              </label>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
