import { useEffect, useMemo, useRef, useState } from "react";
import { onPeers, sendPosition } from "../multiplayer";

function getThree() {
  const THREE = window.THREE;
  return THREE && typeof THREE.Scene === "function" ? THREE : null;
}

function makeCanvasTexture(THREE, size, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function drawBrickTexture(ctx, size) {
  // Warm sandstone base for a more realistic maze.
  ctx.fillStyle = "#c9b08a";
  ctx.fillRect(0, 0, size, size);

  // Brick layout
  const brickW = Math.max(32, Math.floor(size / 7));
  const brickH = Math.max(22, Math.floor(size / 11));
  const mortar = 4;

  for (let y = 0; y < size; y += brickH) {
    const row = Math.floor(y / brickH);
    const xOffset = row % 2 === 0 ? 0 : Math.floor(brickW / 2);
    for (let x = -xOffset; x < size; x += brickW) {
      const bx = x + mortar;
      const by = y + mortar;
      const bw = brickW - mortar * 2;
      const bh = brickH - mortar * 2;

      const grad = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
      grad.addColorStop(0, "#e2cdaa");
      grad.addColorStop(1, "#b68f5a");
      ctx.fillStyle = grad;
      ctx.fillRect(bx, by, bw, bh);

      // Small highlight/shadow for depth
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(bx, by, bw, 2);
      ctx.fillRect(bx, by, 2, bh);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(bx + bw - 2, by, 2, bh);
      ctx.fillRect(bx, by + bh - 2, bw, 2);

      // Small chips for realism
      if (Math.random() < 0.12) {
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(bx + Math.random() * (bw - 6), by + Math.random() * (bh - 6), 4, 2);
      }
    }
  }

  // Noise
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() * 18 - 9) | 0;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
}

