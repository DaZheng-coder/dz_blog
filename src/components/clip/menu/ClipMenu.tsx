import { useState } from "react";
import { useClipEditorStore } from "../store/clipEditorStore";
import { ClipExportProgressModal } from "./ClipExportProgressModal";
import { ClipMenuBrand } from "./ClipMenuBrand";
import { menuItems } from "../shared/data";
import { exportTimelineToMp4 } from "./exportTimelineToMp4";
import { subtleButtonClass } from "../shared/styles";

export function ClipMenu() {
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState("等待导出");
  const [exportError, setExportError] = useState<string | null>(null);
  const timelineClips = useClipEditorStore((state) => state.timelineClips);

  const handleExport = async () => {
    if (isExporting) {
      return;
    }
    setShowExportModal(true);
    setExportProgress(0);
    setExportMessage("准备导出...");
    setExportError(null);
    try {
      setIsExporting(true);
      await exportTimelineToMp4(timelineClips, {
        onProgress: ({ progress, message }) => {
          setExportProgress(progress);
          setExportMessage(message);
        },
      });
      setExportProgress(100);
      setExportMessage("导出完成");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "导出失败，请重试";
      setExportError(message);
      setExportMessage("导出失败");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-3 md:px-5">
        <ClipMenuBrand />

        <div className="hidden items-center gap-2 md:flex">
          {menuItems.map((item) => (
            <button key={item} className={subtleButtonClass}>
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button className={subtleButtonClass}>预览</button>
          <button
            className="cursor-pointer rounded-md bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] px-3 py-1.5 text-xs font-semibold text-[#0b1220] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? "导出中..." : "导出"}
          </button>
        </div>
      </header>

      <ClipExportProgressModal
        isOpen={showExportModal}
        isExporting={isExporting}
        progress={exportProgress}
        message={exportMessage}
        error={exportError}
        onClose={() => setShowExportModal(false)}
      />
    </>
  );
}
