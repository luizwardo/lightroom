// main.js - Interactive 2.5D Bedroom Scene with Three.js

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f1a);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene-canvas'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.physicallyCorrectLights = true;
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

// Camera controls for free look and movement
const pointerControls = new THREE.PointerLockControls(camera, renderer.domElement);
pointerControls.getObject().position.set(0, 2.5, 3);
scene.add(pointerControls.getObject());

renderer.domElement.addEventListener('click', () => {
    if (!pointerControls.isLocked) {
        pointerControls.lock();
    }
});

const roomWidth = 14;
const roomDepth = 16;
const roomHeight = 10;
const wallColor = 0xffffff;
const wallDividerColor = 0xf4f2ec;
const warmLightColor = 0xffe2b2;
const bedOliveColor = 0x7b8446;
const bedOliveAccentColor = 0x8d9857;

function createPaneledSurface(width, height, options = {}) {
    const {
        color = wallColor,
        dividerColor = wallDividerColor,
        columns = 3,
        rows = 2,
        dividerThickness = 0.05,
        dividerDepth = 0.03,
        inset = 0.14
    } = options;

    const group = new THREE.Group();
    const baseMaterial = new THREE.MeshStandardMaterial({
        color,
        side: THREE.DoubleSide,
        roughness: 0.9,
        metalness: 0.0
    });
    const baseSurface = new THREE.Mesh(new THREE.PlaneGeometry(width, height), baseMaterial);
    baseSurface.position.z = -0.002;
    baseSurface.receiveShadow = true;
    group.add(baseSurface);

    const dividerMaterial = new THREE.MeshStandardMaterial({
        color: dividerColor,
        roughness: 0.85,
        metalness: 0.0
    });
    const innerWidth = width - inset * 2;
    const innerHeight = height - inset * 2;
    const dividerOffset = dividerDepth / 2 + 0.005;

    for (let column = 1; column < columns; column++) {
        const divider = new THREE.Mesh(
            new THREE.BoxGeometry(dividerThickness, innerHeight, dividerDepth),
            dividerMaterial
        );
        divider.position.set(
            -width / 2 + inset + (innerWidth / columns) * column,
            0,
            dividerOffset
        );
        divider.castShadow = true;
        divider.receiveShadow = true;
        group.add(divider);
    }

    for (let row = 1; row < rows; row++) {
        const divider = new THREE.Mesh(
            new THREE.BoxGeometry(innerWidth, dividerThickness, dividerDepth),
            dividerMaterial
        );
        divider.position.set(
            0,
            -height / 2 + inset + (innerHeight / rows) * row,
            dividerOffset
        );
        divider.castShadow = true;
        divider.receiveShadow = true;
        group.add(divider);
    }

    return group;
}

function createRoundedPrism(width, depth, height, radius, color) {
    const shape = new THREE.Shape();
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const cornerRadius = Math.min(radius, halfWidth, halfDepth);

    shape.moveTo(-halfWidth + cornerRadius, -halfDepth);
    shape.lineTo(halfWidth - cornerRadius, -halfDepth);
    shape.quadraticCurveTo(halfWidth, -halfDepth, halfWidth, -halfDepth + cornerRadius);
    shape.lineTo(halfWidth, halfDepth - cornerRadius);
    shape.quadraticCurveTo(halfWidth, halfDepth, halfWidth - cornerRadius, halfDepth);
    shape.lineTo(-halfWidth + cornerRadius, halfDepth);
    shape.quadraticCurveTo(-halfWidth, halfDepth, -halfWidth, halfDepth - cornerRadius);
    shape.lineTo(-halfWidth, -halfDepth + cornerRadius);
    shape.quadraticCurveTo(-halfWidth, -halfDepth, -halfWidth + cornerRadius, -halfDepth);

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: height,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: Math.min(cornerRadius * 0.3, 0.08),
        bevelThickness: Math.min(height * 0.16, 0.08),
        curveSegments: 24
    });
    geometry.center();

    const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.75,
        metalness: 0.05
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

function createWallTextures() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#f1eee7');
    gradient.addColorStop(1, '#e7e2d9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 3200; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const w = Math.random() * 3 + 1;
        const h = Math.random() * 3 + 1;
        const shade = 222 + Math.random() * 20;
        ctx.fillStyle = `rgba(${shade}, ${shade - 4}, ${shade - 8}, 0.08)`;
        ctx.fillRect(x, y, w, h);
    }

    for (let i = 0; i < 36; i++) {
        const radius = Math.random() * 55 + 20;
        const x = Math.random() * size;
        const y = Math.random() * size;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bumpCtx = bumpCanvas.getContext('2d');
    bumpCtx.fillStyle = 'rgb(128, 128, 128)';
    bumpCtx.fillRect(0, 0, size, size);

    for (let i = 0; i < 3800; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const w = Math.random() * 2 + 1;
        const h = Math.random() * 2 + 1;
        const shade = 118 + Math.random() * 18;
        bumpCtx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.35)`;
        bumpCtx.fillRect(x, y, w, h);
    }

    const map = new THREE.CanvasTexture(canvas);
    map.encoding = THREE.sRGBEncoding;
    const bump = new THREE.CanvasTexture(bumpCanvas);

    return { map, bump };
}

function createCeilingTextures() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#f6f2ea');
    gradient.addColorStop(1, '#f1ede4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 2400; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const shade = 235 + Math.random() * 12;
        ctx.fillStyle = `rgba(${shade}, ${shade - 2}, ${shade - 4}, 0.08)`;
        ctx.fillRect(x, y, 2, 2);
    }

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bumpCtx = bumpCanvas.getContext('2d');
    bumpCtx.fillStyle = 'rgb(128, 128, 128)';
    bumpCtx.fillRect(0, 0, size, size);

    for (let i = 0; i < 2600; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const shade = 122 + Math.random() * 10;
        bumpCtx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.18)`;
        bumpCtx.fillRect(x, y, 2, 2);
    }

    const map = new THREE.CanvasTexture(canvas);
    map.encoding = THREE.sRGBEncoding;
    const bump = new THREE.CanvasTexture(bumpCanvas);

    return { map, bump };
}

