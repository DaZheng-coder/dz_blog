import { useState } from "react";
import { useClipEditorStore } from "../store/clipEditorStore";
import { ClipExportProgressModal } from "./ClipExportProgressModal";
import { ClipMenuBrand } from "./ClipMenuBrand";
import { ClipStickerOverlayModal } from "./ClipStickerOverlayModal";
import { ClipTextOverlayModal } from "./ClipTextOverlayModal";
import { menuItems, type ClipMenuItemId } from "./menuItems";
import { exportTimelineToMp4 } from "./exportTimelineToMp4";
import { useTextOverlayActions } from "../text/useTextOverlayActions";
import { ClipButton } from "../shared/ClipButton";
import { useStickerOverlayActions } from "../sticker/useStickerOverlayActions";

type ClipMenuProps = {
  onOpenImport: () => void;
};

export function ClipMenu({ onOpenImport }: ClipMenuProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState("等待导出");
  const [exportError, setExportError] = useState<string | null>(null);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [exportedFile, setExportedFile] = useState<{
    blob: Blob;
    filename: string;
  } | null>(null);
  const timelineClips = useClipEditorStore((state) => state.timelineClips);
  const {
    textOverlays,
    timelineCurrentTimeSeconds,
    addTextOverlayAtCurrentTime,
    updateTextOverlay,
    removeTextOverlay,
  } = useTextOverlayActions();
  const {
    stickerOverlays,
    addStickerOverlayAtCurrentTime,
    updateStickerOverlay,
    removeStickerOverlay,
  } = useStickerOverlayActions();

  const handleDownloadExported = () => {
    if (!exportedFile) {
      return;
    }
    const url = URL.createObjectURL(exportedFile.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportedFile.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (isExporting) {
      return;
    }
    setShowExportModal(true);
    setExportProgress(0);
    setExportMessage("准备导出...");
    setExportError(null);
    setExportedFile(null);
    try {
      setIsExporting(true);
      const result = await exportTimelineToMp4(timelineClips, {
        textOverlays,
        onProgress: ({ progress, message }) => {
          setExportProgress(progress);
          setExportMessage(message);
        },
      });
      setExportedFile(result);
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

  const handleMenuAction = (menuItemId: ClipMenuItemId) => {
    if (menuItemId === "import") {
      onOpenImport();
      return;
    }
    if (menuItemId === "text") {
      setShowTextModal(true);
      return;
    }
    if (menuItemId === "sticker") {
      setShowStickerModal(true);
    }
  };

  const handleAddText = (text: string) => {
    addTextOverlayAtCurrentTime(text);
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-3 md:px-5">
        <ClipMenuBrand />

        <div className="hidden items-center gap-2 md:flex">
          {menuItems.map((item) => (
            <ClipButton
              key={item.id}
              onClick={() => handleMenuAction(item.id)}
            >
              {item.label}
            </ClipButton>
          ))}
        </div>

        <div className="flex items-center gap-2">
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
        downloadFilename={exportedFile?.filename || null}
        onDownload={handleDownloadExported}
        onClose={() => setShowExportModal(false)}
      />

      <ClipTextOverlayModal
        isOpen={showTextModal}
        currentTimeSeconds={timelineCurrentTimeSeconds}
        overlays={textOverlays}
        onClose={() => setShowTextModal(false)}
        onAdd={handleAddText}
        onUpdate={updateTextOverlay}
        onDelete={removeTextOverlay}
      />
      <ClipStickerOverlayModal
        isOpen={showStickerModal}
        currentTimeSeconds={timelineCurrentTimeSeconds}
        overlays={stickerOverlays}
        onClose={() => setShowStickerModal(false)}
        onAdd={addStickerOverlayAtCurrentTime}
        onUpdate={updateStickerOverlay}
        onDelete={removeStickerOverlay}
      />
    </>
  );
}
