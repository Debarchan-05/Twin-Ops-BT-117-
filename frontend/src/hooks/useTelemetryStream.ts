import { useEffect, useState } from 'react';
import { telemetryStream, ConnectionStatus } from '../services/websocket';
import { LiveAssetUpdate, WebSocketTelemetryMessage } from '../types';

export function useTelemetryStream() {
  const [liveAssets, setLiveAssets] = useState<Record<string, LiveAssetUpdate>>({});
  const [lastTick, setLastTick] = useState<number>(0);
  const [lastTimestamp, setLastTimestamp] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    telemetryStream.getStatus()
  );

  useEffect(() => {
    const unsubscribe = telemetryStream.subscribe(
      (data: WebSocketTelemetryMessage) => {
        setLiveAssets((prev) => ({
          ...prev,
          ...data.assets,
        }));
        setLastTick(data.tick);
        setLastTimestamp(data.timestamp);
      },
      (status) => {
        setConnectionStatus(status);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    liveAssets,
    lastTick,
    lastTimestamp,
    connectionStatus,
  };
}
