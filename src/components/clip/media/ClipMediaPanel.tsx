import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { ClipMediaAssetCard } from "./ClipMediaAssetCard";
import { ClipMediaEmptyState } from "./ClipMediaEmptyState";
import { ClipMediaStickerOverlayList } from "./ClipMediaStickerOverlayList";
import { ClipMediaTextOverlayList } from "./ClipMediaTextOverlayList";
import { ClipPanelFrame } from "../shared/ClipPanelFrame";
import { useClipEditorStore } from "../store/clipEditorStore";
import { createCardDragGhost, createTrackBlockGhost } from "./dragGhost";
import { MEDIA_ASSET_MIME } from "../shared/dnd";
import type { ClipDragAsset, ClipMediaAsset } from "../shared/types";
import { useTextOverlayActions } from "../text/useTextOverlayActions";
import { ClipButton } from "../shared/ClipButton";
import { useStickerOverlayActions } from "../sticker/useStickerOverlayActions";

type ClipMediaPanelProps = {
  assets: ClipMediaAsset[];
  isParsing: boolean;
  onImportMediaFiles: (files: File[]) => Promise<void>;
  onOpenImport: () => void;
};

export function ClipMediaPanel({
  assets,
  isParsing,
  onImportMediaFiles,
  onOpenImport,
}: ClipMediaPanelProps) {
  const setDraggingAsset = useClipEditorStore(
    (state) => state.setDraggingAsset
  );
  const setSelectedInspectorAsset = useClipEditorStore(
    (state) => state.setSelectedInspectorAsset
  );
  const selectedInspectorSticker = useClipEditorStore(
    (state) => state.selectedInspectorSticker
  );
  const setSelectedInspectorSticker = useClipEditorStore(
    (state) => state.setSelectedInspectorSticker
  );
  const setSelectedPreviewVideoInfo = useClipEditorStore(
    (state) => state.setSelectedPreviewVideoInfo
  );
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
  const selectedTimelineTrack = useClipEditorStore(
    (state) => state.selectedTimelineTrack
  );
  const selectedTimelineClipIds = useClipEditorStore(
    (state) => state.selectedTimelineClipIds
  );
  const setSelectedTimelineClip = useClipEditorStore(
    (state) => state.setSelectedTimelineClip
  );
  const dragGhostRef = useRef<HTMLElement | null>(null);
  const cardGhostRef = useRef<HTMLElement | null>(null);
  const trackGhostRef = useRef<HTMLElement | null>(null);
  const draggingAssetRef = useRef<ClipDragAsset | null>(null);
  const dragGhostModeRef = useRef<"card" | "track">("card");
  const dragGhostFrameRef = useRef<number | null>(null);
  const dragGhostPendingPosRef = useRef<{ x: number; y: number } | null>(null);
  const transparentDragImageRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<"media" | "text" | "sticker">(
    "media"
  );
  const [newText, setNewText] = useState("");

  const hasAssets = assets.length > 0;
  const orderedAssets = useMemo(
    () =>
      [...assets].sort((a, b) =>
        a.title.localeCompare(b.title, "zh-CN", { sensitivity: "base" })
      ),
    [assets]
  );

  useEffect(() => {
    return () => {
      if (dragGhostRef.current) {
        dragGhostRef.current.remove();
        dragGhostRef.current = null;
      }
      cardGhostRef.current?.remove();
      trackGhostRef.current?.remove();
      cardGhostRef.current = null;
      trackGhostRef.current = null;
    };
  }, []);

  const scheduleGhostPosition = useCallback((x: number, y: number) => {
    dragGhostPendingPosRef.current = { x, y };
    if (dragGhostFrameRef.current !== null) {
      return;
    }

    dragGhostFrameRef.current = window.requestAnimationFrame(() => {
      dragGhostFrameRef.current = null;
      const pendingPos = dragGhostPendingPosRef.current;
      const ghost = dragGhostRef.current;
      if (!pendingPos || !ghost) {
        return;
      }
      ghost.style.transform = `translate3d(${pendingPos.x}px, ${pendingPos.y}px, 0)`;
    });
  }, []);

  const clearDragGhost = useCallback(() => {
    if (dragGhostFrameRef.current !== null) {
      window.cancelAnimationFrame(dragGhostFrameRef.current);
      dragGhostFrameRef.current = null;
    }
    dragGhostPendingPosRef.current = null;
    if (dragGhostRef.current) {
      dragGhostRef.current.remove();
      dragGhostRef.current = null;
    }
    draggingAssetRef.current = null;
    dragGhostModeRef.current = "card";
  }, []);

  useEffect(() => {
    const handleWindowDragOver = (event: globalThis.DragEvent) => {
      const ghost = dragGhostRef.current;
      if (!ghost) {
        return;
      }

      const x = event.clientX + 14;
      const y = event.clientY + 14;
      scheduleGhostPosition(x, y);

      const element = document.elementFromPoint(event.clientX, event.clientY);
      const trackLane =
        element instanceof HTMLElement
          ? element.closest<HTMLElement>("[data-clip-track-lane]")
          : null;
      const isOverTrackLane = Boolean(trackLane);

      if (isOverTrackLane && dragGhostModeRef.current !== "track") {
        const asset = draggingAssetRef.current;
        if (!asset) {
          return;
        }
        const pixelsPerSecond = Number(trackLane?.dataset.trackPps || "16");
        const minClipWidth = Number(
          trackLane?.dataset.trackMinClipWidth || "64"
        );
        ghost.remove();
        const trackGhost = createTrackBlockGhost(
          asset,
          pixelsPerSecond,
          minClipWidth,
          trackGhostRef.current
        );
        trackGhostRef.current = trackGhost;
        document.body.appendChild(trackGhost);
        dragGhostRef.current = trackGhost;
        dragGhostModeRef.current = "track";
        scheduleGhostPosition(x, y);
      }

      if (!isOverTrackLane && dragGhostModeRef.current !== "card") {
        const asset = draggingAssetRef.current;
        if (!asset) {
          return;
        }
        ghost.remove();
        const cardGhost = createCardDragGhost(asset, cardGhostRef.current);
        cardGhostRef.current = cardGhost;
        document.body.appendChild(cardGhost);
        dragGhostRef.current = cardGhost;
        dragGhostModeRef.current = "card";
        scheduleGhostPosition(x, y);
      }
    };

    const handleWindowDrop = () => {
      clearDragGhost();
    };

    const handleWindowDragEnd = () => {
      clearDragGhost();
    };

    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", handleWindowDrop);
    window.addEventListener("dragend", handleWindowDragEnd);

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", handleWindowDrop);
      window.removeEventListener("dragend", handleWindowDragEnd);
    };
  }, [clearDragGhost, scheduleGhostPosition]);

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files || []);
      await onImportMediaFiles(files);
    },
    [onImportMediaFiles]
  );

  const handleAssetDragStart = (
    event: DragEvent<HTMLElement>,
    asset: ClipMediaAsset
  ) => {
    const dragAsset: ClipDragAsset = {
      id: asset.id,
      title: asset.title,
      durationSeconds: asset.durationSeconds,
      objectUrl: asset.objectUrl,
      mediaType: asset.mediaType,
      coverDataUrl: asset.coverDataUrl,
      frameThumbnails: asset.frameThumbnails,
      audioLevels: asset.audioLevels,
    };
    clearDragGhost();
    const ghost = createCardDragGhost(dragAsset, cardGhostRef.current);
    cardGhostRef.current = ghost;
    draggingAssetRef.current = dragAsset;
    dragGhostModeRef.current = "card";
    document.body.appendChild(ghost);
    dragGhostRef.current = ghost;

    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(MEDIA_ASSET_MIME, JSON.stringify(dragAsset));
    event.dataTransfer.setData("text/plain", asset.title);
    if (!transparentDragImageRef.current) {
      const pixel = document.createElement("canvas");
      pixel.width = 1;
      pixel.height = 1;
      transparentDragImageRef.current = pixel;
    }
    event.dataTransfer.setDragImage(transparentDragImageRef.current, 0, 0);
    setDraggingAsset(dragAsset);
  };

  const handleAddText = useCallback(() => {
    if (!newText.trim()) {
      return;
    }
    addTextOverlayAtCurrentTime(newText);
    setNewText("");
  }, [addTextOverlayAtCurrentTime, newText]);

  const selectedTextClipIds =
    selectedTimelineTrack === "text" ? selectedTimelineClipIds : [];

  return (
    <ClipPanelFrame
      title="素材库"
      rightSlot={
        activeTab === "media" ? (
          <ClipButton onClick={onOpenImport}>
            导入素材
          </ClipButton>
        ) : activeTab === "text" ? (
          <ClipButton onClick={handleAddText}>
            添加文本
          </ClipButton>
        ) : (
          <span className="text-xs text-[#6b7280]">选择贴纸添加到当前时间</span>
        )
      }
      bodyClassName="flex min-h-0 flex-col"
    >
      <div className="border-b border-white/10 px-2 py-2 text-xs flex items-center gap-2">
        <button
          className={`cursor-pointer rounded-md px-3 py-1.5 ${
            activeTab === "media"
              ? "bg-[#22d3ee]/20 text-[#67e8f9]"
              : "bg-white/5 text-[#9ca3af] hover:text-[#d1d5db]"
          }`}
          onClick={() => setActiveTab("media")}
        >
          视频
        </button>
        <button
          className={`cursor-pointer rounded-md px-3 py-1.5 ${
            activeTab === "text"
              ? "bg-[#22d3ee]/20 text-[#67e8f9]"
              : "bg-white/5 text-[#9ca3af] hover:text-[#d1d5db]"
          }`}
          onClick={() => setActiveTab("text")}
        >
          文本
        </button>
        <button
          className={`cursor-pointer rounded-md px-3 py-1.5 ${
            activeTab === "sticker"
              ? "bg-[#22d3ee]/20 text-[#67e8f9]"
              : "bg-white/5 text-[#9ca3af] hover:text-[#d1d5db]"
          }`}
          onClick={() => setActiveTab("sticker")}
        >
          贴纸
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto p-3"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {activeTab === "media" ? (
          <>
            {!hasAssets ? <ClipMediaEmptyState isParsing={isParsing} /> : null}

            {hasAssets && (
              <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
                {orderedAssets.map((asset) => (
                  <ClipMediaAssetCard
                    key={asset.id}
                    asset={asset}
                    onClick={(selectedAsset) => {
                      setSelectedInspectorSticker(null);
                      setSelectedInspectorAsset(selectedAsset);
                    }}
                    onDragStart={handleAssetDragStart}
                    onDragEnd={() => {
                      clearDragGhost();
                      setDraggingAsset(null);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        ) : activeTab === "text" ? (
          <ClipMediaTextOverlayList
            newText={newText}
            currentTimeSeconds={timelineCurrentTimeSeconds}
            textOverlays={textOverlays}
            selectedTextClipIds={selectedTextClipIds}
            onNewTextChange={setNewText}
            onAddText={handleAddText}
            onSelectTextOverlay={(overlayId, appendSelection) =>
              setSelectedTimelineClip(overlayId, "text", appendSelection)
            }
            onUpdateTextOverlay={(overlayId, text) =>
              updateTextOverlay(overlayId, { text })
            }
            onDeleteTextOverlay={removeTextOverlay}
          />
        ) : (
          <ClipMediaStickerOverlayList
            stickerOverlays={stickerOverlays}
            selectedStickerId={selectedInspectorSticker?.id ?? null}
            onAddSticker={addStickerOverlayAtCurrentTime}
            onSelectSticker={(sticker) => {
              setSelectedTimelineClip(null, null);
              setSelectedPreviewVideoInfo(null);
              setSelectedInspectorAsset(null);
              setSelectedInspectorSticker(sticker);
            }}
            onUpdateStickerOverlay={updateStickerOverlay}
            onDeleteStickerOverlay={removeStickerOverlay}
          />
        )}
      </div>
    </ClipPanelFrame>
  );
}
