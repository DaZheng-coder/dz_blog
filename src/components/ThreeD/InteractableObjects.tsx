import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { type Interactable } from "./types";

type InteractableObjectsProps = {
  vehicleRef: React.RefObject<THREE.Group | null>;
  interactables: Interactable[];
  activeSet: Set<string>;
  interactTick: number;
  interactRange: number;
  onNearbyChange: (id: string | null) => void;
  onInteract: (id: string) => void;
};

export function InteractableObjects({
  vehicleRef,
  interactables,
  activeSet,
  interactTick,
  interactRange,
  onNearbyChange,
  onInteract,
}: InteractableObjectsProps) {
  const nearbyIdRef = useRef<string | null>(null);
  const lastInteractTickRef = useRef(0);
  const vehiclePosition = useMemo(() => new THREE.Vector3(), []);
  const itemPosition = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const vehicle = vehicleRef.current;
    if (!vehicle) {
      return;
    }

    vehiclePosition.copy(vehicle.position);

    let nextNearbyId: string | null = null;
    let nearestDistance = Number.MAX_SAFE_INTEGER;

    for (const item of interactables) {
      itemPosition.set(item.position[0], 0, item.position[2]);
      const itemDistance = vehiclePosition.distanceTo(itemPosition);

      if (itemDistance < nearestDistance) {
        nearestDistance = itemDistance;
        nextNearbyId = item.id;
      }
    }

    if (nearestDistance > interactRange) {
      nextNearbyId = null;
    }

    if (nearbyIdRef.current !== nextNearbyId) {
      nearbyIdRef.current = nextNearbyId;
      onNearbyChange(nextNearbyId);
    }

    if (interactTick !== lastInteractTickRef.current) {
      lastInteractTickRef.current = interactTick;
      if (nearbyIdRef.current) {
        onInteract(nearbyIdRef.current);
      }
    }
  });

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
