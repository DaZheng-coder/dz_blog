import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import type { ClipTextOverlay } from "../shared/types";
import { useClipEditorStore } from "../store/clipEditorStore";
import {
  ClipPreviewSelectionFrame,
  type PreviewResizeEdge,
} from "./ClipPreviewSelectionFrame";
import { usePreviewOverlayOutsideDismiss } from "./usePreviewOverlayOutsideDismiss";
import { useActiveOverlays } from "./useActiveOverlays";
import { usePreviewOverlayEdgeResize } from "./usePreviewOverlayEdgeResize";
import { usePreviewOverlayPointerDrag } from "./usePreviewOverlayPointerDrag";

const MIN_TEXT_FONT_SIZE = 12;
const MAX_TEXT_FONT_SIZE = 240;
const TEXT_RESIZE_SENSITIVITY = 0.35;
const DRAG_START_THRESHOLD_PX = 2;
const EDIT_BOX_EXTRA_WIDTH = 12;
const EDIT_BOX_EXTRA_HEIGHT = 8;
const MIN_EDIT_BOX_WIDTH = 48;
const MIN_EDIT_BOX_HEIGHT = 28;
const PREVIEW_TEXT_OVERLAY_DATASET_KEYS = ["previewTextOverlay"];

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

type EditingBoxSize = {
  width: number;
  height: number;
};

