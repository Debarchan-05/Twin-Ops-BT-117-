import React, { useState } from 'react';
import { Asset, AssetType } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Asset>) => Promise<void>;
  initialData?: Asset | null;
}

export const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEdit = !!initialData;

  const [id, setId] = useState(initialData?.id || '');
  const [name, setName] = useState(initialData?.name || '');
  const [assetType, setAssetType] = useState<AssetType>(initialData?.asset_type || 'electric_motor');
  const [location, setLocation] = useState(initialData?.location || '');
  const [manufacturer, setManufacturer] = useState(initialData?.manufacturer || '');
  const [modelNumber, setModelNumber] = useState(initialData?.model_number || '');
  const [operationalStatus, setOperationalStatus] = useState(
    initialData?.operational_status || 'running'
  );

  // Initial sensors for new asset
  const [sensors, setSensors] = useState<any[]>(
    initialData?.sensors || [
      {
        sensor_key: 'temperature',
        name: 'Operating Temperature',
        unit: '°C',
        min_valid: 0,
        max_valid: 150,
        warning_threshold: 75,
        critical_threshold: 88,
        nominal_value: 60,
        weight: 1.0,
      },
      {
        sensor_key: 'vibration',
        name: 'Vibration RMS',
        unit: 'mm/s',
        min_valid: 0,
        max_valid: 30,
        warning_threshold: 4.5,
        critical_threshold: 7.0,
        nominal_value: 1.8,
        weight: 1.2,
      },
    ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddSensor = () => {
    setSensors([
      ...sensors,
      {
        sensor_key: `sensor_${Date.now()}`,
        name: 'New Sensor',
        unit: 'unit',
        min_valid: 0,
        max_valid: 100,
        warning_threshold: 70,
        critical_threshold: 90,
        nominal_value: 50,
        weight: 1.0,
      },
    ]);
  };

  const handleRemoveSensor = (index: number) => {
    setSensors(sensors.filter((_, i) => i !== index));
  };

  const handleSensorChange = (index: number, field: string, value: any) => {
    const updated = [...sensors];
    updated[index] = { ...updated[index], [field]: value };
    setSensors(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        id: isEdit ? initialData.id : id,
        name,
        asset_type: assetType,
        location,
        manufacturer,
        model_number: modelNumber,
        operational_status: operationalStatus,
      };

      if (!isEdit) {
        payload.sensors = sensors.map((s) => ({
          ...s,
          min_valid: Number(s.min_valid),
          max_valid: Number(s.max_valid),
          warning_threshold: Number(s.warning_threshold),
          critical_threshold: Number(s.critical_threshold),
          nominal_value: Number(s.nominal_value),
          weight: Number(s.weight),
        }));
      }

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-industrial-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isEdit ? 'Configure Asset Twin' : 'Register New Industrial Asset'}
            </h3>
            <p className="text-xs text-slate-400">
              Configure virtual model metadata and telemetry parameters
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/50 border border-rose-500/50 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Asset ID</label>
              <input
                type="text"
                disabled={isEdit}
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. asset-pump-02"
                className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Asset Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Auxiliary Slurry Pump"
                className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Asset Type</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="electric_motor">Industrial Electric Motor</option>
                <option value="water_pump">Industrial Water Pump</option>
                <option value="industrial_fan">Industrial Ventilation Fan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Location / Plant</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Sector 4 - Processing Bay"
                className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Siemens, ABB"
                className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Model Number</label>
              <input
                type="text"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                placeholder="e.g. X100-PRO"
                className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Operational Status</label>
              <select
                value={operationalStatus}
                onChange={(e) => setOperationalStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="running">Running</option>
                <option value="stopped">Stopped</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          {/* Sensors Config (for create) */}
          {!isEdit && (
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Configured Sensors ({sensors.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddSensor}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Sensor
                </button>
              </div>

              <div className="space-y-3">
                {sensors.map((sensor, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-industrial-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 relative"
                  >
                    <div>
                      <span className="text-[10px] text-slate-400">Sensor Key</span>
                      <input
                        type="text"
                        value={sensor.sensor_key}
                        onChange={(e) => handleSensorChange(idx, 'sensor_key', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Name</span>
                      <input
                        type="text"
                        value={sensor.name}
                        onChange={(e) => handleSensorChange(idx, 'name', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Unit</span>
                      <input
                        type="text"
                        value={sensor.unit}
                        onChange={(e) => handleSensorChange(idx, 'unit', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Nominal</span>
                      <input
                        type="number"
                        value={sensor.nominal_value}
                        onChange={(e) => handleSensorChange(idx, 'nominal_value', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400">Warning Thresh</span>
                      <input
                        type="number"
                        value={sensor.warning_threshold}
                        onChange={(e) => handleSensorChange(idx, 'warning_threshold', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-400">Critical Thresh</span>
                      <input
                        type="number"
                        value={sensor.critical_threshold}
                        onChange={(e) => handleSensorChange(idx, 'critical_threshold', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-slate-200"
                      />
                    </div>
                    <div className="col-span-2 flex items-end justify-end">
                      {sensors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSensor(idx)}
                          className="p-1 text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium shadow-lg shadow-cyan-600/30 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