function createWallSurface(width, height, material, opening) {
    let geometry;
    if (opening) {
        const shape = new THREE.Shape();
        shape.moveTo(-width / 2, -height / 2);
        shape.lineTo(width / 2, -height / 2);
        shape.lineTo(width / 2, height / 2);
        shape.lineTo(-width / 2, height / 2);
        shape.lineTo(-width / 2, -height / 2);

        const hole = new THREE.Path();
        const halfHoleWidth = opening.width / 2;
        const halfHoleHeight = opening.height / 2;
        hole.moveTo(opening.x - halfHoleWidth, opening.y - halfHoleHeight);
        hole.lineTo(opening.x + halfHoleWidth, opening.y - halfHoleHeight);
        hole.lineTo(opening.x + halfHoleWidth, opening.y + halfHoleHeight);
        hole.lineTo(opening.x - halfHoleWidth, opening.y + halfHoleHeight);
        hole.lineTo(opening.x - halfHoleWidth, opening.y - halfHoleHeight);
        shape.holes.push(hole);

        geometry = new THREE.ShapeGeometry(shape);
    } else {
        // High density vertices ("blocks") for better shadow mapping and light gradients
        geometry = new THREE.PlaneGeometry(width, height, Math.max(1, Math.floor(width * 4)), Math.max(1, Math.floor(height * 4)));
    }

    // Material should be double-sided to block light from behind effectively
    const twoSidedMaterial = material.clone();
    twoSidedMaterial.side = THREE.DoubleSide;

    const wall = new THREE.Mesh(geometry, twoSidedMaterial);
    wall.receiveShadow = true;
    wall.castShadow = true; // Added so walls cast shadows
    return wall;
}

function createNightSkyTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, '#0a1020');
    gradient.addColorStop(0.7, '#0f1c2e');
    gradient.addColorStop(1, '#1b2b3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = 'rgba(255, 214, 170, 0.08)';
    ctx.fillRect(0, size * 0.72, size, size * 0.28);

    for (let i = 0; i < 120; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size * 0.65;
        const radius = Math.random() * 1.2 + 0.3;
        const alpha = Math.random() * 0.6 + 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    return texture;
}

function createLinenTextures() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f7f6f2';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(235, 235, 230, 0.6)';
    ctx.lineWidth = 1;
    for (let y = 0; y < size; y += 6) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(size, y + 0.5);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(244, 244, 238, 0.45)';
    for (let x = 0; x < size; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, size);
        ctx.stroke();
    }

    for (let i = 0; i < 2600; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const shade = 232 + Math.random() * 16;
        ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade - 3}, 0.2)`;
        ctx.fillRect(x, y, 2, 2);
    }

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bumpCtx = bumpCanvas.getContext('2d');
    bumpCtx.fillStyle = 'rgb(128, 128, 128)';
    bumpCtx.fillRect(0, 0, size, size);

    bumpCtx.strokeStyle = 'rgba(100, 100, 100, 0.35)';
    bumpCtx.lineWidth = 1;
    for (let y = 0; y < size; y += 6) {
        bumpCtx.beginPath();
        bumpCtx.moveTo(0, y + 0.5);
        bumpCtx.lineTo(size, y + 0.5);
        bumpCtx.stroke();
    }

    bumpCtx.strokeStyle = 'rgba(150, 150, 150, 0.25)';
    for (let x = 0; x < size; x += 8) {
        bumpCtx.beginPath();
        bumpCtx.moveTo(x + 0.5, 0);
        bumpCtx.lineTo(x + 0.5, size);
        bumpCtx.stroke();
    }

    const map = new THREE.CanvasTexture(canvas);
    map.encoding = THREE.sRGBEncoding;
    const bump = new THREE.CanvasTexture(bumpCanvas);

    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;

    return { map, bump };
}

const linenTextures = createLinenTextures();

function createLinenMaterial(repeatX, repeatY, color = 0xfaf9f6) {
    const map = linenTextures.map.clone();
    map.repeat.set(repeatX, repeatY);
    map.anisotropy = maxAnisotropy;
    map.needsUpdate = true;

    const bump = linenTextures.bump.clone();
    bump.repeat.set(repeatX, repeatY);
    bump.anisotropy = maxAnisotropy;
    bump.needsUpdate = true;

    return new THREE.MeshStandardMaterial({
        map,
        bumpMap: bump,
        bumpScale: 0.08,
        roughness: 0.82,
        metalness: 0.0,
        color
    });
}

function createLaminatedWoodTextures() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, size, 0);
    gradient.addColorStop(0, '#6f4e3a');
    gradient.addColorStop(1, '#7a5842');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 180; i++) {
        const y = Math.random() * size;
        const h = Math.random() * 2 + 0.5;
        const shade = 110 + Math.random() * 20;
        ctx.fillStyle = `rgba(${shade + 30}, ${shade + 20}, ${shade + 10}, 0.12)`;
        ctx.fillRect(0, y, size, h);
    }

    for (let i = 0; i < 2400; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const shade = 118 + Math.random() * 18;
        ctx.fillStyle = `rgba(${shade + 25}, ${shade + 15}, ${shade + 8}, 0.08)`;
        ctx.fillRect(x, y, 2, 1);
    }

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bumpCtx = bumpCanvas.getContext('2d');
    bumpCtx.fillStyle = 'rgb(128, 128, 128)';
    bumpCtx.fillRect(0, 0, size, size);

    for (let i = 0; i < 200; i++) {
        const y = Math.random() * size;
        const h = Math.random() * 2 + 0.5;
        const shade = 120 + Math.random() * 12;
        bumpCtx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.35)`;
        bumpCtx.fillRect(0, y, size, h);
    }

    const map = new THREE.CanvasTexture(canvas);
    map.encoding = THREE.sRGBEncoding;
    const bump = new THREE.CanvasTexture(bumpCanvas);

    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;

    return { map, bump };
}

const laminatedWoodTextures = createLaminatedWoodTextures();

