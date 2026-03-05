import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Grid, Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";

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

class ExhaustParticles {
  positions: Float32Array;
  velocities: Float32Array;
  life: Float32Array;
  cursor = 0;
  emitCarry = 0;
  hasLiveParticle = false;
  private tmpRight = new THREE.Vector3();
  private tmpSpawn = new THREE.Vector3();

  constructor(count: number) {
    this.positions = new Float32Array(count * 3).fill(-999);
    this.velocities = new Float32Array(count * 3);
    this.life = new Float32Array(count);
  }

  private spawnAt(
    index: number,
    origin: THREE.Vector3,
    forward: THREE.Vector3
  ) {
    const i3 = index * 3;
    const side = index % 2 === 0 ? -1 : 1;

    this.tmpRight.set(forward.z, 0, -forward.x).normalize();
    this.tmpSpawn
      .copy(origin)
      .addScaledVector(forward, -1.2)
      .addScaledVector(this.tmpRight, 0.34 * side);

    this.positions[i3] = this.tmpSpawn.x + (Math.random() - 0.5) * 0.08;
    this.positions[i3 + 1] = 0.36 + Math.random() * 0.08;
    this.positions[i3 + 2] = this.tmpSpawn.z + (Math.random() - 0.5) * 0.08;

    const baseBackSpeed = 0.85 + Math.random() * 0.55;
    this.velocities[i3] =
      -forward.x * baseBackSpeed + (Math.random() - 0.5) * 0.35;
    this.velocities[i3 + 1] = 0.18 + Math.random() * 0.2;
    this.velocities[i3 + 2] =
      -forward.z * baseBackSpeed + (Math.random() - 0.5) * 0.35;
    this.life[index] = 0.38 + Math.random() * 0.28;
  }

  step(
    delta: number,
    origin: THREE.Vector3,
    forward: THREE.Vector3,
    intensity: number
  ) {
    const emitPerSecond = intensity * 30;
    this.emitCarry += emitPerSecond * delta;

    while (this.emitCarry >= 1) {
      this.emitCarry -= 1;
      const index = this.cursor % this.life.length;
      this.cursor += 1;
      this.spawnAt(index, origin, forward);
    }

    this.hasLiveParticle = false;
    for (let i = 0; i < this.life.length; i += 1) {
      const i3 = i * 3;
      const currentLife = this.life[i];
      if (currentLife <= 0) {
        continue;
      }

      this.hasLiveParticle = true;
      const nextLife = currentLife - delta;
      this.life[i] = nextLife;

      if (nextLife <= 0) {
        this.positions[i3] = -999;
        this.positions[i3 + 1] = -999;
        this.positions[i3 + 2] = -999;
        continue;
      }

      this.positions[i3] += this.velocities[i3] * delta;
      this.positions[i3 + 1] += this.velocities[i3 + 1] * delta;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * delta;

      this.velocities[i3] *= 0.975;
      this.velocities[i3 + 1] += 0.2 * delta;
      this.velocities[i3 + 1] *= 0.985;
      this.velocities[i3 + 2] *= 0.975;
    }
  }
}

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

  const forward = useMemo(() => new THREE.Vector3(), []);
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
  const steeringWheels = useMemo<SteeringWheel[]>(() => {
    const vehicleBox = new THREE.Box3().setFromObject(carModel);
    const vehicleSize = vehicleBox.getSize(new THREE.Vector3());
    const candidates: Array<{ node: THREE.Object3D; center: THREE.Vector3 }> = [];

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

    const selected =
      frontCandidates.length >= 2
        ? frontCandidates
        : candidates.sort((a, b) => Math.abs(b.center.x) - Math.abs(a.center.x)).slice(0, 2);

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
        steerSign: side === "left" ? LEFT_FRONT_STEER_SIGN : RIGHT_FRONT_STEER_SIGN,
      });
    }

    return steering;
  }, [carModel]);
  const carTransform = useMemo(() => {
    const bbox = new THREE.Box3().setFromObject(carModel);
    const size = bbox.getSize(new THREE.Vector3());
    const horizontalSize = Math.max(size.x, size.z) || 1;
    const scale =
      (TARGET_CAR_FOOTPRINT / horizontalSize) * CAR_SCALE_MULTIPLIER;
    const yOffset = -bbox.min.y * scale;

    return { scale, yOffset };
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

    for (const wheel of steeringWheels) {
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
      <ambientLight intensity={0.55} />
      <directionalLight position={[10, 14, 7]} intensity={1.2} />
      <color attach="background" args={["#0b0f14"]} />
      <fog attach="fog" args={["#0b0f14", 35, 90]} />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerDown={stopPointer}
      >
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="white" />
      </mesh>

      <Grid
        args={[120, 120]}
        position={[0, 0.03, 0]}
        cellSize={2}
        cellThickness={0.5}
        sectionSize={8}
        sectionThickness={1.1}
        cellColor="#223246"
        sectionColor="#38506a"
        fadeDistance={95}
        renderOrder={10}
      />

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

      <group ref={vehicleRef} position={[0, 0.01, 0]}>
        <primitive
          object={carModel}
          scale={carTransform.scale}
          position-y={carTransform.yOffset}
          rotation-y={CAR_MODEL_Y_ROT_OFFSET}
        />
      </group>

      <points ref={exhaustLightPointsRef} frustumCulled={false} visible={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[exhaustParticles.positions, 3]}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={exhaustLightMaterialRef}
          color="#3a3f46"
          size={0.2}
          sizeAttenuation
          transparent
          opacity={0.12}
          depthWrite={false}
          depthTest={false}
        />
      </points>

      <points ref={exhaustDarkPointsRef} frustumCulled={false} visible={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[exhaustParticles.positions, 3]}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={exhaustDarkMaterialRef}
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

useGLTF.preload(carModelUrl);
