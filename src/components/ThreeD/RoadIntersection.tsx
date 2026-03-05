import { useMemo } from "react";

const ROAD_LENGTH = 120;
const ROAD_HALF_WIDTH = 12;
const ROAD_MARKING_Y = 0.028;
const CROSSWALK_STRIPES = 12;
const CROSSWALK_STRIPE_WIDTH = 1.1;
const CROSSWALK_STRIPE_LENGTH = 5;
const CROSSWALK_STRIPE_GAP = 0.85;
const CROSSWALK_CENTER_OFFSET = 14;

type RoadIntersectionProps = {
  scale?: number;
};

export function RoadIntersection({ scale = 0.25 }: RoadIntersectionProps) {
  const crosswalkStripeOffsets = useMemo(
    () =>
      Array.from(
        { length: CROSSWALK_STRIPES },
        (_, index) =>
          (index - (CROSSWALK_STRIPES - 1) / 2) *
          (CROSSWALK_STRIPE_WIDTH + CROSSWALK_STRIPE_GAP)
      ),
    []
  );

  return (
    <group scale={scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <planeGeometry args={[ROAD_LENGTH, ROAD_HALF_WIDTH * 2]} />
        <meshStandardMaterial color="#3b3f49" roughness={0.92} metalness={0.04} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, 0]} receiveShadow>
        <planeGeometry args={[ROAD_HALF_WIDTH * 2, ROAD_LENGTH]} />
        <meshStandardMaterial color="#3b3f49" roughness={0.92} metalness={0.04} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <planeGeometry args={[ROAD_HALF_WIDTH * 2, ROAD_HALF_WIDTH * 2]} />
        <meshStandardMaterial color="#3e424c" roughness={0.95} metalness={0.03} />
      </mesh>

      {[
        { pos: [0, ROAD_MARKING_Y, ROAD_HALF_WIDTH - 0.65] as [number, number, number], size: [ROAD_LENGTH, 0.35] as [number, number] },
        { pos: [0, ROAD_MARKING_Y, -ROAD_HALF_WIDTH + 0.65] as [number, number, number], size: [ROAD_LENGTH, 0.35] as [number, number] },
        { pos: [ROAD_HALF_WIDTH - 0.65, ROAD_MARKING_Y, 0] as [number, number, number], size: [ROAD_LENGTH, 0.35] as [number, number], rot: Math.PI / 2 },
        { pos: [-ROAD_HALF_WIDTH + 0.65, ROAD_MARKING_Y, 0] as [number, number, number], size: [ROAD_LENGTH, 0.35] as [number, number], rot: Math.PI / 2 },
      ].map((line, index) => (
        <mesh
          key={`edge-line-${index}`}
          position={line.pos}
          rotation={[-Math.PI / 2, 0, line.rot ?? 0]}
        >
          <planeGeometry args={line.size} />
          <meshBasicMaterial color="#f3f4f6" />
        </mesh>
      ))}

      {[
        { pos: [0, ROAD_MARKING_Y, ROAD_HALF_WIDTH - 1.8] as [number, number, number], size: [ROAD_LENGTH, 0.45] as [number, number] },
        { pos: [0, ROAD_MARKING_Y, -ROAD_HALF_WIDTH + 1.8] as [number, number, number], size: [ROAD_LENGTH, 0.45] as [number, number] },
        { pos: [ROAD_HALF_WIDTH - 1.8, ROAD_MARKING_Y, 0] as [number, number, number], size: [ROAD_LENGTH, 0.45] as [number, number], rot: Math.PI / 2 },
        { pos: [-ROAD_HALF_WIDTH + 1.8, ROAD_MARKING_Y, 0] as [number, number, number], size: [ROAD_LENGTH, 0.45] as [number, number], rot: Math.PI / 2 },
      ].map((line, index) => (
        <mesh
          key={`yellow-line-${index}`}
          position={line.pos}
          rotation={[-Math.PI / 2, 0, line.rot ?? 0]}
        >
          <planeGeometry args={line.size} />
          <meshBasicMaterial color="#f4b522" />
        </mesh>
      ))}

      {crosswalkStripeOffsets.map((offset, index) => (
        <group key={`crosswalk-stripe-${index}`}>
          <mesh position={[offset, ROAD_MARKING_Y, CROSSWALK_CENTER_OFFSET]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[CROSSWALK_STRIPE_WIDTH, CROSSWALK_STRIPE_LENGTH]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[offset, ROAD_MARKING_Y, -CROSSWALK_CENTER_OFFSET]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[CROSSWALK_STRIPE_WIDTH, CROSSWALK_STRIPE_LENGTH]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[CROSSWALK_CENTER_OFFSET, ROAD_MARKING_Y, offset]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[CROSSWALK_STRIPE_WIDTH, CROSSWALK_STRIPE_LENGTH]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[-CROSSWALK_CENTER_OFFSET, ROAD_MARKING_Y, offset]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[CROSSWALK_STRIPE_WIDTH, CROSSWALK_STRIPE_LENGTH]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