function createWindow(width, height, options = {}) {
    const {
        frameThickness = 0.12,
        frameDepth = 0.14,
        frameColor = 0xd8d2c5,
        glassColor = 0x9cb3c9,
        glassOpacity = 0.35,
        frameSides = {}
    } = options;

    const resolvedFrameSides = {
        left: true,
        right: true,
        top: true,
        bottom: true,
        ...frameSides
    };

    const group = new THREE.Group();
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: frameColor,
        roughness: 0.55,
        metalness: 0.05
    });
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: glassColor,
        roughness: 0.15,
        metalness: 0.0,
        transparent: true,
        opacity: glassOpacity
    });

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const leftInset = resolvedFrameSides.left ? frameThickness : 0;
    const rightInset = resolvedFrameSides.right ? frameThickness : 0;
    const topInset = resolvedFrameSides.top ? frameThickness : 0;
    const bottomInset = resolvedFrameSides.bottom ? frameThickness : 0;

    const horizontalFrame = new THREE.BoxGeometry(width, frameThickness, frameDepth);
    const verticalFrameHeight = height - topInset - bottomInset;
    const verticalFrame = new THREE.BoxGeometry(frameThickness, verticalFrameHeight, frameDepth);
    const verticalCenterY = (bottomInset - topInset) / 2;

    if (resolvedFrameSides.top) {
        const topFrame = new THREE.Mesh(horizontalFrame, frameMaterial);
        topFrame.position.set(0, halfHeight - frameThickness / 2, 0);
        group.add(topFrame);
    }

    if (resolvedFrameSides.bottom) {
        const bottomFrame = new THREE.Mesh(horizontalFrame, frameMaterial);
        bottomFrame.position.set(0, -halfHeight + frameThickness / 2, 0);
        group.add(bottomFrame);
    }

    if (resolvedFrameSides.left) {
        const leftFrame = new THREE.Mesh(verticalFrame, frameMaterial);
        leftFrame.position.set(-halfWidth + frameThickness / 2, verticalCenterY, 0);
        group.add(leftFrame);
    }

    if (resolvedFrameSides.right) {
        const rightFrame = new THREE.Mesh(verticalFrame, frameMaterial);
        rightFrame.position.set(halfWidth - frameThickness / 2, verticalCenterY, 0);
        group.add(rightFrame);
    }

    const glassGeometry = new THREE.BoxGeometry(
        width - leftInset - rightInset,
        height - topInset - bottomInset,
        0.02
    );
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.z = -frameDepth / 2 + 0.02;
    glass.position.x = (leftInset - rightInset) / 2;
    glass.position.y = (topInset - bottomInset) / 2;
    group.add(glass);

    // Bamboo Slatted Blinds (Sudare style)
    if (options.addBlinds) {
        const blindWidth = width - leftInset - rightInset + 0.1;
        const blindHeight = height - topInset - bottomInset + 0.1;
        const blindGeo = new THREE.PlaneGeometry(blindWidth, blindHeight, 1, Math.floor(blindHeight * 20));
        
        // Procedurally generating wood slats texture via canvas
        const bSize = 512;
        const bCanvas = document.createElement('canvas');
        bCanvas.width = 64;  // Thin strips
        bCanvas.height = bSize;
        const bCtx = bCanvas.getContext('2d');
        for (let i = 0; i < bSize; i+=4) {
            bCtx.fillStyle = (i % 8 < 4) ? '#c9ab81' : '#b08d5c';
            bCtx.fillRect(0, i, 64, 4);
            // Draw string
            bCtx.fillStyle = '#555';
            bCtx.fillRect(16, i, 2, 4);
            bCtx.fillRect(48, i, 2, 4);
        }
        
        const bTexture = new THREE.CanvasTexture(bCanvas);
        bTexture.wrapS = THREE.RepeatWrapping;
        bTexture.wrapT = THREE.RepeatWrapping;
        bTexture.repeat.set(1, blindHeight * 10);
        bTexture.colorSpace = THREE.SRGBColorSpace;
        
        const blindMaterial = new THREE.MeshStandardMaterial({
            map: bTexture,
            roughness: 0.9,
            side: THREE.DoubleSide
        });
        
        const blind = new THREE.Mesh(blindGeo, blindMaterial);
        blind.position.z = frameDepth / 2 + 0.01;
        // Make the blind accessible outside the function
        group.userData.blind = blind;
        group.userData.blindHeight = blindHeight;
        group.userData.blindTargetOpen = false; // Closed by default
        group.add(blind);
    }

    group.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    return group;
}

// Lighting setup
const ambientLight = new THREE.AmbientLight(warmLightColor, 0.02); // Soft bounce fill
scene.add(ambientLight);

const leftLamp = new THREE.SpotLight(warmLightColor, 0, 6, Math.PI / 5, 0.7, 2);
leftLamp.castShadow = true;
leftLamp.shadow.mapSize.set(1024, 1024);
leftLamp.shadow.bias = -0.0001;

const rightLamp = new THREE.SpotLight(warmLightColor, 0, 6, Math.PI / 5, 0.7, 2);
rightLamp.castShadow = true;
rightLamp.shadow.mapSize.set(1024, 1024);
rightLamp.shadow.bias = -0.0001;

const ceilingPanelGroup = new THREE.Group();
const ceilingPanelGlowMaterial = new THREE.MeshStandardMaterial({
    color: 0xf1ede6,
    emissive: warmLightColor,
    emissiveIntensity: 0.0,
    roughness: 0.35,
    metalness: 0.1
});
const ceilingPanelGeometry = new THREE.BoxGeometry(0.85, 0.06, 0.85);
const ceilingPanelY = roomHeight / 2 - 0.06;
const ceilingPanelPositions = [
    new THREE.Vector3(-3.6, ceilingPanelY, -3.6),
    new THREE.Vector3(3.6, ceilingPanelY, -3.6),
    new THREE.Vector3(-3.6, ceilingPanelY, 3.6),
    new THREE.Vector3(3.6, ceilingPanelY, 3.6),
    new THREE.Vector3(0, ceilingPanelY, 0)
];

const ceilingPanelLights = [];
const ceilingPanelFills = [];

ceilingPanelPositions.forEach((position) => {
    const panel = new THREE.Mesh(ceilingPanelGeometry, ceilingPanelGlowMaterial);
    panel.position.copy(position);
    panel.castShadow = true;
    panel.receiveShadow = true;
    ceilingPanelGroup.add(panel);

    const spot = new THREE.SpotLight(warmLightColor, 0, 20, Math.PI / 2.4, 0.9, 1.5);
    spot.position.set(position.x, position.y - 0.03, position.z);
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.00008;

    const target = new THREE.Object3D();
    target.position.set(position.x, 1.7, position.z);
    spot.target = target;

    ceilingPanelGroup.add(spot);
    ceilingPanelGroup.add(target);
    ceilingPanelLights.push(spot);

    const fill = new THREE.PointLight(warmLightColor, 0, 18, 1.4);
    fill.position.set(position.x, position.y - 0.04, position.z);
    ceilingPanelGroup.add(fill);
    ceilingPanelFills.push(fill);
});

scene.add(ceilingPanelGroup);

const ceilingRoomFill = new THREE.PointLight(warmLightColor, 0, 24, 1.25);
ceilingRoomFill.position.set(0, 2.4, -0.2);
scene.add(ceilingRoomFill);

