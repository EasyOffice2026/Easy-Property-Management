import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Asset, AssetStatus, createAsset, listAssets, Trade, updateAsset } from '../api/maintenance';
import { listBuildings, Building } from '../api/properties';

const STATUS_COLORS: Record<AssetStatus, string> = {
  GOOD: 'bg-success/15 text-success',
  SERVICE_DUE: 'bg-warning/15 text-warning',
  OVERDUE: 'bg-danger/15 text-danger',
  OUT_OF_SERVICE: 'bg-gray-100 text-gray-600',
};

const TRADES: Trade[] = ['ELECTRICAL', 'PLUMBING', 'CARPENTRY', 'MASONRY', 'CLEANING', 'OTHER'];

const EMPTY_FORM = {
  buildingId: '',
  name: '',
  category: 'OTHER' as Trade,
  location: '',
  purchaseDate: '',
  warrantyExpiry: '',
  nextServiceDate: '',
  notes: '',
};

export function Assets() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Asset[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    const result = await listAssets();
    setItems(result);
  }

  useEffect(() => {
    refresh();
    listBuildings().then(setBuildings);
  }, []);

  function openAddModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEditModal(asset: Asset) {
    setEditingId(asset.id);
    setForm({
      buildingId: asset.buildingId,
      name: asset.name,
      category: asset.category,
      location: asset.location,
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.slice(0, 10) : '',
      warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.slice(0, 10) : '',
      nextServiceDate: asset.nextServiceDate ? asset.nextServiceDate.slice(0, 10) : '',
      notes: asset.notes ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        buildingId: form.buildingId,
        name: form.name,
        category: form.category,
        location: form.location,
        purchaseDate: form.purchaseDate || undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
        nextServiceDate: form.nextServiceDate || undefined,
        notes: form.notes || undefined,
      };
      if (editingId) {
        await updateAsset(editingId, payload);
      } else {
        await createAsset(payload);
      }
      setModalOpen(false);
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-primary">{t('nav.assets')}</h1>
        <button onClick={openAddModal} className="bg-primary text-white rounded px-4 py-2 text-sm font-medium">
          {t('assets.add')}
        </button>
      </div>

      {error && <p className="text-danger text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Asset ID</th>
              <th className="px-4 py-3">{t('assets.name')}</th>
              <th className="px-4 py-3">{t('assets.category')}</th>
              <th className="px-4 py-3">Building / Unit</th>
              <th className="px-4 py-3">{t('assets.purchaseDate')}</th>
              <th className="px-4 py-3">{t('assets.warrantyExpiry')}</th>
              <th className="px-4 py-3">{t('assets.nextServiceDate')}</th>
              <th className="px-4 py-3">{t('assets.status')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((asset) => (
              <tr key={asset.id} className="border-t">
                <td className="px-4 py-3 text-gray-500">AST-{asset.id.slice(0, 6).toUpperCase()}</td>
                <td className="px-4 py-3 font-medium">{asset.name}</td>
                <td className="px-4 py-3">{t(`maintenance.trades.${asset.category}`)}</td>
                <td className="px-4 py-3">
                  {asset.building?.nameEn ?? '—'}-{asset.location}
                </td>
                <td className="px-4 py-3">
                  {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-3">
                  {asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-3">
                  {asset.nextServiceDate ? new Date(asset.nextServiceDate).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[asset.status]}`}>
                    {t(`assets.statuses.${asset.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEditModal(asset)} className="text-xs font-medium text-primary">
                    {t('assets.edit')}
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                  {t('assets.none')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">
              {editingId ? t('assets.edit') : t('assets.add')}
            </h2>

            {error && <p className="text-danger text-sm mb-3">{error}</p>}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('maintenance.building')}</label>
                <select
                  required
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
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('assets.name')}</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('assets.category')}</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Trade }))}
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('assets.location')}</label>
                  <input
                    required
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('assets.purchaseDate')}</label>
                  <input
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('assets.warrantyExpiry')}</label>
                  <input
                    type="date"
                    value={form.warrantyExpiry}
                    onChange={(e) => setForm((f) => ({ ...f, warrantyExpiry: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t('assets.nextServiceDate')}
                  </label>
                  <input
                    type="date"
                    value={form.nextServiceDate}
                    onChange={(e) => setForm((f) => ({ ...f, nextServiceDate: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('assets.notes')}</label>
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
                {t('assets.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm rounded bg-primary text-white disabled:opacity-50"
              >
                {t('assets.save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
