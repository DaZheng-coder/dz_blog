import { type ThreeEvent } from "@react-three/fiber";

type SceneEnvironmentProps = {
  onGroundPointerDown: (event: ThreeEvent<PointerEvent>) => void;
};

export function SceneEnvironment({ onGroundPointerDown }: SceneEnvironmentProps) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[10, 14, 7]} intensity={1.2} />
      <color attach="background" args={["#0b0f14"]} />
      <fog attach="fog" args={["#0b0f14", 35, 90]} />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerDown={onGroundPointerDown}
      >
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color="#ebe6da" />
      </mesh>
    </>
  );
}