// Room geometry (simple boxes for demonstration - replace with Blender models)
// Floor
const textureLoader = new THREE.TextureLoader();
const woodTexture = textureLoader.load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');
const woodBump = textureLoader.load('https://threejs.org/examples/textures/hardwood2_bump.jpg');
woodTexture.encoding = THREE.sRGBEncoding;
woodTexture.wrapS = THREE.RepeatWrapping;
woodTexture.wrapT = THREE.RepeatWrapping;
woodTexture.repeat.set(4, 4);
woodBump.wrapS = THREE.RepeatWrapping;
woodBump.wrapT = THREE.RepeatWrapping;
woodBump.repeat.set(4, 4);
woodTexture.anisotropy = maxAnisotropy;
woodBump.anisotropy = maxAnisotropy;
const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
const floorMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture,
    color: 0x6b4f35,
    roughness: 0.72,
    metalness: 0.05,
    bumpMap: woodBump,
    bumpScale: 0.12
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Walls
const wallTextures = createWallTextures();
wallTextures.map.wrapS = THREE.RepeatWrapping;
wallTextures.map.wrapT = THREE.RepeatWrapping;
wallTextures.map.repeat.set(1.35, 1.35);
wallTextures.bump.wrapS = THREE.RepeatWrapping;
wallTextures.bump.wrapT = THREE.RepeatWrapping;
wallTextures.bump.repeat.set(1.35, 1.35);
wallTextures.map.anisotropy = maxAnisotropy;
wallTextures.bump.anisotropy = maxAnisotropy;

const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTextures.map,
    bumpMap: wallTextures.bump,
    bumpScale: 0.05,
    roughness: 0.93,
    metalness: 0.0,
    color: 0xf1ede6
});

const windowSize = { width: 2.25, height: 1.75 };
const leftWindowSize = {
    width: windowSize.width * 3,
    height: windowSize.height * 1.5
};
const windowStyle = {
    frameThickness: 0.12,
    frameDepth: 0.14,
    frameColor: 0xd8d2c5,
    glassColor: 0x9cb3c9,
    glassOpacity: 0.35,
    addBlinds: true
};

const rightWindowSize = { width: roomHeight / 2, height: roomHeight / 2 };
const rightWindowOpening = {
    width: rightWindowSize.width - windowStyle.frameThickness * 2,
    height: rightWindowSize.height - windowStyle.frameThickness * 2
};

const leftWindowOpening = {
    width: leftWindowSize.width - windowStyle.frameThickness * 2,
    height: leftWindowSize.height - windowStyle.frameThickness * 2
};

const rightWindowCenter = { 
    y: rightWindowSize.height / 2, 
    z: -roomDepth / 2 + rightWindowSize.width / 2 
};
const leftWindowCenter = {
    y: 2.6,
    z: roomDepth / 2 - leftWindowSize.width / 2
};

const backWall = createWallSurface(roomWidth, roomHeight, wallMaterial);
backWall.position.z = -roomDepth / 2;
scene.add(backWall);

const leftWall = createWallSurface(roomDepth, roomHeight, wallMaterial, {
    x: -leftWindowCenter.z,
    y: leftWindowCenter.y,
    width: leftWindowOpening.width,
    height: leftWindowOpening.height
});
leftWall.rotation.y = Math.PI / 2;
leftWall.position.x = -roomWidth / 2;
scene.add(leftWall);

const rightWall = createWallSurface(roomDepth, roomHeight, wallMaterial, {
    x: rightWindowCenter.z,
    y: rightWindowCenter.y,
    width: rightWindowOpening.width,
    height: rightWindowOpening.height
});
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.x = roomWidth / 2;
scene.add(rightWall);

const doorOpening = { width: 3.2, height: 4.5, x: 0, y: 4.5 / 2 };
const frontWall = createWallSurface(roomWidth, roomHeight, wallMaterial, doorOpening);
frontWall.rotation.y = Math.PI;
frontWall.position.z = roomDepth / 2;
scene.add(frontWall);

function createShojiDoor(width, height) {
    const group = new THREE.Group();
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3625, roughness: 0.8, metalness: 0.1 });
    const paperMaterial = new THREE.MeshStandardMaterial({
        color: 0xfffcf5, roughness: 0.8, metalness: 0.0, transparent: true, opacity: 0.6, side: THREE.DoubleSide
    });
    const fw = 0.08, fd = 0.04;

    const topF = new THREE.Mesh(new THREE.BoxGeometry(width, fw, fd), frameMaterial);
    topF.position.y = height / 2 - fw / 2;
    group.add(topF);

    const botF = new THREE.Mesh(new THREE.BoxGeometry(width, fw * 2, fd), frameMaterial);
    botF.position.y = -height / 2 + fw;
    group.add(botF);

    const leftF = new THREE.Mesh(new THREE.BoxGeometry(fw, height - fw * 3, fd), frameMaterial);
    leftF.position.set(-width / 2 + fw / 2, -fw * 0.5, 0);
    group.add(leftF);

    const rightF = new THREE.Mesh(new THREE.BoxGeometry(fw, height - fw * 3, fd), frameMaterial);
    rightF.position.set(width / 2 - fw / 2, -fw * 0.5, 0);
    group.add(rightF);

    const cols = 3;
    const rows = 8;
    const innerW = width - fw * 2;
    const innerH = height - fw * 3;

    for (let c = 1; c < cols; c++) {
        const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.02, innerH, fd + 0.01), frameMaterial);
        vBar.position.set(-width / 2 + fw + (innerW / cols) * c, -fw * 0.5, 0);
        group.add(vBar);
    }
    for (let r = 1; r < rows; r++) {
        const hBar = new THREE.Mesh(new THREE.BoxGeometry(innerW, 0.02, fd + 0.01), frameMaterial);
        hBar.position.set(0, -height / 2 + fw * 2 + (innerH / rows) * r, 0);
        group.add(hBar);
    }

    const paper = new THREE.Mesh(new THREE.PlaneGeometry(innerW, innerH), paperMaterial);
    paper.position.y = -fw * 0.5;
    group.add(paper);

    group.traverse(child => {
        if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
    return group;
}

const shojiPanelWidth = doorOpening.width / 2 + 0.04;
const leftPanel = createShojiDoor(shojiPanelWidth, doorOpening.height);
leftPanel.position.set(doorOpening.width / 4, doorOpening.height / 2, roomDepth / 2 - 0.02); // Slightly inset from wall
scene.add(leftPanel);

const rightPanel = createShojiDoor(shojiPanelWidth, doorOpening.height);
rightPanel.position.set(-doorOpening.width / 4 + 0.02, doorOpening.height / 2, roomDepth / 2 - 0.05); // Closed, slightly behind left panel to overlap
scene.add(rightPanel);

// Create an architectural wooden frame so the door is physically separated from the bare wall
const entranceFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.8, metalness: 0.05 });
const frameThickness = 0.15;
const frameDepth = 0.25;

