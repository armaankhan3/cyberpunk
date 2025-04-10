import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader';
import gsap from 'gsap';  

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#canvas'),
  antialias: true,
  alpha: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0025;
composer.addPass(rgbShiftPass);

// Load HDRI environment map
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/cobblestone_street_night_1k.hdr',
  function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.error('An error occurred loading the HDRI:', error);
  }
);

// Load GLTF model
const loader = new GLTFLoader();
let model;

loader.load(
  './DamagedHelmet.gltf',
  function (gltf) {
    model = gltf.scene;
    scene.add(model);
    model.position.set(0, 0, 0);
    model.scale.set(2, 2, 2);
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.error('An error occurred loading the model:', error);
  }
);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Handle mouse movement
const maxRotation = THREE.MathUtils.degToRad(30); // Convert 30 degrees to radians

window.addEventListener('mousemove', (event) => {
  // Calculate normalized mouse position (-1 to 1)
  const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
  const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;
  
  // Apply rotation with max 30 degrees
  if (model) {
    gsap.to(model.rotation, {
      y: normalizedX * maxRotation, // Inverted X for correct left/right movement
      x: normalizedY * maxRotation, // Removed inversion for natural up/down movement
      duration: 0.9,
      ease: "power2.out"
    });
  }
});

function animate() {
  requestAnimationFrame(animate);
  composer.render();
}
animate();
