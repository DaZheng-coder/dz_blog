import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { type VehicleTelemetry } from "./types";

export type TireMark = {
  id: number;
  bornAt: number;
  position: [number, number, number];
  rotationY: number;
};

type TireMarksProps = {
  telemetryRef: React.RefObject<VehicleTelemetry>;
  lifetime: number;
  minSpeed: number;
  spawnDistance: number;
  maxMarks: number;
};

export function TireMarks({
  telemetryRef,
  lifetime,
  minSpeed,
  spawnDistance,
  maxMarks,
}: TireMarksProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [marks, setMarks] = useState<TireMark[]>([]);
  const tireMarkIdRef = useRef(0);
  const lastTireCleanupRef = useRef(0);
  const rearLeftLastEmitRef = useRef<THREE.Vector3 | null>(null);
  const rearRightLastEmitRef = useRef<THREE.Vector3 | null>(null);

  useFrame(() => {
    const telemetry = telemetryRef.current;
    const now = performance.now() / 1000;

    if (telemetry.braking && telemetry.speed >= minSpeed) {
      if (!rearLeftLastEmitRef.current || !rearRightLastEmitRef.current) {
        rearLeftLastEmitRef.current = telemetry.rearLeft.clone();
        rearRightLastEmitRef.current = telemetry.rearRight.clone();
      }

      const distanceSinceEmit = Math.min(
        telemetry.rearLeft.distanceTo(rearLeftLastEmitRef.current),
        telemetry.rearRight.distanceTo(rearRightLastEmitRef.current)
      );

      if (distanceSinceEmit >= spawnDistance) {
        const markRotationY = Math.atan2(
          telemetry.forward.x,
          telemetry.forward.z
        );
        const newMarks: TireMark[] = [
          {
            id: tireMarkIdRef.current++,
            bornAt: now,
            position: [telemetry.rearLeft.x, 0.012, telemetry.rearLeft.z],
            rotationY: markRotationY,
          },
          {
            id: tireMarkIdRef.current++,
            bornAt: now,
            position: [telemetry.rearRight.x, 0.012, telemetry.rearRight.z],
            rotationY: markRotationY,
          },
        ];

        setMarks((prev) => [...prev, ...newMarks].slice(-maxMarks));
        rearLeftLastEmitRef.current.copy(telemetry.rearLeft);
        rearRightLastEmitRef.current.copy(telemetry.rearRight);
      }
    } else {
      rearLeftLastEmitRef.current = null;
      rearRightLastEmitRef.current = null;
    }

    if (now - lastTireCleanupRef.current > 0.2) {
      lastTireCleanupRef.current = now;
      setMarks((prev) => prev.filter((mark) => now - mark.bornAt < lifetime));
    }

    if (!groupRef.current) {
      return;
    }

    groupRef.current.children.forEach((child, index) => {
      const mark = marks[index];
      if (!mark) {
        return;
      }

      const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      const lifeRatio = THREE.MathUtils.clamp(
        1 - (now - mark.bornAt) / lifetime,
        0,
        1
      );
      material.opacity = lifeRatio * 0.34;
    });
  });

  return (
    <group ref={groupRef}>
      {marks.map((mark) => (
        <mesh
          key={mark.id}
          position={mark.position}
          rotation={[-Math.PI / 2, 0, mark.rotationY]}
        >
          <planeGeometry args={[0.18, 0.5]} />
          <meshBasicMaterial
            color="#171717"
            transparent
            opacity={0.34}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
