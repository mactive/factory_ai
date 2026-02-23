import { Renderer } from './view/Renderer';
import { RiverFactory } from './core/RiverFactory';
import { Spawner } from './core/Spawner';
import { ClientEntity } from './core/Client';
import './style.css';

const app = document.getElementById('app');
if (app) {
  // Styles
  app.style.display = 'flex';
  app.style.justifyContent = 'center';
  app.style.alignItems = 'center';
  app.style.height = '100vh';
  app.style.backgroundColor = '#f0f4f8';
  app.style.flexDirection = 'column';
}

// UI Controls
const controls = document.createElement('div');
controls.style.padding = '20px';
controls.style.backgroundColor = '#fff';
controls.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
controls.style.borderRadius = '8px';
controls.style.marginBottom = '20px';
controls.style.display = 'flex';
controls.style.gap = '30px';
controls.style.alignItems = 'center';
controls.style.color = '#2c3e50';
controls.style.fontFamily = 'Arial';

controls.innerHTML = `
  <!-- Group 1: Spawn Rate -->
  <div style="display: flex; flex-direction: column; gap: 5px;">
    <label style="font-weight: bold; font-size: 12px; color: #7f8c8d;">SPAWN RATE</label>
    <div style="display: flex; align-items: center; gap: 10px;">
      <input type="range" id="spawnRate" min="200" max="5000" step="100" value="2000" style="width: 120px;">
      <span id="spawnValue" style="font-family: monospace; font-weight: bold;">2000ms</span>
    </div>
  </div>

  <div style="width: 1px; height: 40px; background: #e0e0e0;"></div>

  <!-- Group 2: Workers -->
  <div style="display: flex; flex-direction: column; gap: 5px;">
    <label style="font-weight: bold; font-size: 12px; color: #7f8c8d;">WORKERS</label>
    <div style="display: flex; gap: 15px;">
      <div style="display: flex; align-items: center; gap: 5px;">
        <span style="font-size: 12px; font-weight: bold; color: #2ecc71;">IMG</span>
        <button id="removeImgBtn" style="padding: 2px 8px; cursor: pointer; border: 1px solid #dcdcdc; border-radius: 4px; background: #f8f9fa;">-</button>
        <span id="imgCount" style="min-width: 15px; text-align: center; font-weight: bold;">4</span>
        <button id="addImgBtn" style="padding: 2px 8px; cursor: pointer; border: 1px solid #dcdcdc; border-radius: 4px; background: #f8f9fa;">+</button>
      </div>
      <div style="display: flex; align-items: center; gap: 5px;">
        <span style="font-size: 12px; font-weight: bold; color: #3498db;">VID</span>
        <button id="removeVidBtn" style="padding: 2px 8px; cursor: pointer; border: 1px solid #dcdcdc; border-radius: 4px; background: #f8f9fa;">-</button>
        <span id="vidCount" style="min-width: 15px; text-align: center; font-weight: bold;">4</span>
        <button id="addVidBtn" style="padding: 2px 8px; cursor: pointer; border: 1px solid #dcdcdc; border-radius: 4px; background: #f8f9fa;">+</button>
      </div>
    </div>
  </div>

  <div style="width: 1px; height: 40px; background: #e0e0e0;"></div>

  <!-- Group 3: Task Count -->
  <div style="display: flex; flex-direction: column; gap: 5px;">
    <label style="font-weight: bold; font-size: 12px; color: #7f8c8d;">TASKS PER CLIENT</label>
    <div style="display: flex; align-items: center; gap: 10px;">
      <input type="number" id="minTasks" value="1" min="1" max="10" style="width: 40px; padding: 4px; border: 1px solid #dcdcdc; border-radius: 4px;">
      <span style="color: #95a5a6;">to</span>
      <input type="number" id="maxTasks" value="5" min="1" max="20" style="width: 40px; padding: 4px; border: 1px solid #dcdcdc; border-radius: 4px;">
    </div>
  </div>
`;
app?.insertBefore(controls, app.firstChild);

