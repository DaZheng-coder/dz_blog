import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ExhaustParticles } from "./ExhaustParticles";
import { type VehicleTelemetry } from "./types";

type ExhaustEffectProps = {
  telemetryRef: React.RefObject<VehicleTelemetry>;
  particleCount: number;
};

export function ExhaustEffect({
  telemetryRef,
  particleCount,
}: ExhaustEffectProps) {
  const exhaustParticles = useMemo(
    () => new ExhaustParticles(particleCount),
    [particleCount]
  );
  const lightPointsRef = useRef<THREE.Points>(null);
  const darkPointsRef = useRef<THREE.Points>(null);
  const lightMaterialRef = useRef<THREE.PointsMaterial>(null);
  const darkMaterialRef = useRef<THREE.PointsMaterial>(null);

  useFrame((_, delta) => {
    const telemetry = telemetryRef.current;

    const exhaustIntensity = THREE.MathUtils.clamp(
      (telemetry.speed - 1.8) / 10,
      0,
      1
    );
    exhaustParticles.step(
      delta,
      telemetry.position,
      telemetry.forward,
      exhaustIntensity
    );

    if (lightPointsRef.current) {
      const positionAttr = lightPointsRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      positionAttr.needsUpdate = true;
      lightPointsRef.current.visible = exhaustParticles.hasLiveParticle;
    }

    if (darkPointsRef.current) {
      const positionAttr = darkPointsRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      positionAttr.needsUpdate = true;
      darkPointsRef.current.visible = exhaustParticles.hasLiveParticle;
    }

    if (lightMaterialRef.current) {
      lightMaterialRef.current.opacity = 0.09 + exhaustIntensity * 0.14;
      lightMaterialRef.current.size = 0.2 + exhaustIntensity * 0.12;
    }

    if (darkMaterialRef.current) {
      darkMaterialRef.current.opacity = 0.05 + exhaustIntensity * 0.09;
      darkMaterialRef.current.size = 0.16 + exhaustIntensity * 0.1;
    }
  });

  return (
    <>
      <points ref={lightPointsRef} frustumCulled={false} visible={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[exhaustParticles.positions, 3]}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={lightMaterialRef}
          color="#3a3f46"
          size={0.2}
          sizeAttenuation
          transparent
          opacity={0.12}
          depthWrite={false}
          depthTest={false}
        />
      </points>

      <points ref={darkPointsRef} frustumCulled={false} visible={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[exhaustParticles.positions, 3]}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={darkMaterialRef}
          color="#191c20"
          size={0.16}
          sizeAttenuation
          transparent
          opacity={0.06}
          depthWrite={false}
          depthTest={false}
        />
      </points>
    </>
  );
}
