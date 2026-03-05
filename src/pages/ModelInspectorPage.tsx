import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { SiteNav } from "../components/layout/SiteNav";

type ModelNodeStat = {
  id: string;
  uuid: string;
  name: string;
  type: string;
  depth: number;
  ownTriangles: number;
  subtreeTriangles: number;
  childCount: number;
};

type ModelSummary = {
  sourceLabel: string;
  totalNodes: number;
  meshNodes: number;
  totalTriangles: number;
  rows: ModelNodeStat[];
};

const builtInModels = [
  {
    label: "Soviet Car (Vaz-2103)",
    url: new URL("../3DModel/soviet_car._vaz-2103_zhiguli/scene.gltf", import.meta.url).href,
  },
  {
    label: "Low Poly Car",
    url: new URL("../3DModel/low_poly_car/scene.gltf", import.meta.url).href,
  },
  {
    label: "Mazda RX-7 Stylised",
    url: new URL("../3DModel/mazda_rx7_stylised/scene.gltf", import.meta.url).href,
  },
] as const;

function trianglesForObject(object: THREE.Object3D) {
  const mesh = object as THREE.Mesh;
  if (!mesh.isMesh || !mesh.geometry) {
    return 0;
  }

  const geometry = mesh.geometry;
  if (geometry.index) {
    return Math.floor(geometry.index.count / 3);
  }

  const position = geometry.getAttribute("position");
  return position ? Math.floor(position.count / 3) : 0;
}

function inspectModel(scene: THREE.Object3D, sourceLabel: string): ModelSummary {
  const rows: ModelNodeStat[] = [];

  const walk = (node: THREE.Object3D, depth: number, pathPrefix: string): number => {
    const nodeName = node.name || "(unnamed)";
    const nodePath = pathPrefix ? `${pathPrefix}/${nodeName}` : nodeName;
    const ownTriangles = trianglesForObject(node);
    let subtreeTriangles = ownTriangles;

    for (const child of node.children) {
      subtreeTriangles += walk(child, depth + 1, nodePath);
    }

    rows.push({
      id: `${node.uuid}:${nodePath}`,
      uuid: node.uuid,
      name: nodeName,
      type: node.type,
      depth,
      ownTriangles,
      subtreeTriangles,
      childCount: node.children.length,
    });

    return subtreeTriangles;
  };

  const totalTriangles = walk(scene, 0, "");
  rows.sort((a, b) => a.depth - b.depth || b.subtreeTriangles - a.subtreeTriangles);

  return {
    sourceLabel,
    totalNodes: rows.length,
    meshNodes: rows.filter((row) => row.ownTriangles > 0).length,
    totalTriangles,
    rows,
  };
}

