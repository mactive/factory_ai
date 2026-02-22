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
controls.style.marginBottom = '20px';
controls.style.color = '#2c3e50';
controls.style.fontFamily = 'Arial';
controls.innerHTML = `
  <label for="spawnRate">Spawn Rate (ms): </label>
  <input type="range" id="spawnRate" min="200" max="5000" step="100" value="2000">
  <span id="spawnValue">2000ms</span>
`;
app?.insertBefore(controls, app.firstChild);

const spawnInput = document.getElementById('spawnRate') as HTMLInputElement;
const spawnValue = document.getElementById('spawnValue');

spawnInput.addEventListener('input', (e) => {
  const val = parseInt((e.target as HTMLInputElement).value);
  spawner.setSpawnInterval(val);
  if (spawnValue) spawnValue.textContent = `${val}ms`;
});

const renderer = new Renderer('app');
const factory = new RiverFactory(8);
const spawner = new Spawner();
const clients: ClientEntity[] = [];

let lastTime = 0;

function gameLoop(timestamp: number) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  // 1. Spawn new clients
  const newClient = spawner.update(deltaTime);
  if (newClient) {
    // Generate 1-5 tasks for the client
    const taskCount = Math.floor(Math.random() * 5) + 1;

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
