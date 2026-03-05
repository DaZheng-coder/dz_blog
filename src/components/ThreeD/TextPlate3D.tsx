import { Center, Text3D } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

type TextPlate3DProps = {
  text: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  plateSize?: [number, number];
  plateThickness?: number;
  plateColor?: string;
  textColor?: string;
  textDepth?: number;
  textSize?: number;
  textMargin?: number;
  textRotation?: [number, number, number];
  fontUrl?: string;
};

function createRoundedRectShape(length: number, width: number, radius: number) {
  const halfL = length / 2;
  const halfW = width / 2;
  const r = Math.min(radius, halfL, halfW);
  const shape = new THREE.Shape();

  shape.moveTo(-halfL + r, -halfW);
  shape.lineTo(halfL - r, -halfW);
  shape.quadraticCurveTo(halfL, -halfW, halfL, -halfW + r);
  shape.lineTo(halfL, halfW - r);
  shape.quadraticCurveTo(halfL, halfW, halfL - r, halfW);
  shape.lineTo(-halfL + r, halfW);
  shape.quadraticCurveTo(-halfL, halfW, -halfL, halfW - r);
  shape.lineTo(-halfL, -halfW + r);
  shape.quadraticCurveTo(-halfL, -halfW, -halfL + r, -halfW);

  return shape;
}

export function TextPlate3D({
  text,
  position = [0, 0.001, 0],
  rotation = [0, 0, 0],
  plateSize = [12, 3],
  plateThickness = 0.12,
  plateColor = "white",
  textColor = "#ff9800",
  textDepth = 0.5,
  textSize = 3,
  textMargin = 1,
  textRotation = [-Math.PI / 2, 0, 45],
  fontUrl = "/fonts/helvetiker_regular.typeface.json",
}: TextPlate3DProps) {
  const [plateLength, plateWidth] = plateSize;
  const safeText = text.trim() || "TEXT";

  const plateGeometry = useMemo(() => {
    const shape = createRoundedRectShape(plateLength, plateWidth, 0.28);
    return new THREE.ExtrudeGeometry(shape, {
      depth: plateThickness,
      bevelEnabled: false,
      curveSegments: 18,
    });
  }, [plateLength, plateWidth, plateThickness]);

  const fittedTextSize = useMemo(() => {
    const estimatedCharWidth = 0.62;
    const availableLength = Math.max(plateLength - textMargin * 2, 1);
    const maxByLength =
      availableLength / Math.max(safeText.length * estimatedCharWidth, 1);
    return Math.min(textSize, maxByLength);
  }, [plateLength, safeText, textMargin, textSize]);

  return (
    <group position={position} rotation={rotation}>
      {/* <mesh
        geometry={plateGeometry}
        rotation={textRotation}
        receiveShadow
        castShadow
      ></mesh> */}

      <group position={[0, plateThickness + 0.004, 0]} rotation={textRotation}>
        <Center disableZ>
          <Text3D
            font={fontUrl}
            size={fittedTextSize}
            height={textDepth}
            curveSegments={8}
            bevelEnabled
            bevelThickness={0.02}
            bevelSize={0.01}
            bevelSegments={4}
          >
            {safeText}
            <meshStandardMaterial
              color={textColor}
              metalness={0.06}
              roughness={0.42}
            />
          </Text3D>
        </Center>
      </group>
    </group>
  );
}
