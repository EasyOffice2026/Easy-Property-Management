import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createWorkOrder,
  listWorkOrders,
  Priority,
  Trade,
  updateWorkOrder,
  WOStatus,
  WorkOrder,
} from '../api/maintenance';
import { listBuildings, Building, listUnitsByBuilding, Unit } from '../api/properties';

const TRADE_ICONS: Record<Trade, string> = {
  ELECTRICAL: '⚡',
  PLUMBING: '🔧',
  CARPENTRY: '🪚',
  MASONRY: '🧱',
  CLEANING: '🧹',
  OTHER: '🛠️',
};

const PRIORITY_COLORS: Record<Priority, string> = {
  EMERGENCY: 'bg-danger/10 text-danger border-danger/30',
  HIGH: 'bg-warning/10 text-warning border-warning/30',
  ROUTINE: 'bg-gray-100 text-gray-600 border-gray-300',
};

const STATUS_COLORS: Record<WOStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600 border-gray-300',
  ASSIGNED: 'bg-info/10 text-info border-info/30',
  IN_PROGRESS: 'bg-warning/10 text-warning border-warning/30',
  COMPLETED: 'bg-success/10 text-success border-success/30',
  CANCELLED: 'bg-danger/10 text-danger border-danger/30',
};

const TRADES: Trade[] = ['ELECTRICAL', 'PLUMBING', 'CARPENTRY', 'MASONRY', 'CLEANING', 'OTHER'];
const PRIORITIES: Priority[] = ['EMERGENCY', 'HIGH', 'ROUTINE'];

const EMPTY_FORM = {
  buildingId: '',
  unitId: '',
  trade: 'ELECTRICAL' as Trade,
  priority: 'ROUTINE' as Priority,
  description: '',
  notes: '',
};

