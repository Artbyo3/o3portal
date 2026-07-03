import * as THREE from 'three';

/* === THREE.JS BG === */
var canvas = document.getElementById("bgCanvas");
var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 35;

var W, H;
function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
}
resize();
window.addEventListener("resize", resize);

var palette = [
    new THREE.Color(0xc084fc),
    new THREE.Color(0x60a5fa),
    new THREE.Color(0xf472b6),
    new THREE.Color(0xffffff)
];

/* ---- Round texture ---- */
var texCanvas = document.createElement("canvas");
texCanvas.width = 32;
texCanvas.height = 32;
var tCtx = texCanvas.getContext("2d");
var grad = tCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
grad.addColorStop(0, "rgba(255,255,255,1)");
grad.addColorStop(0.3, "rgba(255,255,255,0.8)");
grad.addColorStop(1, "rgba(255,255,255,0)");
tCtx.fillStyle = grad;
tCtx.fillRect(0, 0, 32, 32);
var roundTex = new THREE.CanvasTexture(texCanvas);

/* ---- Particle nebula (square) ---- */
var pCount = 800;
var pPos = new Float32Array(pCount * 3);
var pCol = new Float32Array(pCount * 3);
for (var i = 0; i < pCount; i++) {
    var r = 3 + Math.random() * 28;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pPos[i * 3 + 2] = r * Math.cos(phi);
    var col = palette[Math.floor(Math.random() * palette.length)];
    pCol[i * 3] = col.r;
    pCol[i * 3 + 1] = col.g;
    pCol[i * 3 + 2] = col.b;
}
var pGeom = new THREE.BufferGeometry();
pGeom.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
pGeom.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
var pMat = new THREE.PointsMaterial({
    size: 0.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
});
var particles = new THREE.Points(pGeom, pMat);
scene.add(particles);

/* ---- Soft round particles ---- */
var sCount = 200;
var sPos = new Float32Array(sCount * 3);
var sCol = new Float32Array(sCount * 3);
for (var i = 0; i < sCount; i++) {
    var r = 4 + Math.random() * 26;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    sPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    sPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    sPos[i * 3 + 2] = r * Math.cos(phi);
    var col = palette[Math.floor(Math.random() * palette.length)];
    sCol[i * 3] = col.r;
    sCol[i * 3 + 1] = col.g;
    sCol[i * 3 + 2] = col.b;
}
var sGeom = new THREE.BufferGeometry();
sGeom.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
sGeom.setAttribute("color", new THREE.BufferAttribute(sCol, 3));
var sMat = new THREE.PointsMaterial({
    size: 0.35,
    map: roundTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
});
var soft = new THREE.Points(sGeom, sMat);
scene.add(soft);

/* ---- Bright core particles ---- */
var cCount = 40;
var cPos = new Float32Array(cCount * 3);
var cCol = new Float32Array(cCount * 3);
for (var i = 0; i < cCount; i++) {
    var r = 2 + Math.random() * 6;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    cPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    cPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    cPos[i * 3 + 2] = r * Math.cos(phi);
    var col = palette[Math.floor(Math.random() * palette.length)];
    cCol[i * 3] = col.r;
    cCol[i * 3 + 1] = col.g;
    cCol[i * 3 + 2] = col.b;
}
var cGeom = new THREE.BufferGeometry();
cGeom.setAttribute("position", new THREE.BufferAttribute(cPos, 3));
cGeom.setAttribute("color", new THREE.BufferAttribute(cCol, 3));
var cMat = new THREE.PointsMaterial({
    size: 0.6,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
});
var core = new THREE.Points(cGeom, cMat);
scene.add(core);





/* ---- Mouse ---- */
var mouseX = 0, mouseY = 0;
var targetRotX = 0, targetRotY = 0;
document.addEventListener("mousemove", function (e) {
    mouseX = (e.clientX / W) * 2 - 1;
    mouseY = -(e.clientY / H) * 2 + 1;
    targetRotY = mouseX * 0.15;
    targetRotX = mouseY * 0.1;
});

var currentRotX = 0, currentRotY = 0;
var time = 0;
var camAngle = 0;
var camRadius = 35;

