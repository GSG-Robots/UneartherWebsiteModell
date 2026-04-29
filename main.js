import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.158/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.158/examples/jsm/controls/OrbitControls.js";

// Canvas & Container
const canvas = document.getElementById("canvas");
const container = document.getElementById("main");

const btnY_plus = document.getElementById("moveYpos");
const btnY_minus = document.getElementById("moveYneg");

const btnX_plus = document.getElementById("moveXpos");
const btnX_minus = document.getElementById("moveXneg");

const btn_bohrer = document.getElementById("drill");
const btn_heimat = document.getElementById("home");

const coord_display_1 = document.getElementById("coords");
const coord_display_2 = document.getElementById("coords2");

const X_MAX = 100;
const Y_MAX = 100;
const Z_MAX = 100;

// Modellname
let model_name = "unearther.glb";

// Szene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// Kamera
const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
);
camera.position.set(0, 1, 3);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight, false);

// Licht
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
scene.add(light);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Animation
let mixer_y;
let mixer_x;
let mixer_bohrer;

let duration_y = 0;
let duration_x = 0;

let currentTime_y = 0;
let currentTime_x = 0;

let action_y;
let action_x;
let action_bohrer;

let y_coord = 0;
let x_coord = 0;
let z_coord = 0;

let bohrer_active = false;

const frameStep = 1 / 30;
// Loader
const loader = new GLTFLoader();


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function max(a, b) {
    if (a < b) {
        return b;
    } else {
        return a;
    }
}

function abs(a) {
    if (a >= 0) {
        return a;
    } else {
        return a * -1;
    }
}

const min = Math.min;

function setFrame(frame, mixer, fps = 30) {
    if (!mixer) {
        // console.log(mixer);
        return;
    };
    const time = frame / fps;
    mixer.setTime(time);

    mixer.update(0);

    // console.log("Frame:", frame, "Time:", time)
}

loader.load(model_name, (gltf) => {
    const model = gltf.scene;
    scene.add(model);

    if (gltf.animations.length > 0) {

        console.log(gltf.animations[2]);
        mixer_y = new THREE.AnimationMixer(model);

        const clip_y = gltf.animations[0]; // erstmal nur eine Animation
        action_y = mixer_y.clipAction(clip_y);

        action_y.play();
        action_y.paused = false;

        duration_y = clip_y.duration;

        console.log("Animation geladen:", clip_y.name);

        // TEST: direkt Frame setzen
        setFrame(0, mixer_y); // → sollte Pose ändern

        mixer_x = new THREE.AnimationMixer(model);

        const clip_x = gltf.animations[1]; // erstmal nur eine Animation
        action_x = mixer_x.clipAction(clip_x);

        action_x.play();
        action_x.paused = false;

        duration_x = clip_x.duration;

        console.log("Animation geladen:", clip_x.name);

        // TEST: direkt Frame setzen
        setFrame(0, mixer_x); // → sollte Pose ändern

        mixer_bohrer = new THREE.AnimationMixer(model);

        const clip_bohrer = gltf.animations[2];
        action_bohrer = mixer_bohrer.clipAction(clip_bohrer);

        action_bohrer.play();
        action_bohrer.paused = true;
        action_bohrer.setLoop(THREE.LoopRepeat);
    }

    start();
});

// Resize
window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(container.clientWidth, container.clientHeight, false);
});

const clock = new THREE.Clock();

// Loop (kein mixer.update!)
function animate() {
    requestAnimationFrame(animate);
    // controls.update();

    const delta = Math.min(clock.getDelta(), 0.1);

    if (mixer_bohrer) mixer_bohrer.update(delta);

    controls.update();

    renderer.render(scene, camera);
}

// Buttons
btnY_plus.onclick = () => {
    if (!mixer_y) return;

    move_to(x_coord, min(y_coord + 10, Y_MAX));
};

btnY_minus.onclick = () => {
    if (!mixer_y) return;

    move_to(x_coord, max(y_coord - 10, 0));
};

btnX_plus.onclick = () => {
    if (!mixer_x) return;

    move_to(min(x_coord + 10, X_MAX), y_coord);
};

btnX_minus.onclick = () => {
    if (!mixer_x) return;

    move_to(max(x_coord - 10, 0), y_coord);
};


btn_bohrer.onclick = () => {
    if (bohrer_active) {
        action_bohrer.paused = true;
    } else {
        action_bohrer.paused = false;
    }

    bohrer_active = !bohrer_active;
}

btn_heimat.onclick = () => {
    move_to(0, 0);
}

function update_coords() {
    coord_display_1.innerText = x_coord + " " + y_coord + " " + z_coord;
    coord_display_2.innerText = x_coord + " " + y_coord + " " + z_coord;

}

async function move_x(steps, delay) {
    for (let i = 0; i < steps; i++) {
        x_coord++;
        setFrame(x_coord / 60, mixer_x, 1);

        // console.log(x_coord / 60);

        await sleep(delay);

        update_coords();
    }

    for (let i = 0; i > steps; i--) {
        x_coord--;
        setFrame(x_coord / 60, mixer_x, 1);

        await sleep(delay);

        update_coords();
    }
}

async function move_y(steps, delay) {
    for (let i = 0; i < steps; i++) {
        y_coord++;
        setFrame(y_coord / 60, mixer_y, 1);

        // console.log(y_coord / 60);

        await sleep(delay);

        update_coords();
    }

    for (let i = 0; i > steps; i--) {
        y_coord--;
        setFrame(y_coord / 60, mixer_y, 1);

        await sleep(delay);

        update_coords();
    }
}

async function move_to(x, y) {
    let dx = x - x_coord;
    let dy = y - y_coord;

    let steps = max(abs(dx), abs(dy));
    console.log(dx, dy, x_coord, y_coord, steps
    )

    for (let i = 0; i < steps; i++) {
        await move_x(dx / steps, 25);
        await move_y(dy / steps, 25);
    }
}

animate();

async function start() {
    await move_to(90, 20);
    // await move_to(0, 0);
}