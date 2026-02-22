import { Client, ClientConfig, Task, ProductType } from '../types';

export class ClientEntity implements Client {
  config: ClientConfig;
  tasks: Task[] = [];
  activeTasks: number = 0;
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  state: 'idle' | 'waiting' | 'leaving' = 'idle';

  constructor(config: ClientConfig, x: number, y: number) {
    this.config = config;
    this.position = { x, y };
    this.targetPosition = { x, y };
  }

  createTask(type: ProductType, duration: number): Task | null {
    if (this.activeTasks >= this.config.maxConcurrency) {
      return null;
    }

    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      clientId: this.config.id,
      type,
      requiredTime: duration,
      remainingTime: duration,
      status: 'pending',
      createdAt: Date.now(),
      vip: this.config.hasVip,
      priorityLabel: this.config.priority
    };

    this.tasks.push(task);
    this.activeTasks++;
    return task;
  }
}
