import { WebSocketTelemetryMessage } from '../types';
import { getAllLatestTelemetry } from './api';

export type ConnectionStatus = 'connected' | 'polling' | 'connecting' | 'disconnected';
type MessageCallback = (data: WebSocketTelemetryMessage) => void;
type StatusCallback = (status: ConnectionStatus) => void;

class TelemetryStreamService {
  private socket: WebSocket | null = null;
  private messageListeners: Set<MessageCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: any = null;
  private pollingTimer: any = null;
  private isIntentionallyClosed = false;

  constructor() {
    // Autostart connection
    this.connect();
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public subscribe(onMessage: MessageCallback, onStatus?: StatusCallback): () => void {
    this.messageListeners.add(onMessage);
    if (onStatus) {
      this.statusListeners.add(onStatus);
      onStatus(this.status);
    }

    return () => {
      this.messageListeners.delete(onMessage);
      if (onStatus) {
        this.statusListeners.delete(onStatus);
      }
    };
  }

  private updateStatus(newStatus: ConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((fn) => fn(newStatus));
    }
  }

  public connect() {
    this.isIntentionallyClosed = false;
    this.stopPolling();
    this.updateStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.updateStatus('connected');
        this.stopPolling();
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'telemetry_update') {
            this.messageListeners.forEach((fn) => fn(payload));
          }
        } catch {
          // Ignored non-json pings
        }
      };

      this.socket.onerror = () => {
        // Handled in onclose
      };

      this.socket.onclose = () => {
        if (!this.isIntentionallyClosed) {
          this.handleDisconnect();
        } else {
          this.updateStatus('disconnected');
        }
      };
    } catch {
      this.handleDisconnect();
    }
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);
      this.updateStatus('connecting');
      this.reconnectTimer = setTimeout(() => this.connect(), delay);
    } else {
      // Fallback to HTTP polling!
      this.startPollingFallback();
    }
  }

  private startPollingFallback() {
    this.updateStatus('polling');
    if (this.pollingTimer) clearInterval(this.pollingTimer);

    // Initial poll
    this.pollNow();
    this.pollingTimer = setInterval(() => this.pollNow(), 2500);
  }

  private async pollNow() {
    try {
      const latest = await getAllLatestTelemetry();
      const assetsMap: Record<string, any> = {};

      for (const [id, reading] of Object.entries(latest)) {
        assetsMap[id] = {
          asset_id: id,
          metrics: reading.metrics,
          health_score: reading.calculated_health_score,
          health_condition: reading.calculated_health_score >= 80 ? 'healthy' : reading.calculated_health_score >= 50 ? 'degraded' : 'critical',
          timestamp: reading.timestamp,
        };
      }

      const mockMsg: WebSocketTelemetryMessage = {
        type: 'telemetry_update',
        timestamp: new Date().toISOString(),
        tick: 0,
        assets: assetsMap,
      };

      this.messageListeners.forEach((fn) => fn(mockMsg));
    } catch {
      // Polling network failure
    }
  }

  private stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  public disconnect() {
    this.isIntentionallyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopPolling();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.updateStatus('disconnected');
  }
}

export const telemetryStream = new TelemetryStreamService();