function drawCobbleTexture(ctx, size) {
  // Cobblestone base (warm gray).
  ctx.fillStyle = "#7a6f61";
  ctx.fillRect(0, 0, size, size);

  const stones = 130;
  for (let i = 0; i < stones; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 8 + Math.random() * 28;
    const c = 110 + Math.random() * 90;
    const warm = Math.random() * 12 - 6;
    ctx.fillStyle = `rgb(${c + warm},${c},${c - warm})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r * (0.8 + Math.random() * 0.5), r * (0.7 + Math.random() * 0.5), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crack/mortar lines
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 55; i += 1) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * size, Math.random() * size);
    ctx.lineTo(Math.random() * size, Math.random() * size);
    ctx.stroke();
  }

  // Soft vignette baked into the texture
  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.75);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
}

function FPSMaze({
  stage,
  maze,
  start = { x: 1, y: 1 },
  exit,
  theme,
  onWin,
  cellSize = 2,
  wallHeight = 2.6,
  playerHeight = 1.6,
  moveSpeed = 3.4,
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const rafRef = useRef(0);
  const lockedRef = useRef(false);
  const viewModeRef = useRef("FPS");

  const [threeReady, setThreeReady] = useState(Boolean(getThree()));
  const [locked, setLocked] = useState(false);
  const [elapsed, setElapsed] = useState("0.00");
  const [viewModeLabel, setViewModeLabel] = useState("FPS");
  const wonRef = useRef(false);
  const startTimeRef = useRef(performance.now());
  const avatarUrl = useMemo(() => localStorage.getItem("robotAvatarUrl") || "", []);

  const rows = maze.length;
  const cols = maze[0]?.length || 0;

  const mergedTheme = useMemo(
    () => ({
      background: "#bcd6f0",
      fog: "#cfe2f5",
      floor: "#6f665b",
      wall: "#caa676",
      exit: "#22c55e",
      light: "#fff2d6",
      ...(theme || {}),
    }),
    [theme]
  );

  const mazeWidth = cols * cellSize;
  const mazeDepth = rows * cellSize;
  const halfWidth = mazeWidth / 2;
  const halfDepth = mazeDepth / 2;

  const gridToWorld = useMemo(
    () => (gridX, gridY) => ({
      x: gridX * cellSize - halfWidth + cellSize / 2,
      z: gridY * cellSize - halfDepth + cellSize / 2,
    }),
    [cellSize, halfWidth, halfDepth]
  );

  const isCellWalkable = useMemo(
    () => (gridX, gridY) => {
      if (gridX < 0 || gridY < 0 || gridY >= rows || gridX >= cols) return false;
      return maze[gridY][gridX] === 0;
    },
    [maze, rows, cols]
  );

  const worldToCell = useMemo(
    () => (x, z) => ({
      x: Math.floor((x + halfWidth) / cellSize),
      y: Math.floor((z + halfDepth) / cellSize),
    }),
    [halfWidth, halfDepth, cellSize]
  );

  const isWorldWalkable = useMemo(
    () => (x, z) => {
      const g = worldToCell(x, z);
      return isCellWalkable(g.x, g.y);
    },
    [worldToCell, isCellWalkable]
  );

  useEffect(() => {
    if (threeReady) return undefined;
    let cancelled = false;
    let tries = 0;
    const t = setInterval(() => {
      tries += 1;
      if (getThree()) {
        setThreeReady(true);
        clearInterval(t);
        return;
      }
      if (tries > 60) {
        clearInterval(t);
        // Fallback: if the CDN is blocked, load the local npm `three` package.
        import("three")
          .then((mod) => {
            if (cancelled) return;
            window.THREE = mod;
            setThreeReady(true);
          })
          .catch(() => {});
      }
    }, 100);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [threeReady]);

  useEffect(() => {
    startTimeRef.current = performance.now();
    wonRef.current = false;
    setElapsed("0.00");
  }, [stage]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (wonRef.current) return;
      const t = (performance.now() - startTimeRef.current) / 1000;
      setElapsed(t.toFixed(2));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!threeReady) return undefined;
    const THREE = getThree();
    if (!THREE) return undefined;
    if (!containerRef.current) return undefined;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(mergedTheme.background);
    scene.fog = new THREE.Fog(
      mergedTheme.fog,
      Math.max(12, cellSize * 5),
      Math.max(mazeWidth, mazeDepth) * 3.2
    );

    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 250);
    camera.rotation.order = "YXZ";
    cameraRef.current = camera;
    // Add camera to the scene (used for a third-person follow camera).
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    handleResize();

    // Pointer-lock mouse look (no extra Three.js controls dependency).
    let yaw = 0;
    let pitch = 0;
    const lookSpeed = 0.0022;

    const onPointerLockChange = () => {
      const isLocked = document.pointerLockElement === renderer.domElement;
      lockedRef.current = isLocked;
      setLocked(isLocked);
    };

    const onMouseMove = (e) => {
      if (!lockedRef.current) return;
      yaw -= (e.movementX || 0) * lookSpeed;
      pitch -= (e.movementY || 0) * lookSpeed;
      const limit = Math.PI / 2 - 0.01;
      pitch = Math.max(-limit, Math.min(limit, pitch));
      camera.rotation.set(pitch, yaw, 0);
    };

    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", handleResize);

    let viewMode = viewModeRef.current || "FPS";
    let playerRobot = null;
    let armsGroup = null;
    const setViewMode = (next) => {
      viewMode = next;
      viewModeRef.current = next;
      setViewModeLabel(next);
      if (armsGroup) armsGroup.visible = next === "FPS";
      if (playerRobot) playerRobot.group.visible = next !== "FPS";
    };

    // Lights (sun + sky for a more realistic daylight feel)
    scene.add(new THREE.AmbientLight(new THREE.Color(mergedTheme.light), 0.6));
    const hemi = new THREE.HemisphereLight(0xbcd6f0, 0x8b7b66, 0.85);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(new THREE.Color(mergedTheme.light), 1.25);
    sun.position.set(22, 20, -18);
    sun.castShadow = true;
    sun.shadow.bias = -0.00025;
    sun.shadow.normalBias = 0.02;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 50;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    scene.add(sun);

    // Textures (procedural, no extra assets)
    const wallTex = makeCanvasTexture(THREE, 512, drawBrickTexture);
    wallTex.repeat.set(1.6, 1.2);
    const floorTex = makeCanvasTexture(THREE, 512, drawCobbleTexture);
    floorTex.repeat.set(Math.max(1, mazeWidth / 6), Math.max(1, mazeDepth / 6));

    // Floor
    const floorGeo = new THREE.PlaneGeometry(mazeWidth, mazeDepth);
    const floorMat = new THREE.MeshStandardMaterial({
      color: mergedTheme.floor,
      map: floorTex,
      roughness: 0.98,
      metalness: 0.02,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls (instanced)
    const wallPositions = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (maze[y][x] === 1) {
          const pos = gridToWorld(x, y);
          wallPositions.push([pos.x, wallHeight / 2, pos.z]);
        }
      }
    }

    const wallGeo = new THREE.BoxGeometry(cellSize, wallHeight, cellSize);
    const wallMat = new THREE.MeshStandardMaterial({
      color: mergedTheme.wall,
      map: wallTex,
      roughness: 0.78,
      metalness: 0.05,
    });
    const wallMesh = new THREE.InstancedMesh(wallGeo, wallMat, wallPositions.length);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    const tmp = new THREE.Object3D();
    for (let i = 0; i < wallPositions.length; i += 1) {
      const [x, y, z] = wallPositions[i];
      tmp.position.set(x, y, z);
      tmp.updateMatrix();
      wallMesh.setMatrixAt(i, tmp.matrix);
    }
    wallMesh.instanceMatrix.needsUpdate = true;
    scene.add(wallMesh);

    // Exit marker (glowing portal vibe)
    const exitWorld = gridToWorld(exit.x, exit.y);
    const exitGeo = new THREE.CylinderGeometry(cellSize * 0.18, cellSize * 0.22, 0.35, 24);
    const exitMat = new THREE.MeshStandardMaterial({
      color: mergedTheme.exit,
      emissive: mergedTheme.exit,
      emissiveIntensity: 0.8,
      roughness: 0.4,
    });
    const exitMesh = new THREE.Mesh(exitGeo, exitMat);
    exitMesh.position.set(exitWorld.x, 0.18, exitWorld.z);
    exitMesh.castShadow = true;
    scene.add(exitMesh);
    const exitLight = new THREE.PointLight(new THREE.Color(mergedTheme.exit), 1.2, 10);
    exitLight.position.set(exitWorld.x, 1.6, exitWorld.z);
    scene.add(exitLight);

    // Square portal frame (closer to the reference look)
    const frameMat = new THREE.MeshBasicMaterial({
      color: mergedTheme.exit,
      transparent: true,
      opacity: 0.75,
    });
    const frameW = cellSize * 0.9;
    const frameH = cellSize * 0.9;
    const frameT = Math.max(0.06, cellSize * 0.06);
    const frameD = Math.max(0.06, cellSize * 0.05);
    const frameY = playerHeight;

    const segHGeo = new THREE.BoxGeometry(frameW, frameT, frameD);
    const segVGeo = new THREE.BoxGeometry(frameT, frameH, frameD);

    const topSeg = new THREE.Mesh(segHGeo, frameMat);
    topSeg.position.set(exitWorld.x, frameY + frameH / 2, exitWorld.z);
    scene.add(topSeg);

    const botSeg = new THREE.Mesh(segHGeo, frameMat);
    botSeg.position.set(exitWorld.x, frameY - frameH / 2, exitWorld.z);
    scene.add(botSeg);

    const leftSeg = new THREE.Mesh(segVGeo, frameMat);
    leftSeg.position.set(exitWorld.x - frameW / 2, frameY, exitWorld.z);
    scene.add(leftSeg);

    const rightSeg = new THREE.Mesh(segVGeo, frameMat);
    rightSeg.position.set(exitWorld.x + frameW / 2, frameY, exitWorld.z);
    scene.add(rightSeg);

    // Spawn + view rig (FPS + optional third-person)
    const startWorld = gridToWorld(start.x, start.y);
    const player = new THREE.Object3D();
    player.position.set(startWorld.x, 0, startWorld.z);
    scene.add(player);

    const dir = new THREE.Vector3(exitWorld.x - startWorld.x, 0, exitWorld.z - startWorld.z);
    if (dir.lengthSq() > 0.0001) dir.normalize();
    yaw = Math.atan2(dir.x, -dir.z);
    pitch = -0.12;

    const camDistance = 3.8;
    const camHeight = 1.25;
    const camTarget = new THREE.Vector3();
    const camBack = new THREE.Vector3();
    const camPos = new THREE.Vector3();

    let bobPhase = 0;
    let bobOffset = 0;
    let rollOffset = 0;

    const updateCamera = (moving) => {
      if (viewMode === "FPS") {
        camera.position.set(player.position.x, playerHeight + bobOffset, player.position.z);
        camera.rotation.set(pitch, yaw, rollOffset);
        return;
      }
      camTarget.set(player.position.x, playerHeight * 0.95, player.position.z);
      camBack.set(Math.sin(yaw), 0, -Math.cos(yaw)).multiplyScalar(-camDistance);
      camPos.copy(camTarget).add(camBack);
      camPos.y += camHeight + Math.sin(pitch) * 0.8 + bobOffset * 0.35;
      camera.position.copy(camPos);
      camera.lookAt(camTarget.x, camTarget.y + 0.15, camTarget.z);
    };
    updateCamera(false);

    // Small "lantern" light attached to the player for consistent visibility.
    const playerFill = new THREE.PointLight(0xffffff, 0.45, 12);
    playerFill.position.set(0, playerHeight + 0.2, 0);
    player.add(playerFill);

    // Robot with a "human face inside" and exposed gears (closer to the reference look).
    const makeRobot = ({ tint = "#d1d5db", avatar = "" } = {}) => {
      const group = new THREE.Group();
      const geometries = [];
      const materials = [];

      const metalMain = new THREE.MeshStandardMaterial({
        color: tint,
        roughness: 0.32,
        metalness: 0.85,
      });
      const metalDark = new THREE.MeshStandardMaterial({
        color: "#6b7280",
        roughness: 0.4,
        metalness: 0.75,
      });
      const metalPanel = new THREE.MeshStandardMaterial({
        color: "#e5e7eb",
        roughness: 0.28,
        metalness: 0.65,
      });
      const gearMat = new THREE.MeshStandardMaterial({
        color: "#9ca3af",
        roughness: 0.25,
        metalness: 0.9,
      });
      const wireMat = new THREE.MeshStandardMaterial({
        color: "#2f3b48",
        roughness: 0.55,
        metalness: 0.5,
      });
      const faceMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.65,
        metalness: 0.05,
      });

      materials.push(metalMain, metalDark, metalPanel, gearMat, wireMat, faceMat);

      const makeMesh = (geo, mat, position, rotation = null) => {
        geometries.push(geo);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (position) mesh.position.set(position.x, position.y, position.z);
        if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
        group.add(mesh);
        return mesh;
      };

      const makeLimbMesh = (geo, mat, position, parent) => {
        geometries.push(geo);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (position) mesh.position.set(position.x, position.y, position.z);
        parent.add(mesh);
        return mesh;
      };

      // Torso + plates
      makeMesh(new THREE.CylinderGeometry(0.32, 0.34, 0.78, 24), metalMain, { x: 0, y: 0.78, z: 0 });
      makeMesh(new THREE.BoxGeometry(0.62, 0.38, 0.32), metalPanel, { x: 0, y: 0.96, z: 0.12 });
      makeMesh(new THREE.BoxGeometry(0.52, 0.28, 0.22), metalDark, { x: 0, y: 0.6, z: 0.1 });
      makeMesh(new THREE.BoxGeometry(0.5, 0.2, 0.28), metalPanel, { x: 0, y: 0.36, z: 0.04 });
      makeMesh(new THREE.BoxGeometry(0.26, 0.18, 0.18), metalDark, { x: 0, y: 0.22, z: -0.05 });

      // Shoulder armor
      makeMesh(new THREE.BoxGeometry(0.24, 0.16, 0.24), metalPanel, { x: -0.38, y: 0.98, z: 0.02 });
      makeMesh(new THREE.BoxGeometry(0.24, 0.16, 0.24), metalPanel, { x: 0.38, y: 0.98, z: 0.02 });

      // Back pack detail
      makeMesh(new THREE.BoxGeometry(0.36, 0.3, 0.22), metalDark, { x: 0, y: 0.82, z: -0.22 });

      // Exposed gear in torso
      const gearGroup = new THREE.Group();
      const ringGeo = new THREE.TorusGeometry(0.12, 0.028, 12, 24);
      const toothGeo = new THREE.BoxGeometry(0.04, 0.02, 0.05);
      geometries.push(ringGeo, toothGeo);

      const ring = new THREE.Mesh(ringGeo, gearMat);
      ring.castShadow = true;
      ring.receiveShadow = true;
      gearGroup.add(ring);

      for (let i = 0; i < 12; i += 1) {
        const tooth = new THREE.Mesh(toothGeo, gearMat);
        const a = (i / 12) * Math.PI * 2;
        tooth.position.set(Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0);
        tooth.rotation.z = a;
        tooth.castShadow = true;
        tooth.receiveShadow = true;
        gearGroup.add(tooth);
      }

      gearGroup.position.set(0, 0.72, 0.23);
      group.add(gearGroup);

      // Wires (simple tube curves in front)
      const wireCurveA = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.18, 0.92, 0.06),
        new THREE.Vector3(-0.2, 0.75, 0.18),
        new THREE.Vector3(-0.1, 0.58, 0.14),
      ]);
      const wireCurveB = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.16, 0.92, 0.06),
        new THREE.Vector3(0.22, 0.78, 0.18),
        new THREE.Vector3(0.12, 0.6, 0.12),
      ]);
      const wireGeoA = new THREE.TubeGeometry(wireCurveA, 20, 0.012, 6, false);
      const wireGeoB = new THREE.TubeGeometry(wireCurveB, 20, 0.012, 6, false);
      makeMesh(wireGeoA, wireMat);
      makeMesh(wireGeoB, wireMat);

      // Neck + head shell
      makeMesh(new THREE.CylinderGeometry(0.07, 0.09, 0.12, 14), metalDark, { x: 0, y: 1.2, z: 0 });
      makeMesh(new THREE.SphereGeometry(0.28, 24, 18), metalMain, { x: 0, y: 1.45, z: 0 });

      // Face frame + face plane (shows the uploaded image)
      makeMesh(new THREE.BoxGeometry(0.28, 0.34, 0.04), metalDark, { x: 0, y: 1.44, z: 0.2 });
      const facePlane = makeMesh(new THREE.PlaneGeometry(0.22, 0.28), faceMat, { x: 0, y: 1.44, z: 0.225 });

      let faceTex = null;
      if (avatar) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          faceTex = new THREE.Texture(img);
          faceTex.colorSpace = THREE.SRGBColorSpace;
          faceTex.needsUpdate = true;
          faceMat.map = faceTex;
          faceMat.needsUpdate = true;
        };
        img.src = avatar;
      }

      // Arms (pivoted for a walk cycle)
      const leftArmPivot = new THREE.Group();
      leftArmPivot.position.set(-0.34, 0.96, 0);
      group.add(leftArmPivot);
      const leftUpperArm = makeLimbMesh(
        new THREE.CylinderGeometry(0.055, 0.06, 0.34, 12),
        metalMain,
        { x: 0, y: -0.17, z: 0 },
        leftArmPivot
      );
      leftUpperArm.rotation.z = Math.PI / 2;

      const leftForePivot = new THREE.Group();
      leftForePivot.position.set(0, -0.34, 0);
      leftArmPivot.add(leftForePivot);
      const leftLowerArm = makeLimbMesh(
        new THREE.CylinderGeometry(0.045, 0.05, 0.3, 12),
        metalDark,
        { x: 0, y: -0.15, z: 0 },
        leftForePivot
      );
      leftLowerArm.rotation.z = Math.PI / 2;
      makeLimbMesh(new THREE.SphereGeometry(0.05, 12, 10), metalDark, { x: 0, y: -0.32, z: 0.03 }, leftForePivot);

      const rightArmPivot = new THREE.Group();
      rightArmPivot.position.set(0.34, 0.96, 0);
      group.add(rightArmPivot);
      const rightUpperArm = makeLimbMesh(
        new THREE.CylinderGeometry(0.055, 0.06, 0.34, 12),
        metalMain,
        { x: 0, y: -0.17, z: 0 },
        rightArmPivot
      );
      rightUpperArm.rotation.z = Math.PI / 2;

      const rightForePivot = new THREE.Group();
      rightForePivot.position.set(0, -0.34, 0);
      rightArmPivot.add(rightForePivot);
      const rightLowerArm = makeLimbMesh(
        new THREE.CylinderGeometry(0.045, 0.05, 0.3, 12),
        metalDark,
        { x: 0, y: -0.15, z: 0 },
        rightForePivot
      );
      rightLowerArm.rotation.z = Math.PI / 2;
      makeLimbMesh(new THREE.SphereGeometry(0.05, 12, 10), metalDark, { x: 0, y: -0.32, z: 0.03 }, rightForePivot);

      // Legs (pivoted for a walk cycle)
      const leftLegPivot = new THREE.Group();
      leftLegPivot.position.set(-0.16, 0.38, 0);
      group.add(leftLegPivot);
      makeLimbMesh(
        new THREE.CylinderGeometry(0.065, 0.07, 0.42, 12),
        metalMain,
        { x: 0, y: -0.21, z: 0 },
        leftLegPivot
      );
      const leftCalfPivot = new THREE.Group();
      leftCalfPivot.position.set(0, -0.42, 0);
      leftLegPivot.add(leftCalfPivot);
      makeLimbMesh(
        new THREE.CylinderGeometry(0.055, 0.06, 0.4, 12),
        metalDark,
        { x: 0, y: -0.2, z: 0 },
        leftCalfPivot
      );
      makeLimbMesh(new THREE.BoxGeometry(0.16, 0.06, 0.26), metalDark, { x: 0, y: -0.35, z: 0.08 }, leftCalfPivot);

      const rightLegPivot = new THREE.Group();
      rightLegPivot.position.set(0.16, 0.38, 0);
      group.add(rightLegPivot);
      makeLimbMesh(
        new THREE.CylinderGeometry(0.065, 0.07, 0.42, 12),
        metalMain,
        { x: 0, y: -0.21, z: 0 },
        rightLegPivot
      );
      const rightCalfPivot = new THREE.Group();
      rightCalfPivot.position.set(0, -0.42, 0);
      rightLegPivot.add(rightCalfPivot);
      makeLimbMesh(
        new THREE.CylinderGeometry(0.055, 0.06, 0.4, 12),
        metalDark,
        { x: 0, y: -0.2, z: 0 },
        rightCalfPivot
      );
      makeLimbMesh(new THREE.BoxGeometry(0.16, 0.06, 0.26), metalDark, { x: 0, y: -0.35, z: 0.08 }, rightCalfPivot);

      let animT = 0;

      return {
        group,
        tick: (dt, moving = false) => {
          animT += dt;
          gearGroup.rotation.z += dt * 1.4;
          const pace = moving ? 6.2 : 2.0;
          const stride = moving ? 0.55 : 0.18;
          const swing = Math.sin(animT * pace) * stride;

          leftArmPivot.rotation.x = -swing * 0.9;
          rightArmPivot.rotation.x = swing * 0.9;
          leftLegPivot.rotation.x = swing;
          rightLegPivot.rotation.x = -swing;

          leftForePivot.rotation.x = Math.max(0, -swing) * 0.8;
          rightForePivot.rotation.x = Math.max(0, swing) * 0.8;
          leftCalfPivot.rotation.x = Math.max(0, swing) * 0.9;
          rightCalfPivot.rotation.x = Math.max(0, -swing) * 0.9;
        },
        dispose: () => {
          materials.forEach((m) => m.dispose());
          geometries.forEach((g) => g.dispose());
          if (faceTex) faceTex.dispose();
        },
      };
    };

    // Local robot model (visible in third-person).
    playerRobot = makeRobot({ tint: "#e5e7eb", avatar: avatarUrl });
    playerRobot.group.position.copy(player.position);
    playerRobot.group.rotation.y = yaw;
    scene.add(playerRobot.group);

    // First-person arms to match the reference view.
    armsGroup = new THREE.Group();
    armsGroup.position.set(0, -0.4, -0.6);
    camera.add(armsGroup);

    const armsGeos = [];
    const armsMats = [];
    const armBlueMat = new THREE.MeshStandardMaterial({
      color: "#2563eb",
      roughness: 0.35,
      metalness: 0.15,
    });
    const armWhiteMat = new THREE.MeshStandardMaterial({
      color: "#e5e7eb",
      roughness: 0.45,
      metalness: 0.08,
    });
    const armDarkMat = new THREE.MeshStandardMaterial({
      color: "#111827",
      roughness: 0.6,
      metalness: 0.1,
    });
    const armScreenMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.05,
      emissive: 0x111111,
      emissiveIntensity: 0.35,
    });
    armsMats.push(armBlueMat, armWhiteMat, armDarkMat, armScreenMat);

    const upperGeo = new THREE.BoxGeometry(0.22, 0.12, 0.44);
    const foreGeo = new THREE.BoxGeometry(0.2, 0.1, 0.38);
    const handGeo = new THREE.BoxGeometry(0.2, 0.08, 0.2);
    const shoulderGeo = new THREE.SphereGeometry(0.11, 14, 12);
    const elbowGeo = new THREE.SphereGeometry(0.07, 12, 10);
    const wristGeo = new THREE.SphereGeometry(0.06, 12, 10);
    const fingerGeo = new THREE.BoxGeometry(0.04, 0.03, 0.08);
    const chestGeo = new THREE.BoxGeometry(0.72, 0.28, 0.42);
    const chestPanelGeo = new THREE.BoxGeometry(0.5, 0.18, 0.08);
    const screenGeo = new THREE.PlaneGeometry(0.22, 0.22);
    armsGeos.push(
      upperGeo,
      foreGeo,
      handGeo,
      shoulderGeo,
      elbowGeo,
      wristGeo,
      fingerGeo,
      chestGeo,
      chestPanelGeo,
      screenGeo
    );

    // Torso visible in FPS for more presence.
    const chest = new THREE.Mesh(chestGeo, armWhiteMat);
    chest.position.set(0, -0.18, -0.1);
    armsGroup.add(chest);
    const chestPanel = new THREE.Mesh(chestPanelGeo, armBlueMat);
    chestPanel.position.set(0, -0.18, 0.12);
    armsGroup.add(chestPanel);
    const chestScreen = new THREE.Mesh(screenGeo, armScreenMat);
    chestScreen.position.set(0, -0.18, 0.17);
    armsGroup.add(chestScreen);

    let chestTex = null;
    if (avatarUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        chestTex = new THREE.Texture(img);
        chestTex.colorSpace = THREE.SRGBColorSpace;
        chestTex.needsUpdate = true;
        armScreenMat.map = chestTex;
        armScreenMat.needsUpdate = true;
      };
      img.src = avatarUrl;
    }

    const makeArm = (side = "left") => {
      const sign = side === "left" ? -1 : 1;
      const shoulder = new THREE.Group();
      shoulder.position.set(0.28 * sign, -0.05, -0.08);
      armsGroup.add(shoulder);

      const shoulderPad = new THREE.Mesh(shoulderGeo, armBlueMat);
      shoulderPad.position.set(0, 0.02, 0.02);
      shoulder.add(shoulderPad);

      const upper = new THREE.Mesh(upperGeo, armBlueMat);
      upper.position.set(0, -0.02, 0.02);
      shoulder.add(upper);

      const forePivot = new THREE.Group();
      forePivot.position.set(0, -0.12, 0.12);
      shoulder.add(forePivot);

      const elbow = new THREE.Mesh(elbowGeo, armDarkMat);
      elbow.position.set(0, -0.02, 0.06);
      forePivot.add(elbow);

      const fore = new THREE.Mesh(foreGeo, armWhiteMat);
      fore.position.set(0, -0.02, 0.12);
      forePivot.add(fore);

      const wrist = new THREE.Mesh(wristGeo, armDarkMat);
      wrist.position.set(0, -0.05, 0.26);
      forePivot.add(wrist);

      const hand = new THREE.Mesh(handGeo, armDarkMat);
      hand.position.set(0, -0.05, 0.28);
      forePivot.add(hand);

      const fingerL = new THREE.Mesh(fingerGeo, armDarkMat);
      fingerL.position.set(-0.04, -0.05, 0.36);
      forePivot.add(fingerL);
      const fingerR = new THREE.Mesh(fingerGeo, armDarkMat);
      fingerR.position.set(0.04, -0.05, 0.36);
      forePivot.add(fingerR);

      return { shoulder, forePivot };
    };

    const leftArm = makeArm("left");
    const rightArm = makeArm("right");

    let walkPhase = 0;
    const updateArms = (dt, moving) => {
      walkPhase += dt * (moving ? 8.5 : 2.2);
      const swing = Math.sin(walkPhase) * (moving ? 0.45 : 0.12);
      leftArm.shoulder.rotation.x = 0.25 + swing;
      rightArm.shoulder.rotation.x = 0.25 - swing;
      leftArm.forePivot.rotation.x = -0.15 + Math.max(0, swing) * 0.4;
      rightArm.forePivot.rotation.x = -0.15 + Math.max(0, -swing) * 0.4;
      armsGroup.position.y = -0.4 + Math.sin(walkPhase * 2) * (moving ? 0.03 : 0.01);
      armsGroup.position.x = Math.sin(walkPhase) * (moving ? 0.012 : 0.004);
    };

    setViewMode(viewMode);

    const peerRobots = new Map();
    const upsertPeerRobot = (peer) => {
      let bot = peerRobots.get(peer.id);
      if (!bot) {
        bot = makeRobot({ tint: "#93c5fd", avatar: peer.avatar || "" });
        bot.lastPos = new THREE.Vector3();
        bot.moving = false;
        peerRobots.set(peer.id, bot);
        scene.add(bot.group);
      }
      return bot;
    };

    const removePeerRobot = (peerId) => {
      const bot = peerRobots.get(peerId);
      if (!bot) return;
      scene.remove(bot.group);
      bot.dispose();
      peerRobots.delete(peerId);
    };

    const unsubPeers = onPeers((list) => {
      const ids = new Set(list.map((p) => p.id));
      Array.from(peerRobots.keys()).forEach((id) => {
        if (!ids.has(id)) removePeerRobot(id);
      });

      list.forEach((peer) => {
        const bot = upsertPeerRobot(peer);

        // Show only players in the same stage and only once they have a position.
        if (Number(peer.stage) !== Number(stage) || !peer.pos) {
          bot.group.visible = false;
          return;
        }

        bot.group.visible = true;
        bot.group.position.set(Number(peer.pos.x) || 0, 0, Number(peer.pos.z) || 0);
        bot.group.rotation.y = Number(peer.pos.yaw) || 0;

        const dx = bot.group.position.x - (bot.lastPos?.x || 0);
        const dz = bot.group.position.z - (bot.lastPos?.z || 0);
        bot.moving = dx * dx + dz * dz > 0.0004;
        if (bot.lastPos) bot.lastPos.set(bot.group.position.x, 0, bot.group.position.z);
      });
    });

    // Input
    const keys = { forward: false, back: false, left: false, right: false };
    const onKeyDown = (e) => {
      if (e.code === "KeyV" && !e.repeat) {
        setViewMode(viewMode === "FPS" ? "TPS" : "FPS");
        return;
      }
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

    const canMoveTo = (x, z) => {
      const radius = Math.min(0.35, cellSize * 0.2);
      return (
        isWorldWalkable(x + radius, z + radius) &&
        isWorldWalkable(x + radius, z - radius) &&
        isWorldWalkable(x - radius, z + radius) &&
        isWorldWalkable(x - radius, z - radius)
      );
    };

    let lastT = performance.now();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const move = new THREE.Vector3();
    const velocity = new THREE.Vector3();
    const accel = moveSpeed * 7;
    const damping = moveSpeed * 4;

    let sendAcc = 0;

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      const obj = player;

      if (!wonRef.current && lockedRef.current) {
        move.set(0, 0, 0);
        forward.set(Math.sin(yaw), 0, -Math.cos(yaw));
        right.set(Math.cos(yaw), 0, Math.sin(yaw));

        if (keys.forward) move.add(forward);
        if (keys.back) move.addScaledVector(forward, -1);
        if (keys.left) move.addScaledVector(right, -1);
        if (keys.right) move.add(right);

        if (move.lengthSq() > 0) {
          move.normalize();
          velocity.addScaledVector(move, accel * dt);
        }

        // Broadcast your position a few times per second for peer rendering.
        sendAcc += dt;
        if (sendAcc >= 0.12) {
          sendAcc = 0;
          sendPosition(
            {
              x: obj.position.x,
              z: obj.position.z,
              yaw,
            },
            stage
          );
        }

        // Win check
        const cell = worldToCell(obj.position.x, obj.position.z);
        if (cell.x === exit.x && cell.y === exit.y) {
          wonRef.current = true;
          const finalTime = Number(((performance.now() - startTimeRef.current) / 1000).toFixed(2));
          if (typeof onWin === "function") onWin(finalTime);
        }

      }

      const damp = Math.exp(-damping * dt);
      velocity.multiplyScalar(damp);
      const speed = velocity.length();
      if (speed > moveSpeed) {
        velocity.multiplyScalar(moveSpeed / speed);
      }

      const nextX = obj.position.x + velocity.x * dt;
      const nextZ = obj.position.z + velocity.z * dt;
      if (canMoveTo(nextX, obj.position.z)) {
        obj.position.x = nextX;
      } else {
        velocity.x = 0;
      }
      if (canMoveTo(obj.position.x, nextZ)) {
        obj.position.z = nextZ;
      } else {
        velocity.z = 0;
      }

      const moving = velocity.lengthSq() > 0.0004;
      bobPhase += dt * (moving ? 8.5 : 2.4);
      bobOffset = Math.sin(bobPhase * 2) * (moving ? 0.06 : 0.015);
      rollOffset = Math.sin(bobPhase) * (moving ? 0.03 : 0.01);
      playerRobot.group.position.copy(player.position);
      playerRobot.group.rotation.y = yaw;
      if (playerRobot.tick) playerRobot.tick(dt, moving);
      if (viewMode === "FPS") updateArms(dt, moving);
      updateCamera(moving);

      peerRobots.forEach((bot) => {
        if (bot.tick) bot.tick(dt, bot.moving);
      });

      renderer.render(scene, camera);
    };

    animate();

    const cleanup = () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      if (document.pointerLockElement === renderer.domElement && document.exitPointerLock) {
        document.exitPointerLock();
      }
      unsubPeers();

      scene.clear();
      wallTex.dispose();
      floorTex.dispose();
      wallGeo.dispose();
      wallMat.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      exitGeo.dispose();
      exitMat.dispose();
      segHGeo.dispose();
      segVGeo.dispose();
      frameMat.dispose();
      armsGeos.forEach((g) => g.dispose());
      armsMats.forEach((m) => m.dispose());
      if (chestTex) chestTex.dispose();
      playerRobot.dispose();
      peerRobots.forEach((bot) => bot.dispose());
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };

    return cleanup;
  }, [
    stage,
    maze,
    start,
    exit,
    mergedTheme,
    rows,
    cols,
    mazeWidth,
    mazeDepth,
    halfWidth,
    halfDepth,
    cellSize,
    wallHeight,
    playerHeight,
    moveSpeed,
    gridToWorld,
    isWorldWalkable,
    worldToCell,
    onWin,
    threeReady,
    avatarUrl,
    isCellWalkable,
  ]);

  const handleClick = () => {
    const THREE = getThree();
    const renderer = rendererRef.current;
    if (!THREE || !renderer || wonRef.current) return;

    if (!lockedRef.current && renderer.domElement && renderer.domElement.requestPointerLock) {
      renderer.domElement.requestPointerLock();
      setTimeout(() => {
        if (document.pointerLockElement !== renderer.domElement) {
          lockedRef.current = true;
          setLocked(true);
        }
      }, 200);
      return;
    }

    // Fallback when Pointer Lock isn't available: allow movement without mouse-look.
    if (!lockedRef.current) {
      lockedRef.current = true;
      setLocked(true);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: 12,
          top: 12,
          zIndex: 5,
          background: "rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding: "8px 10px",
          color: "#fff",
          fontWeight: 800,
          letterSpacing: "0.03em",
        }}
      >
        Stage {stage} - TIME: {elapsed}s {locked ? "" : "(לחץ כדי להתחיל)"} | מבט: {viewModeLabel} (V)
      </div>

      <div ref={containerRef} onClick={handleClick} style={{ width: "100%", height: "100%", background: "#000" }}>
        {threeReady && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 10,
              height: 10,
              marginLeft: -5,
              marginTop: -5,
              border: "1px solid rgba(255,255,255,0.75)",
              borderRadius: "50%",
              boxShadow: "0 0 10px rgba(0,0,0,0.5)",
              pointerEvents: "none",
              zIndex: 3,
            }}
          />
        )}
        {threeReady && (
          <div
            style={{
              position: "absolute",
              left: 12,
              bottom: 76,
              display: "grid",
              gridTemplateColumns: "repeat(2, auto)",
              gap: 6,
              background: "rgba(0,0,0,0.38)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              padding: "6px 8px",
              color: "#fff",
              fontSize: 11,
              letterSpacing: "0.02em",
              pointerEvents: "none",
              zIndex: 3,
            }}
          >
            <div style={{ gridColumn: "span 2", textAlign: "center", opacity: 0.9 }}>Controls</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 800 }}>↑</span> קדימה
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 800 }}>↓</span> אחורה
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 800 }}>←</span> שמאלה
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 800 }}>→</span> ימינה
            </div>
          </div>
        )}
        {!threeReady && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              fontWeight: 700,
              textAlign: "center",
              padding: 16,
              pointerEvents: "none",
            }}
          >
            Loading 3D engine...
          </div>
        )}
        {threeReady && !locked && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              fontWeight: 700,
              textAlign: "center",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.16)",
              maxWidth: "85%",
              pointerEvents: "none",
            }}
          >
            לחץ כדי להתחיל - WASD / חיצים לתנועה, עכבר להסתכל (V להחלפת מבט)
          </div>
        )}
        {threeReady && avatarUrl && (
          <div
            style={{
              position: "absolute",
              left: 12,
              bottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: "8px 10px",
              color: "#fff",
              pointerEvents: "none",
              zIndex: 3,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundImage: `url(${avatarUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "2px solid rgba(255,255,255,0.2)",
                boxShadow: "0 0 12px rgba(0,0,0,0.4)",
              }}
            />
            <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.2 }}>
              פני הרובוט
              <div style={{ fontSize: 11, opacity: 0.75 }}>התמונה שלך</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FPSMaze;