function formatCount(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

type MaterialSnapshot = {
  material: THREE.Material;
  emissive?: THREE.Color;
  emissiveIntensity?: number;
  color?: THREE.Color;
};

function ModelPreview({
  scene,
  highlightedNodeUuid,
}: {
  scene: THREE.Object3D;
  highlightedNodeUuid: string | null;
}) {
  const controlsRef = useRef<any>(null);
  const fittedSceneUuidRef = useRef<string | null>(null);
  const highlightedMaterialsRef = useRef<MaterialSnapshot[]>([]);
  const highlightedObjectRef = useRef<THREE.Object3D | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    for (const snapshot of highlightedMaterialsRef.current) {
      const material = snapshot.material as THREE.MeshStandardMaterial;
      if (snapshot.emissive && "emissive" in material) {
        material.emissive.copy(snapshot.emissive);
      }
      if (typeof snapshot.emissiveIntensity === "number" && "emissiveIntensity" in material) {
        material.emissiveIntensity = snapshot.emissiveIntensity;
      }
      if (snapshot.color && "color" in material) {
        material.color.copy(snapshot.color);
      }
      material.needsUpdate = true;
    }
    highlightedMaterialsRef.current = [];
    highlightedObjectRef.current = null;

    if (!highlightedNodeUuid) {
      return;
    }

    const target = scene.getObjectByProperty("uuid", highlightedNodeUuid);
    if (!target) {
      return;
    }

    highlightedObjectRef.current = target;
    const tracked = new Set<string>();

    target.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) {
        return;
      }

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        if (tracked.has(mat.uuid)) {
          continue;
        }
        tracked.add(mat.uuid);

        const material = mat as THREE.MeshStandardMaterial;
        const snapshot: MaterialSnapshot = { material: mat };
        if ("emissive" in material && material.emissive instanceof THREE.Color) {
          snapshot.emissive = material.emissive.clone();
          snapshot.emissiveIntensity = material.emissiveIntensity;
          material.emissive.set("#f59e0b");
          material.emissiveIntensity = 0.85;
        } else if ("color" in material && material.color instanceof THREE.Color) {
          snapshot.color = material.color.clone();
          material.color.lerp(new THREE.Color("#f59e0b"), 0.4);
        }
        material.needsUpdate = true;
        highlightedMaterialsRef.current.push(snapshot);
      }
    });

    return () => {
      for (const snapshot of highlightedMaterialsRef.current) {
        const material = snapshot.material as THREE.MeshStandardMaterial;
        if (snapshot.emissive && "emissive" in material) {
          material.emissive.copy(snapshot.emissive);
        }
        if (typeof snapshot.emissiveIntensity === "number" && "emissiveIntensity" in material) {
          material.emissiveIntensity = snapshot.emissiveIntensity;
        }
        if (snapshot.color && "color" in material) {
          material.color.copy(snapshot.color);
        }
        material.needsUpdate = true;
      }
      highlightedMaterialsRef.current = [];
      highlightedObjectRef.current = null;
    };
  }, [scene, highlightedNodeUuid]);

  useEffect(() => {
    if (fittedSceneUuidRef.current === scene.uuid) {
      return;
    }

    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.1);
    const distance = maxDim * 2.1;

    camera.position.set(center.x + distance, center.y + distance * 0.7, center.z + distance);
    camera.near = Math.max(maxDim / 500, 0.01);
    camera.far = Math.max(maxDim * 30, 200);
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }

    fittedSceneUuidRef.current = scene.uuid;
  }, [camera, scene]);

  return (
    <>
      <color attach="background" args={["#0f1520"]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[6, 9, 4]} intensity={1.15} />
      <directionalLight position={[-5, 6, -6]} intensity={0.45} />
      <primitive object={scene} />
      <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.08} />
      <gridHelper args={[20, 20, "#334155", "#1f2937"]} position={[0, -0.001, 0]} />
    </>
  );
}

