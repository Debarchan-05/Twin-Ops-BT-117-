import React, { useState } from 'react';
import { MaintenanceRecord, Asset, MaintenanceType, MaintenancePriority } from '../types';
import { X } from 'lucide-react';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<MaintenanceRecord>) => Promise<void>;
  assets: Asset[];
  initialRecord?: MaintenanceRecord | null;
  mode?: 'create' | 'complete';
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  assets,
  initialRecord,
  mode = 'create',
}) => {
  const isCompleteMode = mode === 'complete';

  const [assetId, setAssetId] = useState(initialRecord?.asset_id || assets[0]?.id || '');
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>(
    initialRecord?.maintenance_type || 'preventive'
  );
  const [priority, setPriority] = useState<MaintenancePriority>(
    initialRecord?.priority || 'medium'
  );
  const [description, setDescription] = useState(initialRecord?.description || '');
  const [technician, setTechnician] = useState(initialRecord?.technician || '');
  const [notes, setNotes] = useState(initialRecord?.notes || '');
  const [actionsTaken, setActionsTaken] = useState(initialRecord?.actions_taken || '');
  const [scheduledDate, setScheduledDate] = useState(
    initialRecord?.scheduled_date
      ? new Date(initialRecord.scheduled_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isCompleteMode && initialRecord) {
        await onSubmit({
          status: 'completed',
          actions_taken: actionsTaken,
          technician: technician || initialRecord.technician,
          notes: notes || initialRecord.notes,
        });
      } else {
        await onSubmit({
          asset_id: assetId,
          maintenance_type: maintenanceType,
          priority,
          description,
          scheduled_date: new Date(scheduledDate).toISOString(),
          technician: technician || undefined,
          notes: notes || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-industrial-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isCompleteMode ? 'Complete Maintenance Work Order' : 'Schedule Maintenance Task'}
            </h3>
            <p className="text-xs text-slate-400">
              {isCompleteMode
                ? 'Record actions taken and work completion notes'
                : 'Plan preventative or corrective servicing for industrial assets'}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {!isCompleteMode ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Asset</label>
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Maintenance Type</label>
                  <select
                    value={maintenanceType}
                    onChange={(e) => setMaintenanceType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="preventive">Preventive</option>
                    <option value="corrective">Corrective</option>
                    <option value="inspection">Inspection</option>
                    <option value="overhaul">Overhaul</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Inspect bearing housing clearance and lubricate"
                  className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Scheduled Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Technician</label>
                  <input
                    type="text"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Technician Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional safety protocols or equipment specifications..."
                  className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </>
          ) : (
            <>
              <div className="p-3 rounded-lg bg-industrial-950 border border-slate-800 text-xs space-y-1">
                <div><span className="text-slate-400">Asset:</span> <span className="font-mono text-cyan-400">{initialRecord?.asset_id}</span></div>
                <div><span className="text-slate-400">Task:</span> <span className="text-slate-200">{initialRecord?.description}</span></div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Actions Taken</label>
                <textarea
                  rows={3}
                  required
                  value={actionsTaken}
                  onChange={(e) => setActionsTaken(e.target.value)}
                  placeholder="Detail work performed: e.g. Replaced worn coupling elastomer, purged grease channels, completed laser alignment."
                  className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Technician Name</label>
                <input
                  type="text"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  placeholder="Name of technician completing work"
                  className="w-full px-3 py-2 rounded-lg bg-industrial-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </>
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
              {isSubmitting ? 'Saving...' : isCompleteMode ? 'Mark Completed' : 'Schedule Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
