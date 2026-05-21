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

const roomWidth = 20;
const roomDepth = 22;
const roomHeight = 13;
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

function createBurntCementTextures(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#595959');
    gradient.addColorStop(1, '#454545');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 30; i++) {
        const radius = Math.random() * 80 + 30;
        const x = Math.random() * size;
        const y = Math.random() * size;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, 'rgba(100, 100, 100, 0.15)');
        glow.addColorStop(1, 'rgba(100, 100, 100, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    for (let i = 0; i < 4000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const color = Math.random() > 0.5 ? '#666666' : '#333333';
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.06;
        ctx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }
    
    ctx.globalAlpha = 1.0;
    const map = new THREE.CanvasTexture(canvas);
    map.encoding = THREE.sRGBEncoding;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bumpCtx = bumpCanvas.getContext('2d');
    bumpCtx.fillStyle = 'rgb(128, 128, 128)';
    bumpCtx.fillRect(0, 0, size, size);
    for (let i = 0; i < 4000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const shade = 100 + Math.random() * 56;
        bumpCtx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.2)`;
        bumpCtx.fillRect(x, y, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }
    const bump = new THREE.CanvasTexture(bumpCanvas);
    
    return { map, bump };
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

function createWallSurface(width, height, material, openings) {
    let geometry;
    if (openings) {
        if (!Array.isArray(openings)) openings = [openings];
        const shape = new THREE.Shape();
        shape.moveTo(-width / 2, -height / 2);
        shape.lineTo(width / 2, -height / 2);
        shape.lineTo(width / 2, height / 2);
        shape.lineTo(-width / 2, height / 2);
        shape.lineTo(-width / 2, -height / 2);

        for (const opening of openings) {
            const hole = new THREE.Path();
            const halfHoleWidth = opening.width / 2;
            const halfHoleHeight = opening.height / 2;
            hole.moveTo(opening.x - halfHoleWidth, opening.y - halfHoleHeight);
            hole.lineTo(opening.x + halfHoleWidth, opening.y - halfHoleHeight);
            if (opening.arch) {
                hole.lineTo(opening.x + halfHoleWidth, opening.y + halfHoleHeight - halfHoleWidth);
                hole.absarc(opening.x, opening.y + halfHoleHeight - halfHoleWidth, halfHoleWidth, 0, Math.PI, false);
                hole.lineTo(opening.x - halfHoleWidth, opening.y + halfHoleHeight - halfHoleWidth);
            } else {
                hole.lineTo(opening.x + halfHoleWidth, opening.y + halfHoleHeight);
                hole.lineTo(opening.x - halfHoleWidth, opening.y + halfHoleHeight);
            }
            hole.lineTo(opening.x - halfHoleWidth, opening.y - halfHoleHeight);
            shape.holes.push(hole);
        }

        geometry = new THREE.ShapeGeometry(shape);
    } else {
        // High density vertices ("blocks") for better shadow mapping and light gradients
        geometry = new THREE.PlaneGeometry(width, height, Math.max(1, Math.floor(width * 4)), Math.max(1, Math.floor(height * 4)));

    const uvs = geometry.attributes.uv;
    if (uvs) {
        const worldScaleX = 2.0;
        const worldScaleY = 2.0;
        for (let i = 0; i < uvs.count; i++) {
            uvs.setXY(i, uvs.getX(i) * (width / worldScaleX), uvs.getY(i) * (height / worldScaleY));
        }
    }
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

function createArchedWindow(width, height) {
    const group = new THREE.Group();
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.5,
        metalness: 0.8
    });
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.4
    });

    const thickness = 0.12;
    const depth = 0.14;
    const radius = width / 2;
    const rectHeight = height - radius;
    
    // Glass
    const glassShape = new THREE.Shape();
    glassShape.moveTo(-radius, -height / 2);
    glassShape.lineTo(radius, -height / 2);
    glassShape.lineTo(radius, rectHeight - height / 2);
    glassShape.absarc(0, rectHeight - height / 2, radius, 0, Math.PI, false);
    glassShape.lineTo(-radius, -height / 2);
    
    const glassGeo = new THREE.ShapeGeometry(glassShape);
    const glass = new THREE.Mesh(glassGeo, glassMaterial);
    group.add(glass);

    // Frame (using edges of the shape via extrude or simple path)
    const frameExtrudeSettings = { depth: depth, bevelEnabled: false };
    const frameHole = new THREE.Path();
    const innerRadius = radius - thickness;
    const innerRectHeight = rectHeight - thickness;
    frameHole.moveTo(-innerRadius, -height / 2 + thickness);
    frameHole.lineTo(innerRadius, -height / 2 + thickness);
    frameHole.lineTo(innerRadius, innerRectHeight - height/2 + thickness/2);
    frameHole.absarc(0, innerRectHeight - height/2 + thickness/2, innerRadius, 0, Math.PI, false);
    frameHole.lineTo(-innerRadius, -height / 2 + thickness);
    
    const frameShape = new THREE.Shape();
    frameShape.moveTo(-radius, -height / 2);
    frameShape.lineTo(radius, -height / 2);
    frameShape.lineTo(radius, rectHeight - height / 2);
    frameShape.absarc(0, rectHeight - height / 2, radius, 0, Math.PI, false);
    frameShape.lineTo(-radius, -height / 2);
    frameShape.holes.push(frameHole);

    const frameGeo = new THREE.ExtrudeGeometry(frameShape, frameExtrudeSettings);
    frameGeo.translate(0, 0, -depth / 2);
    const frame = new THREE.Mesh(frameGeo, frameMaterial);
    group.add(frame);

    // Inner Grid (Mullions)
    const barThickness = 0.04;
    const archCenterY = rectHeight - height / 2;
    // Horizontal bars
    for (let i = 1; i <= Math.floor(height / 0.8); i++) {
        const barY = -height / 2 + i * 0.8;
        if (barY > height / 2 - 0.05) continue;
        let barHalfWidth = innerRadius;
        if (barY > archCenterY) {
            const dy = barY - archCenterY;
            if (dy < innerRadius) barHalfWidth = Math.sqrt(innerRadius * innerRadius - dy * dy);
            else barHalfWidth = 0;
        }
        if (barHalfWidth > 0.05) {
            const hBar = new THREE.Mesh(new THREE.BoxGeometry(barHalfWidth * 2, barThickness, depth - 0.02), frameMaterial);
            hBar.position.set(0, barY, 0);
            group.add(hBar);
        }
    }
    // Vertical bars
    for (let i = 1; i <= 3; i++) {
        const barX = -innerRadius + i * (innerRadius * 2 / 4);
        const dx = Math.abs(barX);
        let barMaxY = archCenterY + Math.sqrt(innerRadius * innerRadius - dx * dx);
        const barHeight = barMaxY - (-height / 2 + thickness);
        const vBar = new THREE.Mesh(new THREE.BoxGeometry(barThickness, barHeight, depth - 0.02), frameMaterial);
        vBar.position.set(barX, -height / 2 + thickness + barHeight / 2, 0);
        group.add(vBar);
    }

    group.traverse(child => { if(child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
    return group;
}

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
const cementTextures = createBurntCementTextures(2048); // High res
cementTextures.map.wrapS = THREE.MirroredRepeatWrapping;
cementTextures.map.wrapT = THREE.MirroredRepeatWrapping;
cementTextures.map.repeat.set(1, 1);
cementTextures.bump.wrapS = THREE.MirroredRepeatWrapping;
cementTextures.bump.wrapT = THREE.MirroredRepeatWrapping;
cementTextures.bump.repeat.set(1, 1);
cementTextures.map.anisotropy = maxAnisotropy;
cementTextures.bump.anisotropy = maxAnisotropy;
const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
const floorMaterial = new THREE.MeshStandardMaterial({
    map: cementTextures.map,
    color: 0x999999,
    roughness: 0.6,
    metalness: 0.15,
    bumpMap: cementTextures.bump,
    bumpScale: 0.08
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Walls
const textureLoader = new THREE.TextureLoader();
const brickDiffuse = textureLoader.load('https://threejs.org/examples/textures/brick_diffuse.jpg');
const brickBump = textureLoader.load('https://threejs.org/examples/textures/brick_bump.jpg');
const brickRoughness = textureLoader.load('https://threejs.org/examples/textures/brick_roughness.jpg');

brickDiffuse.wrapS = THREE.RepeatWrapping;
brickDiffuse.wrapT = THREE.RepeatWrapping;
brickDiffuse.repeat.set(1, 1);
brickBump.wrapS = THREE.RepeatWrapping;
brickBump.wrapT = THREE.RepeatWrapping;
brickBump.repeat.set(1, 1);
brickRoughness.wrapS = THREE.RepeatWrapping;
brickRoughness.wrapT = THREE.RepeatWrapping;
brickRoughness.repeat.set(1, 1);

brickDiffuse.encoding = THREE.sRGBEncoding;
brickDiffuse.anisotropy = maxAnisotropy;
brickBump.anisotropy = maxAnisotropy;
brickRoughness.anisotropy = maxAnisotropy;

const wallMaterial = new THREE.MeshStandardMaterial({
    map: brickDiffuse,
    bumpMap: brickBump,
    bumpScale: 0.05,
    roughnessMap: brickRoughness,
    color: 0xcccccc
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

const doorOpening = { width: 3.2, height: 5.5, x: 0, y: 5.5 / 2, arch: true };
const archW1 = { width: 1.6, height: 3.0, x: -5, y: 1.0 + 3.0 / 2, arch: true };
const archW2 = { width: 1.6, height: 3.0, x: 4.5, y: 1.0 + 3.0 / 2, arch: true };
const archW3 = { width: 1.6, height: 3.0, x: 7.5, y: 1.0 + 3.0 / 2, arch: true };
const frontWall = createWallSurface(roomWidth, roomHeight, wallMaterial, [doorOpening, archW1, archW2, archW3]);
frontWall.rotation.y = Math.PI;
frontWall.position.z = roomDepth / 2;
scene.add(frontWall);

// Arched transom over the main door
const doorTransom = createArchedWindow(3.2, 1.6);
doorTransom.position.set(0, 3.9 + 1.6 / 2, roomDepth / 2 - 0.05);
doorTransom.rotation.y = Math.PI;
scene.add(doorTransom);

const aWin1 = createArchedWindow(archW1.width, archW1.height);
aWin1.position.set(-archW1.x, archW1.y, roomDepth / 2 - 0.05); // inverted x due to Math.PI rotation y
aWin1.rotation.y = Math.PI;
scene.add(aWin1);

const aWin2 = createArchedWindow(archW2.width, archW2.height);
aWin2.position.set(-archW2.x, archW2.y, roomDepth / 2 - 0.05);
aWin2.rotation.y = Math.PI;
scene.add(aWin2);

const aWin3 = createArchedWindow(archW3.width, archW3.height);
aWin3.position.set(-archW3.x, archW3.y, roomDepth / 2 - 0.05);
aWin3.rotation.y = Math.PI;
scene.add(aWin3);

function createIndustrialDoor(width, height) {
    const group = new THREE.Group();
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.8 });
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.4, side: THREE.DoubleSide
    });
    const fw = 0.06, fd = 0.04;

    const topF = new THREE.Mesh(new THREE.BoxGeometry(width, fw, fd), frameMaterial);
    topF.position.y = height / 2 - fw / 2;
    group.add(topF);

    const botF = new THREE.Mesh(new THREE.BoxGeometry(width, fw, fd), frameMaterial);
    botF.position.y = -height / 2 + fw / 2;
    group.add(botF);

    const leftF = new THREE.Mesh(new THREE.BoxGeometry(fw, height, fd), frameMaterial);
    leftF.position.set(-width / 2 + fw / 2, 0, 0);
    group.add(leftF);

    const rightF = new THREE.Mesh(new THREE.BoxGeometry(fw, height, fd), frameMaterial);
    rightF.position.set(width / 2 - fw / 2, 0, 0);
    group.add(rightF);

    const cols = 2;
    const rows = 3;
    const innerW = width - fw * 2;
    const innerH = height - fw * 2;

    for (let c = 1; c < cols; c++) {
        const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.03, innerH, fd + 0.01), frameMaterial);
        vBar.position.set(-width / 2 + fw + (innerW / cols) * c, 0, 0);
        group.add(vBar);
    }
    for (let r = 1; r < rows; r++) {
        const hBar = new THREE.Mesh(new THREE.BoxGeometry(innerW, 0.03, fd + 0.01), frameMaterial);
        hBar.position.set(0, -height / 2 + fw + (innerH / rows) * r, 0);
        group.add(hBar);
    }

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(innerW, innerH), glassMaterial);
    group.add(glass);

    group.traverse(child => {
        if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });
    return group;
}

const shojiPanelWidth = doorOpening.width / 2 + 0.04;
const doubleDoorHeight = 3.9; // 5.5 total - 1.6 arch
const leftPanel = createIndustrialDoor(shojiPanelWidth, doubleDoorHeight);
leftPanel.position.set(doorOpening.width / 4, doubleDoorHeight / 2, roomDepth / 2 - 0.02); // Slightly inset from wall
scene.add(leftPanel);

const rightPanel = createIndustrialDoor(shojiPanelWidth, doubleDoorHeight);
rightPanel.position.set(-doorOpening.width / 4 + 0.02, doubleDoorHeight / 2, roomDepth / 2 - 0.05); // Closed, slightly behind left panel to overlap
scene.add(rightPanel);

// Frame removed since we now use an arched transom built-in framework

const leftWallWindow = createWindow(leftWindowSize.width, leftWindowSize.height, windowStyle);
leftWallWindow.position.set(-roomWidth / 2 + 0.06, leftWindowCenter.y, leftWindowCenter.z);
leftWallWindow.rotation.y = Math.PI / 2;
scene.add(leftWallWindow);

const rightWallWindow = createWindow(rightWindowSize.width, rightWindowSize.height, windowStyle);
rightWallWindow.position.set(roomWidth / 2 - 0.06, rightWindowCenter.y, rightWindowCenter.z);
rightWallWindow.rotation.y = -Math.PI / 2;
scene.add(rightWallWindow);

// Ceiling
const ceilingTextures = createBurntCementTextures(1024);
ceilingTextures.map.wrapS = THREE.MirroredRepeatWrapping;
ceilingTextures.map.wrapT = THREE.MirroredRepeatWrapping;
ceilingTextures.map.repeat.set(1, 1);
ceilingTextures.bump.wrapS = THREE.MirroredRepeatWrapping;
ceilingTextures.bump.wrapT = THREE.MirroredRepeatWrapping;
ceilingTextures.bump.repeat.set(1, 1);
ceilingTextures.map.anisotropy = maxAnisotropy;
ceilingTextures.bump.anisotropy = maxAnisotropy;

const ceilingMaterial = new THREE.MeshStandardMaterial({
    map: ceilingTextures.map,
    bumpMap: ceilingTextures.bump,
    bumpScale: 0.08,
    roughness: 0.8,
    metalness: 0.2,
    color: 0x999999,
    side: THREE.DoubleSide
});
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth + 10), ceilingMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = roomHeight / 2;
ceiling.receiveShadow = true;
ceiling.castShadow = true;
scene.add(ceiling);

// Industrial Beams
const beamGeo = new THREE.BoxGeometry(0.5, 0.6, roomDepth);
const beamMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.5 });
for (let x = -roomWidth / 2 + 3; x < roomWidth / 2; x += 4) {
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(x, roomHeight / 2 - 0.3, 0);
    beam.castShadow = true;
    beam.receiveShadow = true;
    scene.add(beam);
}

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