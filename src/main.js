import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'

// --- Configuration ---
const CONFIG = {
  // === Tree Settings ===
  treeHeight: 80,
  treeRadius: 30,
  particleCount: 15000,
  autoRotateSpeed: 0,

  // === Text Settings ===
  text: "MERRY CHRISTMAS\n Yuki 宝宝",
  textFont: "MengquRuantang, sans-serif",  // 萌趣软糖体
  textColor: [1, 0.3, 0.2],      // RGB - 纯红色
  textSize: 0.15,
  textY: 40,
  textBrightness: 1,           // 亮度 (1=正常)
  textSaturation: 2,           // 饱和度 (1=正常, 2=很艳)
  textTwinkleSpeed: 5.0,
  textGlowIntensity: 0.3,

  // === Tree Colors ===
  colorLeaf: new THREE.Color(0x2d5a27),
  colorLeafBright: new THREE.Color(0x4ca64c),
  colorOrnament: [
    new THREE.Color(0xff0000), // Red
    new THREE.Color(0xffd700), // Gold
    new THREE.Color(0xffffff), // White
    new THREE.Color(0x0000ff), // Blue
  ]
};

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.FogExp2(0x050505, 0.002);

// UI Scene for static text
const sceneUI = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 180);
camera.lookAt(0, 0, 0);

// UI Camera (Fixed)
const cameraUI = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
cameraUI.position.set(0, 0, 100); // Fixed position

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.autoClear = false; // Important for multi-pass rendering
document.body.appendChild(renderer.domElement);

// --- Helpers ---
const textureLoader = new THREE.TextureLoader();
const createGlowTexture = () => {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};
const particleTexture = createGlowTexture();

// --- Components ---


// --- Components ---

/**
 * Creates the Particle Tree
 */
function createTree() {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  const sizes = [];
  const speeds = []; // For twinkling or movement
  const phases = []; // For blinking timing

  const { treeHeight, treeRadius, particleCount } = CONFIG;

  // 1. Core / Main Branches (Original logic enhanced)
  const branchCount = particleCount * 0.7;
  for (let i = 0; i < branchCount; i++) {
    const yRatio = Math.random();
    const y = yRatio * treeHeight;
    const rAtHeight = treeRadius * (1 - yRatio);

    // Spiral logic with more chaos for "natural" look
    const spiralTurns = 12;
    const spiralAngle = yRatio * Math.PI * 2 * spiralTurns;
    const randomOffset = (Math.random() - 0.5) * 2.5;
    const angle = spiralAngle + randomOffset;

    // Distribute more evenly within the 'branch' thickness
    const r = rAtHeight * (0.6 + Math.random() * 0.4);

    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    positions.push(x, y - treeHeight / 2, z);

    // Color logic
    const isOrnament = Math.random() < 0.08;
    let color;
    let size;

    if (isOrnament) {
      color = CONFIG.colorOrnament[Math.floor(Math.random() * CONFIG.colorOrnament.length)];
      size = Math.random() * 1.5 + 1.2;
    } else {
      color = CONFIG.colorLeaf.clone().lerp(CONFIG.colorLeafBright, Math.random());
      size = Math.random() * 0.8 + 0.4;
    }

    colors.push(color.r, color.g, color.b);
    sizes.push(size);
    speeds.push(Math.random());
    phases.push(Math.random() * Math.PI * 2);
  }

  // 2. Garlands (Smooth ribbons wrapping around)
  const garlandCount = particleCount * 0.2; // 20% of particles
  const garlandStrands = 3; // Number of distinct ribbons

  for (let i = 0; i < garlandCount; i++) {
    // Create distinct strands
    const strandId = Math.floor(Math.random() * garlandStrands);
    const strandOffset = (strandId / garlandStrands) * Math.PI * 2;

    const yRatio = Math.random();
    const y = yRatio * treeHeight;
    const rAtHeight = treeRadius * (1 - yRatio) + 1.5; // Slightly outside the tree

    // Tighter, smoother spiral for garland
    const spiralTurns = 8;
    const angle = yRatio * Math.PI * 2 * spiralTurns + strandOffset;

    // Less jitter
    const r = rAtHeight;

    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    positions.push(x, y - treeHeight / 2, z);

    // Gold/Silver Garlands
    const color = new THREE.Color(0xffd700).lerp(new THREE.Color(0xffffff), Math.random() * 0.5);
    colors.push(color.r, color.g, color.b);
    sizes.push(1.2); // Uniformly bright
    speeds.push(0); // Garlands don't twinkle as much, or maybe they flow?
    phases.push(yRatio * 10); // Phase based on height for flowing light effect
  }

  // 3. Inner Volume (Fill the void)
  const fillCount = particleCount * 0.1;
  for (let i = 0; i < fillCount; i++) {
    const yRatio = Math.random();
    const y = yRatio * treeHeight;
    const rAtHeight = treeRadius * (1 - yRatio);

    // Random fill
    const r = Math.sqrt(Math.random()) * rAtHeight * 0.7; // Closer to center
    const angle = Math.random() * Math.PI * 2;

    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    positions.push(x, y - treeHeight / 2, z);

    // Darker inner leaves
    const color = CONFIG.colorLeaf.clone().multiplyScalar(0.7);
    colors.push(color.r, color.g, color.b);
    sizes.push(0.5);
    speeds.push(Math.random());
    phases.push(0);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('speed', new THREE.Float32BufferAttribute(speeds, 1));
  geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));

  const material = new THREE.PointsMaterial({
    size: 1,
    vertexColors: true,
    map: particleTexture,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });

  const tree = new THREE.Points(geometry, material);
  return tree;
}

