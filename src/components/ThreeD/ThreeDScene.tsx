import { useRef } from "react";
import * as THREE from "three";
import { SceneEnvironment } from "./SceneEnvironment";
import { InteractableObjects } from "./InteractableObjects";
import { VehicleModel } from "./VehicleModel";
import { ExhaustEffect } from "./ExhaustEffect";
import { TireMarks } from "./TireMarks";
import { TextPlate3D } from "./TextPlate3D";
import type { Interactable, KeyState, VehicleTelemetry } from "./types";
export type { Interactable, KeyState } from "./types";

type ThreeDSceneProps = {
  keysRef: React.RefObject<KeyState>;
  interactTick: number;
  activeSet: Set<string>;
  interactables: Interactable[];
  onNearbyChange: (id: string | null) => void;
  onInteract: (id: string) => void;
};

const INTERACT_RANGE = 4;
const EXHAUST_PARTICLE_COUNT = 130;
const TIRE_MARK_SPAWN_DISTANCE = 0.45;
const TIRE_MARK_MIN_SPEED = 2;
const TIRE_MARK_LIFETIME = 4.2;
const MAX_TIRE_MARKS = 220;

export function ThreeDScene({
  keysRef,
  interactTick,
  activeSet,
  interactables,
  onNearbyChange,
  onInteract,
}: ThreeDSceneProps) {
  const vehicleRef = useRef<THREE.Group>(null);
  const telemetryRef = useRef<VehicleTelemetry>({
    speed: 0,
    braking: false,
    position: new THREE.Vector3(),
    forward: new THREE.Vector3(0, 0, 1),
    rearLeft: new THREE.Vector3(),
    rearRight: new THREE.Vector3(),
  });

  return (
    <>
      <SceneEnvironment />
      <TextPlate3D
        text="I Love Three.js"
        position={[-6, 0.001, -10]}
        rotation={[0, -Math.PI / 8, 0]}
        plateSize={[15, 3.6]}
        textSize={1.35}
      />
      <InteractableObjects
        vehicleRef={vehicleRef}
        interactables={interactables}
        activeSet={activeSet}
        interactTick={interactTick}
        interactRange={INTERACT_RANGE}
        onNearbyChange={onNearbyChange}
        onInteract={onInteract}
      />
      <VehicleModel
        keysRef={keysRef}
        vehicleRef={vehicleRef}
        telemetryRef={telemetryRef}
      />
      <ExhaustEffect
        telemetryRef={telemetryRef}
        particleCount={EXHAUST_PARTICLE_COUNT}
      />
      <TireMarks
        telemetryRef={telemetryRef}
        lifetime={TIRE_MARK_LIFETIME}
        minSpeed={TIRE_MARK_MIN_SPEED}
        spawnDistance={TIRE_MARK_SPAWN_DISTANCE}
        maxMarks={MAX_TIRE_MARKS}
      />
    </>
  );
}
