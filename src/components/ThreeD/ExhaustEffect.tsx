import * as THREE from "three";
import { ExhaustParticles } from "./ExhaustParticles";

type ExhaustEffectProps = {
  exhaustParticles: ExhaustParticles;
  lightPointsRef: React.RefObject<THREE.Points | null>;
  darkPointsRef: React.RefObject<THREE.Points | null>;
  lightMaterialRef: React.RefObject<THREE.PointsMaterial | null>;
  darkMaterialRef: React.RefObject<THREE.PointsMaterial | null>;
};

export function ExhaustEffect({
  exhaustParticles,
  lightPointsRef,
  darkPointsRef,
  lightMaterialRef,
  darkMaterialRef,
}: ExhaustEffectProps) {
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