const topEntranceFrame = new THREE.Mesh(new THREE.BoxGeometry(doorOpening.width + frameThickness * 2, frameThickness, frameDepth), entranceFrameMaterial);
topEntranceFrame.position.set(doorOpening.x, doorOpening.y + doorOpening.height / 2 + frameThickness / 2, roomDepth / 2 - 0.03);
scene.add(topEntranceFrame);

const leftEntranceFrame = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, doorOpening.height, frameDepth), entranceFrameMaterial);
leftEntranceFrame.position.set(doorOpening.x - doorOpening.width / 2 - frameThickness / 2, doorOpening.y, roomDepth / 2 - 0.03);
scene.add(leftEntranceFrame);

const rightEntranceFrame = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, doorOpening.height, frameDepth), entranceFrameMaterial);
rightEntranceFrame.position.set(doorOpening.x + doorOpening.width / 2 + frameThickness / 2, doorOpening.y, roomDepth / 2 - 0.03);
scene.add(rightEntranceFrame);

const leftWallWindow = createWindow(leftWindowSize.width, leftWindowSize.height, windowStyle);
leftWallWindow.position.set(-roomWidth / 2 + 0.06, leftWindowCenter.y, leftWindowCenter.z);
leftWallWindow.rotation.y = Math.PI / 2;
scene.add(leftWallWindow);

const rightWallWindow = createWindow(rightWindowSize.width, rightWindowSize.height, windowStyle);
rightWallWindow.position.set(roomWidth / 2 - 0.06, rightWindowCenter.y, rightWindowCenter.z);
rightWallWindow.rotation.y = -Math.PI / 2;
scene.add(rightWallWindow);

// --- 3D FOREST OUTSIDE ---

const forestGroup = new THREE.Group();

// Create noisy green grass texture
const grassCanvas = document.createElement('canvas');
grassCanvas.width = 512;
grassCanvas.height = 512;
const grassCtx = grassCanvas.getContext('2d');
grassCtx.fillStyle = '#1e3814'; // dark base
grassCtx.fillRect(0, 0, 512, 512);

// noise dots for grass blades
for (let i = 0; i < 50000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const isBright = Math.random() > 0.5;
    grassCtx.fillStyle = isBright ? '#3b5f2b' : '#264219';
    grassCtx.fillRect(x, y, 2, 4);
}
const grassTex = new THREE.CanvasTexture(grassCanvas);
grassTex.wrapS = THREE.RepeatWrapping;
grassTex.wrapT = THREE.RepeatWrapping;
grassTex.repeat.set(150, 150);

// Ground plane for the forest
const forestGroundGeo = new THREE.PlaneGeometry(350, 350);
const forestGroundMat = new THREE.MeshStandardMaterial({ 
    map: grassTex,
    color: 0x88aa77, // tint brightened for daylight
    roughness: 1.0, 
    metalness: 0.0 
});
const forestGround = new THREE.Mesh(forestGroundGeo, forestGroundMat);
forestGround.rotation.x = -Math.PI / 2;
forestGround.position.y = -2; // slightly below room floor
forestGround.receiveShadow = true;
forestGroup.add(forestGround);

// Function to generate organic, fluffy pine layers
function createOrganicPineLayer() {
    const geo = new THREE.ConeGeometry(2.6, 5.5, 9, 3);
    geo.translate(0, 5.5 / 2, 0); // shift origin to bottom
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        // apply noise to vertices that aren't the exact top tip or center base
        if (v.y > 0.1 && v.y < 5.4) {
            const noise = Math.sin(v.x * 5.0) * Math.sin(v.y * 6.0) * Math.cos(v.z * 5.0);
            const distXZ = Math.hypot(v.x, v.z);
            if (distXZ > 0) { // Push out organically
                v.x += (v.x / distXZ) * noise * 0.45;
                v.z += (v.z / distXZ) * noise * 0.45;
            }
            v.y += (Math.random() - 0.5) * 0.3; // Slight random vertical variation
        }
        pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
}

// Higher quality trees using organic geometry, 5 layers, shadows, and natural scatter
const treeCount = 1500;
const trunkGeo = new THREE.CylinderGeometry(0.25, 0.5, 3.5, 8);
const leafGeo = createOrganicPineLayer();

const trunkMat = new THREE.MeshStandardMaterial({ color: 0x211711, roughness: 0.95 });
const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }); 

const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
trunks.castShadow = true;
trunks.receiveShadow = true;

const leafLayers = [];
for (let j = 0; j < 5; j++) {
    const layerMesh = new THREE.InstancedMesh(leafGeo, leafMat, treeCount);
    layerMesh.castShadow = true;
    layerMesh.receiveShadow = true;
    leafLayers.push(layerMesh);
}

const dummy = new THREE.Object3D();
const colorHelper = new THREE.Color();

for (let i = 0; i < treeCount; i++) {
    // Generate trees in a radial ring to leave a large realistic open yard space
    const radius = 30 + Math.pow(Math.random(), 0.8) * 110; // Slightly denser away from house
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const scale = 0.7 + Math.random() * 1.6;
    const trunkY = -2 + (3.5 * scale) / 2; 

    // Add slight random tilt
    const tiltX = (Math.random() - 0.5) * 0.15;
    const tiltZ = (Math.random() - 0.5) * 0.15;
    const rotationY = Math.random() * Math.PI * 2;

    // Set Trunk
    dummy.position.set(x, trunkY, z);
    dummy.scale.set(scale, scale, scale);
    dummy.rotation.set(tiltX, rotationY, tiltZ);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);

    // Natural color variation for foliage
    const hue = 0.30 + Math.random() * 0.05;    // Varied mossy greens
    const sat = 0.35 + Math.random() * 0.25;    
    const light = 0.06 + Math.random() * 0.09;  
    colorHelper.setHSL(hue, sat, light);
    
    // 5 cascading layers of foliage per tree for dense realism
    const layerSettings = [
        { yOffset: 1.5, scaleMod: 1.0 },
        { yOffset: 3.5, scaleMod: 0.85 },
        { yOffset: 5.2, scaleMod: 0.7 },
        { yOffset: 6.8, scaleMod: 0.5 },
        { yOffset: 8.0, scaleMod: 0.35 }
    ];

    layerSettings.forEach((layer, index) => {
        dummy.position.set(x, -2 + layer.yOffset * scale, z);
        const lScale = scale * layer.scaleMod;
        
        // Randomize rotation slightly per layer to break up patterns
        dummy.rotation.set(tiltX, rotationY + Math.random(), tiltZ);
        dummy.scale.set(lScale, lScale * 0.9, lScale);
        dummy.updateMatrix();
        
        leafLayers[index].setMatrixAt(i, dummy.matrix);
        leafLayers[index].setColorAt(i, colorHelper);
    });
}

