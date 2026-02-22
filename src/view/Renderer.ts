import { Task, Worker } from '../types';
import { RiverFactory } from '../core/RiverFactory';
import { THEME } from './theme';

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
    // Shadow for depth
    this.canvas.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
    this.canvas.style.borderRadius = '12px';
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d')!;
  }

  clear() {
    this.ctx.fillStyle = THEME.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawFactory(factory: RiverFactory) {
    // Draw Factory Floor
    this.ctx.fillStyle = THEME.panelBg;
    this.ctx.strokeStyle = THEME.panelBorder;
    this.ctx.lineWidth = 2;

    // Rounded rect function would be nice, but simple rect for now
    this.ctx.fillRect(600, 50, 550, 700);
    this.ctx.strokeRect(600, 50, 550, 700);

    this.ctx.fillStyle = THEME.text.primary;
    this.ctx.font = 'bold 24px "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    this.ctx.fillText(`Factory Floor (${factory.workers.length} Workers)`, 620, 90);

    // Draw Workers
    factory.workers.forEach((worker, index) => {
      const col = index % 2; // 2 columns
      const row = Math.floor(index / 2);
      const x = 620 + col * 260; // Wider spacing
      const y = 120 + row * 130;

      this.drawWorker(worker, x, y);
    });
  }

  drawWorker(worker: Worker, x: number, y: number) {
    // Worker Card
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = 'rgba(0,0,0,0.05)';
    this.ctx.shadowBlur = 10;
    this.ctx.fillRect(x, y, 240, 110);
    this.ctx.shadowBlur = 0; // Reset shadow

    this.ctx.strokeStyle = worker.status === 'working' ?
      (worker.currentTask?.type === 'image' ? THEME.task.image : THEME.task.video) :
      '#e0e0e0';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, 240, 110);

    // Worker ID & Type
    this.ctx.fillStyle = THEME.text.primary;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText(worker.id, x + 15, y + 25);

    // Type Badge
    const typeColor = worker.supportedType === 'image' ? THEME.task.image : THEME.task.video;

    // Badge Background
    this.ctx.fillStyle = typeColor;
    this.ctx.beginPath();
    this.ctx.roundRect(x + 180, y + 10, 50, 20, 10);
    this.ctx.fill();

    // Badge Text
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 11px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(worker.supportedType === 'image' ? 'IMG' : 'VID', x + 205, y + 24);
    this.ctx.textAlign = 'left'; // Reset

    if (worker.currentTask) {
      this.drawTaskDetails(worker.currentTask, x + 15, y + 35);

      // Progress bar bg
      this.ctx.fillStyle = '#ecf0f1';
      this.ctx.fillRect(x + 15, y + 85, 210, 6);

      // Progress bar fill
      const total = worker.currentTask.requiredTime;
      const remaining = worker.currentTask.remainingTime;
      const progress = (total - remaining) / total;

      this.ctx.fillStyle = worker.currentTask.type === 'image' ? THEME.task.image : THEME.task.video;
      this.ctx.fillRect(x + 15, y + 85, 210 * progress, 6);
    } else {
      this.ctx.fillStyle = '#bdc3c7';
      this.ctx.font = 'italic 14px Arial';
      this.ctx.fillText('Waiting for task...', x + 15, y + 60);
    }
  }

  drawClients(clients: import('../core/Client').ClientEntity[]) {
    // Client List Area
    this.ctx.fillStyle = THEME.panelBg;
    this.ctx.strokeStyle = THEME.panelBorder;
    this.ctx.lineWidth = 2;
    this.ctx.fillRect(50, 50, 500, 700); // Background
    this.ctx.strokeRect(50, 50, 500, 700);

    // Header
    this.ctx.fillStyle = THEME.text.primary;
    this.ctx.font = 'bold 24px "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    this.ctx.fillText(`Active Clients (${clients.length})`, 70, 90);

    // Legend
    const legendY = 710;
    this.ctx.font = '12px Arial';

    // Pending
    this.ctx.fillStyle = '#bdc3c7'; // Grey
    this.ctx.beginPath(); this.ctx.arc(70, legendY, 5, 0, Math.PI * 2); this.ctx.fill();
    this.ctx.fillStyle = THEME.text.secondary;
    this.ctx.fillText('Pending', 80, legendY + 4);

    // Processing
    this.ctx.fillStyle = '#f1c40f'; // Yellow (Active)
    this.ctx.beginPath(); this.ctx.arc(150, legendY, 5, 0, Math.PI * 2); this.ctx.fill();
    this.ctx.fillStyle = THEME.text.secondary;
    this.ctx.fillText('Processing', 160, legendY + 4);

    // Completed
    this.ctx.fillStyle = '#2ecc71'; // Green (Done)
    this.ctx.beginPath(); this.ctx.arc(240, legendY, 5, 0, Math.PI * 2); this.ctx.fill();
    this.ctx.fillStyle = THEME.text.secondary;
    this.ctx.fillText('Done', 250, legendY + 4);

    // Draw clients list
    clients.forEach((client, i) => {
      const x = 70;
      const y = 120 + i * 70; // Increased spacing

      if (y < 680) { // Adjusted culling for legend space
        this.drawClientRow(client, x, y);
      }
    });
  }

  drawClientRow(client: import('../core/Client').ClientEntity, x: number, y: number) {
    // Client Card
    this.ctx.fillStyle = '#f8f9fa';
    this.ctx.strokeStyle = '#e9ecef';
    this.ctx.lineWidth = 1;

    // VIP styling (Border)
    if (client.config.hasVip) {
      this.ctx.strokeStyle = '#f1c40f';
      this.ctx.lineWidth = 3; // Thicker border for VIP
    }

    this.ctx.fillRect(x, y, 460, 60);
    this.ctx.strokeRect(x, y, 460, 60);

    // Status Indicator (Left Bar)
    const hasActive = client.tasks.some(t => t.status === 'processing');
    const allDone = client.tasks.every(t => t.status === 'completed');

    if (hasActive) {
      this.ctx.fillStyle = '#f1c40f'; // Active Yellow
      this.ctx.fillRect(x, y, 5, 60);
    } else if (allDone) {
      this.ctx.fillStyle = '#2ecc71'; // Done Green
      this.ctx.fillRect(x, y, 5, 60);
    } else {
      this.ctx.fillStyle = '#bdc3c7'; // Pending Grey (Waiting)
      this.ctx.fillRect(x, y, 5, 60);
    }

    // Client Info (Left)
    this.ctx.fillStyle = THEME.text.primary;
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillText(client.config.id, x + 20, y + 35);

    // Priority Badges (Right of Name) - Fixed Overlap
    let badgeX = x + 100;

    // VIP Badge
    if (client.config.hasVip) {
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.beginPath();
      this.ctx.roundRect(badgeX, y + 20, 35, 20, 4);
      this.ctx.fill();

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.fillText('VIP', badgeX + 8, y + 34);
      badgeX += 45;
    }

    // L1/L2 Badge
    const isL2 = client.config.priority === 'L2';
    this.ctx.fillStyle = isL2 ? THEME.client.l2 : THEME.client.l1;
    this.ctx.beginPath();
    this.ctx.roundRect(badgeX, y + 20, 30, 20, 4);
    this.ctx.fill();

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 10px Arial';
    this.ctx.fillText(client.config.priority, badgeX + 8, y + 34);

    // Tasks Info (Far Right)
    client.tasks.forEach((task, index) => {
      const taskX = x + 200 + index * 35; // Tighter spacing

      // Task Box
      const taskColor = task.type === 'image' ? THEME.task.image : THEME.task.video;

      // Status opacity
      this.ctx.globalAlpha = task.status === 'completed' ? 1.0 : (task.status === 'processing' ? 0.8 : 0.4);

      this.ctx.fillStyle = taskColor;
      this.ctx.beginPath();
      this.ctx.roundRect(taskX, y + 20, 30, 20, 4); // Smaller boxes
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 9px Arial'; // Smaller font
      this.ctx.textAlign = 'center';
      this.ctx.fillText(task.type === 'image' ? 'IMG' : 'VID', taskX + 15, y + 33);
      this.ctx.textAlign = 'left';

      // Status dot overlay
      if (task.status === 'processing') {
        this.ctx.fillStyle = '#f1c40f'; // Yellow
        this.ctx.beginPath(); this.ctx.arc(taskX + 26, y + 20, 3, 0, Math.PI * 2); this.ctx.fill();
      } else if (task.status === 'completed') {
        this.ctx.fillStyle = '#2ecc71'; // Green
        this.ctx.beginPath(); this.ctx.arc(taskX + 26, y + 20, 3, 0, Math.PI * 2); this.ctx.fill();
      }

      if (task.isWarning) {
        this.ctx.fillStyle = THEME.task.warning;
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText('!', taskX + 20, y + 15);
      }
    });
  }

  drawTaskDetails(task: Task, x: number, y: number) {
    this.ctx.fillStyle = THEME.text.secondary; // Muted text

    // 1. Client ID (Top)
    this.ctx.font = '12px Arial';
    this.ctx.fillText(`Client: ${task.clientId}`, x, y + 15);

    // 2. Task Type
    const typeColor = task.type === 'image' ? THEME.task.image : THEME.task.video;
    this.ctx.fillStyle = typeColor;
    this.ctx.font = 'bold 12px Arial';
    this.ctx.fillText(task.type === 'image' ? 'Image Generation' : 'Video Rendering', x, y + 35);
  }
}
