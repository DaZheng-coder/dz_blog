import * as THREE from "three";

type VehicleModelProps = {
  vehicleRef: React.RefObject<THREE.Group | null>;
  carModel: THREE.Group;
  scale: number;
  yOffset: number;
  yRotation: number;
};

export function VehicleModel({
  vehicleRef,
  carModel,
  scale,
  yOffset,
  yRotation,
}: VehicleModelProps) {
  return (
    <group ref={vehicleRef} position={[0, 0.01, 0]}>
      <primitive
        object={carModel}
        scale={scale}
        position-y={yOffset}
        rotation-y={yRotation}
      />
    </group>
  );
}
