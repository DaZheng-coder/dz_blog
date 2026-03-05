import { Html } from "@react-three/drei";
import { type Interactable } from "./types";

type InteractableObjectsProps = {
  interactables: Interactable[];
  activeSet: Set<string>;
};

export function InteractableObjects({
  interactables,
  activeSet,
}: InteractableObjectsProps) {
  return (
    <>
      {interactables.map((item) => {
        const isActive = activeSet.has(item.id);

        return (
          <group key={item.id} position={item.position}>
            <mesh castShadow>
              <boxGeometry args={[2, 1.5, 2]} />
              <meshStandardMaterial
                color={isActive ? "#f59e0b" : "#4b6078"}
                emissive={isActive ? "#5a3a05" : "#000000"}
              />
            </mesh>
            <Html position={[0, 1.5, 0]} center>
              <div className="rounded bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                {item.name}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}