const tree = createTree();
scene.add(tree);

/**
 * Tree Trunk & Internal Branches (Organic Continuous Lines)
 */
function createTrunk() {
  const trunkHeight = 25;
  const branchHeight = CONFIG.treeHeight * 0.8; // Extend 80% up the tree
  const trunkRadius = 3;
  const lineCount = 300;
  const segments = 40; // Increased resolution for longer lines

  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];

  const colorRoot = new THREE.Color(0x2a1505); // Darker roots
  const colorTrunk = new THREE.Color(0x8B4513); // Brown body
  const colorBranch = new THREE.Color(0x5c4033); // Darker branch color inside

  for (let i = 0; i < lineCount; i++) {
    // Initial angle around circle
    const startAngle = (i / lineCount) * Math.PI * 2 + (Math.random() * 0.5);

    let currentPos = new THREE.Vector3();
    let prevColor = null; // Store previous color

    // Each line goes from bottom of trunk to top of internal branches
    // yBase = -CONFIG.treeHeight / 2
    // Start Y = yBase - trunkHeight
    // End Y = yBase + branchHeight

    const yBase = -CONFIG.treeHeight / 2;
    const totalH = trunkHeight + branchHeight;

    // Randomize height slightly so branches end at different levels
    const myBranchHeight = branchHeight * (0.5 + Math.random() * 0.5);

    for (let j = 0; j <= segments; j++) {
      const t = j / segments;

      // Map t to Y coordinate
      // We want non-linear distribution maybe? Linear is fine for now.
      // Let's separate trunk part and branch part based on real Y

      // Normalize t to cover the full range of THIS line
      const yRel = (t * (trunkHeight + myBranchHeight)) - trunkHeight;
      const yActual = yBase + yRel;

      let r, angle, noiseX, noiseZ;
      let colCurrent;

      if (yRel < 0) {
        // TRUNK / ROOTS SECTION
        const tTrunk = (yRel + trunkHeight) / trunkHeight; // 0 (bottom) to 1 (base of tree)

        // Root flare
        const flare = Math.pow(1 - tTrunk, 3) * 8;
        r = trunkRadius + flare + (Math.random() * 0.2);

        //  Twist
        const twist = tTrunk * Math.PI;
        angle = startAngle + twist;

        noiseX = Math.sin(tTrunk * 20 + i) * 0.3;
        noiseZ = Math.cos(tTrunk * 20 + i) * 0.3;

        colCurrent = colorRoot.clone().lerp(colorTrunk, tTrunk);

      } else {
        // BRANCH SECTION (Inside Tree)
        const tBranch = yRel / myBranchHeight; // 0 (base) to 1 (tip)

        // Disperse outwards
        // Cone radius at this height
        const coneR = CONFIG.treeRadius * (1 - (yRel / CONFIG.treeHeight));

        // Branches shouldn't be surface, but internal structure.
        // Spread from trunkRadius out to random % of coneR
        // As we go up, we want to spread out.

        const spreadFactor = Math.pow(tBranch, 0.5); // Spread quickly then linear
        const maxSpread = Math.max(trunkRadius, coneR * 0.6); // Stay within 60% of volume

        r = trunkRadius + (maxSpread - trunkRadius) * spreadFactor;

        // Add significant jitter/branching chaos
        // We use i (line index) to determine distinct "branch" paths
        const branchNoise = (Math.sin(tBranch * 10 + i * 5) + Math.cos(tBranch * 15)) * (tBranch * 5);

        r += branchNoise;

        // STRICT CONSTRAINT: Keep branches inside the foliage cone
        // Calculate cone radius at this height
        const coneRadiusAtHeight = CONFIG.treeRadius * (1 - (yRel / CONFIG.treeHeight));
        // Safety margin of 2 units to ensure they are deeply inside
        const maxAllowedR = Math.max(0.1, coneRadiusAtHeight - 2);

        if (r > maxAllowedR) {
          r = maxAllowedR;
        }

        // Initial twist continues but maybe slows down or changes
        angle = startAngle + Math.PI + (Math.sin(tBranch * 5 + i) * 1.0); // Wavy branches

        noiseX = 0;
        noiseZ = 0;

        colCurrent = colorTrunk.clone().lerp(colorBranch, tBranch);
      }

      const x = Math.cos(angle) * r + noiseX;
      const z = Math.sin(angle) * r + noiseZ;

      if (j > 0) {
        positions.push(currentPos.x, currentPos.y, currentPos.z);
        positions.push(x, yActual, z);

        // Use previous color for start of segment, current color for end
        colors.push(prevColor.r, prevColor.g, prevColor.b);
        colors.push(colCurrent.r, colCurrent.g, colCurrent.b);
      }

      // Store for next step
      currentPos.set(x, yActual, z);
      prevColor = colCurrent; // Update prevColor for the next iteration
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });

  return new THREE.LineSegments(geometry, material);
}