forestGroup.add(trunks);
leafLayers.forEach(layer => forestGroup.add(layer));

// Add moonlight for the forest (CHANGED TO DAYTIME SUNLIGHT)
const sunlight = new THREE.DirectionalLight(0xffa050, 4.0); // Warm fiery sunset daylight
sunlight.position.set(-140, 8, 45); // Very low horizon angle through left window for sunset
sunlight.castShadow = true;
sunlight.shadow.camera.left = -30;
sunlight.shadow.camera.right = 30;
sunlight.shadow.camera.top = 30;
sunlight.shadow.camera.bottom = -30;
sunlight.shadow.camera.far = 250;
sunlight.shadow.mapSize.set(2048, 2048);
sunlight.target.position.set(0, 0, 0);
scene.add(sunlight);
scene.add(sunlight.target);

// Visible physical sun mesh in the sky
const sunMeshGeo = new THREE.SphereGeometry(6, 32, 32);
const sunMeshMat = new THREE.MeshBasicMaterial({ color: 0xff6600, toneMapped: false });
const sunObj = new THREE.Mesh(sunMeshGeo, sunMeshMat);
sunObj.position.copy(sunlight.position);
scene.add(sunObj);

// Starry sky sphere enclosing the scene (CHANGED TO DAYTIME SKY)
const skyGeo = new THREE.SphereGeometry(150, 16, 16);
const skyMat = new THREE.MeshBasicMaterial({ color: 0xc46955, side: THREE.BackSide, toneMapped: false }); // Sunset sky color
const sky = new THREE.Mesh(skyGeo, skyMat);
forestGroup.add(sky);

scene.add(forestGroup);

// Ceiling
const ceilingTextures = createCeilingTextures();
ceilingTextures.map.wrapS = THREE.RepeatWrapping;
ceilingTextures.map.wrapT = THREE.RepeatWrapping;
ceilingTextures.map.repeat.set(1.2, 1.2);
ceilingTextures.bump.wrapS = THREE.RepeatWrapping;
ceilingTextures.bump.wrapT = THREE.RepeatWrapping;
ceilingTextures.bump.repeat.set(1.2, 1.2);
ceilingTextures.map.anisotropy = maxAnisotropy;
ceilingTextures.bump.anisotropy = maxAnisotropy;

const ceilingMaterial = new THREE.MeshStandardMaterial({
    map: ceilingTextures.map,
    bumpMap: ceilingTextures.bump,
    bumpScale: 0.02,
    roughness: 0.96,
    metalness: 0.0,
    color: 0xf6f3ec,
    side: THREE.DoubleSide
});
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth + 10), ceilingMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = roomHeight / 2;
ceiling.receiveShadow = true;
ceiling.castShadow = true;
scene.add(ceiling);

const bed = new THREE.Group();

const bedDepthScale = 0.9 * 1.2;
const bedBaseDepth = 4.9 * bedDepthScale;
const bedTopDepth = bedBaseDepth * (4.7 / 4.9);
const mattressDepth = bedBaseDepth * 0.9;
const duvetDepth = mattressDepth - 0.8;
const duvetZ = 0.4;
const pillowZ = -(bedBaseDepth / 2 - 0.75);
const backWallZ = -roomDepth / 2;
const bedCenterZ = backWallZ + bedBaseDepth / 2;

function createPuffedBox(width, height, depth, segments = 32, radius = 0.1) {
    const geometry = new THREE.BoxGeometry(width, height, depth, segments, Math.max(2, Math.floor(segments / 2)), segments);
    const position = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    const innerW = Math.max(0, width - radius * 2);
    const innerH = Math.max(0, height - radius * 2);
    const innerD = Math.max(0, depth - radius * 2);

    for (let i = 0; i < position.count; i++) {
        vertex.fromBufferAttribute(position, i);
        
        const cx = Math.max(-innerW / 2, Math.min(innerW / 2, vertex.x));
        const cy = Math.max(-innerH / 2, Math.min(innerH / 2, vertex.y));
        const cz = Math.max(-innerD / 2, Math.min(innerD / 2, vertex.z));
        
        const dx = vertex.x - cx;
        const dy = vertex.y - cy;
        const dz = vertex.z - cz;
        
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist > 0) {
            vertex.x = cx + (dx / dist) * radius;
            vertex.y = cy + (dy / dist) * radius;
            vertex.z = cz + (dz / dist) * radius;
        }

        const isDuvet = width > 2.0;
        if (isDuvet) {
            const drapeMask = Math.max(0, (vertex.y + height / 2) / height);
            const fold1 = Math.sin(vertex.x * 4) * Math.cos(vertex.z * 3) * 0.025;
            const fold2 = Math.sin(vertex.x * 9 + vertex.z * 5) * 0.01;
            const drop = Math.sin(vertex.z * 2.5) * 0.04 * (1 - drapeMask);
            vertex.y += (fold1 + fold2) * drapeMask;
            vertex.x += drop * Math.sign(vertex.x);
        } else {
            const safeW = innerW || 1;
            const safeD = innerD || 1;
            const pillowPlump = (1 - Math.pow(2 * cx / safeW, 2)) * (1 - Math.pow(2 * cz / safeD, 2)) * 0.05;
            const pillowWrinkle = Math.sin(vertex.x * 15) * Math.sin(vertex.z * 15) * 0.003;
            vertex.y += (vertex.y > 0 ? pillowPlump : -pillowPlump) + pillowWrinkle;
        }

        position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals();
    return geometry;
}

const bedLaminateMap = laminatedWoodTextures.map.clone();
bedLaminateMap.repeat.set(2.2, 1.2);
bedLaminateMap.anisotropy = maxAnisotropy;
bedLaminateMap.needsUpdate = true;

const bedLaminateBump = laminatedWoodTextures.bump.clone();
bedLaminateBump.repeat.set(2.2, 1.2);
bedLaminateBump.anisotropy = maxAnisotropy;
bedLaminateBump.needsUpdate = true;

const bedBaseMaterial = new THREE.MeshStandardMaterial({
    map: bedLaminateMap,
    bumpMap: bedLaminateBump,
    bumpScale: 0.02,
    color: 0x72513c,
    roughness: 0.5,
    metalness: 0.02
});

const bedBase = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.32, bedBaseDepth), bedBaseMaterial);
bedBase.position.y = 0.16;
bedBase.castShadow = true;
bedBase.receiveShadow = true;
bed.add(bedBase);

const bedTop = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.08, bedTopDepth), bedBaseMaterial);
bedTop.position.y = 0.32;
bedTop.castShadow = true;
bedTop.receiveShadow = true;
bed.add(bedTop);

