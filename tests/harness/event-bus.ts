/**
 * Syncbay PaaS — Real-Time Log Console & Live Metrics Bus (F12, F13)
 * In-memory ring buffer event bus streaming build steps and container stdout/stderr
 * and telemetry metrics stream generator matching PROJECT.md interface contract.
 */

export interface LogEntry {
  id: string;
  deploymentId: string;
  timestamp: string;
  stream: "stdout" | "stderr" | "system";
  message: string;
}

export interface MetricSnapshot {
  deploymentId: string;
  timestamp: string;
  cpuPercent: number;
  memoryMiB: number;
  networkEgressKb: number;
  diskUsedMiB: number;
}

export class LogEventBus {
  private ringBuffers = new Map<string, LogEntry[]>();
  private subscribers = new Map<string, Set<(log: LogEntry) => void>>();
  private maxBufferSize: number;

  constructor(maxBufferSize = 500) {
    this.maxBufferSize = maxBufferSize;
  }

  publish(
    deploymentId: string,
    logLine: { timestamp?: string; stream: "stdout" | "stderr" | "system"; message: string }
  ): LogEntry {
    const entry: LogEntry = {
      id: "log_" + Math.random().toString(36).slice(2, 10),
      deploymentId,
      timestamp: logLine.timestamp || new Date().toISOString(),
      stream: logLine.stream,
      message: logLine.message,
    };

    let buffer = this.ringBuffers.get(deploymentId);
    if (!buffer) {
      buffer = [];
      this.ringBuffers.set(deploymentId, buffer);
    }

    buffer.push(entry);
    if (buffer.length > this.maxBufferSize) {
      buffer.shift(); // FIFO eviction
    }

    const listeners = this.subscribers.get(deploymentId);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(entry);
        } catch {
          // Listener error protection
        }
      });
    }

    return entry;
  }

  subscribe(deploymentId: string, listener: (log: LogEntry) => void): () => void {
    let listeners = this.subscribers.get(deploymentId);
    if (!listeners) {
      listeners = new Set();
      this.subscribers.set(deploymentId, listeners);
    }
    listeners.add(listener);

    return () => {
      listeners?.delete(listener);
      if (listeners && listeners.size === 0) {
        this.subscribers.delete(deploymentId);
      }
    };
  }

  getHistory(deploymentId: string): LogEntry[] {
    return [...(this.ringBuffers.get(deploymentId) || [])];
  }

  clear(deploymentId?: string): void {
    if (deploymentId) {
      this.ringBuffers.delete(deploymentId);
      this.subscribers.delete(deploymentId);
    } else {
      this.ringBuffers.clear();
      this.subscribers.clear();
    }
  }

  formatSseMessage(entry: LogEntry): string {
    return `event: log\ndata: ${JSON.stringify(entry)}\n\n`;
  }
}

export class MetricsStreamGenerator {
  private activeStreams = new Map<string, NodeJS.Timeout>();

  generateSnapshot(deploymentId: string, overrides?: Partial<MetricSnapshot>): MetricSnapshot {
    return {
      deploymentId,
      timestamp: new Date().toISOString(),
      cpuPercent: overrides?.cpuPercent ?? +(Math.random() * 25 + 5).toFixed(2),
      memoryMiB: overrides?.memoryMiB ?? +(Math.random() * 120 + 80).toFixed(2),
      networkEgressKb: overrides?.networkEgressKb ?? +(Math.random() * 50 + 10).toFixed(2),
      diskUsedMiB: overrides?.diskUsedMiB ?? +(Math.random() * 400 + 100).toFixed(2),
    };
  }

  formatSseMetric(snapshot: MetricSnapshot): string {
    return `event: metric\ndata: ${JSON.stringify(snapshot)}\n\n`;
  }
}
