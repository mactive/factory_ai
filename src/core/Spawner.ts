import { ClientEntity } from './Client';
import { Priority } from '../types';

export class Spawner {
  spawnTimer: number = 0;
  spawnInterval: number = 2000; // Default 2 seconds
  minTasks: number = 1;
  maxTasks: number = 5;

  setSpawnInterval(interval: number) {
    this.spawnInterval = interval;
  }

  setTaskRange(min: number, max: number) {
    this.minTasks = Math.max(1, min);
    this.maxTasks = Math.max(this.minTasks, max);
  }

  update(deltaTime: number): ClientEntity | null {
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      return this.createRandomClient();
    }
    return null;
  }

  generateClientId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    let id = '';
    for (let i = 0; i < 4; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    for (let i = 0; i < 2; i++) {
      id += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return id;
  }

  createRandomClient(): ClientEntity {
    const isL2 = Math.random() > 0.7;
    const hasVip = Math.random() > 0.8;
    const priority: Priority = isL2 ? 'L2' : 'L1';

    const config = {
      id: this.generateClientId(),
      priority,
      hasVip,
      budget: Math.floor(Math.random() * 1000) + 100,
      maxConcurrency: isL2 ? 2 : 1,
      avatarIndex: Math.floor(Math.random() * 64)
    };

    return new ClientEntity(config, 0, 0); // Position will be set by main loop
  }
}
