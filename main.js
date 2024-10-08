import WindowManager from "./WindowManager.js";

const t = THREE;
let camera, scene, renderer, world;
let near, far;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let geometries = [];
let sceneOffsetTarget = { x: 0, y: 0 };
let sceneOffset = { x: 0, y: 0 };

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let internalTime = getTime();
let windowManager;
let initialized = false;

// get time in seconds since beginning of the day (so that all windows use the same time)
function getTime() {
  return (new Date().getTime() - today) / 1000.0;
}

if (new URLSearchParams(window.location.search).get("clear")) {
  localStorage.clear();
} else {
  // circumvent preloading
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState != "hidden" && !initialized) {
      init();
    }
  });

  window.onload = () => {
    if (document.visibilityState != "hidden") {
      init();
    }
  };

  function init() {
    initialized = true;

    // add a short timeout because window.offsetX reports wrong values before a short period
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
    camera = new t.OrthographicCamera(0, 0, window.innerWidth, window.innerHeight, -10000, 10000);

    camera.position.z = 2.5;
    near = camera.position.z - 0.5;
    far = camera.position.z + 0.5;

    scene = new t.Scene();
    scene.background = new t.Color(0.0);
    scene.add(camera);

    renderer = new t.WebGLRenderer({ antialias: true, depthBuffer: true });
    renderer.setPixelRatio(pixR);

    world = new t.Object3D();
    scene.add(world);

    renderer.domElement.setAttribute("id", "scene");
    document.body.appendChild(renderer.domElement);
  }

  function setupWindowManager() {
    windowManager = new WindowManager();
    windowManager.setWinShapeChangeCallback(updateWindowShape);
    windowManager.setWinChangeCallback(windowsUpdated);

    // add custom metadata to each windows instance
    let metaData = { foo: "bar" };

    // init the windowmanager and add the new window to the centralised pool of windows
    windowManager.init(metaData);

    // call update windows initially (it will later be called by the win change callback)
    windowsUpdated();
  }

  function windowsUpdated() {
    updateNumberOfgeometries();
  }

  function updateNumberOfgeometries() {
    let wins = windowManager.getWindows();
    // console.log(wins);

    // remove all geometries
    geometries.forEach((c) => {
      world.remove(c);
    });

    // console.log(geometries.length);

    geometries = [];

    // add new geometries based on the current window setup
    for (let i = 0; i < wins.length; i++) {
      let win = wins[i];

      let c = new t.Color();
      c.setHSL(i * 0.1, 1.0, 0.5);

      let s = 100 + i * 50;

      let geometry = new t.Mesh(
        // new t.BoxGeometry(s, s, s),
        new t.IcosahedronGeometry(s, 4, 30),
        new t.MeshBasicMaterial({ color: c, wireframe: true })
      );

      geometry.position.x = win.shape.x + win.shape.w * 0.5;
      geometry.position.y = win.shape.y + win.shape.h * 0.5;

      world.add(geometry);
      geometries.push(geometry);
    }
  }
  // TODO: fix That     EDIT: fix what?

  function updateWindowShape(easing = true) {
    // storing the offset in a proxy that is updated against in the render function
    sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
    if (!easing) sceneOffset = sceneOffsetTarget;
  }

  function render() {
    let t = getTime();

    windowManager.update();

    // calculate the new position based on the delta between current offset and new offset times a falloff value
    // tldr: smoothing effect
    let falloff = 0.05;
    sceneOffset.x = sceneOffset.x + (sceneOffsetTarget.x - sceneOffset.x) * falloff;
    sceneOffset.y = sceneOffset.y + (sceneOffsetTarget.y - sceneOffset.y) * falloff;

    // set the world position to the offset
    world.position.x = sceneOffset.x;
    world.position.y = sceneOffset.y;

    let wins = windowManager.getWindows();

    // loop through all geometries and update positions based on current window positions
    for (let i = 0; i < geometries.length; i++) {
      let geometry = geometries[i];
      let win = wins[i];
      let _t = t; // + i * 0.2;

      let posTarget = { x: win.shape.x + win.shape.w * 0.5, y: win.shape.y + win.shape.h * 0.5 };

      geometry.position.x = geometry.position.x + (posTarget.x - geometry.position.x) * falloff;
      geometry.position.y = geometry.position.y + (posTarget.y - geometry.position.y) * falloff;
      geometry.rotation.x = _t * 0.5;
      geometry.rotation.y = _t * 0.3;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  // resize the renderer to fit the window size
  function resize() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
}