export function ClipPreviewTextOverlayLayer({
  stageRef,
  textOverlays,
  currentTimeSeconds,
  setTextOverlays,
}: ClipPreviewTextOverlayLayerProps) {
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingBoxSize, setEditingBoxSize] = useState<EditingBoxSize | null>(
    null
  );
  const editingTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editingTextRef = useRef("");

  const selectedTimelineClipId = useClipEditorStore(
    (state) => state.selectedTimelineClipId
  );
  const selectedTimelineTrack = useClipEditorStore(
    (state) => state.selectedTimelineTrack
  );
  const setSelectedTimelineClip = useClipEditorStore(
    (state) => state.setSelectedTimelineClip
  );

  const activeTextOverlays = useActiveOverlays(textOverlays, currentTimeSeconds);
  const startPointerDrag = usePreviewOverlayPointerDrag({
    stageRef,
    dragThresholdPx: DRAG_START_THRESHOLD_PX,
    preservePointerOffset: true,
  });
  const startEdgeResize = usePreviewOverlayEdgeResize();

  useEffect(() => {
    if (selectedTimelineTrack === "text" && selectedTimelineClipId) {
      setSelectedOverlayId(selectedTimelineClipId);
      return;
    }
    setSelectedOverlayId(null);
  }, [selectedTimelineClipId, selectedTimelineTrack]);

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
    if (!editingOverlayId) {
      return;
    }
    const exists = textOverlays.some((overlay) => overlay.id === editingOverlayId);
    if (!exists) {
      setEditingOverlayId(null);
      setEditingText("");
      setEditingBoxSize(null);
    }
  }, [editingOverlayId, textOverlays]);

  useEffect(() => {
    editingTextRef.current = editingText;
  }, [editingText]);

  const commitOverlayText = useCallback(
    (overlayId: string, text: string) => {
      setTextOverlays((prev) =>
        prev.map((overlay) =>
          overlay.id === overlayId ? { ...overlay, text } : overlay
        )
      );
      setEditingOverlayId(null);
      setEditingText("");
      setEditingBoxSize(null);
    },
    [setTextOverlays]
  );

  const dismissTextSelection = useCallback(() => {
    if (editingOverlayId) {
      commitOverlayText(editingOverlayId, editingTextRef.current);
    }
    setSelectedOverlayId(null);
    setSelectedTimelineClip(null, null);
  }, [commitOverlayText, editingOverlayId, setSelectedTimelineClip]);

  usePreviewOverlayOutsideDismiss({
    enabled: Boolean(selectedOverlayId || editingOverlayId),
    overlayDatasetKeys: PREVIEW_TEXT_OVERLAY_DATASET_KEYS,
    onDismiss: dismissTextSelection,
  });

  const handleOverlayTextKeyDown = (
    event: ReactKeyboardEvent<HTMLTextAreaElement>,
    overlayId: string
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      commitOverlayText(overlayId, event.currentTarget.value);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setEditingOverlayId(null);
      setEditingText("");
      setEditingBoxSize(null);
    }
  };

  useLayoutEffect(() => {
    if (!editingOverlayId || !editingTextareaRef.current) {
      return;
    }
    const textarea = editingTextareaRef.current;
    textarea.style.width = "auto";
    textarea.style.height = "auto";
    const nextWidth = Math.max(
      MIN_EDIT_BOX_WIDTH,
      Math.ceil(textarea.scrollWidth) + EDIT_BOX_EXTRA_WIDTH
    );
    const nextHeight = Math.max(
      MIN_EDIT_BOX_HEIGHT,
      Math.ceil(textarea.scrollHeight) + EDIT_BOX_EXTRA_HEIGHT
    );
    setEditingBoxSize((prev) => {
      if (prev && prev.width === nextWidth && prev.height === nextHeight) {
        return prev;
      }
      return { width: nextWidth, height: nextHeight };
    });
  }, [editingOverlayId, editingText]);

  const handleOverlayResizeStart = (
    event: React.MouseEvent<HTMLDivElement>,
    overlayId: string,
    edge: PreviewResizeEdge
  ) => {
    const target = textOverlays.find((overlay) => overlay.id === overlayId);
    if (!target) {
      return;
    }
    const startFontSize = Math.max(MIN_TEXT_FONT_SIZE, target.fontSize || 0);
    startEdgeResize(event, edge, (delta) => {
      const nextFontSize = Math.max(
        MIN_TEXT_FONT_SIZE,
        Math.min(MAX_TEXT_FONT_SIZE, startFontSize + delta * TEXT_RESIZE_SENSITIVITY)
      );
      setTextOverlays((prev) =>
        prev.map((overlay) =>
          overlay.id === overlayId ? { ...overlay, fontSize: nextFontSize } : overlay
        )
      );
    });
  };

  return (
    <>
      {activeTextOverlays.map((overlay) => (
        <div
          key={overlay.id}
          data-preview-text-overlay
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
            setSelectedTimelineClip(overlay.id, "text");
          }}
          onDoubleClick={(event) => {
            event.stopPropagation();
            const contentElement = event.currentTarget.querySelector<HTMLElement>(
              "[data-preview-text-content]"
            );
            const measuredWidth = contentElement?.offsetWidth ?? 0;
            const measuredHeight = contentElement?.offsetHeight ?? 0;
            setSelectedOverlayId(overlay.id);
            setSelectedTimelineClip(overlay.id, "text");
            setEditingOverlayId(overlay.id);
            setEditingText(overlay.text);
            editingTextRef.current = overlay.text;
            setEditingBoxSize({
              width: Math.max(
                MIN_EDIT_BOX_WIDTH,
                measuredWidth + EDIT_BOX_EXTRA_WIDTH
              ),
              height: Math.max(
                MIN_EDIT_BOX_HEIGHT,
                measuredHeight + EDIT_BOX_EXTRA_HEIGHT
              ),
            });
          }}
          onMouseDown={(event) => {
            if (
              event.button !== 0 ||
              editingOverlayId === overlay.id ||
              event.detail > 1
            ) {
              return;
            }
            startPointerDrag(event, (xPercent, yPercent) => {
              setTextOverlays((prev) =>
                prev.map((item) =>
                  item.id === overlay.id ? { ...item, xPercent, yPercent } : item
                )
              );
            });
          }}
        >
          {selectedOverlayId === overlay.id && editingOverlayId !== overlay.id ? (
            <ClipPreviewSelectionFrame
              frameClassName="pointer-events-none absolute inset-0 border border-[#67e8f9]/90"
              topHandleClassName="absolute left-0 top-0 h-[2px] w-full cursor-ns-resize bg-[#67e8f9]/90"
              rightHandleClassName="absolute right-0 top-0 h-full w-[2px] cursor-ew-resize bg-[#67e8f9]/90"
              bottomHandleClassName="absolute bottom-0 left-0 h-[2px] w-full cursor-ns-resize bg-[#67e8f9]/90"
              leftHandleClassName="absolute left-0 top-0 h-full w-[2px] cursor-ew-resize bg-[#67e8f9]/90"
              onResizeStart={(event, edge) =>
                handleOverlayResizeStart(event, overlay.id, edge)
              }
            />
          ) : null}

          {editingOverlayId === overlay.id ? (
            <textarea
              ref={editingTextareaRef}
              autoFocus
              value={editingText}
              onChange={(event) => {
                setEditingText(event.target.value);
                editingTextRef.current = event.target.value;
              }}
              onBlur={(event) =>
                commitOverlayText(overlay.id, event.currentTarget.value)
              }
              onKeyDown={(event) => handleOverlayTextKeyDown(event, overlay.id)}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              className="resize-none overflow-hidden rounded border border-[#67e8f9]/70 bg-black/45 px-2 py-1 text-center text-inherit text-white outline-none"
              style={{
                width: `${Math.max(MIN_EDIT_BOX_WIDTH, editingBoxSize?.width ?? 0)}px`,
                height: `${Math.max(MIN_EDIT_BOX_HEIGHT, editingBoxSize?.height ?? 0)}px`,
                writingMode: "horizontal-tb",
                textOrientation: "mixed",
                whiteSpace: "pre-wrap",
                wordBreak: "normal",
              }}
            />
          ) : (
            <span data-preview-text-content>{overlay.text}</span>
          )}
        </div>
      ))}
    </>
  );
}