const trunk = createTrunk();
scene.add(trunk);

// Star at top (3D Extruded Mesh)
const createStarGeometry = (radius = 5, depth = 2) => {
  const shape = new THREE.Shape();
  const points = 5;

  for (let i = 0; i < points * 2; i++) {
    const l = i % 2 === 1 ? radius * 0.5 : radius;
    const a = (i / points) * Math.PI;
    const x = Math.sin(a) * l;
    const y = Math.cos(a) * l;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const extrudeSettings = {
    steps: 1,
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.5,
    bevelSegments: 2
  };

  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
};

const starGeo = createStarGeometry(3, 1.5);
const starMat = new THREE.MeshBasicMaterial({
  color: 0x88ccff, // Light Blue
  transparent: false,
  opacity: 1.0
});

const star = new THREE.Mesh(starGeo, starMat);
star.position.set(0, CONFIG.treeHeight / 2 + 2, 0);
// Orient correctly (Shape is drawn in XY plane, extruded in Z)
// We want it upright?
// Default shape is in XY. Extrusion is along Z.
// If we want "front view is star", we face Z ?
// Let's just center geometry and see.
starGeo.center();
scene.add(star);

// Star Outline
const edges = new THREE.EdgesGeometry(starGeo);
const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
const starLines = new THREE.LineSegments(edges, lineMat);
// Since star lines are children of star or same position?
// Best just add to star so they move together
star.add(starLines);

// Star Glow Halo
const haloGeo = new THREE.BufferGeometry();
haloGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, CONFIG.treeHeight / 2 + 2, 0], 3));
const haloMat = new THREE.PointsMaterial({
  color: 0xaaddff, // Cool blue glow
  size: 20,
  map: particleTexture,
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  sizeAttenuation: true
});
const halo = new THREE.Points(haloGeo, haloMat);
scene.add(halo);


/**
 * Snow Particles
 */
