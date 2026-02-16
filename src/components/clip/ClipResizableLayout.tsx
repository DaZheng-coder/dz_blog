import { useEffect, useRef, useState, type ReactNode } from "react";

type DragType = "left" | "right" | "bottom" | null;

type ClipResizableLayoutProps = {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  bottom: ReactNode;
};

type ResizeHandleProps = {
  direction: "row" | "col";
  label: string;
  onMouseDown: () => void;
};

const HANDLE_SIZE = 8;
const MIN_LEFT_WIDTH = 220;
const MIN_RIGHT_WIDTH = 260;
const MIN_CENTER_WIDTH = 420;
const MIN_TOP_HEIGHT = 240;
const MIN_BOTTOM_HEIGHT = 160;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function ResizeHandle({ direction, label, onMouseDown }: ResizeHandleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={onMouseDown}
      className={`shrink-0 bg-transparent transition hover:bg-[#22d3ee]/20 ${
        direction === "row"
          ? "h-2 cursor-row-resize"
          : "w-2 cursor-col-resize"
      }`}
    />
  );
}

export function ClipResizableLayout({
  left,
  center,
  right,
  bottom,
}: ClipResizableLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(320);
  const [bottomHeight, setBottomHeight] = useState(250);
  const [dragType, setDragType] = useState<DragType>(null);

  useEffect(() => {
    if (!dragType) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const rect = container.getBoundingClientRect();

      if (dragType === "left") {
        const maxLeft =
          rect.width - rightWidth - MIN_CENTER_WIDTH - HANDLE_SIZE * 2;
        const nextLeft = clamp(
          event.clientX - rect.left,
          MIN_LEFT_WIDTH,
          maxLeft
        );
        setLeftWidth(nextLeft);
      }

      if (dragType === "right") {
        const maxRight =
          rect.width - leftWidth - MIN_CENTER_WIDTH - HANDLE_SIZE * 2;
        const nextRight = clamp(
          rect.right - event.clientX,
          MIN_RIGHT_WIDTH,
          maxRight
        );
        setRightWidth(nextRight);
      }

      if (dragType === "bottom") {
        const maxBottom = rect.height - MIN_TOP_HEIGHT - HANDLE_SIZE;
        const nextBottom = clamp(
          rect.bottom - event.clientY,
          MIN_BOTTOM_HEIGHT,
          maxBottom
        );
        setBottomHeight(nextBottom);
      }
    };

    const handleMouseUp = () => {
      setDragType(null);
    };

    const cursor =
      dragType === "bottom" ? "row-resize" : ("col-resize" as const);
    document.body.style.cursor = cursor;
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragType, leftWidth, rightWidth]);

  return (
    <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden p-2">
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full min-h-0 items-stretch">
            <div
              className="h-full min-h-0 shrink-0 overflow-hidden"
              style={{ width: `${leftWidth}px` }}
            >
              {left}
            </div>

            <ResizeHandle
              direction="col"
              label="调整左侧面板宽度"
              onMouseDown={() => setDragType("left")}
            />

            <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden">{center}</div>

            <ResizeHandle
              direction="col"
              label="调整右侧面板宽度"
              onMouseDown={() => setDragType("right")}
            />

            <div
              className="h-full min-h-0 shrink-0 overflow-hidden"
              style={{ width: `${rightWidth}px` }}
            >
              {right}
            </div>
          </div>
        </div>

        <ResizeHandle
          direction="row"
          label="调整底部轨道高度"
          onMouseDown={() => setDragType("bottom")}
        />

        <div
          className="min-h-0 shrink-0 overflow-hidden"
          style={{ height: `${bottomHeight}px` }}
        >
          {bottom}
        </div>
      </div>
    </div>
  );
}
