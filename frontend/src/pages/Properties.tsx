import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building, listBuildings, listUnitsByBuilding, Unit } from '../api/properties';

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

export function Properties() {
  const { t } = useTranslation();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listBuildings().then((data) => {
      setBuildings(data);
      if (data.length > 0) setSelectedId(data[0].id);
    });
  }, []);

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

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">{t('nav.properties')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Buildings &amp; apartment units</p>
        </div>
        <button className="bg-primary text-white rounded px-4 py-2 text-sm font-medium">+ Add Building</button>
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
              <button className="flex-1 border rounded px-3 py-2 text-sm font-medium text-primary">
                Edit Building
              </button>
              <button className="flex-1 border rounded px-3 py-2 text-sm font-medium text-primary">
                View Financials
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