function createSnow() {
  const count = 5000; // Increased from 2000
  const geo = new THREE.BufferGeometry();
  const pos = [];

  for (let i = 0; i < count; i++) {
    pos.push(
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 200
    );
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    map: particleTexture,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  return new THREE.Points(geo, mat);
}
const snow = createSnow();
scene.add(snow);



/**
 * 3D Text Particles
 */
function createTextParticles(textString) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fontSize = 80;
  const width = 1000;
  const height = 300;
  canvas.width = width;
  canvas.height = height;

  // Draw Text
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${fontSize}px ${CONFIG.textFont}`;
  ctx.fillStyle = '#ffffff';

  // Handle multiline
  const lines = textString.split('\n');
  lines.forEach((line, i) => {
    const y = height / 2 + (i - (lines.length - 1) / 2) * fontSize * 1.2;
    ctx.fillText(line, width / 2, y);
  });

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const positions = [];
  const colors = [];
  const origins = []; // Store original destination

  for (let y = 0; y < height; y += 2) { // Skip steps for density
    for (let x = 0; x < width; x += 2) {
      const index = (y * width + x) * 4;
      const r = data[index];
      if (r > 128) { // Threshold
        // Map x,y to 3D space using CONFIG
        const pX = (x - width / 2) * CONFIG.textSize;
        const pY = -(y - height / 2) * CONFIG.textSize + CONFIG.textY;
        const pZ = 0;

        positions.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200); // Start scattered
        origins.push(pX, pY, pZ);

        colors.push(CONFIG.textColor[0], CONFIG.textColor[1], CONFIG.textColor[2]);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('targetPos', new THREE.Float32BufferAttribute(origins, 3));

  const mat = shaderMaterial(
    '/src/shaders/text.vs',
    '/src/shaders/text.fs',
    {
      uniforms: {
        time: { value: 0 },
        pointTexture: { value: particleTexture },
        brightness: { value: CONFIG.textBrightness },
        saturation: { value: CONFIG.textSaturation },
        twinkleSpeed: { value: CONFIG.textTwinkleSpeed },
        glowIntensity: { value: CONFIG.textGlowIntensity }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    }
  );

  const points = new THREE.Points(geo, mat);
  return points;
}

// Wait for font to load, then create text
let textParticles;
document.fonts.load(`bold 80px ${CONFIG.textFont}`).then(() => {
  textParticles = createTextParticles(CONFIG.text);
  sceneUI.add(textParticles);

  // Setup animation after text is created
  setupTextAnimation();
}).catch(() => {
  // Fallback: create with default font if custom fails
  console.warn('Custom font failed to load, using fallback');
  textParticles = createTextParticles(CONFIG.text);
  sceneUI.add(textParticles);
  setupTextAnimation();
});

function setupTextAnimation() {
  const posAttr = textParticles.geometry.attributes.position;
  const startPosArray = new Float32Array(posAttr.array);
  textParticles.geometry.setAttribute('startPos', new THREE.BufferAttribute(startPosArray, 3));
}


// --- Animation Control ---

const animState = { progress: 0, finalized: false };
gsap.to(animState, {
  progress: 1,
  duration: 3,
  ease: "power2.out",
  delay: 1.5, // Slightly longer delay to ensure font loads
  onUpdate: () => {
    // Interpolate positions handled in loop
  }
});


// --- Dual Galaxy Base ---

// 1. Original Spiral Galaxy (Now Cool Colors)
function createSpiralGalaxy() {
  const particleCount = 20000; // Original count
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  const sizes = [];
  const phases = [];

  // Swapped from Cloud Sea
  const colorInside = new THREE.Color(0xe0f7fa);  // Light Cyan/White
  const colorOutside = new THREE.Color(0x0288d1); // Light Blue

  const radius = 150;
  const branches = 5;

  for (let i = 0; i < particleCount; i++) {
    const r = Math.random() * radius;
    const spinAngle = r * 0.05;
    const branchAngle = (i % branches) / branches * Math.PI * 2;

    const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * (r * 0.5);
    const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * (r * 0.2);
    const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * (r * 0.5);

    const x = Math.cos(branchAngle + spinAngle) * r + randomX;
    const y = randomY - CONFIG.treeHeight / 2 - 10;
    const z = Math.sin(branchAngle + spinAngle) * r + randomZ;

    positions.push(x, y, z);

    const mixedColor = colorInside.clone().lerp(colorOutside, r / radius);

    colors.push(mixedColor.r, mixedColor.g, mixedColor.b);
    sizes.push(Math.random() * 2);
    phases.push(Math.random() * Math.PI * 2);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));

  const material = new THREE.PointsMaterial({
    size: 1,
    vertexColors: true,
    map: particleTexture,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });

  return new THREE.Points(geometry, material);
}

// 2. Dense Cloud Sea (Now Warm Colors)
function createCloudSea() {
  const particleCount = 1000000; // Even denser
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  const sizes = [];
  const phases = [];

  // Swapped from Spiral Galaxy
  const colorInside = new THREE.Color(0xff6030);  // Warm orange/pink
  const colorOutside = new THREE.Color(0x1b3984); // Deep blue

  const maxRadius = 350; // Wide

  for (let i = 0; i < particleCount; i++) {
    const r = Math.sqrt(Math.random()) * maxRadius;
    const theta = Math.random() * Math.PI * 2;

    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;

    // Waves
    const wave1 = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 5;
    const wave2 = Math.sin(x * 0.1 + 10) * Math.sin(z * 0.15) * 2;
    const yBase = -CONFIG.treeHeight / 2 - 10; // Aligned with Spiral Galaxy
    const y = yBase + wave1 + wave2 + (Math.random() - 0.5) * 6;

    positions.push(x, y, z);

    const mixedColor = colorInside.clone().lerp(colorOutside, Math.random());

    colors.push(mixedColor.r, mixedColor.g, mixedColor.b);
    sizes.push(Math.random() * 1.5 + 0.5);
    phases.push(Math.random() * Math.PI * 2);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));

  const material = new THREE.PointsMaterial({
    size: 0.8, // Slightly smaller particles for density
    vertexColors: true,
    map: particleTexture,
    transparent: true,
    opacity: 0.5, // Ethereal
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });

  return new THREE.Points(geometry, material);
}

const spiralGalaxy = createSpiralGalaxy();
const cloudSea = createCloudSea();
scene.add(spiralGalaxy);
scene.add(cloudSea);

// --- Starry Sky Background ---
import { shaderMaterial } from './shaders/shaderHelper.js';

// Define URLs for shaders
// Note: We use raw imports via Vite if possible, but shaderHelper uses FileLoader.
// FileLoader loads via fetch. In Vite, /src/shaders/... usually works.
const starryMaterial = shaderMaterial(
  '/src/shaders/stars.vs',
  '/src/shaders/stars.fs',
  {
    side: THREE.BackSide,
    uniforms: {
      time: { value: 0 }
    }
  }
);

const skyGeometry = new THREE.SphereGeometry(400, 64, 64);
const skybox = new THREE.Mesh(skyGeometry, starryMaterial);
scene.add(skybox);

// --- Controls ---
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = CONFIG.autoRotateSpeed;
controls.minDistance = 50;
controls.maxDistance = 300;
controls.maxPolarAngle = Math.PI / 1.5; // Prevent going too far below

// --- Main Loop ---

const clock = new THREE.Clock();



function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  controls.update();

  // Pulse effect for tree particles (optional)
  // Accessing buffer in loop can be expensive if large, but 15k is manageable on desktop.

  // Twinkle Tree Particles
  const colors = tree.geometry.attributes.color;
  const speeds = tree.geometry.attributes.speed;
  const phases = tree.geometry.attributes.phase;

  // Actually, I can pulse the star size?
  const starScale = 1 + Math.sin(time * 3) * 0.05; // Reduced amplitude as requested
  star.scale.set(starScale, starScale, starScale);
  halo.scale.set(starScale, starScale, starScale); // Pulse halo with star

  // Animate Snow
  const snowPos = snow.geometry.attributes.position;
  for (let i = 0; i < snowPos.count; i++) {
    let y = snowPos.getY(i);
    y -= 0.05; // Slightly faster than 0.03 to make falling "obvious", but still slow
    if (y < -100) y = 100;
    snowPos.setY(i, y);

    // Wiggle
    let x = snowPos.getX(i);
    x += Math.sin(time * 0.5 + y) * 0.005; // Reduced drift significantly
    snowPos.setX(i, x);
  }
  snowPos.needsUpdate = true;

  // Animate Galaxies
  if (spiralGalaxy) spiralGalaxy.rotation.y = time * 0.05; // Inner spiral
  if (cloudSea) cloudSea.rotation.y = time * 0.02; // Outer sea slower

  // Animate Skybox Stars
  if (starryMaterial) starryMaterial.uniforms.time.value = time;
  if (skybox) skybox.rotation.y = time * 0.01; // Very slow rotation for the sky

  // Text Animation (only if textParticles exists)
  if (textParticles && textParticles.geometry.attributes.startPos) {
    // Update Text Shader Time
    if (textParticles.material.uniforms) {
      textParticles.material.uniforms.time.value = time;
    }

    const pos = textParticles.geometry.attributes.position;
    const start = textParticles.geometry.attributes.startPos;
    const target = textParticles.geometry.attributes.targetPos;

    if (animState.progress < 1) {
      const p = animState.progress;

      for (let i = 0; i < pos.count; i++) {
        const x = start.getX(i) + (target.getX(i) - start.getX(i)) * p;
        const y = start.getY(i) + (target.getY(i) - start.getY(i)) * p;
        const z = start.getZ(i) + (target.getZ(i) - start.getZ(i)) * p;
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    } else if (!animState.finalized) {
      // Snap to final positions once
      animState.finalized = true;
      for (let i = 0; i < pos.count; i++) {
        pos.setXYZ(i, target.getX(i), target.getY(i), target.getZ(i));
      }
      pos.needsUpdate = true;
    }
  }

  // Render Main Scene
  renderer.clear();
  renderer.render(scene, camera);

  // Render UI Scene
  renderer.clearDepth();
  renderer.render(sceneUI, cameraUI);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  cameraUI.aspect = window.innerWidth / window.innerHeight;
  cameraUI.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

// Eastern Time Clock (秒精度)
function updateClock() {
  const now = new Date();
  const options = {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  const timeStr = now.toLocaleString('en-US', options);
  document.getElementById('clock').textContent = `${timeStr}`;
}
updateClock();
setInterval(updateClock, 1000);
