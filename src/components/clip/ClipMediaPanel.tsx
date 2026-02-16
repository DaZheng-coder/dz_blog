import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { ClipMediaAssetCard } from "./ClipMediaAssetCard";
import { ClipMediaEmptyState } from "./ClipMediaEmptyState";
import { ClipPanelFrame } from "./ClipPanelFrame";
import { useClipEditorStore } from "./clipEditorStore";
import { createCardDragGhost, createTrackBlockGhost } from "./dragGhost";
import { MEDIA_ASSET_MIME } from "./dnd";
import { subtleButtonClass } from "./styles";
import type { ClipDragAsset, ClipVideoAsset } from "./types";
import { createVideoAsset } from "./videoAsset";

export function ClipMediaPanel() {
  const setDraggingAsset = useClipEditorStore((state) => state.setDraggingAsset);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlSetRef = useRef(new Set<string>());
  const dragGhostRef = useRef<HTMLElement | null>(null);
  const draggingAssetRef = useRef<ClipDragAsset | null>(null);
  const dragGhostModeRef = useRef<"card" | "track">("card");
  const transparentDragImageRef = useRef<HTMLCanvasElement | null>(null);
  const [assets, setAssets] = useState<ClipVideoAsset[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const hasAssets = assets.length > 0;
  const orderedAssets = useMemo(
    () =>
      [...assets].sort((a, b) =>
        a.title.localeCompare(b.title, "zh-CN", { sensitivity: "base" })
      ),
    [assets]
  );

  useEffect(() => {
    const objectUrls = objectUrlSetRef.current;
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.clear();
      if (dragGhostRef.current) {
        dragGhostRef.current.remove();
        dragGhostRef.current = null;
      }
    };
  }, []);

  const clearDragGhost = useCallback(() => {
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
      ghost.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      const element = document.elementFromPoint(event.clientX, event.clientY);
      const trackLane =
        element instanceof HTMLElement
          ? element.closest<HTMLElement>('[data-clip-track-lane="video-1"]')
          : null;
      const isOverTrackLane = Boolean(trackLane);

      if (isOverTrackLane && dragGhostModeRef.current !== "track") {
        const asset = draggingAssetRef.current;
        if (!asset) {
          return;
        }
        const pixelsPerSecond = Number(trackLane?.dataset.trackPps || "16");
        const minClipWidth = Number(trackLane?.dataset.trackMinClipWidth || "64");
        ghost.remove();
        const trackGhost = createTrackBlockGhost(
          asset,
          pixelsPerSecond,
          minClipWidth
        );
        document.body.appendChild(trackGhost);
        dragGhostRef.current = trackGhost;
        dragGhostModeRef.current = "track";
        trackGhost.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      if (!isOverTrackLane && dragGhostModeRef.current !== "card") {
        const asset = draggingAssetRef.current;
        if (!asset) {
          return;
        }
        ghost.remove();
        const cardGhost = createCardDragGhost(asset);
        cardGhost.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        document.body.appendChild(cardGhost);
        dragGhostRef.current = cardGhost;
        dragGhostModeRef.current = "card";
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
  }, [clearDragGhost]);

  const handleImportVideos = useCallback(async (files: File[]) => {
    const videoFiles = files.filter((file) => file.type.startsWith("video/"));
    if (videoFiles.length === 0) {
      return;
    }

    setIsParsing(true);
    try {
      const parsed = await Promise.allSettled(
        videoFiles.map((file) => createVideoAsset(file))
      );

      setAssets((prev) => {
        const signatureSet = new Set(prev.map((asset) => asset.signature));
        const next = [...prev];

        for (const item of parsed) {
          if (item.status !== "fulfilled") {
            continue;
          }
          if (signatureSet.has(item.value.signature)) {
            URL.revokeObjectURL(item.value.objectUrl);
            continue;
          }
          signatureSet.add(item.value.signature);
          objectUrlSetRef.current.add(item.value.objectUrl);
          next.push(item.value);
        }

        return next;
      });
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      await handleImportVideos(files);
      event.target.value = "";
    },
    [handleImportVideos]
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files || []);
      await handleImportVideos(files);
    },
    [handleImportVideos]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAssetDragStart = (
    event: DragEvent<HTMLElement>,
    asset: ClipVideoAsset
  ) => {
    const dragAsset: ClipDragAsset = {
      id: asset.id,
      title: asset.title,
      durationSeconds: asset.durationSeconds,
      objectUrl: asset.objectUrl,
      coverDataUrl: asset.coverDataUrl,
    };
    clearDragGhost();
    const ghost = createCardDragGhost(dragAsset);
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

  return (
    <ClipPanelFrame
      title="素材库"
      rightSlot={
        <button className={subtleButtonClass} onClick={openFilePicker}>
          导入视频
        </button>
      }
      bodyClassName="flex min-h-0 flex-col"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="border-b border-white/10 px-2 py-2 text-xs">
        <button className="cursor-pointer rounded-md bg-[#22d3ee]/20 px-3 py-1.5 text-[#67e8f9]">
          视频
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto p-3"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {!hasAssets ? <ClipMediaEmptyState isParsing={isParsing} /> : null}

        {hasAssets && (
          <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
            {orderedAssets.map((asset) => (
              <ClipMediaAssetCard
                key={asset.id}
                asset={asset}
                onDragStart={handleAssetDragStart}
                onDragEnd={() => {
                  clearDragGhost();
                  setDraggingAsset(null);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </ClipPanelFrame>
  );
}
