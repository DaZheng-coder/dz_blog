import type * as THREE from "three";

export type KeyState = {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
};

export type Interactable = {
  id: string;
  name: string;
  position: [number, number, number];
};

export type VehicleTelemetry = {
  speed: number;
  braking: boolean;
  position: THREE.Vector3;
  forward: THREE.Vector3;
  rearLeft: THREE.Vector3;
  rearRight: THREE.Vector3;
};
