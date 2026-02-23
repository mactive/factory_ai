import { Task, Worker } from '../types';
import { RiverFactory } from '../core/RiverFactory';
import { ClientEntity } from '../core/Client';
import { THEME } from './theme';
import avatarUrl from '../images/avatar_128.png';

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  avatarSprite: HTMLImageElement;

  // Pagination State
  pageState = {
    img: 0,
    vid: 0,
    pageSize: 6 // Workers per page per column
  };

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    this.canvas = document.createElement('canvas');
    this.width = 1200;
    this.height = 800;

    // HiDPI Scaling
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Shadow for depth
    this.canvas.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
    this.canvas.style.borderRadius = '12px';
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.scale(dpr, dpr); // Scale context to match dpr

    // Load Avatar Sprite
    this.avatarSprite = new Image();
    this.avatarSprite.src = avatarUrl;

    // Event Listener for Pagination
    this.canvas.addEventListener('click', (e) => this.handlePaginationClick(e));
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

    this.ctx.fillRect(600, 50, 550, 700);
    this.ctx.strokeRect(600, 50, 550, 700);

    this.ctx.fillStyle = THEME.text.primary;
    this.ctx.font = 'bold 24px "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    this.ctx.fillText(`Factory Floor (${factory.workers.length} Workers)`, 620, 90);

    // Split workers into types
    const imgWorkers = factory.workers.filter(w => w.supportedType === 'image');
    const vidWorkers = factory.workers.filter(w => w.supportedType === 'video');

    // Draw IMG Column (Left)
    this.drawWorkerColumn(imgWorkers, 620, 'img', 'Image Processing');

    // Draw VID Column (Right)
    this.drawWorkerColumn(vidWorkers, 880, 'vid', 'Video Rendering');
  }

  drawWorkerColumn(workers: Worker[], x: number, key: 'img' | 'vid', title: string) {
    // Column Header
    this.ctx.fillStyle = THEME.text.secondary;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText(title, x, 120);

    // Pagination Logic
    const pageIndex = this.pageState[key];
    const start = pageIndex * this.pageState.pageSize;
    const end = start + this.pageState.pageSize;
    const visibleWorkers = workers.slice(start, end);
    const totalPages = Math.ceil(workers.length / this.pageState.pageSize);

    // Draw Workers
    visibleWorkers.forEach((worker, index) => {
      const y = 140 + index * 90; // Compact height (110 -> 90)
      this.drawWorker(worker, x, y);
    });

    // Draw Pagination Controls
    if (totalPages > 1) {
      this.drawPaginationControls(x, 700, key, pageIndex, totalPages);
    }
  }

  drawPaginationControls(x: number, y: number, key: 'img' | 'vid', currentPage: number, totalPages: number) {
    this.ctx.fillStyle = THEME.text.primary;
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Page ${currentPage + 1} / ${totalPages}`, x + 120, y + 20);
    this.ctx.textAlign = 'left';

    // Up Button (Prev Page)
    if (currentPage > 0) {
      this.drawButton(x + 60, y + 5, '▲', `${key}_prev`);
    }

    // Down Button (Next Page)
    if (currentPage < totalPages - 1) {
      this.drawButton(x + 160, y + 5, '▼', `${key}_next`);
    }
  }

  drawButton(x: number, y: number, text: string, id: string) {
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.strokeStyle = '#bdc3c7';
    this.ctx.lineWidth = 1;
    this.ctx.fillRect(x, y, 30, 20);
    this.ctx.strokeRect(x, y, 30, 20);

    this.ctx.fillStyle = THEME.text.primary;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, x + 15, y + 15);
    this.ctx.textAlign = 'left';
  }

  handlePaginationClick(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();

    // Fix: We need logical coordinates (CSS pixels) for hit testing, not physical pixels
    // The drawing logic uses logical coordinates (e.g. 620, 700), but the canvas context is scaled by DPR.
    // The mouse event gives coordinates relative to the viewport.
    // rect.left/top are also in CSS pixels.
    // So we just need relative CSS coordinates.

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Helper to check click bounds with expanded hit area
    const checkClick = (btnX: number, btnY: number) => {
      // Expanded hit area: +/- 10px around the 30x20 button
      return x >= btnX - 10 && x <= btnX + 40 && y >= btnY - 10 && y <= btnY + 30;
    };

    // IMG Column Controls (x=620, y=700)
    // Prev Button at 620 + 60 = 680
    if (checkClick(680, 705)) {
      if (this.pageState.img > 0) this.pageState.img--;
    }
    // Next Button at 620 + 160 = 780
    if (checkClick(780, 705)) {
      this.pageState.img++;
    }

    // VID Column Controls (x=880, y=700)
    // Prev Button at 880 + 60 = 940
    if (checkClick(940, 705)) {
      if (this.pageState.vid > 0) this.pageState.vid--;
    }
    // Next Button at 880 + 160 = 1040
    if (checkClick(1040, 705)) {
      this.pageState.vid++;
    }
  }

  drawWorker(worker: Worker, x: number, y: number) {
    // Worker Card
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = 'rgba(0,0,0,0.05)';
    this.ctx.shadowBlur = 10;
    this.ctx.fillRect(x, y, 240, 80); // Compact Height (110 -> 80)
    this.ctx.shadowBlur = 0;

    this.ctx.strokeStyle = worker.status === 'working' ?
      (worker.currentTask?.type === 'image' ? THEME.task.image : THEME.task.video) :
      '#e0e0e0';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, 240, 80);

    // Worker ID & Type
    this.ctx.fillStyle = THEME.text.primary;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.fillText(worker.id, x + 15, y + 25);

    // Type Badge
    const typeColor = worker.supportedType === 'image' ? THEME.task.image : THEME.task.video;
    this.ctx.fillStyle = typeColor;
    this.ctx.beginPath();
    this.ctx.roundRect(x + 180, y + 10, 50, 20, 10);
    this.ctx.fill();
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 11px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(worker.supportedType === 'image' ? 'IMG' : 'VID', x + 205, y + 24);
    this.ctx.textAlign = 'left';

    if (worker.currentTask) {
      this.drawTaskDetails(worker.currentTask, x + 15, y + 35);

      // Progress bar bg
      this.ctx.fillStyle = '#ecf0f1';
      this.ctx.fillRect(x + 15, y + 65, 210, 6); // Adjusted Y

      // Progress bar fill
      const total = worker.currentTask.requiredTime;
      const remaining = worker.currentTask.remainingTime;
      const progress = (total - remaining) / total;

      this.ctx.fillStyle = worker.currentTask.type === 'image' ? THEME.task.image : THEME.task.video;
      this.ctx.fillRect(x + 15, y + 65, 210 * progress, 6);
    } else {
      this.ctx.fillStyle = '#bdc3c7';
      this.ctx.font = 'italic 14px Arial';
      this.ctx.fillText('Idle', x + 15, y + 55);
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
      this.ctx.strokeStyle = THEME.client.vip;
      this.ctx.lineWidth = 2; // Thicker border for VIP
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

    // Draw Avatar (x+10 to x+50)
    if (this.avatarSprite && this.avatarSprite.complete) {
      const idx = client.config.avatarIndex;
      const col = idx % 8;
      const row = Math.floor(idx / 8);
      // Source: 128x128, Dest: 40x40
      this.ctx.drawImage(this.avatarSprite, col * 128, row * 128, 128, 128, x + 15, y + 10, 40, 40);
    } else {
      // Fallback placeholder
      this.ctx.fillStyle = '#ccc';
      this.ctx.fillRect(x + 15, y + 10, 40, 40);
    }

    // Client Info (Shifted Right)
    this.ctx.fillStyle = THEME.text.primary;
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillText(client.config.id, x + 65, y + 25);

    // Time Active
    const elapsed = Math.floor((Date.now() - client.createdAt) / 1000);
    this.ctx.fillStyle = THEME.text.secondary;
    this.ctx.font = '11px Arial';
    this.ctx.fillText(`${elapsed}s`, x + 65, y + 45);

    // Priority Badges (Right of Name) - Fixed Overlap
    let badgeX = x + 145; // Shifted right

    // VIP Badge (Moved to Top Right)
    if (client.config.hasVip) {
      this.ctx.fillStyle = THEME.client.vip;
      this.ctx.beginPath();
      // Position at top-right corner: x + width - padding, y + padding
      // Box width 460. Right edge is x + 460.
      // roundRect radii: [topLeft, topRight, bottomRight, bottomLeft]
      this.ctx.roundRect(x + 460 - 30, y, 30, 15, [0, 0, 0, 8]);
      this.ctx.fill();

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 8px Arial'; // Smaller font
      this.ctx.textAlign = 'center';
      this.ctx.fillText('VIP', x + 460 - 15, y + 10);
      this.ctx.textAlign = 'left';
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

        // Draw warning border
        this.ctx.strokeStyle = THEME.task.warning;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(taskX, y + 20, 30, 20);
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
    this.ctx.font = 'bold 10px Arial';
    this.ctx.fillText(task.type === 'image' ? 'Image Generation' : 'Video Rendering', x + 120, y + 20);
  }
}
