import {
  ClipInspectorPanel,
  ClipMediaPanel,
  ClipMenu,
  ClipPreviewPanel,
  ClipResizableLayout,
  ClipTimeline,
} from "../components/clip";
import { useClipMediaImport } from "../components/clip/media/useClipMediaImport";

export function ClipPage() {
  const {
    assets,
    isParsing,
    importMediaFiles,
    openFilePicker,
    fileInputProps,
  } = useClipMediaImport();

  return (
    <div className="h-screen overflow-x-auto overflow-y-hidden bg-[#0a0d13] text-[#e5e7eb]">
      <div className="relative flex h-full min-w-[1080px] flex-col bg-[radial-gradient(circle_at_top,#1f29371a_0%,transparent_42%)]">
        <input {...fileInputProps} />
        <ClipMenu onOpenImport={openFilePicker} />
        <ClipResizableLayout
          left={
            <ClipMediaPanel
              assets={assets}
              isParsing={isParsing}
              onImportMediaFiles={importMediaFiles}
              onOpenImport={openFilePicker}
            />
          }
          center={<ClipPreviewPanel />}
          right={<ClipInspectorPanel />}
          bottom={<ClipTimeline />}
        />
      </div>
    </div>
  );
}
