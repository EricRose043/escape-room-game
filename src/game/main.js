import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c1015);

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 50);
camera.position.set(0, 1.6, 3.8);
camera.lookAt(-0.8, 1.5, -4);

// 簡單幾何、無即時陰影或後製；像素比上限 1，降低內顯負擔。
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1));
document.body.appendChild(renderer.domElement);

const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x42434a });
const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x586367 });
const ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0x343941 });

function addBox(width, height, depth, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  scene.add(mesh);
}

// 房內可用空間：寬 10、深 12、高 3.5；六個方塊封閉成空房間。
addBox(10.4, 0.2, 12.4, 0, -0.1, 0, floorMaterial);
addBox(10.4, 0.2, 12.4, 0, 3.6, 0, ceilingMaterial);
addBox(0.2, 3.5, 12.4, -5.1, 1.75, 0, wallMaterial);
addBox(0.2, 3.5, 12.4, 5.1, 1.75, 0, wallMaterial);
addBox(10, 3.5, 0.2, 0, 1.75, -6.1, wallMaterial);
addBox(10, 3.5, 0.2, 0, 1.75, 6.1, wallMaterial);

scene.add(new THREE.AmbientLight(0x8e9eae, 0.55));
const lamp = new THREE.PointLight(0xffd7a0, 45, 18, 2);
lamp.position.set(0, 3.1, -1);
scene.add(lamp);
addBox(0.7, 0.08, 0.4, 0, 3.4, -1,
  new THREE.MeshBasicMaterial({ color: 0xffd7a0 }));

function resize() {
  const width = window.innerWidth;
  const height = Math.max(window.innerHeight, 1);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', resize);
resize();

const fpsDisplay = document.querySelector('#fps');
let frames = 0;
let sampleStart;

function animate(time) {
  if (sampleStart === undefined) sampleStart = time;
  renderer.render(scene, camera);
  frames += 1;
  const elapsed = time - sampleStart;
  if (elapsed >= 1000) {
    fpsDisplay.textContent = `FPS: ${Math.round(frames * 1000 / elapsed)}`;
    frames = 0;
    sampleStart = time;
  }
  requestAnimationFrame(animate);
}

// 背景分頁停止繪圖時，不把閒置時間混入下一次 FPS 取樣。
document.addEventListener('visibilitychange', () => {
  frames = 0;
  sampleStart = undefined;
});
requestAnimationFrame(animate);
