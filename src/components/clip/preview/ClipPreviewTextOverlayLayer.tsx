import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import type { ClipTextOverlay } from "../shared/types";
import { useClipEditorStore } from "../store/clipEditorStore";

const MIN_TEXT_FONT_SIZE = 12;
const MAX_TEXT_FONT_SIZE = 240;
const TEXT_RESIZE_SENSITIVITY = 0.35;
const DRAG_START_THRESHOLD_PX = 2;
const EDIT_BOX_EXTRA_WIDTH = 12;
const EDIT_BOX_EXTRA_HEIGHT = 8;
const MIN_EDIT_BOX_WIDTH = 48;
const MIN_EDIT_BOX_HEIGHT = 28;

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

  useEffect(() => {
    const handleDocumentPointerDown = (event: PointerEvent) => {
      const path = event.composedPath();
      const clickedInsideOverlay = path.some((node) => {
        if (!(node instanceof HTMLElement)) {
          return false;
        }
        return node.dataset.previewTextOverlay !== undefined;
      });
      const clickedInsideInspector = path.some((node) => {
        if (!(node instanceof HTMLElement)) {
          return false;
        }
        return node.dataset.clipInspector !== undefined;
      });
      if (clickedInsideOverlay || clickedInsideInspector) {
        return;
      }
      if (editingOverlayId) {
        commitOverlayText(editingOverlayId, editingTextRef.current);
      }
      setSelectedOverlayId(null);
      setSelectedTimelineClip(null, null);
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown, true);
    return () => {
      document.removeEventListener(
        "pointerdown",
        handleDocumentPointerDown,
        true
      );
    };
  }, [commitOverlayText, editingOverlayId, setSelectedTimelineClip]);

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

  const handleOverlayDragStart = (
    event: React.MouseEvent<HTMLDivElement>,
    overlayId: string
  ) => {
    if (
      event.button !== 0 ||
      editingOverlayId === overlayId ||
      event.detail > 1
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const overlayRect = event.currentTarget.getBoundingClientRect();
    const overlayCenterX = overlayRect.left + overlayRect.width / 2;
    const overlayCenterY = overlayRect.top + overlayRect.height / 2;
    const dragOffsetX = event.clientX - overlayCenterX;
    const dragOffsetY = event.clientY - overlayCenterY;
    const startClientX = event.clientX;
    const startClientY = event.clientY;
    let didStartDrag = false;

    const rect = stage.getBoundingClientRect();
    const updatePosition = (clientX: number, clientY: number) => {
      const centerX = clientX - dragOffsetX;
      const centerY = clientY - dragOffsetY;
      const xPercent = Math.max(
        0,
        Math.min(100, ((centerX - rect.left) / rect.width) * 100)
      );
      const yPercent = Math.max(
        0,
        Math.min(100, ((centerY - rect.top) / rect.height) * 100)
      );
      setTextOverlays((prev) =>
        prev.map((overlay) =>
          overlay.id === overlayId ? { ...overlay, xPercent, yPercent } : overlay
        )
      );
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!didStartDrag) {
        const deltaX = Math.abs(moveEvent.clientX - startClientX);
        const deltaY = Math.abs(moveEvent.clientY - startClientY);
        if (deltaX < DRAG_START_THRESHOLD_PX && deltaY < DRAG_START_THRESHOLD_PX) {
          return;
        }
        didStartDrag = true;
      }
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
          onMouseDown={(event) => handleOverlayDragStart(event, overlay.id)}
        >
          {selectedOverlayId === overlay.id && editingOverlayId !== overlay.id ? (
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