function animate() {
    time += 0.005;
    camAngle += 0.001;

    currentRotY += (targetRotY - currentRotY) * 0.05;
    currentRotX += (targetRotX - currentRotX) * 0.05;

    var groupRotY = currentRotY + time * 0.04;
    var groupRotX = currentRotX + time * 0.015;

    particles.rotation.y = groupRotY;
    particles.rotation.x = groupRotX;
    soft.rotation.y = groupRotY + 0.2;
    soft.rotation.x = groupRotX + 0.1;
    core.rotation.y = groupRotY + 0.3;
    core.rotation.x = groupRotX - 0.2;

    // Camera slowly orbits
    var camY = Math.sin(camAngle * 0.5) * 4;
    camera.position.x = Math.sin(camAngle) * camRadius;
    camera.position.z = Math.cos(camAngle) * camRadius;
    camera.position.y = camY;
    camera.lookAt(0, 0, 0);

    // Pulse particle size subtly
    var pulse = 1 + Math.sin(time * 2) * 0.15;
    pMat.size = 0.2 * pulse;
    sMat.size = 0.35 * (1 + Math.sin(time * 1.7 + 1) * 0.1);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

/* === CURSOR === */
var c = document.getElementById("cursor");
var mx = -100, my = -100;
document.addEventListener("mousemove", function (e) {
    mx = e.clientX; my = e.clientY;
    c.style.transform = "translate(" + mx + "px, " + my + "px) translate(-50%, -50%)";
});

/* === FLOATING LINKS PARALLAX === */
var flLinks = document.querySelectorAll(".fl-link");
var ww = window.innerWidth, wh = window.innerHeight;

function moveLinks() {
    var cx = ww / 2, cy = wh / 2;
    var dx = (mx - cx) / cx;
    var dy = (my - cy) / cy;
    flLinks.forEach(function (link, i) {
        var f = 3 + i * 1.8;
        link.style.transform = "translate(" + (dx * f) + "px, " + (dy * f) + "px)";
    });
    requestAnimationFrame(moveLinks);
}
moveLinks();

window.addEventListener("resize", function () {
    ww = window.innerWidth; wh = window.innerHeight;
});

/* === STAGGER === */
var staggerEls = document.querySelectorAll(".hero-text, .fl-link");
staggerEls.forEach(function (el, i) {
    el.style.opacity = "0";
    el.style.transition = "opacity 0.7s cubic-bezier(0.25,0.46,0.45,0.94)";
    setTimeout(function () {
        el.style.opacity = "1";
    }, 200 + i * 70);
});

/* === SCROLL TOGGLE === */
var wrap = document.getElementById("scrollWrap");
var panelNext = document.getElementById("panelNext");
var scrollHint = document.getElementById("scrollHint");
var isScrolled = false;
var scrollLock = false;
var scrollTimeout;

function toggleScroll(open) {
    if (scrollLock) return;
    scrollLock = true;
    isScrolled = open;
    wrap.style.transform = open ? "translateY(-100vh)" : "translateY(0)";
    if (open) scrollHint.style.opacity = "0";
    else scrollHint.style.opacity = "1";
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function () { scrollLock = false; }, 700);
}

window.addEventListener("wheel", function (e) {
    if (e.deltaY > 0 && !isScrolled) toggleScroll(true);
    else if (e.deltaY < 0 && isScrolled) toggleScroll(false);
}, { passive: true });

// Touch support
var touchStart = 0;
window.addEventListener("touchstart", function (e) {
    touchStart = e.changedTouches[0].screenY;
}, { passive: true });
window.addEventListener("touchend", function (e) {
    var diff = touchStart - e.changedTouches[0].screenY;
    if (Math.abs(diff) > 30) {
        if (diff > 0 && !isScrolled) toggleScroll(true);
        else if (diff < 0 && isScrolled) toggleScroll(false);
    }
}, { passive: true });

/* === CURSOR HOVER === */
document.addEventListener("mouseover", function (e) {
    var t = e.target.closest(".fl-link");
    if (t) c.classList.add("hover");
});
document.addEventListener("mouseout", function (e) {
    var t = e.target.closest(".fl-link");
    if (t) c.classList.remove("hover");
});
