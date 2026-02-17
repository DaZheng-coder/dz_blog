import { ClipPanelFrame } from "../shared/ClipPanelFrame";
import {
  colorAdjustments,
  inspectorAnimations,
  inspectorMetrics,
} from "../shared/data";
import {
  inspectorActionActiveButtonClass,
  inspectorActionButtonClass,
} from "../shared/styles";

export function ClipInspectorPanel() {
  return (
    <ClipPanelFrame
      title="检查器"
      rightSlot={
        <button className="cursor-pointer text-xs text-[#9ca3af] hover:text-white">
          重置
        </button>
      }
      bodyClassName="space-y-4 overflow-y-auto p-4 text-sm"
    >
        <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-[#9ca3af]">基础参数</p>
          <div className="mt-2 space-y-2 text-xs">
            {inspectorMetrics.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[#cbd5e1]">{item.label}</span>
                <span className="rounded bg-white/10 px-2 py-0.5 text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-[#9ca3af]">动画效果</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {inspectorAnimations.map((item) => (
              <button
                key={item.label}
                className={
                  item.active
                    ? inspectorActionActiveButtonClass
                    : inspectorActionButtonClass
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-[#9ca3af]">色彩调整</p>
          <div className="mt-3 space-y-3 text-xs text-[#cbd5e1]">
            {colorAdjustments.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-1.5 rounded bg-white/10">
                  <div
                    className="h-full rounded bg-gradient-to-r from-[#22d3ee] to-[#3b82f6]"
                    style={{ width: item.progress }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
    </ClipPanelFrame>
  );
}
