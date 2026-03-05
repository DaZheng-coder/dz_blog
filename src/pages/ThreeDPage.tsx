import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { ThreeDScene, type Interactable, type KeyState } from "../components/ThreeD/ThreeDScene";

const interactables: Interactable[] = [
  { id: "charging-station", name: "充电站", position: [8, 0.75, 5] },
  { id: "supply-box", name: "补给箱", position: [-10, 0.75, -6] },
  { id: "signal-tower", name: "信号塔", position: [3, 0.75, -13] },
];

function useKeyboardControls() {
  const keysRef = useRef<KeyState>({ w: false, a: false, s: false, d: false });
  const [interactTick, setInteractTick] = useState(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (["w", "a", "s", "d", "f"].includes(key)) {
        event.preventDefault();
      }

      if (key === "w") keysRef.current.w = true;
      if (key === "a") keysRef.current.a = true;
      if (key === "s") keysRef.current.s = true;
      if (key === "d") keysRef.current.d = true;
      if (key === "f" && !event.repeat) {
        setInteractTick((prev) => prev + 1);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === "w") keysRef.current.w = false;
      if (key === "a") keysRef.current.a = false;
      if (key === "s") keysRef.current.s = false;
      if (key === "d") keysRef.current.d = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return { keysRef, interactTick };
}

export function ThreeDPage() {
  const { keysRef, interactTick } = useKeyboardControls();
  const [nearbyId, setNearbyId] = useState<string | null>(null);
  const [activeSet, setActiveSet] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("WASD 控制车辆，按 F 与附近物体交互");

  const onInteract = useCallback((id: string) => {
    const target = interactables.find((item) => item.id === id);
    if (!target) {
      return;
    }

    setActiveSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setToast(`已关闭 ${target.name}`);
      } else {
        next.add(id);
        setToast(`已激活 ${target.name}`);
      }
      return next;
    });
  }, []);

  const nearbyLabel = nearbyId
    ? interactables.find((item) => item.id === nearbyId)?.name ?? null
    : null;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0b0f14] text-white">
      <Canvas
        camera={{
          position: [22, 30, 22],
          fov: 38,
        }}
        shadows
      >
        <Suspense fallback={null}>
          <ThreeDScene
            keysRef={keysRef}
            interactTick={interactTick}
            activeSet={activeSet}
            interactables={interactables}
            onNearbyChange={setNearbyId}
            onInteract={onInteract}
          />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-lg border border-white/20 bg-black/45 px-4 py-3 text-sm backdrop-blur-md">
        <p className="font-semibold">3D 测试场景</p>
        <p className="mt-1 text-white/80">W/S 前进后退 · A/D 转向 · F 交互</p>
        {nearbyLabel ? (
          <p className="mt-2 text-amber-300">可交互对象：{nearbyLabel}（按 F）</p>
        ) : (
          <p className="mt-2 text-white/60">附近没有可交互对象</p>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-lg border border-white/20 bg-black/45 px-4 py-2 text-sm text-white/90 backdrop-blur-md">
        {toast}
      </div>

      <div className="absolute right-4 top-4 z-20 flex gap-2">
        <Link
          to="/model-inspector"
          className="rounded-md border border-white/25 bg-black/50 px-3 py-2 text-sm text-white transition hover:bg-black/70"
        >
          模型分析工具
        </Link>
        <Link
          to="/"
          className="rounded-md border border-white/25 bg-black/50 px-3 py-2 text-sm text-white transition hover:bg-black/70"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
