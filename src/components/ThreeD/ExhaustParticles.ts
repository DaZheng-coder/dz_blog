import * as THREE from "three";

export class ExhaustParticles {
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

  private spawnAt(index: number, origin: THREE.Vector3, forward: THREE.Vector3) {
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