export function WorkOrders() {
  const { t } = useTranslation();
  const [items, setItems] = useState<WorkOrder[]>([]);
  const [tradeFilter, setTradeFilter] = useState<Trade | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    const result = await listWorkOrders({
      trade: tradeFilter || undefined,
      pageSize: 100,
    });
    setItems(result.items);
  }

  useEffect(() => {
    refresh();
  }, [tradeFilter]);

  const emergencyCount = items.filter((w) => w.priority === 'EMERGENCY' && w.status !== 'COMPLETED' && w.status !== 'CANCELLED').length;
  const highCount = items.filter((w) => w.priority === 'HIGH' && w.status !== 'COMPLETED' && w.status !== 'CANCELLED').length;
  const routineCount = items.filter((w) => w.priority === 'ROUTINE' && w.status !== 'COMPLETED' && w.status !== 'CANCELLED').length;
  const completedThisMonth = items.filter((w) => {
    if (w.status !== 'COMPLETED') return false;
    const updated = new Date(w.updatedAt ?? w.createdAt ?? '');
    const now = new Date();
    return updated.getMonth() === now.getMonth() && updated.getFullYear() === now.getFullYear();
  }).length;

  async function openModal() {
    setForm(EMPTY_FORM);
    const b = await listBuildings();
    setBuildings(b);
    setUnits([]);
    setModalOpen(true);
  }

  async function onBuildingChange(buildingId: string) {
    setForm((f) => ({ ...f, buildingId, unitId: '' }));
    if (buildingId) {
      const u = await listUnitsByBuilding(buildingId);
      setUnits(u);
    } else {
      setUnits([]);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createWorkOrder({
        buildingId: form.buildingId,
        unitId: form.unitId || undefined,
        trade: form.trade,
        priority: form.priority,
        description: form.description,
        notes: form.notes || undefined,
      });
      setModalOpen(false);
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Failed to create work order');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(wo: WorkOrder, status: WOStatus) {
    setError('');
    try {
      await updateWorkOrder(wo.id, { status });
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Action failed');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">{t('nav.maintenance')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Maintenance requests and assignments</p>
        </div>
        <button onClick={openModal} className="bg-primary text-white rounded px-4 py-2 text-sm font-medium">
          + {t('maintenance.add')}
        </button>
      </div>

      {error && <p className="text-danger text-sm mb-3">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <MiniStat value={emergencyCount} label={t('maintenance.priorities.EMERGENCY')} color="text-danger" dot="bg-danger" />
        <MiniStat value={highCount} label={t('maintenance.priorities.HIGH')} color="text-warning" dot="bg-warning" />
        <MiniStat value={routineCount} label={t('maintenance.priorities.ROUTINE')} color="text-info" dot="bg-info" />
        <MiniStat value={completedThisMonth} label="Completed This Month" color="text-success" dot="bg-success" />
      </div>

      <div className="bg-white rounded-lg shadow p-3 mb-4 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setTradeFilter('')}
          className={`shrink-0 rounded px-4 py-2 text-sm font-medium ${
            tradeFilter === '' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('maintenance.allTrades')}
        </button>
        {TRADES.map((tr) => (
          <button
            key={tr}
            onClick={() => setTradeFilter(tr)}
            className={`shrink-0 rounded px-4 py-2 text-sm font-medium ${
              tradeFilter === tr ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {TRADE_ICONS[tr]} {t(`maintenance.trades.${tr}`)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow divide-y">
        {items.map((wo) => (
          <div key={wo.id} className="flex items-center gap-4 px-4 py-3">
            <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${PRIORITY_COLORS[wo.priority]}`}>
              {TRADE_ICONS[wo.trade]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">
                {wo.woNumber} — {wo.description}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{wo.unit?.unitNumber ?? '-'}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[wo.priority]}`}>
                  {t(`maintenance.priorities.${wo.priority}`)}
                </span>
                <span>Reported {new Date(wo.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${STATUS_COLORS[wo.status]}`}>
              {t(`maintenance.statuses.${wo.status}`)}
            </span>
            <div className="flex gap-2 shrink-0">
              {wo.status === 'PENDING' && (
                <button
                  onClick={() => handleStatusChange(wo, 'ASSIGNED')}
                  className="text-xs font-medium text-primary"
                >
                  {t('maintenance.assign')}
                </button>
              )}
              {wo.status === 'ASSIGNED' && (
                <button
                  onClick={() => handleStatusChange(wo, 'IN_PROGRESS')}
                  className="text-xs font-medium text-primary"
                >
                  {t('maintenance.start')}
                </button>
              )}
              {(wo.status === 'ASSIGNED' || wo.status === 'IN_PROGRESS') && (
                <button
                  onClick={() => handleStatusChange(wo, 'COMPLETED')}
                  className="text-xs font-medium text-success"
                >
                  {t('maintenance.complete')}
                </button>
              )}
              {wo.status !== 'COMPLETED' && wo.status !== 'CANCELLED' && (
                <button
                  onClick={() => handleStatusChange(wo, 'CANCELLED')}
                  className="text-xs font-medium text-danger"
                >
                  {t('maintenance.cancel')}
                </button>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="px-4 py-6 text-center text-gray-500">{t('maintenance.none')}</div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">{t('maintenance.add')}</h2>

            {error && <p className="text-danger text-sm mb-3">{error}</p>}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('maintenance.building')}</label>
                <select
                  required
                  value={form.buildingId}
                  onChange={(e) => onBuildingChange(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">--</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('maintenance.unit')}</label>
                <select
                  value={form.unitId}
                  onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  disabled={!form.buildingId}
                >
                  <option value="">--</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unitNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('maintenance.trade')}</label>
                  <select
                    value={form.trade}
                    onChange={(e) => setForm((f) => ({ ...f, trade: e.target.value as Trade }))}
                    className="w-full border rounded px-3 py-2"
                  >
                    {TRADES.map((tr) => (
                      <option key={tr} value={tr}>
                        {t(`maintenance.trades.${tr}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('maintenance.priority')}</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}
                    className="w-full border rounded px-3 py-2"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {t(`maintenance.priorities.${p}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('maintenance.description')}</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('maintenance.notes')}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm rounded border">
                {t('maintenance.close')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm rounded bg-primary text-white disabled:opacity-50"
              >
                {t('maintenance.save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function MiniStat({ value, label, color, dot }: { value: number; label: string; color: string; dot: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <span className={`text-2xl font-semibold ${color}`}>{value}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
