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
const STATUSES: WOStatus[] = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

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
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [statusFilter, setStatusFilter] = useState<WOStatus | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    const result = await listWorkOrders({
      trade: tradeFilter || undefined,
      priority: priorityFilter || undefined,
      status: statusFilter || undefined,
      pageSize: 100,
    });
    setItems(result.items);
  }

  useEffect(() => {
    refresh();
  }, [tradeFilter, priorityFilter, statusFilter]);

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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-primary">{t('nav.maintenance')}</h1>
        <button onClick={openModal} className="bg-primary text-white rounded px-4 py-2 text-sm font-medium">
          {t('maintenance.add')}
        </button>
      </div>

      {error && <p className="text-danger text-sm mb-3">{error}</p>}

      <div className="flex gap-3 mb-4">
        <select
          value={tradeFilter}
          onChange={(e) => setTradeFilter(e.target.value as Trade | '')}
          className="border rounded px-3 py-2 bg-white text-sm"
        >
          <option value="">{t('maintenance.allTrades')}</option>
          {TRADES.map((tr) => (
            <option key={tr} value={tr}>
              {t(`maintenance.trades.${tr}`)}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as Priority | '')}
          className="border rounded px-3 py-2 bg-white text-sm"
        >
          <option value="">{t('maintenance.allPriorities')}</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {t(`maintenance.priorities.${p}`)}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as WOStatus | '')}
          className="border rounded px-3 py-2 bg-white text-sm"
        >
          <option value="">{t('maintenance.allStatuses')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`maintenance.statuses.${s}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">{t('maintenance.number')}</th>
              <th className="px-4 py-3">{t('maintenance.trade')}</th>
              <th className="px-4 py-3">{t('maintenance.priority')}</th>
              <th className="px-4 py-3">{t('maintenance.description')}</th>
              <th className="px-4 py-3">{t('maintenance.unit')}</th>
              <th className="px-4 py-3">{t('maintenance.status')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((wo) => (
              <tr key={wo.id} className="border-t">
                <td className="px-4 py-3 font-medium">{wo.woNumber}</td>
                <td className="px-4 py-3">
                  <span className="mr-1">{TRADE_ICONS[wo.trade]}</span>
                  {t(`maintenance.trades.${wo.trade}`)}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded border ${PRIORITY_COLORS[wo.priority]}`}>
                    {t(`maintenance.priorities.${wo.priority}`)}
                  </span>
                </td>
                <td className="px-4 py-3 max-w-xs truncate">{wo.description}</td>
                <td className="px-4 py-3">{wo.unit?.unitNumber ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[wo.status]}`}>
                    {t(`maintenance.statuses.${wo.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
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
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  {t('maintenance.none')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
