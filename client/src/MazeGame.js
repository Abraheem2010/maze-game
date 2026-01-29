import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const MODEL_URL = "https://threejs.org/examples/models/gltf/Soldier.glb";
const USER_FACE_URL = "/face.png";

const WALL_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/brick_diffuse.jpg";
const WALL_BUMP_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/brick_bump.jpg";
const WALL_ROUGH_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/brick_roughness.jpg";
const FLOOR_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/hardwood2_diffuse.jpg";
const FLOOR_BUMP_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/hardwood2_bump.jpg";

const LEVEL_THEMES = [
  {
    scene: {
      sky: "#e7c59a",
      fog: "#e7c59a",
      ambient: "#2b3345",
      hemiSky: "#ffd5a6",
      hemiGround: "#283246",
      sun: "#ffb36a",
      goal: "#22c55e",
    },
    ui: {
      hud: "#9fffe0",
      accent: "#78ffd3",
      text: "#e6fbff",
      panelBg: "rgba(8, 20, 30, 0.75)",
      panelBorder: "rgba(120, 255, 220, 0.35)",
      panelGlow: "rgba(0, 200, 255, 0.15)",
      overlayTop: "rgba(8, 12, 24, 0.65)",
      overlayBottom: "rgba(0, 0, 0, 0.78)",
      lockBg: "rgba(0, 0, 0, 0.35)",
      cardBg: "rgba(12, 26, 38, 0.9)",
      cardBorder: "rgba(120, 255, 220, 0.5)",
    },
    texture: { wallRepeat: { x: 4, y: 1 }, floorScale: 1 },
  },
  {
    scene: {
      sky: "#a9bdd3",
      fog: "#a9bdd3",
      ambient: "#1f2a3b",
      hemiSky: "#d8e4ff",
      hemiGround: "#2a2f3f",
      sun: "#ffc58a",
      goal: "#38bdf8",
    },
    ui: {
      hud: "#b8d7ff",
      accent: "#7aa7ff",
      text: "#eef4ff",
      panelBg: "rgba(10, 18, 36, 0.78)",
      panelBorder: "rgba(122, 167, 255, 0.5)",
      panelGlow: "rgba(80, 140, 255, 0.18)",
      overlayTop: "rgba(10, 14, 30, 0.65)",
      overlayBottom: "rgba(0, 0, 0, 0.82)",
      lockBg: "rgba(0, 0, 0, 0.38)",
      cardBg: "rgba(12, 22, 40, 0.92)",
      cardBorder: "rgba(122, 167, 255, 0.55)",
    },
    texture: { wallRepeat: { x: 5, y: 1 }, floorScale: 1.1 },
  },
  {
    scene: {
      sky: "#d3b29b",
      fog: "#d3b29b",
      ambient: "#2b2128",
      hemiSky: "#ffd7b3",
      hemiGround: "#2c2430",
      sun: "#ff9b54",
      goal: "#f97316",
    },
    ui: {
      hud: "#ffd1a8",
      accent: "#ffb36a",
      text: "#fff1e6",
      panelBg: "rgba(24, 14, 12, 0.78)",
      panelBorder: "rgba(255, 179, 106, 0.45)",
      panelGlow: "rgba(255, 160, 90, 0.18)",
      overlayTop: "rgba(26, 12, 10, 0.65)",
      overlayBottom: "rgba(0, 0, 0, 0.82)",
      lockBg: "rgba(0, 0, 0, 0.4)",
      cardBg: "rgba(28, 16, 12, 0.9)",
      cardBorder: "rgba(255, 179, 106, 0.55)",
    },
    texture: { wallRepeat: { x: 6, y: 1 }, floorScale: 1.15 },
  },
];

