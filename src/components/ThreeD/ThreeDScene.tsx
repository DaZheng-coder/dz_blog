import { useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ExhaustParticles } from "./ExhaustParticles";
import { SceneEnvironment } from "./SceneEnvironment";
import { InteractableObjects } from "./InteractableObjects";
import { VehicleModel } from "./VehicleModel";
import { ExhaustEffect } from "./ExhaustEffect";
import { TireMarks, type TireMark } from "./TireMarks";
import type { Interactable, KeyState } from "./types";
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
const RTS_CAMERA_OFFSET = { x: 22, y: 30, z: 22 };
const CAR_MODEL_Y_ROT_OFFSET = Math.PI;
const TARGET_CAR_FOOTPRINT = 2;
const CAR_SCALE_MULTIPLIER = 1.5;
const EXHAUST_PARTICLE_COUNT = 130;
const MAX_WHEEL_STEER_ANGLE = THREE.MathUtils.degToRad(30);
const WHEEL_STEER_SMOOTH = 12;
const FRONT_WHEEL_LOCAL_Z_SIGN = -1;
const LEFT_FRONT_STEER_SIGN = 1;
const RIGHT_FRONT_STEER_SIGN = 1;
const TIRE_MARK_SPAWN_DISTANCE = 0.45;
const TIRE_MARK_MIN_SPEED = 2;
const TIRE_MARK_LIFETIME = 4.2;
const MAX_TIRE_MARKS = 220;
const carModelUrl = new URL(
  "../../3DModel/soviet_car._vaz-2103_zhiguli/scene.gltf",
  import.meta.url
).href;

type SteeringWheel = {
  side: "left" | "right";
  pivot: THREE.Object3D;
  basePivotRotation: THREE.Euler;
  steerSign: number;
};

type WheelDetection = {
  steeringWheels: SteeringWheel[];
  rearWheels: {
    left: THREE.Object3D | null;
    right: THREE.Object3D | null;
  };
};

