import WindowManager from "./WindowManager.js";

const t = THREE;
let camera, scene, renderer, world;
let pixR = window.devicePixelRatio || 1;
let geometries = [];
let sceneOffsetTarget = { x: 0, y: 0 };
let sceneOffset = { x: 0, y: 0 };
let windowManager;
let initialized = false;

// Get time in seconds since the beginning of the day
const today = new Date().setHours(0, 0, 0, 0);
const getTime = () => (Date.now() - today) / 1000;

if (new URLSearchParams(window.location.search).get("clear")) {
  localStorage.clear();
} else {
  // Initialize only when document is visible
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !initialized) init();
  });

  window.onload = () => {
    if (document.visibilityState === "visible") init();
  };
}

function init() {
  initialized = true;
  setTimeout(() => {
    setupScene();
    setupWindowManager();
    resize();
    updateWindowShape(false);
    render();
    window.addEventListener("resize", resize);
  }, 500);
}

function setupScene() {
  camera = new t.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, -10000, 10000);
  camera.position.z = 2.5;

  scene = new t.Scene();
  scene.background = new t.Color(0);
  scene.add(camera);

  renderer = new t.WebGLRenderer({ antialias: true, depthBuffer: true });
  renderer.setPixelRatio(pixR);
  renderer.domElement.id = "scene";
  document.body.appendChild(renderer.domElement);

  world = new t.Object3D();
  scene.add(world);
}

function setupWindowManager() {
  windowManager = new WindowManager();
  windowManager.setWinShapeChangeCallback(updateWindowShape);
  windowManager.setWinChangeCallback(updateGeometries);

  const metaData = { foo: "bar" };
  windowManager.init(metaData);

  updateGeometries();
}

function updateGeometries() {
  const wins = windowManager.getWindows();

  geometries.forEach((geometry) => world.remove(geometry));
  geometries = [];

  wins.forEach((win, i) => {
    const color = new t.Color().setHSL(i * 0.1, 1.0, 0.5);
    const size = 100 + i * 50;
    const geometry = new t.Mesh(
      new t.BoxGeometry(size, size, size),
      new t.MeshBasicMaterial({ color, wireframe: true })
    );

    geometry.position.set(win.shape.x + win.shape.w * 0.5, win.shape.y + win.shape.h * 0.5);

    world.add(geometry);
    geometries.push(geometry);
  });
}

function updateWindowShape(easing = true) {
  sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
  if (!easing) sceneOffset = sceneOffsetTarget;
}

function render() {
  const currentTime = getTime();
  windowManager.update();
  const falloff = 0.05;

  sceneOffset.x += (sceneOffsetTarget.x - sceneOffset.x) * falloff;
  sceneOffset.y += (sceneOffsetTarget.y - sceneOffset.y) * falloff;
  world.position.set(sceneOffset.x, sceneOffset.y);

  geometries.forEach((geometry, i) => {
    const win = windowManager.getWindows()[i];
    const posTarget = {
      x: win.shape.x + win.shape.w * 0.5,
      y: win.shape.y + win.shape.h * 0.5,
    };

    geometry.position.x += (posTarget.x - geometry.position.x) * falloff;
    geometry.position.y += (posTarget.y - geometry.position.y) * falloff;
    geometry.rotation.x = currentTime * 0.5;
    geometry.rotation.y = currentTime * 0.3;
  });

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
