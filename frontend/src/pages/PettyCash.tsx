import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createPettyCash,
  getPettyCashSummary,
  listPettyCash,
  PettyCashCategory,
  PettyCashStatus,
  PettyCashSummary,
  PettyCashTransaction,
  PettyCashType,
  setPettyCashStatus,
} from '../api/pettycash';
import { listBuildings, Building } from '../api/properties';

const TYPES: PettyCashType[] = ['REPLENISHMENT', 'EXPENSE'];
const CATEGORIES: PettyCashCategory[] = ['MAINTENANCE', 'SUPPLIES', 'UTILITIES', 'TRANSPORT', 'OFFICE', 'OTHER'];
const STATUSES: PettyCashStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

const STATUS_COLORS: Record<PettyCashStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  APPROVED: 'bg-success/15 text-success',
  REJECTED: 'bg-danger/15 text-danger',
};

const TYPE_COLORS: Record<PettyCashType, string> = {
  REPLENISHMENT: 'bg-info/15 text-info',
  EXPENSE: 'bg-warning/15 text-warning',
};

const EMPTY_FORM = {
  buildingId: '',
  type: 'EXPENSE' as PettyCashType,
  category: 'OTHER' as PettyCashCategory,
  amount: 0,
  description: '',
  occurredAt: '',
};

export function PettyCash() {
  const { t } = useTranslation();
  const [items, setItems] = useState<PettyCashTransaction[]>([]);
  const [summary, setSummary] = useState<PettyCashSummary | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [typeFilter, setTypeFilter] = useState<PettyCashType | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<PettyCashCategory | ''>('');
  const [statusFilter, setStatusFilter] = useState<PettyCashStatus | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    const [result, summaryResult] = await Promise.all([
      listPettyCash({
        type: typeFilter || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        pageSize: 100,
      }),
      getPettyCashSummary(),
    ]);
    setItems(result.items);
    setSummary(summaryResult);
  }

  useEffect(() => {
    refresh();
    listBuildings().then(setBuildings);
  }, [typeFilter, categoryFilter, statusFilter]);

  function openModal(type: PettyCashType = 'EXPENSE') {
    setForm({ ...EMPTY_FORM, type });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createPettyCash({
        buildingId: form.buildingId || undefined,
        type: form.type,
        category: form.category,
        amount: form.amount,
        description: form.description,
        occurredAt: form.occurredAt || undefined,
      });
      setModalOpen(false);
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(tx: PettyCashTransaction, status: 'APPROVED' | 'REJECTED') {
    setError('');
    try {
      await setPettyCashStatus(tx.id, status);
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Action failed');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">{t('pettyCash.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('pettyCash.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openModal('REPLENISHMENT')}
            className="bg-gray-100 text-gray-700 rounded px-4 py-2 text-sm font-medium"
          >
            Top Up Request
          </button>
          <button onClick={() => openModal('EXPENSE')} className="bg-primary text-white rounded px-4 py-2 text-sm font-medium">
            {t('pettyCash.add')}
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            label={t('pettyCash.remaining')}
            value={summary.remaining}
            color={summary.remaining < 0 ? 'text-danger' : 'text-success'}
          />
          <SummaryCard label={t('pettyCash.spent')} value={summary.spent} color="text-warning" />
          <SummaryCard label={t('pettyCash.monthlyLimit')} value={summary.monthlyLimit} />
        </div>
      )}

      {error && <p className="text-danger text-sm mb-3">{error}</p>}

      <div className="flex gap-3 mb-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as PettyCashType | '')}
          className="border rounded px-3 py-2 bg-white text-sm"
        >
          <option value="">{t('pettyCash.allTypes')}</option>
          {TYPES.map((ty) => (
            <option key={ty} value={ty}>
              {t(`pettyCash.types.${ty}`)}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as PettyCashCategory | '')}
          className="border rounded px-3 py-2 bg-white text-sm"
        >
          <option value="">{t('pettyCash.allCategories')}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`pettyCash.categories.${c}`)}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PettyCashStatus | '')}
          className="border rounded px-3 py-2 bg-white text-sm"
        >
          <option value="">{t('pettyCash.allStatuses')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`pettyCash.statuses.${s}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">{t('pettyCash.date')}</th>
              <th className="px-4 py-3">{t('pettyCash.type')}</th>
              <th className="px-4 py-3">{t('pettyCash.category')}</th>
              <th className="px-4 py-3">{t('pettyCash.description')}</th>
              <th className="px-4 py-3">{t('pettyCash.building')}</th>
              <th className="px-4 py-3">{t('pettyCash.amount')}</th>
              <th className="px-4 py-3">{t('pettyCash.status')}</th>
              <th className="px-4 py-3">By</th>
              <th className="px-4 py-3">Receipt</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((tx) => (
              <tr key={tx.id} className="border-t">
                <td className="px-4 py-3 whitespace-nowrap">{new Date(tx.occurredAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[tx.type]}`}>
                    {t(`pettyCash.types.${tx.type}`)}
                  </span>
                </td>
                <td className="px-4 py-3">{t(`pettyCash.categories.${tx.category}`)}</td>
                <td className="px-4 py-3 max-w-xs truncate">{tx.description}</td>
                <td className="px-4 py-3">{tx.building?.nameEn ?? '-'}</td>
                <td className="px-4 py-3 font-medium">{tx.amount} KWD</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[tx.status]}`}>
                    {t(`pettyCash.statuses.${tx.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3">{tx.requestedBy}</td>
                <td className="px-4 py-3">
                  {tx.receiptUrl ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-success/15 text-success">✓</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-warning/15 text-warning">Missing</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                  {tx.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(tx, 'APPROVED')}
                        className="text-xs font-medium text-success"
                      >
                        {t('pettyCash.approve')}
                      </button>
                      <button
                        onClick={() => handleStatusChange(tx, 'REJECTED')}
                        className="text-xs font-medium text-danger"
                      >
                        {t('pettyCash.reject')}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                  {t('pettyCash.none')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">{t('pettyCash.add')}</h2>

            {error && <p className="text-danger text-sm mb-3">{error}</p>}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('pettyCash.type')}</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PettyCashType }))}
                    className="w-full border rounded px-3 py-2"
                  >
                    {TYPES.map((ty) => (
                      <option key={ty} value={ty}>
                        {t(`pettyCash.types.${ty}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('pettyCash.category')}</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as PettyCashCategory }))}
                    className="w-full border rounded px-3 py-2"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {t(`pettyCash.categories.${c}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('maintenance.building')}</label>
                <select
                  value={form.buildingId}
                  onChange={(e) => setForm((f) => ({ ...f, buildingId: e.target.value }))}
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
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('pettyCash.amount')}</label>
                <input
                  type="number"
                  required
                  min={0}
                  step="0.001"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('pettyCash.description')}</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('pettyCash.date')}</label>
                <input
                  type="date"
                  value={form.occurredAt}
                  onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm rounded border">
                {t('pettyCash.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm rounded bg-primary text-white disabled:opacity-50"
              >
                {t('pettyCash.save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className={`text-xl font-semibold ${color ?? 'text-primary'}`}>{value.toFixed(3)} KWD</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