export function ThreeDScene({
  keysRef,
  interactTick,
  activeSet,
  interactables,
  onNearbyChange,
  onInteract,
}: ThreeDSceneProps) {
  const { scene } = useGLTF(carModelUrl);
  const vehicleRef = useRef<THREE.Group>(null);
  const exhaustLightPointsRef = useRef<THREE.Points>(null);
  const exhaustDarkPointsRef = useRef<THREE.Points>(null);
  const exhaustLightMaterialRef = useRef<THREE.PointsMaterial>(null);
  const exhaustDarkMaterialRef = useRef<THREE.PointsMaterial>(null);
  const velocityRef = useRef(0);
  const yawRef = useRef(0);
  const steerAngleRef = useRef(0);
  const nearbyIdRef = useRef<string | null>(null);
  const lastInteractTickRef = useRef(0);
  const tireMarkIdRef = useRef(0);
  const lastTireCleanupRef = useRef(0);
  const rearLeftLastEmitRef = useRef<THREE.Vector3 | null>(null);
  const rearRightLastEmitRef = useRef<THREE.Vector3 | null>(null);
  const [tireMarks, setTireMarks] = useState<TireMark[]>([]);

  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const rearCenter = useMemo(() => new THREE.Vector3(), []);
  const rearLeftPos = useMemo(() => new THREE.Vector3(), []);
  const rearRightPos = useMemo(() => new THREE.Vector3(), []);
  const desiredCamera = useMemo(() => new THREE.Vector3(), []);
  const vehiclePosition = useMemo(() => new THREE.Vector3(), []);
  const exhaustParticles = useMemo(
    () => new ExhaustParticles(EXHAUST_PARTICLE_COUNT),
    []
  );
  const carModel = useMemo(() => {
    const model = scene.clone(true);
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return model;
  }, [scene]);
  const wheelDetection = useMemo<WheelDetection>(() => {
    const vehicleBox = new THREE.Box3().setFromObject(carModel);
    const vehicleSize = vehicleBox.getSize(new THREE.Vector3());
    const candidates: Array<{ node: THREE.Object3D; center: THREE.Vector3 }> =
      [];

    carModel.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) {
        return;
      }

      const bounds = new THREE.Box3().setFromObject(mesh);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const dims = [size.x, size.y, size.z].sort((a, b) => a - b);
      const thickness = dims[0];
      const radiusA = dims[1];
      const radiusB = dims[2];

      const wheelLike =
        thickness > 0.005 &&
        thickness < radiusA * 0.65 &&
        radiusA > 0.04 &&
        radiusB / Math.max(radiusA, 0.001) < 1.9;
      const nearGround = center.y <= vehicleBox.min.y + vehicleSize.y * 0.45;
      const sideOffset = Math.abs(center.x) >= vehicleSize.x * 0.18;

      if (wheelLike && nearGround && sideOffset) {
        candidates.push({ node: mesh, center });
      }
    });

    carModel.updateWorldMatrix(true, true);
    const frontCandidates = candidates
      .filter(({ center }) => center.z * FRONT_WHEEL_LOCAL_Z_SIGN > 0)
      .sort((a, b) => Math.abs(b.center.x) - Math.abs(a.center.x))
      .slice(0, 2);
    const rearCandidates = candidates
      .filter(({ center }) => center.z * FRONT_WHEEL_LOCAL_Z_SIGN < 0)
      .sort((a, b) => Math.abs(b.center.x) - Math.abs(a.center.x))
      .slice(0, 2);

    const selected =
      frontCandidates.length >= 2
        ? frontCandidates
        : candidates
            .sort((a, b) => Math.abs(b.center.x) - Math.abs(a.center.x))
            .slice(0, 2);

    const steering: SteeringWheel[] = [];
    for (const { node, center } of selected) {
      const parent = node.parent;
      if (!parent) {
        continue;
      }

      const wheelCenterWorld = center.clone();
      const wheelCenterLocal = parent.worldToLocal(wheelCenterWorld);
      const pivot = new THREE.Object3D();
      pivot.name = `${node.name || "wheel"}_steer_pivot`;
      pivot.position.copy(wheelCenterLocal);
      parent.add(pivot);
      pivot.attach(node);

      const side: "left" | "right" = center.x <= 0 ? "left" : "right";
      steering.push({
        side,
        pivot,
        basePivotRotation: pivot.rotation.clone(),
        steerSign:
          side === "left" ? LEFT_FRONT_STEER_SIGN : RIGHT_FRONT_STEER_SIGN,
      });
    }

    const rearLeft =
      rearCandidates
        .filter((wheel) => wheel.center.x <= 0)
        .sort((a, b) => a.center.x - b.center.x)[0]?.node ?? null;
    const rearRight =
      rearCandidates
        .filter((wheel) => wheel.center.x > 0)
        .sort((a, b) => b.center.x - a.center.x)[0]?.node ?? null;

    return {
      steeringWheels: steering,
      rearWheels: {
        left: rearLeft,
        right: rearRight,
      },
    };
  }, [carModel]);
  const carTransform = useMemo(() => {
    const bbox = new THREE.Box3().setFromObject(carModel);
    const size = bbox.getSize(new THREE.Vector3());
    const horizontalSize = Math.max(size.x, size.z) || 1;
    const scale =
      (TARGET_CAR_FOOTPRINT / horizontalSize) * CAR_SCALE_MULTIPLIER;
    const yOffset = -bbox.min.y * scale;

    const rearTrackHalf = Math.max(size.x * scale * 0.28, 0.45);
    const rearAxleOffset = Math.max(size.z * scale * 0.33, 0.9);

    return { scale, yOffset, rearTrackHalf, rearAxleOffset };
  }, [carModel]);
  useFrame(({ camera }, delta) => {
    const vehicle = vehicleRef.current;
    const keys = keysRef.current;

    if (!vehicle || !keys) {
      return;
    }

    const acceleration = 14;
    const maxSpeed = 16;
    const turnSpeed = 1.8;
    const friction = 7.5;

    if (keys.w) velocityRef.current += acceleration * delta;
    if (keys.s) velocityRef.current -= acceleration * delta;

    velocityRef.current = THREE.MathUtils.clamp(
      velocityRef.current,
      -maxSpeed * 0.65,
      maxSpeed
    );

    if (!keys.w && !keys.s) {
      const frictionDelta = friction * delta;
      if (Math.abs(velocityRef.current) <= frictionDelta) {
        velocityRef.current = 0;
      } else {
        velocityRef.current -= Math.sign(velocityRef.current) * frictionDelta;
      }
    }

    const speedRatio = Math.min(Math.abs(velocityRef.current) / maxSpeed, 1);
    const steeringDirection = velocityRef.current >= 0 ? 1 : -1;
    if (keys.a)
      yawRef.current += turnSpeed * speedRatio * steeringDirection * delta;
    if (keys.d)
      yawRef.current -= turnSpeed * speedRatio * steeringDirection * delta;

    const steerInput = (keys.a ? 1 : 0) - (keys.d ? 1 : 0);
    const targetSteerAngle = steerInput * MAX_WHEEL_STEER_ANGLE;
    steerAngleRef.current = THREE.MathUtils.damp(
      steerAngleRef.current,
      targetSteerAngle,
      WHEEL_STEER_SMOOTH,
      delta
    );

    for (const wheel of wheelDetection.steeringWheels) {
      wheel.pivot.rotation.copy(wheel.basePivotRotation);
      wheel.pivot.rotation.z += steerAngleRef.current * wheel.steerSign;
    }

    forward.set(Math.sin(yawRef.current), 0, Math.cos(yawRef.current));
    vehicle.position.addScaledVector(forward, velocityRef.current * delta);

    vehicle.rotation.y = yawRef.current;

    // Twin-tailpipe exhaust particles: stronger emission at higher speed.
    const speed = Math.abs(velocityRef.current);
    const exhaustIntensity = THREE.MathUtils.clamp((speed - 1.8) / 10, 0, 1);
    exhaustParticles.step(delta, vehicle.position, forward, exhaustIntensity);

    if (exhaustLightPointsRef.current) {
      const positionAttr = exhaustLightPointsRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      positionAttr.needsUpdate = true;
      exhaustLightPointsRef.current.visible = exhaustParticles.hasLiveParticle;
    }

    if (exhaustDarkPointsRef.current) {
      const positionAttr = exhaustDarkPointsRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      positionAttr.needsUpdate = true;
      exhaustDarkPointsRef.current.visible = exhaustParticles.hasLiveParticle;
    }

    if (exhaustLightMaterialRef.current) {
      exhaustLightMaterialRef.current.opacity = 0.09 + exhaustIntensity * 0.14;
      exhaustLightMaterialRef.current.size = 0.2 + exhaustIntensity * 0.12;
    }

    if (exhaustDarkMaterialRef.current) {
      exhaustDarkMaterialRef.current.opacity = 0.05 + exhaustIntensity * 0.09;
      exhaustDarkMaterialRef.current.size = 0.16 + exhaustIntensity * 0.1;
    }

    const rearLeft = wheelDetection.rearWheels.left;
    const rearRight = wheelDetection.rearWheels.right;
    if (keys.s && velocityRef.current >= TIRE_MARK_MIN_SPEED) {
      right.set(forward.z, 0, -forward.x).normalize();
      rearCenter
        .copy(vehicle.position)
        .addScaledVector(forward, -carTransform.rearAxleOffset);
      rearLeftPos
        .copy(rearCenter)
        .addScaledVector(right, -carTransform.rearTrackHalf);
      rearRightPos
        .copy(rearCenter)
        .addScaledVector(right, carTransform.rearTrackHalf);

      if (rearLeft && rearRight) {
        rearLeft.getWorldPosition(rearLeftPos);
        rearRight.getWorldPosition(rearRightPos);
      }

      const wheelGap = rearLeftPos.distanceTo(rearRightPos);
      if (wheelGap < carTransform.rearTrackHalf * 1.4) {
        rearLeftPos
          .copy(rearCenter)
          .addScaledVector(right, -carTransform.rearTrackHalf);
        rearRightPos
          .copy(rearCenter)
          .addScaledVector(right, carTransform.rearTrackHalf);
      }

      if (!rearLeftLastEmitRef.current || !rearRightLastEmitRef.current) {
        rearLeftLastEmitRef.current = rearLeftPos.clone();
        rearRightLastEmitRef.current = rearRightPos.clone();
      }

      const distanceSinceEmit = Math.min(
        rearLeftPos.distanceTo(rearLeftLastEmitRef.current!),
        rearRightPos.distanceTo(rearRightLastEmitRef.current!)
      );

      if (distanceSinceEmit >= TIRE_MARK_SPAWN_DISTANCE) {
        const now = performance.now() / 1000;
        const markRotationY = Math.atan2(forward.x, forward.z);
        const newMarks: TireMark[] = [
          {
            id: tireMarkIdRef.current++,
            bornAt: now,
            position: [rearLeftPos.x, 0.012, rearLeftPos.z],
            rotationY: markRotationY,
          },
          {
            id: tireMarkIdRef.current++,
            bornAt: now,
            position: [rearRightPos.x, 0.012, rearRightPos.z],
            rotationY: markRotationY,
          },
        ];

        setTireMarks((prev) => [...prev, ...newMarks].slice(-MAX_TIRE_MARKS));
        rearLeftLastEmitRef.current.copy(rearLeftPos);
        rearRightLastEmitRef.current.copy(rearRightPos);
      }
    }

    const now = performance.now() / 1000;
    if (now - lastTireCleanupRef.current > 0.2) {
      lastTireCleanupRef.current = now;
      setTireMarks((prev) =>
        prev.filter((mark) => now - mark.bornAt < TIRE_MARK_LIFETIME)
      );
    }

    desiredCamera.set(
      vehicle.position.x + RTS_CAMERA_OFFSET.x,
      RTS_CAMERA_OFFSET.y,
      vehicle.position.z + RTS_CAMERA_OFFSET.z
    );
    camera.position.lerp(desiredCamera, 0.12);
    camera.lookAt(vehicle.position.x, 0, vehicle.position.z);

    vehiclePosition.copy(vehicle.position);

    let nextNearbyId: string | null = null;
    let nearestDistance = Number.MAX_SAFE_INTEGER;

    for (const item of interactables) {
      const itemDistance = vehiclePosition.distanceTo(
        new THREE.Vector3(item.position[0], 0, item.position[2])
      );

      if (itemDistance < nearestDistance) {
        nearestDistance = itemDistance;
        nextNearbyId = item.id;
      }
    }

    if (nearestDistance > INTERACT_RANGE) {
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

  const stopPointer = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
  };

  return (
    <>
      <SceneEnvironment onGroundPointerDown={stopPointer} />
      <InteractableObjects interactables={interactables} activeSet={activeSet} />
      <VehicleModel
        vehicleRef={vehicleRef}
        carModel={carModel}
        scale={carTransform.scale}
        yOffset={carTransform.yOffset}
        yRotation={CAR_MODEL_Y_ROT_OFFSET}
      />
      <ExhaustEffect
        exhaustParticles={exhaustParticles}
        lightPointsRef={exhaustLightPointsRef}
        darkPointsRef={exhaustDarkPointsRef}
        lightMaterialRef={exhaustLightMaterialRef}
        darkMaterialRef={exhaustDarkMaterialRef}
      />
      <TireMarks marks={tireMarks} lifetime={TIRE_MARK_LIFETIME} />
    </>
  );
}

useGLTF.preload(carModelUrl);