const LEVELS = [
  {
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1,0,0,0,0,1],
      [1,0,1,1,1,0,1,0,1,1,0,1],
      [1,0,0,0,1,0,0,0,1,0,0,1],
      [1,1,1,0,1,1,1,0,1,0,1,1],
      [1,0,0,0,0,0,1,0,0,0,0,1],
      [1,0,1,1,1,0,1,1,1,1,0,1],
      [1,0,0,0,1,0,0,0,0,1,0,1],
      [1,1,1,0,1,1,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,1,1,1,1,1,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    start: { x: 1, y: 1 },
    goal: { x: 10, y: 9 },
  },
  {
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
      [1,0,1,0,0,0,1,0,0,0,0,0,0,1,0,1],
      [1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,1],
      [1,0,1,1,1,1,1,1,1,1,0,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
      [1,1,1,1,1,1,1,1,0,1,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,1,0,0,0,1,0,1,0,1],
      [1,0,1,1,1,1,0,1,1,1,0,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,1,0,1,0,0,0,1],
      [1,1,1,1,1,1,1,1,0,1,0,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
      [1,0,1,1,1,1,1,1,0,1,1,1,0,1,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    start: { x: 1, y: 1 },
    goal: { x: 14, y: 13 },
  },
  {
    grid: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,0,1,0,1,1,0,1,0,1,1,1,1,1,0,1],
      [1,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,1,0,1],
      [1,0,1,0,1,1,1,1,1,1,0,1,1,1,1,1,0,1,0,1],
      [1,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0,1],
      [1,0,1,1,1,1,1,1,0,1,1,1,1,1,0,1,0,1,0,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0,1,0,1],
      [1,1,1,1,1,1,0,1,1,1,1,1,0,1,0,1,0,1,0,1],
      [1,0,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0,1,0,1],
      [1,0,1,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1,0,1],
      [1,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0,1],
      [1,0,1,0,1,1,1,1,0,1,1,1,1,1,0,1,0,1,0,1],
      [1,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1],
      [1,1,1,0,1,0,1,1,1,1,1,1,0,1,1,1,0,1,0,1],
      [1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,0,1],
      [1,0,1,1,1,0,1,0,1,1,0,1,1,1,0,1,1,1,0,1],
      [1,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,0,1],
      [1,0,1,0,1,1,1,1,1,1,1,1,0,1,1,1,0,1,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    start: { x: 1, y: 1 },
    goal: { x: 18, y: 18 },
  },
];

const formatTime = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return `${value.toFixed(2)}s`;
};

export default function MazeGame() {
  const containerRef = useRef(null);
  const rafRef = useRef(0);
  const controlsRef = useRef(null);
  const gameStateRef = useRef("MENU");

  const [gameState, setGameState] = useState("MENU");
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [bestTimes, setBestTimes] = useState({ 1: null, 2: null, 3: null });
  const [unlocked, setUnlocked] = useState([true, false, false]);
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);

  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);

  const levelData = useMemo(() => LEVELS[selectedLevel - 1], [selectedLevel]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await fetch("/api/scores");
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data.scores) return;
        setBestTimes((prev) => ({
          ...prev,
          1: typeof data.scores[1] === "number" ? data.scores[1] : prev[1],
          2: typeof data.scores[2] === "number" ? data.scores[2] : prev[2],
          3: typeof data.scores[3] === "number" ? data.scores[3] : prev[3],
        }));
        setUnlocked((prev) => {
          const next = [...prev];
          if (typeof data.scores[1] === "number") next[1] = true;
          if (typeof data.scores[2] === "number") next[2] = true;
          return next;
        });
      } catch {
        // ignore
      }
    };
    fetchScores();
    const interval = setInterval(fetchScores, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (gameState === "PLAYING") {
      startTimeRef.current = performance.now();
      elapsedRef.current = 0;
      setElapsed(0);
    }
  }, [gameState, selectedLevel]);

  useEffect(() => {
    const root = document.getElementById("root");
    const html = document.documentElement;
    const body = document.body;

    const prevRoot = root
      ? {
          width: root.style.width,
          height: root.style.height,
          display: root.style.display,
        }
      : null;
    const prevHtml = html
      ? {
          width: html.style.width,
          height: html.style.height,
          margin: html.style.margin,
          display: html.style.display,
          overflow: html.style.overflow,
        }
      : null;
    const prevBody = body
      ? {
          margin: body.style.margin,
          display: body.style.display,
          alignItems: body.style.alignItems,
          justifyContent: body.style.justifyContent,
          overflow: body.style.overflow,
        }
      : null;

    if (root) {
      root.style.width = "100vw";
      root.style.height = "100vh";
      root.style.display = "block";
    }
    if (html) {
      html.style.width = "100%";
      html.style.height = "100%";
      html.style.margin = "0";
      html.style.display = "block";
      html.style.overflow = "hidden";
    }
    if (body) {
      body.style.margin = "0";
      body.style.display = "block";
      body.style.alignItems = "stretch";
      body.style.justifyContent = "stretch";
      body.style.overflow = "hidden";
    }

    const restoreLayout = () => {
      if (root && prevRoot) {
        root.style.width = prevRoot.width;
        root.style.height = prevRoot.height;
        root.style.display = prevRoot.display;
      }
      if (html && prevHtml) {
        html.style.width = prevHtml.width;
        html.style.height = prevHtml.height;
        html.style.margin = prevHtml.margin;
        html.style.display = prevHtml.display;
        html.style.overflow = prevHtml.overflow;
      }
      if (body && prevBody) {
        body.style.margin = prevBody.margin;
        body.style.display = prevBody.display;
        body.style.alignItems = prevBody.alignItems;
        body.style.justifyContent = prevBody.justifyContent;
        body.style.overflow = prevBody.overflow;
      }
    };

    if (!containerRef.current) return restoreLayout;

    const { grid, start, goal } = levelData;
    const theme = LEVEL_THEMES[selectedLevel - 1] || LEVEL_THEMES[0];
    const rows = grid.length;
    const cols = grid[0].length;
    const cellSize = 2;
    const wallHeight = 3;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.scene.sky);
    scene.fog = new THREE.Fog(theme.scene.fog, 12, Math.max(rows, cols) * 4);

    const camera = new THREE.PerspectiveCamera(65, 1, 0.2, 220);
    camera.rotation.order = "YXZ";

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (err) {
      setErrorMsg(`WebGL init failed: ${err.message}`);
      return restoreLayout;
    }
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.zIndex = "1";

    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = new RoomEnvironment();
    const envTex = pmrem.fromScene(environment, 0.04).texture;
    scene.environment = envTex;

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const wallTex = loader.load(WALL_URL);
    const wallBump = loader.load(WALL_BUMP_URL);
    const wallRough = loader.load(WALL_ROUGH_URL);
    const floorTex = loader.load(FLOOR_URL);
    const floorBump = loader.load(FLOOR_BUMP_URL);
    const faceTex = loader.load(USER_FACE_URL);

    wallTex.colorSpace = THREE.SRGBColorSpace;
    floorTex.colorSpace = THREE.SRGBColorSpace;
    faceTex.colorSpace = THREE.SRGBColorSpace;

    wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
    wallBump.wrapS = wallBump.wrapT = THREE.RepeatWrapping;
    wallRough.wrapS = wallRough.wrapT = THREE.RepeatWrapping;
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorBump.wrapS = floorBump.wrapT = THREE.RepeatWrapping;

    const wallRepeat = theme.texture.wallRepeat;
    wallTex.repeat.set(wallRepeat.x, wallRepeat.y);
    wallBump.repeat.set(wallRepeat.x, wallRepeat.y);
    wallRough.repeat.set(wallRepeat.x, wallRepeat.y);
    const floorRepeatX = (cols / 4) * theme.texture.floorScale;
    const floorRepeatY = (rows / 4) * theme.texture.floorScale;
    floorTex.repeat.set(floorRepeatX, floorRepeatY);
    floorBump.repeat.set(floorRepeatX, floorRepeatY);

    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      bumpMap: wallBump,
      roughnessMap: wallRough,
      bumpScale: 0.15,
      roughness: 0.9,
      metalness: 0.02,
    });
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      bumpMap: floorBump,
      bumpScale: 0.2,
      roughness: 0.95,
      metalness: 0.02,
    });

    const mazeW = cols * cellSize;
    const mazeD = rows * cellSize;
    const halfW = mazeW / 2;
    const halfD = mazeD / 2;

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(mazeW, mazeD), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallGeo = new THREE.BoxGeometry(cellSize, wallHeight, cellSize);
    const wallPositions = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (grid[y][x] === 1) {
          wallPositions.push({
            x: x * cellSize - halfW + cellSize / 2,
            z: y * cellSize - halfD + cellSize / 2,
          });
        }
      }
    }

    const wallMesh = new THREE.InstancedMesh(wallGeo, wallMat, wallPositions.length);
    const tmp = new THREE.Object3D();
    wallPositions.forEach((p, i) => {
      tmp.position.set(p.x, wallHeight / 2, p.z);
      tmp.updateMatrix();
      wallMesh.setMatrixAt(i, tmp.matrix);
    });
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    wallMesh.instanceMatrix.needsUpdate = true;
    scene.add(wallMesh);

    scene.add(new THREE.AmbientLight(theme.scene.ambient, 0.8));
    const hemi = new THREE.HemisphereLight(theme.scene.hemiSky, theme.scene.hemiGround, 0.85);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(theme.scene.sun, 1.35);
    sun.position.set(18, 14, -18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.00025;
    sun.shadow.normalBias = 0.02;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 70;
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    scene.add(sun);

    const goalPos = {
      x: goal.x * cellSize - halfW + cellSize / 2,
      z: goal.y * cellSize - halfD + cellSize / 2,
    };
    const goalMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.42, 0.5, 24),
      new THREE.MeshStandardMaterial({
        color: theme.scene.goal,
        emissive: theme.scene.goal,
        emissiveIntensity: 0.9,
        roughness: 0.4,
      })
    );
    goalMesh.position.set(goalPos.x, 0.25, goalPos.z);
    goalMesh.castShadow = true;
    scene.add(goalMesh);
    const goalLight = new THREE.PointLight("#22c55e", 1.4, 10);
    goalLight.position.set(goalPos.x, 1.6, goalPos.z);
    scene.add(goalLight);

    const player = new THREE.Object3D();
    player.position.set(
      start.x * cellSize - halfW + cellSize / 2,
      0,
      start.y * cellSize - halfD + cellSize / 2
    );
    scene.add(player);

    const cameraTargetOffset = new THREE.Vector3(0, 1.2, 0);
    const cameraOffset = new THREE.Vector3(0, 0, 4.6);
    const camDesired = new THREE.Vector3();
    const camQuat = new THREE.Quaternion();
    const yawQuat = new THREE.Quaternion();
    const baseDir = new THREE.Vector3(0, 0, 1);
    let yaw = 0;
    let pitch = 0.35;
    const minPitch = 0.05;
    const maxPitch = 1.1;
    const camLerp = 0.08;
    const camMargin = 0.4;
    const minCamDistance = 2.2;

    camera.position.copy(player.position).add(new THREE.Vector3(0, 2.5, 4.6));
    camera.lookAt(player.position.x, player.position.y + 1.2, player.position.z);

    const lockElement = renderer.domElement;
    controlsRef.current = lockElement;

    const onPointerLockChange = () => {
      const isLocked = document.pointerLockElement === lockElement;
      lockedRef.current = isLocked;
      setLocked(isLocked);
    };
    const onMouseMove = (e) => {
      if (!lockedRef.current) return;
      const lookSpeed = 0.002;
      yaw -= e.movementX * lookSpeed;
      pitch -= e.movementY * lookSpeed;
      pitch = THREE.MathUtils.clamp(pitch, minPitch, maxPitch);
    };
    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("mousemove", onMouseMove);

    const raycaster = new THREE.Raycaster();
    const camTarget = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    const inputDir = new THREE.Vector3();
    const faceDir = new THREE.Vector3();

    let robot = null;
    let mixer = null;
    let idleAction = null;
    let runAction = null;
    let activeAction = null;
    let rootBone = null;
    const rootBoneBase = new THREE.Vector3();
    const modelYawOffset = Math.PI;

    const targetQuat = new THREE.Quaternion();
    const upAxis = new THREE.Vector3(0, 1, 0);

    const fadeToAction = (next, duration = 0.2) => {
      if (!next || next === activeAction) return;
      next.reset().setEffectiveWeight(1).play();
      if (activeAction) activeAction.crossFadeTo(next, duration, true);
      activeAction = next;
    };

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      MODEL_URL,
      (gltf) => {
        robot = gltf.scene;
        robot.scale.set(1.5, 1.5, 1.5);
        robot.position.set(0, 0, 0);
        robot.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              metalness: 0.8,
              roughness: 0.4,
              skinning: !!child.isSkinnedMesh,
            });
          }
        });
        player.add(robot);
        robot.rotation.y = modelYawOffset;

        rootBone = null;
        robot.traverse((child) => {
          if (rootBone) return;
          if (child.isBone && /hips|pelvis|root/i.test(child.name)) rootBone = child;
        });
        if (rootBone) rootBoneBase.copy(rootBone.position);

        const faceMat = new THREE.MeshStandardMaterial({
          map: faceTex,
          transparent: true,
          side: THREE.DoubleSide,
          roughness: 0.9,
          metalness: 0.0,
        });
        const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), faceMat);
        faceMesh.renderOrder = 2;

        let headBone = null;
        robot.traverse((child) => {
          if (headBone) return;
          if (child.isBone && /head/i.test(child.name)) headBone = child;
        });
        if (!headBone) {
          robot.traverse((child) => {
            if (!child.isSkinnedMesh || !child.skeleton) return;
            const bone = child.skeleton.bones.find((b) => /head/i.test(b.name));
            if (bone && !headBone) headBone = bone;
          });
        }

        if (headBone) {
          faceMesh.position.set(0, 0.05, 0.12);
          faceMesh.rotation.y = Math.PI;
          headBone.add(faceMesh);
        } else {
          faceMesh.position.set(0, 1.55, 0.18);
          faceMesh.rotation.y = Math.PI;
          robot.add(faceMesh);
        }

        mixer = new THREE.AnimationMixer(robot);
        const clips = gltf.animations || [];
        const findClip = (name) => clips.find((c) => c.name.toLowerCase().includes(name));
        const idleClip = findClip("idle") || clips[0];
        const runClip = findClip("run") || findClip("walk") || clips[0];

        if (idleClip) idleAction = mixer.clipAction(idleClip);
        if (runClip) runAction = mixer.clipAction(runClip);

        activeAction = idleAction || runAction || null;
        if (activeAction) activeAction.play();

        // (no camera adjustments during load)
      },
      undefined,
      (err) => {
        setErrorMsg(`Model load failed: ${err?.message || err}`);
      }
    );

    const keys = { forward: false, back: false, left: false, right: false };
    const resetKeys = () => {
      keys.forward = false;
      keys.back = false;
      keys.left = false;
      keys.right = false;
    };
    const onKeyDown = (e) => {
      if (gameStateRef.current !== "PLAYING") return;
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.forward = true;
      if (e.code === "KeyS" || e.code === "ArrowDown") keys.back = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.left = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.right = true;
    };
    const onKeyUp = (e) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.forward = false;
      if (e.code === "KeyS" || e.code === "ArrowDown") keys.back = false;
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.left = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.right = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", resetKeys);
    window.addEventListener("focus", resetKeys);

    const canMoveTo = (x, z) => {
      const radius = Math.min(0.35, cellSize * 0.2);
      const toCell = (xx, zz) => ({
        x: Math.floor((xx + halfW) / cellSize),
        y: Math.floor((zz + halfD) / cellSize),
      });
      const cells = [
        toCell(x + radius, z + radius),
        toCell(x + radius, z - radius),
        toCell(x - radius, z + radius),
        toCell(x - radius, z - radius),
      ];
      return cells.every((c) => grid[c.y] && grid[c.y][c.x] === 0);
    };

    const velocity = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const move = new THREE.Vector3();
    const accel = 26;
    const damping = 14;
    const maxSpeed = 6.5;
    const turnSpeed = 12;

    let last = performance.now();
    let lastHud = 0;

    const saveScore = async (level, time) => {
      try {
        const res = await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ level, time }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.bestTime === "number") {
          setBestTimes((prev) => ({ ...prev, [level]: data.bestTime }));
        }
      } catch {
        // ignore
      }
    };

    const updateCamera = (immediate) => {
      camTarget.copy(player.position).add(cameraTargetOffset);
      camQuat.setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
      camDir.copy(baseDir).applyQuaternion(camQuat).normalize();

      const desiredDist = cameraOffset.z;
      let finalDist = desiredDist;

      raycaster.set(camTarget, camDir);
      raycaster.far = desiredDist;
      const hit = raycaster.intersectObject(wallMesh, true)[0];
      if (hit) {
        finalDist = Math.max(0.1, hit.distance - camMargin);
      } else {
        finalDist = Math.max(desiredDist, minCamDistance);
      }

      camDesired.copy(camTarget).addScaledVector(camDir, finalDist);

      if (immediate) {
        camera.position.copy(camDesired);
      } else {
        camera.position.lerp(camDesired, camLerp);
      }
      camera.lookAt(camTarget);
    };

    updateCamera(true);

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const playing = gameStateRef.current === "PLAYING";
      if (!playing && lockedRef.current && document.pointerLockElement) {
        document.exitPointerLock();
      }

      move.set(0, 0, 0);
      inputDir.set(0, 0, 0);
      if (playing) {
        yawQuat.setFromAxisAngle(upAxis, yaw);
        forward.set(0, 0, 1).applyQuaternion(yawQuat).normalize();
        forward.multiplyScalar(-1);
        right.set(1, 0, 0).applyQuaternion(yawQuat).normalize();

        if (keys.forward) move.add(forward);
        if (keys.back) move.addScaledVector(forward, -1);
        if (keys.left) move.addScaledVector(right, -1);
        if (keys.right) move.add(right);

        if (move.lengthSq() > 0) {
          move.normalize();
          inputDir.copy(move);
          velocity.addScaledVector(move, accel * dt);
        }
      }

      velocity.multiplyScalar(Math.exp(-damping * dt));
      const speed = velocity.length();
      if (speed > maxSpeed) velocity.multiplyScalar(maxSpeed / speed);
      if (!playing || (!keys.forward && !keys.back && !keys.left && !keys.right && speed < 0.05)) {
        velocity.set(0, 0, 0);
      }

      if (playing) {
        const nextX = player.position.x + velocity.x * dt;
        const nextZ = player.position.z + velocity.z * dt;
        if (canMoveTo(nextX, player.position.z)) player.position.x = nextX; else velocity.x = 0;
        if (canMoveTo(player.position.x, nextZ)) player.position.z = nextZ; else velocity.z = 0;
      }

      updateCamera(false);

      const moving = velocity.lengthSq() > 0.0004;
      if (mixer) {
        mixer.update(dt);
        if (rootBone) rootBone.position.copy(rootBoneBase);
        if (playing && moving && runAction) {
          runAction.timeScale = THREE.MathUtils.clamp(speed / 2.8, 0.6, 1.6);
          fadeToAction(runAction, 0.2);
        } else if (idleAction) {
          fadeToAction(idleAction, 0.2);
        }
      }

      if (inputDir.lengthSq() > 0) {
        faceDir.copy(inputDir);
      } else if (moving) {
        faceDir.set(velocity.x, 0, velocity.z);
        if (faceDir.lengthSq() > 0) faceDir.normalize();
      } else {
        faceDir.set(0, 0, 0);
      }
      if (faceDir.lengthSq() > 0) {
        const targetYaw = Math.atan2(faceDir.x, faceDir.z);
        targetQuat.setFromAxisAngle(upAxis, targetYaw);
        player.quaternion.rotateTowards(targetQuat, turnSpeed * dt);
      }

      if (playing && !Number.isNaN(startTimeRef.current)) {
        elapsedRef.current = (now - startTimeRef.current) / 1000;
        if (now - lastHud > 120) {
          lastHud = now;
          setElapsed(elapsedRef.current);
        }
      }

      if (playing) {
        const dx = player.position.x - goalPos.x;
        const dz = player.position.z - goalPos.z;
        if (dx * dx + dz * dz < 0.35) {
          gameStateRef.current = "WON";
          setGameState("WON");
          const finalTime = elapsedRef.current;
          saveScore(selectedLevel, finalTime);
          setUnlocked((prev) => {
            const next = [...prev];
            if (selectedLevel < 3) next[selectedLevel] = true;
            return next;
          });
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const cleanup = () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", resetKeys);
      window.removeEventListener("focus", resetKeys);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      wallGeo.dispose();
      wallMat.dispose();
      floorMat.dispose();
      goalMesh.geometry.dispose();
      goalMesh.material.dispose();
      wallTex.dispose();
      wallBump.dispose();
      wallRough.dispose();
      floorTex.dispose();
      floorBump.dispose();
      faceTex.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      restoreLayout();
    };

    return cleanup;
  }, [levelData, selectedLevel]);

  const startLevel = (level) => {
    if (!unlocked[level - 1]) return;
    setSelectedLevel(level);
    setGameState("PLAYING");
  };

  const returnToMenu = () => {
    setGameState("MENU");
  };

  const handleClick = () => {
    if (gameStateRef.current !== "PLAYING") return;
    const el = controlsRef.current;
    if (el && document.pointerLockElement !== el) {
      el.requestPointerLock();
    }
  };

  const levelCards = [1, 2, 3].map((level) => {
    const locked = !unlocked[level - 1];
    return (
      <button
        key={level}
        type="button"
        onClick={() => startLevel(level)}
        className={`level-card${locked ? " locked" : ""}`}
        disabled={locked}
      >
        <span className="level-title">LEVEL {level}</span>
        <span className="level-time">BEST: {formatTime(bestTimes[level])}</span>
      </button>
    );
  });

  const scoreRows = [1, 2, 3].map((level) => (
    <tr key={level}>
      <td>Level {level}</td>
      <td style={{ textAlign: "right", fontWeight: "bold" }}>
        {formatTime(bestTimes[level])}
      </td>
    </tr>
  ));

  const theme = LEVEL_THEMES[selectedLevel - 1] || LEVEL_THEMES[0];
  const uiTheme = theme.ui;

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={`maze-root level-${selectedLevel}`}
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "var(--level-bg, #000)",
        "--level-bg": theme.scene.sky,
        "--hud-color": uiTheme.hud,
        "--accent": uiTheme.accent,
        "--menu-text": uiTheme.text,
        "--panel-bg": uiTheme.panelBg,
        "--panel-border": uiTheme.panelBorder,
        "--panel-glow": uiTheme.panelGlow,
        "--overlay-top": uiTheme.overlayTop,
        "--overlay-bottom": uiTheme.overlayBottom,
        "--lock-bg": uiTheme.lockBg,
        "--card-bg": uiTheme.cardBg,
        "--card-border": uiTheme.cardBorder,
      }}
    >
      <style>{`
        .ui-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top, var(--overlay-top), var(--overlay-bottom));
          color: var(--menu-text);
          z-index: 3;
        }
        .menu-panel {
          width: min(760px, 92vw);
          padding: 32px 34px;
          border-radius: 18px;
          border: 1px solid var(--panel-border);
          background: var(--panel-bg);
          box-shadow: 0 0 40px var(--panel-glow);
          text-align: center;
        }
        .menu-title {
          font-size: 32px;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        .menu-subtitle {
          opacity: 0.8;
          margin-bottom: 26px;
        }
        .level-track {
          position: relative;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin: 20px 0 10px;
        }
        .level-track::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 12%;
          right: 12%;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          transform: translateY(-50%);
        }
        .level-card {
          position: relative;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 14px;
          padding: 20px 12px;
          color: var(--menu-text);
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          z-index: 2;
        }
        .level-card:hover:not(.locked) {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px var(--panel-glow);
        }
        .level-card.locked {
          opacity: 0.45;
          cursor: not-allowed;
          border-style: dashed;
        }
        .level-title {
          display: block;
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .level-time {
          font-size: 12px;
          opacity: 0.8;
        }
        .hud {
          position: absolute;
          left: 16px;
          top: 14px;
          z-index: 2;
          color: var(--hud-color);
          font-family: monospace;
          font-size: 12px;
          text-shadow: 0 0 8px rgba(100,255,220,0.3);
          pointer-events: none;
        }
        .win-panel {
          text-align: center;
        }
        .menu-button {
          margin-top: 16px;
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid var(--panel-border);
          background: var(--panel-bg);
          color: var(--menu-text);
          cursor: pointer;
        }
        .menu-button:hover {
          box-shadow: 0 0 14px var(--panel-glow);
        }
        .helper-text {
          margin-top: 16px;
          font-size: 12px;
          opacity: 0.7;
        }
        .scoreboard {
          margin-top: 18px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.08);
          font-size: 12px;
        }
        .scoreboard h4 {
          margin: 0 0 8px 0;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--menu-text);
          opacity: 0.8;
        }
        .scoreboard table {
          width: 100%;
          border-collapse: collapse;
        }
        .scoreboard td {
          padding: 4px 0;
        }
        .lock-hint {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          color: #ffffff;
          font-size: 16px;
          letter-spacing: 0.08em;
          background: var(--lock-bg);
          pointer-events: none;
        }
      `}</style>

      <div className="hud">
        <div>LEVEL: {selectedLevel}</div>
        <div>TIME: {formatTime(elapsed)}</div>
      </div>

      {gameState === "PLAYING" && !locked && (
        <div className="lock-hint">Click to lock camera</div>
      )}

      {gameState !== "PLAYING" && (
        <div className="ui-overlay">
          <div className="menu-panel">
            {gameState === "MENU" && (
              <>
                <div className="menu-title">Maze Campaign</div>
                <div className="menu-subtitle">Choose your mission</div>
                <div className="level-track">{levelCards}</div>
                <div className="helper-text">WASD to move. Click to lock camera and look around.</div>
                <div className="scoreboard">
                  <h4>Best Records</h4>
                  <table>
                    <tbody>{scoreRows}</tbody>
                  </table>
                </div>
              </>
            )}
            {gameState === "WON" && (
              <div className="win-panel">
                <div className="menu-title">Level Complete</div>
                <div className="menu-subtitle">Time: {formatTime(elapsed)}</div>
                <button className="menu-button" type="button" onClick={returnToMenu}>
                  Back to Menu
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="ui-overlay">
          <div className="menu-panel">
            <div className="menu-title">Error</div>
            <div className="menu-subtitle">{errorMsg}</div>
          </div>
        </div>
      )}
    </div>
  );
}
