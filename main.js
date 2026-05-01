import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.158/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.158/examples/jsm/controls/OrbitControls.js";

// Canvas & Container
const canvas = document.getElementById("canvas");
const container = document.getElementById("main");

const btnZ_plus = document.getElementById("moveZpos");
const btnZ_minus = document.getElementById("moveZneg");

const btnY_plus = document.getElementById("moveYpos");
const btnY_minus = document.getElementById("moveYneg");

const btnX_plus = document.getElementById("moveXpos");
const btnX_minus = document.getElementById("moveXneg");

const btn_bohrer = document.getElementById("drill");
const btn_heimat = document.getElementById("home");
const btn_bewegung = document.getElementById("movePosition");

const coord_display_1 = document.getElementById("coords");
const coord_display_2 = document.getElementById("coords2");

const layer_display = document.getElementById("layer");

const X_MAX = 179;
const Y_MAX = 179;
const Z_MAX = 179;

// Modellname
let model_name = "UneartherModell2.glb";

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
let mixer_z;
let mixer_y;
let mixer_x;
let mixer_bohrer;

let duration_z = 0;
let duration_y = 0;
let duration_x = 0;

let currentTime_y = 0;
let currentTime_x = 0;

let action_z;
let action_y;
let action_x;
let action_bohrer;

let y_coord = 0;
let x_coord = 0;
let z_coord = 0;

let bohrer_active = false;

let is_moving = false;
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
        mixer_z = new THREE.AnimationMixer(model);

        const clip_z = gltf.animations[0]; // erstmal nur eine Animation
        action_z = mixer_z.clipAction(clip_z);

        action_z.play();
        action_z.paused = false;

        duration_z = clip_z.duration;

        console.log("Animation geladen:", clip_z.name);

        // TEST: direkt Frame setzen
        setFrame(0, mixer_y); // → sollte Pose ändern

        mixer_y = new THREE.AnimationMixer(model);

        const clip_y = gltf.animations[1]; // erstmal nur eine Animation
        action_y = mixer_y.clipAction(clip_y);

        action_y.play();
        action_y.paused = false;

        duration_y = clip_y.duration;

        console.log("Animation geladen:", clip_y.name);

        // TEST: direkt Frame setzen
        setFrame(0, mixer_y); // → sollte Pose ändern

        mixer_x = new THREE.AnimationMixer(model);

        const clip_x = gltf.animations[2]; // erstmal nur eine Animation
        action_x = mixer_x.clipAction(clip_x);

        action_x.play();
        action_x.paused = false;

        duration_x = clip_x.duration;

        console.log("Animation geladen:", clip_x.name);

        // TEST: direkt Frame setzen
        setFrame(0, mixer_x); // → sollte Pose ändern

        mixer_bohrer = new THREE.AnimationMixer(model);

        const clip_bohrer = gltf.animations[3];
        action_bohrer = mixer_bohrer.clipAction(clip_bohrer);

        action_bohrer.play();
        action_bohrer.paused = true;
        action_bohrer.setLoop(THREE.LoopRepeat);


        console.log(duration_x, duration_y, duration_z);
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

btnZ_plus.onclick = async function() {
    if (!mixer_z || is_moving) return;

    console.log(min(z_coord + 10, Z_MAX));

    await move_z(min(z_coord + 10, Z_MAX) - z_coord, 25);
};

btnZ_minus.onclick = async function() {
    if (!mixer_z || is_moving) return;

    await move_z(max(z_coord - 10, 0) - z_coord, 25);
};

btnY_plus.onclick = async function() {
    if (!mixer_y || is_moving) return;

    await move_to(x_coord, min(y_coord + 10, Y_MAX));
};

btnY_minus.onclick = async function() {
    if (!mixer_y || is_moving) return;

    await move_to(x_coord, max(y_coord - 10, 0));
};

btnX_plus.onclick = async function() {
    if (!mixer_x || is_moving) return;

    await move_to(min(x_coord + 10, X_MAX), y_coord);
};

btnX_minus.onclick = async function() {
    if (!mixer_x || is_moving) return;

    await move_to(max(x_coord - 10, 0), y_coord);
};


btn_bohrer.onclick = () => {
    if (bohrer_active) {
        action_bohrer.paused = true;
    } else {
        action_bohrer.paused = false;
    }

    bohrer_active = !bohrer_active;
}

btn_heimat.onclick = async function() {
    await move_to(0, 0);
}

btn_bewegung.onclick = async function() {
    let input_x = Number(prompt("move X (0-100)"));

    input_x = max(0, min(input_x, X_MAX));

    if (isNaN(input_x)) {
        alert("That's no number!");
        return;
    }

    let input_y = Number(prompt("move  (0-100)"));

    input_y = max(0, min(input_y, Y_MAX));


    if (isNaN(input_y)) {
        alert("That's no number!");
        return;
    }

    // let input_z = prompt("move X (0-100)");

    // input_z = min(0, max(input_z, Z_MAX));


    // if (!isNaN(input_z)) {
    //     alert("That's no number!");
    // }

    await move_to(input_x, input_y);

    
}
function update_coords() {
    coord_display_1.innerText = x_coord + " " + y_coord + " " + z_coord;
    coord_display_2.innerText = x_coord + " " + y_coord + " " + z_coord;

}

function update_layer() {
    layer_display.innerText = "Layer: " + z_coord / 10;

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

async function move_z(steps, delay) {
    while (is_moving);
    is_moving = true;
    for (let i = 0; i < steps; i++) {
        z_coord++;
        setFrame(z_coord / 60, mixer_z, 1);
        
        // console.log(y_coord / 60);
        
        await sleep(delay);
        
        update_coords();
    }
    
    for (let i = 0; i > steps; i--) {
        z_coord--;
        setFrame(z_coord / 60, mixer_z, 1);
        
        await sleep(delay);
        
        update_coords();
    }
    is_moving = false;
}

async function move_to(x, y) {
    while (is_moving);
    is_moving = true;
    let dx = abs(x - x_coord);
    let dy = abs(y - y_coord);

    let sx = x_coord < x ? 1 : -1;
    let sy = y_coord < y ? 1 : -1;

    let err = dx - dy;

    console.log(dx, dy, x_coord, y_coord)

    while (true) {
        if (x_coord == x && y_coord == y) break;
        console.log(x_coord, y_coord);

        let e2 = 2 * err;

        if (e2 > -dy)  {
            err -= dy;
            // x_coord += sx;
            await move_x(sx, 10);
            console.log("move_x: ", sx);
        }
        
        if (e2 < dx) {
            err += dx
            // y_coord += sy
            await move_y(sy, 10);
            console.log("move_y: ", sy);
        }
    }

    is_moving = false;
}

async function drilling() {
    action_bohrer.paused = false;

    for(let z=0; z < Z_MAX; z+=10) {
        update_layer();
        for(let y=0; y < Y_MAX; y+=10) {
            if ((y/10)%2 == 0) {
                await move_to(0, y);
                await move_to(X_MAX, y);
            } else {
                await move_to(X_MAX, y);
                await move_to(0, y);            
            }
        }
        await move_to(0, 0);
        await move_z(z - z_coord, 25)
    }
}
animate();

async function start() {
    // await move_to(X_MAX, Y_MAX);
    await drilling();
    // await move_to(0, 0);
}