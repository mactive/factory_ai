import { Task, Worker } from '../types';
import { RiverFactory } from '../core/RiverFactory';

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    this.canvas = document.createElement('canvas');
    this.width = 1200;
    this.height = 800;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d')!;
  }

  clear() {
    this.ctx.fillStyle = '#2c3e50'; // Dark background
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawFactory(factory: RiverFactory) {
    // Draw Factory Floor
    this.ctx.fillStyle = '#34495e';
    this.ctx.fillRect(600, 50, 550, 700);
    this.ctx.strokeStyle = '#ecf0f1';
    this.ctx.strokeRect(600, 50, 550, 700);

    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.font = '24px Arial';
    this.ctx.fillText('Factory Floor (Workers)', 620, 90);

    // Draw Workers
    factory.workers.forEach((worker, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = 620 + col * 130;
      const y = 120 + row * 130;

      this.drawWorker(worker, x, y);
    });
  }

  drawWorker(worker: Worker, x: number, y: number) {
    this.ctx.fillStyle = worker.status === 'idle' ? '#95a5a6' : '#27ae60';
    this.ctx.fillRect(x, y, 110, 110);

    // Worker ID
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(worker.id, x + 5, y + 15);

    if (worker.currentTask) {
      this.drawTaskDetails(worker.currentTask, x + 5, y + 25, 100);

      // Progress bar
      const total = worker.currentTask.requiredTime;
      const remaining = worker.currentTask.remainingTime;
      const progress = (total - remaining) / total;

      this.ctx.fillStyle = '#2ecc71';
      this.ctx.fillRect(x, y + 115, 110 * progress, 5);
    } else {
      this.ctx.fillStyle = '#bdc3c7';
      this.ctx.font = 'italic 14px Arial';
      this.ctx.fillText('Idle', x + 40, y + 60);
    }
  }

  drawQueue(queue: Task[]) {
    // Waiting Area
    this.ctx.fillStyle = '#7f8c8d';
    this.ctx.fillRect(50, 50, 500, 700); // Waiting room
    this.ctx.strokeStyle = '#bdc3c7';
    this.ctx.strokeRect(50, 50, 500, 700);

    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Waiting Tasks (${queue.length})`, 70, 90);

    // Draw tasks
    queue.forEach((task, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 70 + col * 110;
      const y = 120 + row * 110;

      this.drawTask(task, x, y);
    });
  }

  drawTask(task: Task, x: number, y: number) {
    this.ctx.fillStyle = task.vip ? '#f1c40f' : '#3498db'; // Gold for VIP, Blue for Normal
    this.ctx.fillRect(x, y, 100, 100);

    // Check for warnings
    if (task.isWarning) {
      this.ctx.fillStyle = '#e74c3c'; // Red alert
      this.ctx.font = 'bold 30px Arial';
      this.ctx.fillText('!', x + 80, y + 30);
    }

    this.drawTaskDetails(task, x + 5, y + 5, 90);
  }

  drawTaskDetails(task: Task, x: number, y: number, width: number) {
    this.ctx.fillStyle = '#fff'; // Text color

    // 1. Client ID (Top)
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText(`C: ${task.clientId}`, x, y + 20);

    // 2. Task Type (Middle)
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Type: ${task.type === 'image' ? 'IMG' : 'VID'}`, x, y + 50);

    // 3. Priority (Bottom)
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillText(task.priorityLabel, x, y + 80);

    // VIP Badge
    if (task.vip) {
      this.ctx.fillStyle = '#000';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.fillText('VIP', x + 70, y + 90);
    }
  }
}
