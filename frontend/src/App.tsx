import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { AssetExplorer } from './pages/AssetExplorer';
import { AssetDetailPage } from './pages/AssetDetailPage';
import { AlertsCenter } from './pages/AlertsCenter';
import { MaintenanceManager } from './pages/MaintenanceManager';
import { SimulationControls } from './pages/SimulationControls';
import { useTelemetryStream } from './hooks/useTelemetryStream';
import { getAlerts, getSimulationStatus, pauseSimulation, resumeSimulation } from './services/api';
import { SimulationStatus } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [activeAlertCount, setActiveAlertCount] = useState<number>(0);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus | null>(null);

  // Live real-time telemetry stream from WebSocket (with REST polling fallback)
  const { liveAssets, connectionStatus } = useTelemetryStream();

  const refreshMetadata = async () => {
    try {
      const [alerts, simStatus] = await Promise.all([
        getAlerts({ status: 'active' }),
        getSimulationStatus(),
      ]);
      setActiveAlertCount(alerts.length);
      setSimulationStatus(simStatus);
    } catch {
      // Quiet background poll error
    }
  };

  useEffect(() => {
    refreshMetadata();
    const interval = setInterval(refreshMetadata, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    setCurrentTab('detail');
  };

  const handleToggleSimulation = async () => {
    try {
      if (simulationStatus?.is_running) {
        const updated = await pauseSimulation();
        setSimulationStatus(updated);
      } else {
        const updated = await resumeSimulation();
        setSimulationStatus(updated);
      }
    } catch (err) {
      console.error('Failed to toggle simulation:', err);
    }
  };

  return (
    <Layout
      currentTab={currentTab}
      setCurrentTab={(tab) => {
        setCurrentTab(tab);
        if (tab !== 'detail') {
          setSelectedAssetId(null);
        }
      }}
      connectionStatus={connectionStatus}
      simulationStatus={simulationStatus}
      onToggleSimulation={handleToggleSimulation}
      activeAlertCount={activeAlertCount}
    >
      {currentTab === 'overview' && (
        <OverviewDashboard
          liveAssets={liveAssets}
          onSelectAsset={handleSelectAsset}
          onNavigateTab={setCurrentTab}
        />
      )}

      {currentTab === 'assets' && (
        <AssetExplorer
          liveAssets={liveAssets}
          onSelectAsset={handleSelectAsset}
        />
      )}

      {currentTab === 'detail' && selectedAssetId && (
        <AssetDetailPage
          assetId={selectedAssetId}
          liveAssets={liveAssets}
          onBack={() => setCurrentTab('assets')}
          onNavigateTab={setCurrentTab}
        />
      )}

      {currentTab === 'alerts' && <AlertsCenter />}

      {currentTab === 'maintenance' && <MaintenanceManager />}

      {currentTab === 'simulation' && (
        <SimulationControls
          liveAssets={liveAssets}
          onSelectAsset={handleSelectAsset}
        />
      )}
    </Layout>
  );
}

export default App;
