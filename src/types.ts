export type ProductType = 'image' | 'video' | 'audio' | 'text';

export type Priority = 'L1' | 'L2';

export interface ClientConfig {
  id: string;
  priority: Priority;
  hasVip: boolean;
  budget: number;
  maxConcurrency: number;
}

export interface Task {
  id: string;
  clientId: string;
  type: ProductType;
  requiredTime: number; // in milliseconds
  remainingTime: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: number;
  startedAt?: number;
  vip: boolean;
  priorityLabel: Priority; // 'L1' or 'L2'
  isWarning?: boolean;
}

export interface Client {
  config: ClientConfig;
  tasks: Task[];
  activeTasks: number; // tasks in queue + processing
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  state: 'idle' | 'waiting' | 'leaving';
}

export interface Worker {
  id: string;
  currentTask: Task | null;
  status: 'idle' | 'working';
  position: { x: number; y: number };
}
