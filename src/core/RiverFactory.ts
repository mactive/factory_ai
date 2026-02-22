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
      // Split workers: First half IMG, second half VID
      const type = i < this.maxConcurrency / 2 ? 'image' : 'video';
      
      this.workers.push({
        id: `W-${i} [${type.toUpperCase().substr(0, 3)}]`,
        supportedType: type,
        currentTask: null,
        status: 'idle',
        position: { x: 0, y: 0 }
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

    // Assign tasks to compatible idle workers
    const idleWorkers = this.workers.filter(w => w.status === 'idle');
    
    // We need to match tasks to compatible workers
    // This simple loop might be inefficient but works for small numbers
    for (let i = 0; i < idleWorkers.length; i++) {
      const worker = idleWorkers[i];
      
      // Find the first task in queue that matches this worker's type
      // Note: This naive approach might skip a high priority VIP of one type 
      // if we process workers in a fixed order. 
      // Ideally, we should iterate tasks and find a worker, but this is a demo.
      const taskIndex = this.queue.findIndex(t => t.type === worker.supportedType);
      
      if (taskIndex !== -1) {
        const task = this.queue.splice(taskIndex, 1)[0];
        
        worker.currentTask = task;
        worker.status = 'working';
        task.status = 'processing';
        task.startedAt = currentTime;
      }
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
