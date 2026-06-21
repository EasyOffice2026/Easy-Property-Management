import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { DashboardKpis, getDashboardKpis } from '../api/dashboard';

const STATUS_COLORS: Record<string, string> = {
  OCCUPIED: '#22c55e',
  VACANT: '#3b82f6',
  MAINTENANCE: '#f59e0b',
  RESERVED: '#c8972b',
};

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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon="🏢" label={t('dashboard.buildings')} value={kpis.buildingCount} color="bg-primary/10 text-primary" />
            <StatCard icon="🏠" label={t('dashboard.units')} value={kpis.totalUnits} color="bg-info/10 text-info" />
            <StatCard icon="👥" label={t('dashboard.tenants')} value={kpis.tenantCount} color="bg-gold/10 text-gold" />
            <StatCard
              icon="📊"
              label={t('dashboard.occupancyRate')}
              value={`${Math.round(kpis.occupancyRate * 100)}%`}
              color="bg-success/10 text-success"
            />
            <StatCard icon="📄" label={t('dashboard.activeContracts')} value={kpis.activeContractCount} color="bg-primary-light/10 text-primary-light" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-sm font-medium text-gray-700 mb-4">{t('dashboard.unitsByStatus')}</h2>
              <UnitsDonut unitsByStatus={kpis.unitsByStatus} />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-sm font-medium text-gray-700 mb-4">{t('dashboard.openWorkOrders')}</h2>
              <div className="flex gap-6">
                {(['EMERGENCY', 'HIGH', 'ROUTINE'] as const).map((priority) => (
                  <div key={priority} className="text-center flex-1">
                    <div className="text-3xl font-semibold text-primary">{kpis.openWorkOrders[priority]}</div>
                    <div className="text-xs text-gray-500 mt-1">{t(`maintenance.priorities.${priority}`)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {kpis.expiringContracts.length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow border-l-4 border-warning p-6">
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
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-5 flex items-start gap-3">
      <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${color}`}>
        {icon}
      </span>
      <div>
        <div className="text-2xl font-semibold text-primary leading-tight">{value}</div>
        <div className="text-xs text-gray-500 mt-1">{label}</div>
      </div>
    </div>
  );
}

function UnitsDonut({ unitsByStatus }: { unitsByStatus: Record<string, number> }) {
  const entries = Object.entries(unitsByStatus);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (total === 0) {
    return <p className="text-sm text-gray-500">-</p>;
  }

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="20" />
        {entries.map(([status, count]) => {
          const fraction = count / total;
          const dash = fraction * circumference;
          const circle = (
            <circle
              key={status}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={STATUS_COLORS[status] ?? '#9ca3af'}
              strokeWidth="20"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 80 80)"
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      <div className="space-y-1.5">
        {entries.map(([status, count]) => (
          <div key={status} className="flex items-center gap-2 text-sm">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] ?? '#9ca3af' }}
            />
            <span className="text-gray-600">{status}</span>
            <span className="font-medium text-gray-800">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
