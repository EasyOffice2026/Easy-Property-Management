import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building, listBuildings, listUnitsByBuilding, Unit } from '../api/properties';

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-success/10 text-success border-success/30',
  OCCUPIED: 'bg-info/10 text-info border-info/30',
  MAINTENANCE: 'bg-warning/10 text-warning border-warning/30',
  OUT_OF_SERVICE: 'bg-danger/10 text-danger border-danger/30',
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

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-4">{t('nav.properties')}</h1>

      <div className="mb-6">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-md bg-white"
        >
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nameEn} / {b.nameAr}
            </option>
          ))}
        </select>
      </div>

      {selectedBuilding && (
        <p className="text-gray-600 mb-4 text-sm">
          {selectedBuilding.address} &middot; {selectedBuilding.totalFloors} floors &middot;{' '}
          {selectedBuilding.facilities.join(', ')}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {units.map((unit) => (
            <div key={unit.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-primary">Unit {unit.unitNumber}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[unit.status] ?? ''}`}
                >
                  {unit.status}
                </span>
              </div>
              <p className="text-sm text-gray-500">Floor {unit.floor}</p>
              <p className="text-sm text-gray-500">{unit.type.replace('_', ' ')}</p>
              <p className="text-sm font-medium text-gray-800 mt-2">{unit.rentAmount} KWD/mo</p>
            </div>
          ))}
          {units.length === 0 && <p className="text-gray-500">No units found.</p>}
        </div>
      )}
    </div>
  );
}
