import { useMemo } from "react";
import { ClipPanelFrame } from "../shared/ClipPanelFrame";
import { formatDuration } from "../shared/time";
import { useClipEditorStore } from "../store/clipEditorStore";
import type { ClipTextOverlay } from "../shared/types";

export function ClipInspectorPanel() {
  const setSelectedInspectorAsset = useClipEditorStore(
    (state) => state.setSelectedInspectorAsset
  );
  const setSelectedTimelineClip = useClipEditorStore(
    (state) => state.setSelectedTimelineClip
  );
  const setSelectedPreviewVideoInfo = useClipEditorStore(
    (state) => state.setSelectedPreviewVideoInfo
  );
  const selectedInspectorAsset = useClipEditorStore(
    (state) => state.selectedInspectorAsset
  );
  const selectedPreviewVideoInfo = useClipEditorStore(
    (state) => state.selectedPreviewVideoInfo
  );
  const selectedTimelineClipId = useClipEditorStore(
    (state) => state.selectedTimelineClipId
  );
  const selectedTimelineTrack = useClipEditorStore(
    (state) => state.selectedTimelineTrack
  );
  const timelineClips = useClipEditorStore((state) => state.timelineClips);
  const audioTimelineClips = useClipEditorStore(
    (state) => state.audioTimelineClips
  );
  const textOverlays = useClipEditorStore((state) => state.textOverlays);
  const setTextOverlays = useClipEditorStore((state) => state.setTextOverlays);

  const updateTextOverlay = (
    overlayId: string,
    patch: Partial<
      Pick<ClipTextOverlay, "fontSize" | "letterSpacing" | "lineHeight" | "color">
    >
  ) => {
    setTextOverlays((prev) =>
      prev.map((overlay) =>
        overlay.id === overlayId ? { ...overlay, ...patch } : overlay
      )
    );
  };

  const selectedTimelineEntity = useMemo(() => {
    if (!selectedTimelineClipId || !selectedTimelineTrack) {
      return null;
    }
    if (selectedTimelineTrack === "video") {
      const clip = timelineClips.find((item) => item.id === selectedTimelineClipId);
      return clip ? { kind: "video" as const, clip } : null;
    }
    if (selectedTimelineTrack === "audio") {
      const clip = audioTimelineClips.find(
        (item) => item.id === selectedTimelineClipId
      );
      return clip ? { kind: "audio" as const, clip } : null;
    }
    const overlay = textOverlays.find((item) => item.id === selectedTimelineClipId);
    return overlay ? { kind: "text" as const, overlay } : null;
  }, [
    audioTimelineClips,
    selectedTimelineClipId,
    selectedTimelineTrack,
    textOverlays,
    timelineClips,
  ]);

  return (
    <ClipPanelFrame
      title="检查器"
      rightSlot={
        <button
          className="cursor-pointer text-xs text-[#9ca3af] hover:text-white"
          onClick={() => {
            setSelectedInspectorAsset(null);
            setSelectedTimelineClip(null, null);
            setSelectedPreviewVideoInfo(null);
          }}
        >
          重置
        </button>
      }
      bodyClassName="space-y-4 overflow-y-auto p-4 text-sm"
    >
      {selectedTimelineEntity ? (
        <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-[#9ca3af]">时间线片段信息</p>
          <div className="mt-2 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[#cbd5e1]">标题</span>
              <span className="max-w-[70%] truncate rounded bg-white/10 px-2 py-0.5 text-white">
                {selectedTimelineEntity.kind === "text"
                  ? selectedTimelineEntity.overlay.text || "文本"
                  : selectedTimelineEntity.clip.title}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#cbd5e1]">轨道</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                {selectedTimelineEntity.kind === "video"
                  ? "视频轨道"
                  : selectedTimelineEntity.kind === "audio"
                    ? "音频轨道"
                    : "文本轨道"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#cbd5e1]">开始时间</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                {formatDuration(
                  selectedTimelineEntity.kind === "text"
                    ? selectedTimelineEntity.overlay.startSeconds
                    : selectedTimelineEntity.clip.startSeconds
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#cbd5e1]">时长</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                {formatDuration(
                  selectedTimelineEntity.kind === "text"
                    ? selectedTimelineEntity.overlay.endSeconds -
                        selectedTimelineEntity.overlay.startSeconds
                    : selectedTimelineEntity.clip.durationSeconds
                )}
              </span>
            </div>
            {selectedTimelineEntity.kind !== "text" ? (
              <div className="flex items-center justify-between">
                <span className="text-[#cbd5e1]">源片段区间</span>
                <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                  {formatDuration(selectedTimelineEntity.clip.sourceStartSeconds)} ~{" "}
                  {formatDuration(selectedTimelineEntity.clip.sourceEndSeconds)}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[#cbd5e1]">字体大小</span>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                    {Math.round(selectedTimelineEntity.overlay.fontSize)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#cbd5e1]">字间距</span>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                    {(selectedTimelineEntity.overlay.letterSpacing ?? 0).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#cbd5e1]">行高</span>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                    {(selectedTimelineEntity.overlay.lineHeight ?? 1.2).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#cbd5e1]">颜色</span>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                    {selectedTimelineEntity.overlay.color}
                  </span>
                </div>
                <div className="space-y-2 rounded border border-white/10 bg-black/20 p-2">
                  <p className="text-[11px] text-[#94a3b8]">文本样式</p>

                  <label className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#cbd5e1]">字体大小</span>
                    <input
                      type="number"
                      min={12}
                      max={120}
                      step={1}
                      value={Math.round(selectedTimelineEntity.overlay.fontSize)}
                      onChange={(event) =>
                        updateTextOverlay(selectedTimelineEntity.overlay.id, {
                          fontSize: Math.max(
                            12,
                            Math.min(120, Number(event.target.value) || 12)
                          ),
                        })
                      }
                      className="w-20 rounded border border-white/15 bg-white/5 px-2 py-1 text-right text-xs text-white outline-none focus:border-[#22d3ee]/70"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#cbd5e1]">字间距</span>
                    <input
                      type="number"
                      min={-8}
                      max={24}
                      step={0.5}
                      value={(selectedTimelineEntity.overlay.letterSpacing ?? 0).toFixed(
                        1
                      )}
                      onChange={(event) =>
                        updateTextOverlay(selectedTimelineEntity.overlay.id, {
                          letterSpacing: Math.max(
                            -8,
                            Math.min(24, Number(event.target.value) || 0)
                          ),
                        })
                      }
                      className="w-20 rounded border border-white/15 bg-white/5 px-2 py-1 text-right text-xs text-white outline-none focus:border-[#22d3ee]/70"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#cbd5e1]">行高</span>
                    <input
                      type="number"
                      min={0.8}
                      max={2.4}
                      step={0.05}
                      value={(selectedTimelineEntity.overlay.lineHeight ?? 1.2).toFixed(
                        2
                      )}
                      onChange={(event) =>
                        updateTextOverlay(selectedTimelineEntity.overlay.id, {
                          lineHeight: Math.max(
                            0.8,
                            Math.min(2.4, Number(event.target.value) || 1.2)
                          ),
                        })
                      }
                      className="w-20 rounded border border-white/15 bg-white/5 px-2 py-1 text-right text-xs text-white outline-none focus:border-[#22d3ee]/70"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#cbd5e1]">颜色</span>
                    <input
                      type="color"
                      value={selectedTimelineEntity.overlay.color || "#ffffff"}
                      onChange={(event) =>
                        updateTextOverlay(selectedTimelineEntity.overlay.id, {
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
      ) : selectedPreviewVideoInfo ? (
        <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-[#9ca3af]">预览视频信息</p>
          <div className="mt-2 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#cbd5e1]">类型</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                视频
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#cbd5e1]">时长</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                {formatDuration(selectedPreviewVideoInfo.durationSeconds)}
              </span>
            </div>
            {typeof selectedPreviewVideoInfo.sourceStartSeconds === "number" &&
            typeof selectedPreviewVideoInfo.sourceEndSeconds === "number" ? (
              <div className="flex items-center justify-between">
                <span className="text-[#cbd5e1]">源片段区间</span>
                <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                  {formatDuration(selectedPreviewVideoInfo.sourceStartSeconds)} ~{" "}
                  {formatDuration(selectedPreviewVideoInfo.sourceEndSeconds)}
                </span>
              </div>
            ) : null}
          </div>
        </section>
      ) : !selectedInspectorAsset ? (
        <section className="grid h-full min-h-40 place-items-center rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-3 text-xs text-[#9ca3af]">
          请选择素材库资源或时间线片段查看信息
        </section>
      ) : (
        <>
          <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs text-[#9ca3af]">素材信息</p>
            <div className="mt-2 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#cbd5e1]">标题</span>
                <span className="max-w-[70%] truncate rounded bg-white/10 px-2 py-0.5 text-white">
                  {selectedInspectorAsset.title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#cbd5e1]">类型</span>
                <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                  {selectedInspectorAsset.mediaType === "audio" ? "音频" : "视频"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#cbd5e1]">时长</span>
                <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                  {formatDuration(selectedInspectorAsset.durationSeconds)}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs text-[#9ca3af]">封面预览</p>
            <div className="mt-2 relative aspect-[4/3] w-full overflow-hidden rounded-md bg-gradient-to-br from-[#1f2937] to-[#0f172a]">
              {selectedInspectorAsset.coverDataUrl ? (
                <img
                  src={selectedInspectorAsset.coverDataUrl}
                  alt={selectedInspectorAsset.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs text-[#9ca3af]">
                  暂无封面
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </ClipPanelFrame>
  );
}
