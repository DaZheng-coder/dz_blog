import { useEffect, useState } from "react";
import { formatDuration } from "../shared/time";
import type { ClipTextOverlay, ClipTrackClip } from "../shared/types";
import { ClipInspectorInfoRow, ClipInspectorSection } from "./ClipInspectorCommon";

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
  const [draftValue, setDraftValue] = useState(String(value));

  useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  const commitValue = () => {
    const parsed = Number(draftValue);
    const nextValue = Number.isFinite(parsed)
      ? Math.max(min, Math.min(max, parsed))
      : value;
    setDraftValue(String(nextValue));
    onChange(nextValue);
  };

  return (
    <label className="flex items-center justify-between gap-2 text-[11px]">
      <span className="text-[#cbd5e1]">{label}</span>
      <input
        type="text"
        inputMode={step < 1 ? "decimal" : "numeric"}
        value={draftValue}
        onChange={(event) => setDraftValue(event.target.value)}
        onBlur={commitValue}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
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
    <ClipInspectorSection title="时间线片段信息">
      <ClipInspectorInfoRow
        label="标题"
        value={entity.kind === "text" ? entity.overlay.text || "文本" : entity.clip.title}
        className="gap-3"
        valueClassName="max-w-[70%] truncate"
      />
      <ClipInspectorInfoRow
        label="轨道"
        value={
          entity.kind === "video"
            ? "视频轨道"
            : entity.kind === "audio"
            ? "音频轨道"
            : "文本轨道"
        }
      />
      <ClipInspectorInfoRow
        label="开始时间"
        value={formatDuration(
          entity.kind === "text" ? entity.overlay.startSeconds : entity.clip.startSeconds
        )}
      />
      <ClipInspectorInfoRow
        label="时长"
        value={formatDuration(
          entity.kind === "text"
            ? entity.overlay.endSeconds - entity.overlay.startSeconds
            : entity.clip.durationSeconds
        )}
      />
      {entity.kind !== "text" ? (
        <ClipInspectorInfoRow
          label="源片段区间"
          value={`${formatDuration(entity.clip.sourceStartSeconds)} ~ ${formatDuration(
            entity.clip.sourceEndSeconds
          )}`}
        />
      ) : (
        <>
          <ClipInspectorInfoRow
            label="字体大小"
            value={Math.round(entity.overlay.fontSize)}
          />
          <ClipInspectorInfoRow
            label="字间距"
            value={(entity.overlay.letterSpacing ?? 0).toFixed(1)}
          />
          <ClipInspectorInfoRow
            label="行高"
            value={(entity.overlay.lineHeight ?? 1.2).toFixed(2)}
          />
          <ClipInspectorInfoRow label="颜色" value={entity.overlay.color} />
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
    </ClipInspectorSection>
  );
}
