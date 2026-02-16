import {
  ClipInspectorPanel,
  ClipMediaPanel,
  ClipMenu,
  ClipPreviewPanel,
  ClipResizableLayout,
  ClipTimeline,
} from "../components/clip";

export function ClipPage() {
  return (
    <div className="h-screen overflow-hidden bg-[#0a0d13] text-[#e5e7eb]">
      <div className="relative flex h-full flex-col bg-[radial-gradient(circle_at_top,#1f29371a_0%,transparent_42%)]">
        <ClipMenu />
        <ClipResizableLayout
          left={<ClipMediaPanel />}
          center={<ClipPreviewPanel />}
          right={<ClipInspectorPanel />}
          bottom={<ClipTimeline />}
        />
      </div>
    </div>
  );
}