const mattressMaterial = createLinenMaterial(2.6, 2.2, 0xfaf9f6);
const mattress = new THREE.Mesh(new THREE.BoxGeometry(4.15, 0.26, mattressDepth, 4, 2, 4), mattressMaterial);
mattress.position.y = 0.49;
mattress.castShadow = true;
mattress.receiveShadow = true;
bed.add(mattress);

const duvetMaterial = createLinenMaterial(3.2, 2.6, 0xfcfbf8);
duvetMaterial.bumpScale = 0.05;
duvetMaterial.roughness = 0.86;
const duvet = new THREE.Mesh(createPuffedBox(4.2, 0.22, duvetDepth + 0.1, 48, 0.25), duvetMaterial);
duvet.position.set(0, 0.64, duvetZ);
duvet.rotation.x = -0.02;
duvet.castShadow = true;
duvet.receiveShadow = true;
bed.add(duvet);

const pillowMaterial = createLinenMaterial(3.8, 3.2, 0xfffefa);
pillowMaterial.bumpScale = 0.06;
pillowMaterial.roughness = 0.8;
const pillowGeometry = createPuffedBox(1.25, 0.22, 0.8, 32, 0.15);

const leftPillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
leftPillow.position.set(-0.7, 0.62, pillowZ);
leftPillow.rotation.y = 0.06;
leftPillow.rotation.z = -0.02;
leftPillow.castShadow = true;
leftPillow.receiveShadow = true;
bed.add(leftPillow);

const rightPillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
rightPillow.position.set(0.7, 0.62, pillowZ);
rightPillow.rotation.y = -0.05;
rightPillow.rotation.z = 0.02;
rightPillow.castShadow = true;
rightPillow.receiveShadow = true;
bed.add(rightPillow);

bed.position.set(0, 0, bedCenterZ);
scene.add(bed);

const tablePlacement = {
    leftX: -2.7,
    rightX: 2.7,
    z: -roomDepth / 2 + 1.25
};

const lampBulbGeometry = new THREE.BoxGeometry(0.18, 0.02, 0.12);
const lampBulbMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff1d8,
    emissive: warmLightColor,
    emissiveIntensity: 0.0,
    roughness: 0.3,
    metalness: 0.0
});
const lampMetalMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8b1a6,
    roughness: 0.35,
    metalness: 0.7
});

function createWallLamp() {
    const group = new THREE.Group();

    const wallBlock = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.14), lampMetalMaterial);
    wallBlock.position.z = -0.02;
    group.add(wallBlock);

    const ledStrip = new THREE.Mesh(lampBulbGeometry, lampBulbMaterial);
    ledStrip.position.set(0, -0.12, 0.03);
    group.add(ledStrip);

    group.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    return { group, bulb: ledStrip };
}

const wallLampHeight = 1.6;
const wallLampOffset = 0.08;

const leftWallLamp = createWallLamp();
leftWallLamp.group.position.set(tablePlacement.leftX, wallLampHeight, -roomDepth / 2 + wallLampOffset);
scene.add(leftWallLamp.group);

const leftLampBulb = leftWallLamp.bulb;
leftWallLamp.group.add(leftLamp);
leftLamp.position.copy(leftLampBulb.position);

const leftLampTarget = new THREE.Object3D();
leftLampTarget.position.set(0, -0.7, 1.8);
leftWallLamp.group.add(leftLampTarget);
leftLamp.target = leftLampTarget;

const leftLampSpread = new THREE.PointLight(warmLightColor, 0, 9, 1.5);
leftLampSpread.position.copy(leftLampBulb.position);
leftWallLamp.group.add(leftLampSpread);

const rightWallLamp = createWallLamp();
rightWallLamp.group.position.set(tablePlacement.rightX, wallLampHeight, -roomDepth / 2 + wallLampOffset);
scene.add(rightWallLamp.group);

const rightLampBulb = rightWallLamp.bulb;
rightWallLamp.group.add(rightLamp);
rightLamp.position.copy(rightLampBulb.position);

const rightLampTarget = new THREE.Object3D();
rightLampTarget.position.set(0, -0.7, 1.8);
rightWallLamp.group.add(rightLampTarget);
rightLamp.target = rightLampTarget;

const rightLampSpread = new THREE.PointLight(warmLightColor, 0, 9, 1.5);
rightLampSpread.position.copy(rightLampBulb.position);
rightWallLamp.group.add(rightLampSpread);

// GLTF Loader for Blender models (uncomment and modify when models are available)
/*
const loader = new THREE.GLTFLoader();
loader.load('models/room.gltf', function (gltf) {
    scene.add(gltf.scene);
}, undefined, function (error) {
    console.error(error);
});
*/

// Controls
const controls = {
    ceilingLightToggle: document.getElementById('ceiling-light-toggle'),
    ceilingLightIntensity: document.getElementById('ceiling-light-intensity'),
    leftLampToggle: document.getElementById('left-lamp-toggle'),
    leftLampIntensity: document.getElementById('left-lamp-intensity'),
    rightLampToggle: document.getElementById('right-lamp-toggle'),
    rightLampIntensity: document.getElementById('right-lamp-intensity')
};

const clock = new THREE.Clock();
const movementState = {
    forward: false,
    backward: false,
    left: false,
    right: false
};
const moveSpeed = 4.0;
const cameraHeight = 2.5;
const roomBounds = {
    xMin: -roomWidth / 2 + 0.6,
    xMax: roomWidth / 2 - 0.6,
    zMin: -roomDepth / 2 + 0.6,
    zMax: roomDepth / 2 - 0.6
};

function handleMovementKey(event, isDown) {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            movementState.forward = isDown;
            break;
        case 'KeyS':
        case 'ArrowDown':
            movementState.backward = isDown;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            movementState.left = isDown;
            break;
        case 'KeyD':
        case 'ArrowRight':
            movementState.right = isDown;
            break;
        default:
            break;
    }
}

document.addEventListener('keydown', (event) => handleMovementKey(event, true));
document.addEventListener('keyup', (event) => handleMovementKey(event, false));

const lightingTargets = {
    ambient: 0,
    ceilingSpots: [0, 0, 0, 0, 0],
    ceilingFills: [0, 0, 0, 0, 0],
    ceilingRoomFill: 0,
    leftSpot: 0,
    leftFill: 0,
    rightSpot: 0,
    rightFill: 0,
    ceilingGlow: 0,
    leftBulbGlow: 0,
    rightBulbGlow: 0
};

const lightingScale = {
    ceilingSpot: 34.875,
    ceilingFill: 28.125,
    ceilingRoomFill: 10.125,
    lampSpot: 20.25,
    lampFill: 12.375,
    ambient: 0.01125
};

