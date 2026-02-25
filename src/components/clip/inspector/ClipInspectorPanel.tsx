import { useMemo } from "react";
import { ClipPanelFrame } from "../shared/ClipPanelFrame";
import { useClipEditorStore } from "../store/clipEditorStore";
import type { ClipTextOverlay } from "../shared/types";
import { useTextOverlayActions } from "../text/useTextOverlayActions";
import { ClipInspectorTimelineEntitySection } from "./ClipInspectorTimelineEntitySection";
import { ClipInspectorPreviewVideoSection } from "./ClipInspectorPreviewVideoSection";
import { ClipInspectorAssetSection } from "./ClipInspectorAssetSection";

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
  const { updateTextOverlay } = useTextOverlayActions();

  const updateSelectedTextOverlayStyle = (
    overlayId: string,
    patch: Partial<
      Pick<ClipTextOverlay, "fontSize" | "letterSpacing" | "lineHeight" | "color">
    >
  ) => updateTextOverlay(overlayId, patch);

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
    <div data-clip-inspector className="h-full">
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
          <ClipInspectorTimelineEntitySection
            entity={selectedTimelineEntity}
            onUpdateTextOverlayStyle={updateSelectedTextOverlayStyle}
          />
        ) : selectedPreviewVideoInfo ? (
          <ClipInspectorPreviewVideoSection info={selectedPreviewVideoInfo} />
        ) : !selectedInspectorAsset ? (
          <section className="grid h-full min-h-40 place-items-center rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-3 text-xs text-[#9ca3af]">
            请选择素材库资源或时间线片段查看信息
          </section>
        ) : (
          <ClipInspectorAssetSection asset={selectedInspectorAsset} />
        )}
      </ClipPanelFrame>
    </div>
  );
}
