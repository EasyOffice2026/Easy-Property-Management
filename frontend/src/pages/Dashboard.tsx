import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { DashboardKpis, getDashboardKpis } from '../api/dashboard';

export function Dashboard() {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);

  useEffect(() => {
    getDashboardKpis().then(setKpis).catch(() => setKpis(null));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-1">
        {t('dashboard.welcome')}, {user?.name}
      </h1>
      <p className="text-gray-600 mb-6">{user?.role}</p>

      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label={t('dashboard.buildings')} value={kpis.buildingCount} />
          <KpiCard label={t('dashboard.units')} value={kpis.totalUnits} />
          <KpiCard label={t('dashboard.tenants')} value={kpis.tenantCount} />
          <KpiCard label={t('dashboard.occupancyRate')} value={`${Math.round(kpis.occupancyRate * 100)}%`} />
          <KpiCard label={t('dashboard.activeContracts')} value={kpis.activeContractCount} />
        </div>
      )}

      {kpis && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">{t('dashboard.openWorkOrders')}</h2>
          <div className="flex gap-6">
            {(['EMERGENCY', 'HIGH', 'ROUTINE'] as const).map((priority) => (
              <div key={priority} className="text-center">
                <div className="text-xl font-semibold text-primary">{kpis.openWorkOrders[priority]}</div>
                <div className="text-xs text-gray-500">{t(`maintenance.priorities.${priority}`)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {kpis && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">{t('dashboard.unitsByStatus')}</h2>
          <div className="flex gap-6">
            {Object.entries(kpis.unitsByStatus).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className="text-xl font-semibold text-primary">{count}</div>
                <div className="text-xs text-gray-500">{status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {kpis && kpis.expiringContracts.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">{t('dashboard.expiringSoon')}</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-1">{t('contracts.number')}</th>
                <th className="py-1">{t('tenants.name')}</th>
                <th className="py-1">{t('contracts.unit')}</th>
                <th className="py-1">{t('contracts.endDate')}</th>
              </tr>
            </thead>
            <tbody>
              {kpis.expiringContracts.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="py-1.5">{c.contractNumber}</td>
                  <td className="py-1.5">
                    {c.tenant.companyName ?? `${c.tenant.firstName ?? ''} ${c.tenant.lastName ?? ''}`}
                  </td>
                  <td className="py-1.5">{c.unit.unitNumber}</td>
                  <td className="py-1.5">{new Date(c.endDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="text-2xl font-semibold text-primary">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}