export function ModelInspectorPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ModelSummary | null>(null);
  const [previewScene, setPreviewScene] = useState<THREE.Group | null>(null);
  const [hoveredNodeUuid, setHoveredNodeUuid] = useState<string | null>(null);
  const [nodeFilter, setNodeFilter] = useState("");

  const filteredRows = useMemo(() => {
    if (!summary) {
      return [];
    }

    const keyword = nodeFilter.trim().toLowerCase();
    if (!keyword) {
      return summary.rows;
    }

    return summary.rows.filter((row) => {
      return row.name.toLowerCase().includes(keyword) || row.type.toLowerCase().includes(keyword);
    });
  }, [summary, nodeFilter]);

  const loadFromUrl = async (url: string, label: string) => {
    setLoading(true);
    setError(null);
    setHoveredNodeUuid(null);

    try {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(url);
      setPreviewScene(gltf.scene);
      setSummary(inspectModel(gltf.scene, label));
    } catch (err) {
      setError(err instanceof Error ? err.message : "模型解析失败");
      setSummary(null);
      setPreviewScene(null);
    } finally {
      setLoading(false);
    }
  };

  const loadFromFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setHoveredNodeUuid(null);

    try {
      const loader = new GLTFLoader();
      const data = await file.arrayBuffer();
      const gltf = await new Promise<THREE.Group>((resolve, reject) => {
        loader.parse(
          data,
          "",
          (result) => resolve(result.scene),
          (parseError) => reject(parseError)
        );
      });

      setPreviewScene(gltf);
      setSummary(inspectModel(gltf, file.name));
    } catch (err) {
      setError(err instanceof Error ? err.message : "模型解析失败");
      setSummary(null);
      setPreviewScene(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0f14] px-4 py-6 text-[#f4f4f5] sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <SiteNav
          className="bg-[#121922]/85"
          rightSlot={
            <Link
              to="/three-d"
              className="rounded-full border border-[#3f3f46] px-4 py-2 text-sm text-[#d4d4d8] transition hover:border-[#f59e0b] hover:text-[#f4f4f5]"
            >
              3D 场景
            </Link>
          }
        />

        <section className="rounded-2xl border border-[#2b3747] bg-[#131b25]/90 p-5">
          <h1 className="text-2xl font-semibold">模型节点分析工具</h1>
          <p className="mt-2 text-sm text-[#9ca3af]">
            分析 glTF / GLB 模型的节点结构，并统计节点对应三角面数量。
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {builtInModels.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={loading}
                onClick={() => void loadFromUrl(item.url, item.label)}
                className="rounded-lg border border-[#3a4a61] bg-[#1b2633] px-4 py-2 text-sm transition hover:border-[#f59e0b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                加载 {item.label}
              </button>
            ))}

            <label className="cursor-pointer rounded-lg border border-[#3a4a61] bg-[#1b2633] px-4 py-2 text-sm transition hover:border-[#f59e0b]">
              上传模型
              <input
                type="file"
                className="hidden"
                accept=".gltf,.glb,model/gltf+json,model/gltf-binary"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void loadFromFile(file);
                  }
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>

          {loading && <p className="mt-4 text-sm text-[#93c5fd]">正在解析模型...</p>}
          {error && <p className="mt-4 text-sm text-[#fca5a5]">解析失败：{error}</p>}
        </section>

        {summary && (
          <section className="rounded-2xl border border-[#2b3747] bg-[#131b25]/90 p-5">
            {previewScene && (
              <div className="mb-4 overflow-hidden rounded-xl border border-[#273345]">
                <div className="h-[360px]">
                  <Canvas camera={{ position: [5, 4, 6], fov: 45 }}>
                    <ModelPreview scene={previewScene} highlightedNodeUuid={hoveredNodeUuid} />
                  </Canvas>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">分析结果：{summary.sourceLabel}</h2>
                <p className="mt-1 text-sm text-[#9ca3af]">
                  节点 {formatCount(summary.totalNodes)} · 网格节点 {formatCount(summary.meshNodes)} · 总三角面{" "}
                  {formatCount(summary.totalTriangles)}
                </p>
              </div>
              <input
                value={nodeFilter}
                onChange={(event) => setNodeFilter(event.target.value)}
                placeholder="筛选节点名称或类型"
                className="w-full rounded-lg border border-[#3a4a61] bg-[#0f1520] px-3 py-2 text-sm outline-none transition focus:border-[#f59e0b] sm:w-64"
              />
            </div>

            <div className="mt-4 max-h-[60vh] overflow-auto rounded-lg border border-[#273345]">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-[#0f1520]">
                  <tr className="border-b border-[#273345] text-[#cbd5e1]">
                    <th className="px-3 py-2 font-medium">节点</th>
                    <th className="px-3 py-2 font-medium">类型</th>
                    <th className="px-3 py-2 font-medium">自身三角面</th>
                    <th className="px-3 py-2 font-medium">子树总三角面</th>
                    <th className="px-3 py-2 font-medium">子节点数</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b border-[#1d2837] last:border-b-0 ${
                        hoveredNodeUuid === row.uuid ? "bg-[#1e293b]/60" : "hover:bg-[#111827]/55"
                      }`}
                      onMouseEnter={() => setHoveredNodeUuid(row.uuid)}
                      onMouseLeave={() => setHoveredNodeUuid(null)}
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-[#e5e7eb]">
                        <span style={{ paddingLeft: `${row.depth * 16}px` }}>
                          {row.depth > 0 ? "└ " : ""}
                          {row.name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[#9ca3af]">{row.type}</td>
                      <td className="px-3 py-2 text-[#fcd34d]">{formatCount(row.ownTriangles)}</td>
                      <td className="px-3 py-2 text-[#93c5fd]">{formatCount(row.subtreeTriangles)}</td>
                      <td className="px-3 py-2 text-[#9ca3af]">{formatCount(row.childCount)}</td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-[#9ca3af]">
                        没有匹配的节点
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