const spawnInput = document.getElementById('spawnRate') as HTMLInputElement;
const spawnValue = document.getElementById('spawnValue');
const minTasksInput = document.getElementById('minTasks') as HTMLInputElement;
const maxTasksInput = document.getElementById('maxTasks') as HTMLInputElement;

// Worker Controls
const addImgBtn = document.getElementById('addImgBtn');
const removeImgBtn = document.getElementById('removeImgBtn');
const imgCountSpan = document.getElementById('imgCount');

const addVidBtn = document.getElementById('addVidBtn');
const removeVidBtn = document.getElementById('removeVidBtn');
const vidCountSpan = document.getElementById('vidCount');

const factory = new RiverFactory(8); // This value is now dynamic

function updateWorkerCounts() {
  const imgCount = factory.workers.filter(w => w.supportedType === 'image').length;
  const vidCount = factory.workers.filter(w => w.supportedType === 'video').length;

  if (imgCountSpan) imgCountSpan.textContent = imgCount.toString();
  if (vidCountSpan) vidCountSpan.textContent = vidCount.toString();
}

addImgBtn?.addEventListener('click', () => {
  factory.addWorker('image');
  updateWorkerCounts();
});

removeImgBtn?.addEventListener('click', () => {
  factory.removeWorker('image');
  updateWorkerCounts();
});

addVidBtn?.addEventListener('click', () => {
  factory.addWorker('video');
  updateWorkerCounts();
});

removeVidBtn?.addEventListener('click', () => {
  factory.removeWorker('video');
  updateWorkerCounts();
});

minTasksInput?.addEventListener('change', (e) => {
  const val = parseInt((e.target as HTMLInputElement).value);
  spawner.setTaskRange(val, spawner.maxTasks);
});

maxTasksInput?.addEventListener('change', (e) => {
  const val = parseInt((e.target as HTMLInputElement).value);
  spawner.setTaskRange(spawner.minTasks, val);
});

spawnInput.addEventListener('input', (e) => {
  const val = parseInt((e.target as HTMLInputElement).value);
  spawner.setSpawnInterval(val);
  if (spawnValue) spawnValue.textContent = `${val}ms`;
});

// Update counts on init
updateWorkerCounts();

const renderer = new Renderer('app');
const spawner = new Spawner();
const clients: ClientEntity[] = [];

let lastTime = 0;

function gameLoop(timestamp: number) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  // 1. Spawn new clients
  const newClient = spawner.update(deltaTime);
  if (newClient) {
    // Generate tasks based on spawner range
    const range = spawner.maxTasks - spawner.minTasks + 1;
    const taskCount = Math.floor(Math.random() * range) + spawner.minTasks;

    for (let i = 0; i < taskCount; i++) {
      const isVideo = Math.random() > 0.8; // 20% video tasks
      const type = isVideo ? 'video' : 'image';
      const duration = isVideo ? 10000 : 2000; // 10s or 2s

      newClient.createTask(type, duration);
    }

    clients.push(newClient);

    // Add tasks to factory queue
    newClient.tasks.forEach(task => {
      if (task.status === 'pending') {
        factory.addTask(task);
      }
    });
  }

  // 2. Update Factory (process queues, workers)
  factory.update(deltaTime);

  // 3. Cleanup finished clients (simple logic: if no active tasks, remove)
  // In real logic, they might wait for results, but here we simplify
  for (let i = clients.length - 1; i >= 0; i--) {
    const client = clients[i];
    const allCompleted = client.tasks.every(t => t.status === 'completed');
    if (allCompleted && client.tasks.length > 0) {
      // Client leaves
      clients.splice(i, 1);
    }
  }

  // 4. Render
  renderer.clear();
  renderer.drawFactory(factory);
  renderer.drawClients(clients);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
