import { ClipPanelFrame } from "../shared/ClipPanelFrame";
import { formatDuration } from "../shared/time";
import { useClipEditorStore } from "../store/clipEditorStore";

export function ClipInspectorPanel() {
  const setSelectedInspectorAsset = useClipEditorStore(
    (state) => state.setSelectedInspectorAsset
  );
  const selectedInspectorAsset = useClipEditorStore(
    (state) => state.selectedInspectorAsset
  );

  return (
    <ClipPanelFrame
      title="检查器"
      rightSlot={
        <button
          className="cursor-pointer text-xs text-[#9ca3af] hover:text-white"
          onClick={() => setSelectedInspectorAsset(null)}
        >
          重置
        </button>
      }
      bodyClassName="space-y-4 overflow-y-auto p-4 text-sm"
    >
      {!selectedInspectorAsset ? (
        <section className="grid h-full min-h-40 place-items-center rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-3 text-xs text-[#9ca3af]">
          请选择素材库中的视频或音频查看信息
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
