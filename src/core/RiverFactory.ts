import { Task, Worker } from '../types';

export class RiverFactory {
  queue: Task[] = [];
  workers: Worker[] = [];
  maxConcurrency: number = 20;

  constructor(workerCount: number = 20) {
    this.maxConcurrency = workerCount;
    this.initWorkers();
  }

  initWorkers() {
    for (let i = 0; i < this.maxConcurrency; i++) {
      this.workers.push({
        id: `worker-${i}`,
        currentTask: null,
        status: 'idle',
        position: { x: 0, y: 0 } // Will be set by renderer layout
      });
    }
  }

  addTask(task: Task) {
    // Priority handling: VIPs go to front, but behind other VIPs
    if (task.vip) {
      const lastVipIndex = this.queue.findLastIndex(t => t.vip);
      if (lastVipIndex === -1) {
        this.queue.unshift(task);
      } else {
        this.queue.splice(lastVipIndex + 1, 0, task);
      }
    } else {
      this.queue.push(task);
    }
  }

  update(deltaTime: number) {
    const currentTime = Date.now();
    this.checkTimeouts(currentTime);

    // Assign tasks to idle workers
    const idleWorkers = this.workers.filter(w => w.status === 'idle');
    
    while (idleWorkers.length > 0 && this.queue.length > 0) {
      const worker = idleWorkers.pop()!;
      const task = this.queue.shift()!;
      
      worker.currentTask = task;
      worker.status = 'working';
      task.status = 'processing';
      task.startedAt = currentTime;
    }

    // Process active tasks
    this.workers.forEach(worker => {
      if (worker.status === 'working' && worker.currentTask) {
        worker.currentTask.remainingTime -= deltaTime;
        
        if (worker.currentTask.remainingTime <= 0) {
          this.completeTask(worker);
        }
      }
    });
  }

  checkTimeouts(currentTime: number) {
    // Check waiting tasks
    this.queue.forEach(task => {
      if (!task.startedAt && (currentTime - task.createdAt > task.requiredTime * 3)) {
        task.isWarning = true;
      }
    });
  }

  completeTask(worker: Worker) {
    if (worker.currentTask) {
      worker.currentTask.status = 'completed';
      // Notify client logic here if needed (usually handled by polling or callback)
      worker.currentTask = null;
      worker.status = 'idle';
    }
  }
}
