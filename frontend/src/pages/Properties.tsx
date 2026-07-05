import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building, listBuildings, listUnitsByBuilding, Unit, createBuilding, updateBuilding } from '../api/properties';

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: 'bg-success/15 text-success border border-success/40',
  OCCUPIED: 'bg-danger/15 text-danger border border-danger/40',
  MAINTENANCE: 'bg-warning/15 text-warning border border-warning/40',
  OUT_OF_SERVICE: 'bg-gray-200 text-gray-500 border border-gray-300',
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  MAINTENANCE: 'Maintenance',
  OUT_OF_SERVICE: 'Out of Service',
};

interface BuildingForm {
  nameEn: string;
  nameAr: string;
  address: string;
  totalFloors: number;
  facilities: string[];
}

const emptyForm: BuildingForm = { nameEn: '', nameAr: '', address: '', totalFloors: 1, facilities: [] };

export function Properties() {
  const { t } = useTranslation();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<BuildingForm>(emptyForm);
  const [facilityInput, setFacilityInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadBuildings = () => {
    listBuildings().then((data) => {
      setBuildings(data);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
    });
  };

  useEffect(() => { loadBuildings(); }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    listUnitsByBuilding(selectedId)
      .then(setUnits)
      .finally(() => setLoading(false));
  }, [selectedId]);

  const selectedBuilding = buildings.find((b) => b.id === selectedId);
  const counts = {
    AVAILABLE: units.filter((u) => u.status === 'AVAILABLE').length,
    OCCUPIED: units.filter((u) => u.status === 'OCCUPIED').length,
    MAINTENANCE: units.filter((u) => u.status === 'MAINTENANCE').length,
  };

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setFacilityInput('');
    setError('');
    setShowModal(true);
  };

  const openEdit = (b: Building) => {
    setEditId(b.id);
    setForm({ nameEn: b.nameEn, nameAr: b.nameAr, address: b.address, totalFloors: b.totalFloors, facilities: [...b.facilities] });
    setFacilityInput('');
    setError('');
    setShowModal(true);
  };

  const addFacility = () => {
    const val = facilityInput.trim();
    if (val && !form.facilities.includes(val)) {
      setForm({ ...form, facilities: [...form.facilities, val] });
      setFacilityInput('');
    }
  };

  const removeFacility = (idx: number) => {
    setForm({ ...form, facilities: form.facilities.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async () => {
    if (!form.nameEn || !form.nameAr || !form.address) {
      setError('Name (EN), Name (AR) and Address are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await updateBuilding(editId, form);
      } else {
        const created = await createBuilding(form);
        setSelectedId(created.id);
      }
      setShowModal(false);
      loadBuildings();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save building';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">{t('nav.properties')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Buildings &amp; apartment units</p>
        </div>
        <button onClick={openAdd} className="bg-primary text-white rounded px-4 py-2 text-sm font-medium">+ Add Building</button>
      </div>

      <div className="bg-white rounded-lg shadow p-3 mb-6 flex gap-2 overflow-x-auto">
        {buildings.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedId(b.id)}
            className={`shrink-0 rounded px-4 py-2 text-sm font-medium ${
              b.id === selectedId ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {b.nameEn}
          </button>
        ))}
      </div>

      {selectedBuilding && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="font-semibold text-primary">{selectedBuilding.nameEn}</h2>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 rounded bg-success/15 text-success font-medium">
                  Available: {counts.AVAILABLE}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-danger/15 text-danger font-medium">
                  Occupied: {counts.OCCUPIED}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-warning/15 text-warning font-medium">
                  Maint: {counts.MAINTENANCE}
                </span>
              </div>
            </div>

            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className={`rounded-lg p-3 text-center ${STATUS_STYLES[unit.status] ?? ''}`}
                  >
                    <div className="font-semibold text-gray-800">{unit.unitNumber}</div>
                    <div className="text-xs mt-0.5">{STATUS_LABELS[unit.status] ?? unit.status}</div>
                  </div>
                ))}
                {units.length === 0 && <p className="text-gray-500 col-span-full">No units found.</p>}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="font-semibold text-primary mb-4">Building Details</h2>
            <dl className="text-sm divide-y">
              <DetailRow label="Building Name" value={selectedBuilding.nameEn} />
              <DetailRow label="Location" value={selectedBuilding.address} />
              <DetailRow label="Total Floors" value={String(selectedBuilding.totalFloors)} />
              <DetailRow label="Total Units" value={String(units.length)} />
              <DetailRow label="Facilities" value={selectedBuilding.facilities.join(', ') || '-'} />
            </dl>
            <div className="flex gap-2 mt-5">
              <button onClick={() => openEdit(selectedBuilding)} className="flex-1 border rounded px-3 py-2 text-sm font-medium text-primary hover:bg-gray-50">
                Edit Building
              </button>
              <button className="flex-1 border rounded px-3 py-2 text-sm font-medium text-primary hover:bg-gray-50">
                View Financials
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-lg font-semibold text-primary">{editId ? 'Edit Building' : 'Add Building'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Building Name (English) *</label>
                <input
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  placeholder="e.g. Al-Jahra Tower"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Building Name (Arabic) *</label>
                <input
                  dir="rtl"
                  value={form.nameAr}
                  onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  placeholder="مثال: برج الجهراء"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  placeholder="e.g. Block 5, Salmiya, Kuwait"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Floors *</label>
                <input
                  type="number"
                  min={1}
                  value={form.totalFloors}
                  onChange={(e) => setForm({ ...form, totalFloors: Number(e.target.value) || 1 })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facilities</label>
                <div className="flex gap-2">
                  <input
                    value={facilityInput}
                    onChange={(e) => setFacilityInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFacility(); } }}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    placeholder="e.g. Parking, Gym, Pool"
                  />
                  <button type="button" onClick={addFacility} className="bg-gray-100 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-200">Add</button>
                </div>
                {form.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.facilities.map((f, i) => (
                      <span key={i} className="bg-primary/10 text-primary text-xs rounded-full px-2.5 py-1 flex items-center gap-1">
                        {f}
                        <button type="button" onClick={() => removeFacility(i)} className="hover:text-red-500">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t">
              <button onClick={() => setShowModal(false)} className="border rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : editId ? 'Update Building' : 'Add Building'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-2">
      <span className="text-primary-light">{label}</span>
      <span className="text-gray-800 font-medium text-right">{value}</span>
    </div>
  );
}
