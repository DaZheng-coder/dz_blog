import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type TireMark = {
  id: number;
  bornAt: number;
  position: [number, number, number];
  rotationY: number;
};

type TireMarksProps = {
  marks: TireMark[];
  lifetime: number;
};

export function TireMarks({ marks, lifetime }: TireMarksProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) {
      return;
    }

    const now = performance.now() / 1000;
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
