export interface DatabasePoolConfig {
  poolMode: 'transaction' | 'session';
  maxClientConnections: number;
  defaultPoolSize: number;
  statementTimeout: string;
  idleTimeout: string;
}

export interface AutoScalingConfig {
  minComputeNodes: number;
  maxComputeNodes: number;
  cpuThresholdPercent: number;
  memoryThresholdPercent: number;
  scaleUpCooldownSeconds: number;
  scaleDownCooldownSeconds: number;
}

export interface ReadReplicaConfig {
  enabled: boolean;
  replicaCount: number;
  healthCheckIntervalSeconds: number;
  fallbackToPrimary: boolean;
}

export interface ProductionDatabaseConfig {
  pool: DatabasePoolConfig;
  autoScaling: AutoScalingConfig;
  readReplicas: ReadReplicaConfig;
  connectionRetry: {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
  };
  queryTimeout: string;
}

export const productionDatabaseConfig: ProductionDatabaseConfig = {
  pool: {
    poolMode: 'transaction',
    maxClientConnections: 1000,
    defaultPoolSize: 20,
    statementTimeout: '30s',
    idleTimeout: '20s',
  },
  autoScaling: {
    minComputeNodes: 2,
    maxComputeNodes: 8,
    cpuThresholdPercent: 70,
    memoryThresholdPercent: 75,
    scaleUpCooldownSeconds: 60,
    scaleDownCooldownSeconds: 300,
  },
  readReplicas: {
    enabled: true,
    replicaCount: 2,
    healthCheckIntervalSeconds: 15,
    fallbackToPrimary: true,
  },
  connectionRetry: {
    maxRetries: 3,
    baseDelayMs: 500,
    maxDelayMs: 5000,
  },
  queryTimeout: '15s',
};

export function getRetryDelay(attempt: number): number {
  const { baseDelayMs, maxDelayMs } = productionDatabaseConfig.connectionRetry;
  return Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
}
