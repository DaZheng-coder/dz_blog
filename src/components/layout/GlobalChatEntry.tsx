import { useEffect, useRef, useState } from "react";
import type { DragEvent, MouseEvent, PointerEvent } from "react";
import { Link, useLocation } from "react-router-dom";

const ENTRY_SIZE = 56;
const VIEWPORT_PADDING = 12;
const STORAGE_KEY = "global-chat-entry-position";

type Position = {
  x: number;
  y: number;
};

function getDefaultPosition(): Position {
  if (typeof window === "undefined") {
    return { x: 0, y: 0 };
  }

  return {
    x: window.innerWidth - ENTRY_SIZE - 32,
    y: window.innerHeight - ENTRY_SIZE - 32,
  };
}

function clampPosition(position: Position): Position {
  if (typeof window === "undefined") {
    return position;
  }

  const maxX = window.innerWidth - ENTRY_SIZE - VIEWPORT_PADDING;
  const maxY = window.innerHeight - ENTRY_SIZE - VIEWPORT_PADDING;

  return {
    x: Math.min(Math.max(VIEWPORT_PADDING, position.x), maxX),
    y: Math.min(Math.max(VIEWPORT_PADDING, position.y), maxY),
  };
}

export function GlobalChatEntry() {
  const location = useLocation();
  const [position, setPosition] = useState<Position>(() => {
    if (typeof window === "undefined") {
      return { x: 0, y: 0 };
    }

    const savedPosition = window.localStorage.getItem(STORAGE_KEY);
    if (!savedPosition) {
      return clampPosition(getDefaultPosition());
    }

    try {
      const parsed = JSON.parse(savedPosition) as Position;
      return clampPosition(parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return clampPosition(getDefaultPosition());
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const hasMovedRef = useRef(false);
  const pointerOffsetRef = useRef({ x: 0, y: 0 });
  const entryRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    const onResize = () => {
      setPosition((prev) => clampPosition(prev));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (!entryRef.current) {
      return;
    }

    const rect = entryRef.current.getBoundingClientRect();
    pointerOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    hasMovedRef.current = false;
    setIsDragging(true);

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    if (!isDragging) {
      return;
    }

    event.preventDefault();
    hasMovedRef.current = true;

    const nextPosition = clampPosition({
      x: event.clientX - pointerOffsetRef.current.x,
      y: event.clientY - pointerOffsetRef.current.y,
    });

    setPosition(nextPosition);
  };

  const handlePointerUp = (event: PointerEvent<HTMLAnchorElement>) => {
    if (!isDragging) {
      return;
    }

    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (hasMovedRef.current) {
      event.preventDefault();
      hasMovedRef.current = false;
    }
  };

  const handleDragStart = (event: DragEvent<HTMLAnchorElement>) => {
    event.preventDefault();
  };

  if (location.pathname === "/chat") {
    return null;
  }

  return (
    <Link
      ref={entryRef}
      to="/chat"
      draggable={false}
      onClick={handleClick}
      onDragStart={handleDragStart}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-[#0a0a0b] shadow-[0_12px_40px_rgba(245,158,11,0.4)] transition ${isDragging ? "cursor-grabbing scale-105" : "cursor-grab hover:scale-105"}`}
      style={{ left: position.x, top: position.y, touchAction: "none" }}
      aria-label="打开 AI 对话"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </Link>
  );
}