function syncLighting() {
    const ceilingEnabled = controls.ceilingLightToggle.checked;
    const ceilingIntensity = ceilingEnabled ? parseFloat(controls.ceilingLightIntensity.value) : 0;

    ceilingPanelLights.forEach((light, index) => {
        const isCenter = index === 4;
        lightingTargets.ceilingSpots[index] =
            ceilingIntensity * lightingScale.ceilingSpot * (isCenter ? 1.05 : 0.95);
    });
    ceilingPanelFills.forEach((light, index) => {
        const isCenter = index === 4;
        lightingTargets.ceilingFills[index] =
            ceilingIntensity * lightingScale.ceilingFill * (isCenter ? 1.05 : 0.95);
    });
    lightingTargets.ceilingRoomFill = ceilingIntensity * lightingScale.ceilingRoomFill;
    lightingTargets.ceilingGlow = ceilingIntensity * 1.2;

    const leftEnabled = controls.leftLampToggle.checked;
    const leftIntensity = leftEnabled ? parseFloat(controls.leftLampIntensity.value) : 0;
    lightingTargets.leftSpot = leftIntensity * lightingScale.lampSpot;
    lightingTargets.leftFill = leftIntensity * lightingScale.lampFill;
    lightingTargets.leftBulbGlow = leftIntensity * 1.24;

    const rightEnabled = controls.rightLampToggle.checked;
    const rightIntensity = rightEnabled ? parseFloat(controls.rightLampIntensity.value) : 0;
    lightingTargets.rightSpot = rightIntensity * lightingScale.lampSpot;
    lightingTargets.rightFill = rightIntensity * lightingScale.lampFill;
    lightingTargets.rightBulbGlow = rightIntensity * 1.24;

    lightingTargets.ambient =
        0.5 + lightingScale.ambient * (ceilingIntensity * 0.7 + (leftIntensity + rightIntensity) * 0.3); // 0.5 natural daylight baseline
}

controls.ceilingLightToggle.addEventListener('change', syncLighting);

controls.ceilingLightIntensity.addEventListener('input', syncLighting);

controls.leftLampToggle.addEventListener('change', syncLighting);

controls.leftLampIntensity.addEventListener('input', syncLighting);

controls.rightLampToggle.addEventListener('change', syncLighting);

controls.rightLampIntensity.addEventListener('input', syncLighting);

// --- Window Blinds Controls ---
const leftWindowBtn = document.createElement('button');
leftWindowBtn.innerText = "Toggle Left Blind";
leftWindowBtn.style.marginTop = "10px";
leftWindowBtn.style.width = "100%";
leftWindowBtn.onclick = () => { leftWallWindow.userData.blindTargetOpen = !leftWallWindow.userData.blindTargetOpen; };
document.getElementById('controls').appendChild(leftWindowBtn);

const rightWindowBtn = document.createElement('button');
rightWindowBtn.innerText = "Toggle Right Blind";
rightWindowBtn.style.marginTop = "10px";
rightWindowBtn.style.width = "100%";
rightWindowBtn.onclick = () => { rightWallWindow.userData.blindTargetOpen = !rightWallWindow.userData.blindTargetOpen; };
document.getElementById('controls').appendChild(rightWindowBtn);

syncLighting();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const smoothing = 1 - Math.exp(-delta * 10);

    if (pointerControls.isLocked) {
        const forward = (movementState.forward ? 1 : 0) - (movementState.backward ? 1 : 0);
        const right = (movementState.right ? 1 : 0) - (movementState.left ? 1 : 0);

        if (forward !== 0) {
            pointerControls.moveForward(forward * moveSpeed * delta);
        }
        if (right !== 0) {
            pointerControls.moveRight(right * moveSpeed * delta);
        }

        const cameraPosition = pointerControls.getObject().position;
        cameraPosition.x = Math.min(roomBounds.xMax, Math.max(roomBounds.xMin, cameraPosition.x));
        cameraPosition.z = Math.min(roomBounds.zMax, Math.max(roomBounds.zMin, cameraPosition.z));
        cameraPosition.y = cameraHeight;
    }

    ambientLight.intensity = THREE.MathUtils.lerp(
        ambientLight.intensity,
        lightingTargets.ambient,
        smoothing
    );

    ceilingPanelLights.forEach((light, index) => {
        light.intensity = THREE.MathUtils.lerp(light.intensity, lightingTargets.ceilingSpots[index], smoothing);
    });
    ceilingPanelFills.forEach((light, index) => {
        light.intensity = THREE.MathUtils.lerp(light.intensity, lightingTargets.ceilingFills[index], smoothing);
    });
    ceilingRoomFill.intensity = THREE.MathUtils.lerp(
        ceilingRoomFill.intensity,
        lightingTargets.ceilingRoomFill,
        smoothing
    );
    ceilingPanelGlowMaterial.emissiveIntensity = THREE.MathUtils.lerp(
        ceilingPanelGlowMaterial.emissiveIntensity,
        lightingTargets.ceilingGlow,
        smoothing
    );

    leftLamp.intensity = THREE.MathUtils.lerp(leftLamp.intensity, lightingTargets.leftSpot, smoothing);
    leftLampSpread.intensity = THREE.MathUtils.lerp(leftLampSpread.intensity, lightingTargets.leftFill, smoothing);
    leftLampBulb.material.emissiveIntensity = THREE.MathUtils.lerp(
        leftLampBulb.material.emissiveIntensity,
        lightingTargets.leftBulbGlow,
        smoothing
    );

    rightLamp.intensity = THREE.MathUtils.lerp(rightLamp.intensity, lightingTargets.rightSpot, smoothing);
    rightLampSpread.intensity = THREE.MathUtils.lerp(rightLampSpread.intensity, lightingTargets.rightFill, smoothing);
    rightLampBulb.material.emissiveIntensity = THREE.MathUtils.lerp(
        rightLampBulb.material.emissiveIntensity,
        lightingTargets.rightBulbGlow,
        smoothing
    );

    // Animate Japanese roller blinds (Sudare)
    [leftWallWindow, rightWallWindow].forEach(win => {
        if (!win || !win.userData.blind) return;
        const targetScaleY = win.userData.blindTargetOpen ? 0.05 : 1.0;
        const blind = win.userData.blind;
        blind.scale.y = THREE.MathUtils.lerp(blind.scale.y, targetScaleY, smoothing * 0.3);
        // Anchor the scale to the top frame so it rolls up
        blind.position.y = (win.userData.blindHeight / 2) * (1 - blind.scale.y);
    });

    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});