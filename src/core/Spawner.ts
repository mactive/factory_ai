import { ClientEntity } from './Client';
import { ProductType, Priority } from '../types';

export class Spawner {
  spawnTimer: number = 0;
  spawnInterval: number = 2000; // 2 seconds

  update(deltaTime: number): ClientEntity | null {
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      return this.createRandomClient();
    }
    return null;
  }

  createRandomClient(): ClientEntity {
    const isL2 = Math.random() > 0.7;
    const hasVip = Math.random() > 0.8;
    const priority: Priority = isL2 ? 'L2' : 'L1';

    const config = {
      id: Math.random().toString(36).substr(2, 9),
      priority,
      hasVip,
      budget: Math.floor(Math.random() * 1000) + 100,
      maxConcurrency: isL2 ? 2 : 1
    };

    return new ClientEntity(config, 0, 0); // Position will be set by main loop
  }
}
