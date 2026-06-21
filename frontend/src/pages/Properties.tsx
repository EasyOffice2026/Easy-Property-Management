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
  const availableCount = units.filter((u) => u.status === 'AVAILABLE').length;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-4">{t('nav.properties')}</h1>

      <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
        {buildings.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedId(b.id)}
            className={`shrink-0 text-left rounded-lg shadow px-4 py-3 min-w-[180px] border-2 ${
              b.id === selectedId ? 'border-primary bg-primary/5' : 'border-transparent bg-white'
            }`}
          >
            <div className="font-semibold text-primary text-sm">{b.nameEn}</div>
            <div className="text-xs text-gray-500 mt-0.5">{b.nameAr}</div>
          </button>
        ))}
      </div>

      {selectedBuilding && (
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap items-center justify-between gap-2">
          <p className="text-gray-600 text-sm">
            {selectedBuilding.address} &middot; {selectedBuilding.totalFloors} floors &middot;{' '}
            {selectedBuilding.facilities.join(', ')}
          </p>
          <span className="text-xs px-2 py-1 rounded border bg-success/10 text-success border-success/30">
            {availableCount} available
          </span>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {units.map((unit) => (
            <div key={unit.id} className="bg-white rounded-lg shadow p-4 border-t-2 border-t-primary/20">
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
