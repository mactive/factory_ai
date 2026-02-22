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
  app.style.backgroundColor = '#1a1a1a';
}

const renderer = new Renderer('app');
const factory = new RiverFactory(20);
const spawner = new Spawner();
const clients: ClientEntity[] = [];

let lastTime = 0;

function gameLoop(timestamp: number) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  // 1. Spawn new clients
  const newClient = spawner.update(deltaTime);
  if (newClient) {
    // Generate a task immediately for the demo
    const isVideo = Math.random() > 0.8; // 20% video tasks
    const type = isVideo ? 'video' : 'image';
    const duration = isVideo ? 120000 : 10000; // 2min or 10s

    newClient.createTask(type, duration);
    clients.push(newClient);

    // Add task to factory queue
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
  renderer.drawQueue(factory.queue);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
