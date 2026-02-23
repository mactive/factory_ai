import { Task, Worker } from '../types';

export class RiverFactory {
  queue: Task[] = [];
  workers: Worker[] = [];
  maxConcurrency: number;
  
  // Stats
  completedImg: number = 0;
  completedVid: number = 0;

  constructor(maxConcurrency: number = 8) {
    this.maxConcurrency = maxConcurrency;
    this.initWorkers();
  }

  initWorkers() {
    // Initial: 4 IMG, 4 VID
    for (let i = 0; i < 4; i++) this.addWorker('image');
    for (let i = 0; i < 4; i++) this.addWorker('video');
  }

  addWorker(type: 'image' | 'video') {
    const id = Math.random().toString(36).substr(2, 4).toUpperCase();
    const typeLabel = type === 'image' ? 'IMG' : 'VID';
    
    this.workers.push({
      id: `W-${id} [${typeLabel}]`,
      supportedType: type,
      currentTask: null,
      status: 'idle',
      position: { x: 0, y: 0 }
    });
  }

  removeWorker(type: 'image' | 'video') {
    // Try to remove an idle worker first
    let index = this.workers.findIndex(w => w.supportedType === type && w.status === 'idle');
    
    // If no idle worker, force remove one (in real world, we'd wait)
    if (index === -1) {
      index = this.workers.findIndex(w => w.supportedType === type);
    }
    
    if (index !== -1) {
      // If worker had a task, we should probably return it to queue
      const worker = this.workers[index];
      if (worker.currentTask) {
         worker.currentTask.status = 'pending'; // Reset task
         this.queue.unshift(worker.currentTask); // Put back in front
      }
      this.workers.splice(index, 1);
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
      
      // Update Stats
      if (worker.currentTask.type === 'image') {
        this.completedImg++;
      } else {
        this.completedVid++;
      }

      // Notify client logic here if needed (usually handled by polling or callback)
      worker.currentTask = null;
      worker.status = 'idle';
    }
  }
}
