import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* === SETUP === */
var canvas = document.getElementById("c");
var renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

var W = window.innerWidth, H = window.innerHeight;
renderer.setSize(W, H);

var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

var scene = new THREE.Scene();

/* === BLOOM === */
var composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
var bp = new UnrealBloomPass(new THREE.Vector2(W, H), 1.1, 0.45, 0.38);
composer.addPass(bp);

/* === SHADER === */
var geon = new THREE.PlaneGeometry(2, 2);

var uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uRes: { value: new THREE.Vector2(W, H) }
};

var vert = /* glsl */`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`;

var frag = /* glsl */`
    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform vec2 uRes;

    /* === NOISE === */
    float hash(vec2 p) {
        float h = dot(p, vec2(127.1, 311.7));
        return fract(sin(h) * 43758.5453);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
        );
    }

    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        float freq = 1.0;
        vec2 shift = vec2(100.0);
        for (int i = 0; i < 4; i++) {
            v += a * noise(p * freq);
            p = p * 2.0 + shift;
            freq *= 2.0;
            a *= 0.5;
        }
        return v;
    }

    void main() {
        vec2 uv = vUv;
        float asp = uRes.x / uRes.y;

        /* Cursor distortion */
        vec2 mc = uMouse;
        float md = length(uv - mc);
        uv += (mc - uv) * 0.06 * smoothstep(0.55, 0.0, md);
        uv += vec2(
            sin(uv.y * 6.0 + uTime * 0.3) * 0.008,
            cos(uv.x * 5.0 + uTime * 0.4) * 0.008
        );

        /* Domain warping */
        vec2 q = uv * 2.8;
        q.x *= asp;
        float d1 = fbm(q + uTime * 0.08);
        float d2 = fbm(q + vec2(d1 * 1.6, d1 * 0.7) + uTime * 0.12);
        float d3 = fbm(q + vec2(d2 * 1.3, d1 * 1.1) + uTime * 0.06);
        float warp = (d1 * 0.6 + d2 * 0.3 + d3 * 0.1);

        /* Flow lines */
        vec2 flowUV = q * 0.5 + vec2(
            sin(q.y * 2.0 + uTime * 0.2) * 0.3,
            cos(q.x * 2.5 + uTime * 0.25) * 0.3
        );
        float flow = sin(flowUV.x * 12.0 + warp * 4.0) * 0.5 + 0.5;

        /* Combine with steeper contrast */
        float val = warp * 0.55 + flow * 0.25 + d3 * 0.2;
        val = pow(clamp(val, 0.0, 1.0), 1.6);

        /* Palette: dark → border → accent blue → green → subtle white */
        vec3 bg    = vec3(0.059, 0.067, 0.082); /* #0f1115 */
        vec3 card  = vec3(0.106, 0.122, 0.153); /* #1b1f27 */
        vec3 bord  = vec3(0.169, 0.192, 0.235); /* #2b313c */
        vec3 blue  = vec3(0.471, 0.718, 1.000); /* #78b7ff */
        vec3 green = vec3(0.400, 1.000, 0.761); /* #66ffc2 */
        vec3 white = vec3(0.914, 0.925, 0.937); /* #e9ecef */

        /* Mapping: 0-0.35=darks, 0.35-0.55=border, 0.55-0.75=blue, 0.75-0.92=green, 0.92-1.0=white highlight */
        vec3 col;
        if (val < 0.35)       col = mix(bg, card, val / 0.35);
        else if (val < 0.55)  col = mix(card, bord, (val - 0.35) / 0.2);
        else if (val < 0.75)  col = mix(bord, blue, (val - 0.55) / 0.2);
        else if (val < 0.92)  col = mix(blue, green, (val - 0.75) / 0.17);
        else                  col = mix(green, white, (val - 0.92) / 0.08);

        /* Bloom amp — blue and green get extra punch */
        float bamp = smoothstep(0.45, 0.7, val);
        col += bamp * blue * 0.22;
        float gamp = smoothstep(0.7, 0.88, val);
        col += gamp * green * 0.18;

        /* Vignette */
        float vig = 1.0 - length(vUv - 0.5) * 0.55;
        col *= vig;

        gl_FragColor = vec4(col, 1.0);
    }
`;

var mat = new THREE.ShaderMaterial({
    uniforms, vertexShader: vert, fragmentShader: frag
});

var quad = new THREE.Mesh(geon, mat);
scene.add(quad);

/* === CURSOR === */
var mouse = new THREE.Vector2(0.5, 0.5);
var tgt = new THREE.Vector2(0.5, 0.5);

document.addEventListener("mousemove", function (e) {
    tgt.x = e.clientX / W;
    tgt.y = 1.0 - e.clientY / H;
});

window.addEventListener("resize", function () {
    W = window.innerWidth;
    H = window.innerHeight;
    renderer.setSize(W, H);
    composer.setSize(W, H);
    uniforms.uRes.value.set(W, H);
});

/* === LOOP === */
var clock = new THREE.Clock();

function loop() {
    var dt = Math.min(clock.getDelta(), 0.1);
    uniforms.uTime.value += dt;

    mouse.lerp(tgt, 0.06);
    uniforms.uMouse.value.copy(mouse);

    bp.strength = 1.1 + Math.sin(uniforms.uTime.value * 0.35) * 0.15 + mouse.distanceTo(new THREE.Vector2(0.5, 0.5)) * 0.4;

    composer.render();
    requestAnimationFrame(loop);
}
loop();
