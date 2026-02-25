import { useEffect, useMemo, useState, type RefObject } from "react";
import type { ClipTextOverlay } from "../shared/types";

const MIN_TEXT_FONT_SIZE = 12;
const MAX_TEXT_FONT_SIZE = 240;
const TEXT_RESIZE_SENSITIVITY = 0.35;
type TextResizeEdge = "top" | "right" | "bottom" | "left";

type ClipPreviewTextOverlayLayerProps = {
  stageRef: RefObject<HTMLDivElement | null>;
  textOverlays: ClipTextOverlay[];
  currentTimeSeconds: number;
  setTextOverlays: (
    updater:
      | ClipTextOverlay[]
      | ((prevOverlays: ClipTextOverlay[]) => ClipTextOverlay[])
  ) => void;
};

export function ClipPreviewTextOverlayLayer({
  stageRef,
  textOverlays,
  currentTimeSeconds,
  setTextOverlays,
}: ClipPreviewTextOverlayLayerProps) {
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);

  const activeTextOverlays = useMemo(
    () =>
      textOverlays.filter(
        (overlay) =>
          currentTimeSeconds >= overlay.startSeconds &&
          currentTimeSeconds < overlay.endSeconds
      ),
    [currentTimeSeconds, textOverlays]
  );

  useEffect(() => {
    if (!selectedOverlayId) {
      return;
    }
    const exists = activeTextOverlays.some(
      (overlay) => overlay.id === selectedOverlayId
    );
    if (!exists) {
      setSelectedOverlayId(null);
    }
  }, [activeTextOverlays, selectedOverlayId]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const handleStageMouseDown = (event: MouseEvent) => {
      if (event.target === stage) {
        setSelectedOverlayId(null);
      }
    };

    stage.addEventListener("mousedown", handleStageMouseDown);
    return () => {
      stage.removeEventListener("mousedown", handleStageMouseDown);
    };
  }, [stageRef]);

  const handleOverlayDragStart = (
    event: React.MouseEvent<HTMLDivElement>,
    overlayId: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const rect = stage.getBoundingClientRect();
    const updatePosition = (clientX: number, clientY: number) => {
      const xPercent = Math.max(
        0,
        Math.min(100, ((clientX - rect.left) / rect.width) * 100)
      );
      const yPercent = Math.max(
        0,
        Math.min(100, ((clientY - rect.top) / rect.height) * 100)
      );
      setTextOverlays((prev) =>
        prev.map((overlay) =>
          overlay.id === overlayId
            ? { ...overlay, xPercent, yPercent }
            : overlay
        )
      );
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updatePosition(moveEvent.clientX, moveEvent.clientY);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleOverlayResizeStart = (
    event: React.MouseEvent<HTMLDivElement>,
    overlayId: string,
    edge: TextResizeEdge
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const target = textOverlays.find((overlay) => overlay.id === overlayId);
    if (!target) {
      return;
    }
    const startX = event.clientX;
    const startY = event.clientY;
    const startFontSize = Math.max(MIN_TEXT_FONT_SIZE, target.fontSize || 0);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      let delta = 0;
      if (edge === "top") {
        delta = -deltaY;
      } else if (edge === "bottom") {
        delta = deltaY;
      } else if (edge === "left") {
        delta = -deltaX;
      } else {
        delta = deltaX;
      }
      const nextFontSize = Math.max(
        MIN_TEXT_FONT_SIZE,
        Math.min(MAX_TEXT_FONT_SIZE, startFontSize + delta * TEXT_RESIZE_SENSITIVITY)
      );
      setTextOverlays((prev) =>
        prev.map((overlay) =>
          overlay.id === overlayId ? { ...overlay, fontSize: nextFontSize } : overlay
        )
      );
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <>
      {activeTextOverlays.map((overlay) => (
        <div
          key={overlay.id}
          className={`absolute select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] ${
            selectedOverlayId === overlay.id ? "cursor-move" : "cursor-pointer"
          }`}
          style={{
            left: `${overlay.xPercent}%`,
            top: `${overlay.yPercent}%`,
            transform: "translate(-50%, -50%)",
            color: overlay.color,
            fontSize: `${overlay.fontSize}px`,
            letterSpacing: `${overlay.letterSpacing ?? 0}px`,
            lineHeight: overlay.lineHeight ?? 1.2,
            fontWeight: 600,
            textAlign: "center",
            whiteSpace: "pre-wrap",
          }}
          onClick={(event) => {
            event.stopPropagation();
            setSelectedOverlayId(overlay.id);
          }}
          onMouseDown={(event) => handleOverlayDragStart(event, overlay.id)}
        >
          {selectedOverlayId === overlay.id ? (
            <>
              <div
                className="absolute left-0 top-0 h-[2px] w-full cursor-ns-resize bg-[#67e8f9]/90"
                onMouseDown={(event) =>
                  handleOverlayResizeStart(event, overlay.id, "top")
                }
              />
              <div
                className="absolute bottom-0 left-0 h-[2px] w-full cursor-ns-resize bg-[#67e8f9]/90"
                onMouseDown={(event) =>
                  handleOverlayResizeStart(event, overlay.id, "bottom")
                }
              />
              <div
                className="absolute left-0 top-0 h-full w-[2px] cursor-ew-resize bg-[#67e8f9]/90"
                onMouseDown={(event) =>
                  handleOverlayResizeStart(event, overlay.id, "left")
                }
              />
              <div
                className="absolute right-0 top-0 h-full w-[2px] cursor-ew-resize bg-[#67e8f9]/90"
                onMouseDown={(event) =>
                  handleOverlayResizeStart(event, overlay.id, "right")
                }
              />
            </>
          ) : null}
          {overlay.text}
        </div>
      ))}
    </>
  );
}
