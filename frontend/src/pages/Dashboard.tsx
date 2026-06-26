import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardKpis, getDashboardKpis } from '../api/dashboard';
import { Contract, listContracts } from '../api/contracts';
import { listWorkOrders, WorkOrder } from '../api/maintenance';

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#ef4444',
  OCCUPIED: '#22c55e',
  MAINTENANCE: '#f59e0b',
  OUT_OF_SERVICE: '#9ca3af',
};

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-success/15 text-success',
  EXPIRING: 'bg-warning/15 text-warning',
  EXPIRED: 'bg-danger/15 text-danger',
  TERMINATED: 'bg-danger/15 text-danger',
  CLEARED: 'bg-info/15 text-info',
};

const PRIORITY_ICON_BG: Record<string, string> = {
  EMERGENCY: 'bg-danger/15 text-danger',
  HIGH: 'bg-warning/15 text-warning',
  ROUTINE: 'bg-info/15 text-info',
};

export function Dashboard() {
  const { t } = useTranslation();
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [openWorkOrders, setOpenWorkOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    getDashboardKpis().then(setKpis).catch(() => setKpis(null));
    listContracts({ pageSize: 5 }).then((r) => setRecentContracts(r.items)).catch(() => setRecentContracts([]));
    listWorkOrders({ pageSize: 5 }).then((r) =>
      setOpenWorkOrders(r.items.filter((w) => w.status !== 'COMPLETED' && w.status !== 'CANCELLED'))
    ).catch(() => setOpenWorkOrders([]));
  }, []);

  const today = new Date();
  const monthLabel = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  if (!kpis) return null;

  const occupiedCount = kpis.unitsByStatus['OCCUPIED'] ?? 0;
  const emergencyCount = kpis.openWorkOrders.EMERGENCY;

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary">{t('nav.dashboard')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('dashboard.welcome')}! Here&apos;s your portfolio overview.</p>
        </div>
        <span className="text-sm text-gray-400">{monthLabel}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="🏢"
          label={t('dashboard.buildings')}
          value={kpis.buildingCount}
          color="bg-info/10 text-info"
        />
        <StatCard
          icon="🏠"
          label={t('dashboard.units')}
          value={kpis.totalUnits}
          color="bg-success/10 text-success"
          sub={`▲ ${Math.round(kpis.occupancyRate * 100)}% occupied`}
          subColor="text-success"
        />
        <StatCard
          icon="📄"
          label={t('dashboard.activeContracts')}
          value={kpis.activeContractCount}
          color="bg-gold/10 text-gold"
        />
        <StatCard
          icon="🔧"
          label={t('dashboard.openWorkOrders')}
          value={kpis.openWorkOrders.EMERGENCY + kpis.openWorkOrders.HIGH + kpis.openWorkOrders.ROUTINE}
          color="bg-danger/10 text-danger"
          sub={emergencyCount > 0 ? `▼ ${emergencyCount} emergency` : undefined}
          subColor="text-danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">{t('dashboard.unitsByStatus')}</h2>
          <UnitsDonut unitsByStatus={kpis.unitsByStatus} occupancyRate={kpis.occupancyRate} />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-gray-700">{t('contracts.add')}</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-1 font-medium">{t('contracts.number')}</th>
                <th className="py-1 font-medium">{t('tenants.name')}</th>
                <th className="py-1 font-medium">{t('contracts.unit')}</th>
                <th className="py-1 font-medium">{t('maintenance.status')}</th>
              </tr>
            </thead>
            <tbody>
              {recentContracts.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="py-2 text-primary font-medium">{c.contractNumber}</td>
                  <td className="py-2">
                    {c.tenant?.companyName ?? `${c.tenant?.firstName ?? ''} ${c.tenant?.lastName ?? ''}`}
                  </td>
                  <td className="py-2">{c.unit?.unitNumber}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONTRACT_STATUS_COLORS[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentContracts.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">
                    {t('contracts.none')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">{t('nav.maintenance')}</h2>
          <div className="space-y-3">
            {openWorkOrders.map((wo) => (
              <div key={wo.id} className="flex items-start gap-3">
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${PRIORITY_ICON_BG[wo.priority]}`}
                >
                  🛠️
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">
                    {wo.woNumber} — {wo.description}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {wo.unit?.unitNumber ?? '-'} · {t(`maintenance.priorities.${wo.priority}`)}
                  </div>
                </div>
              </div>
            ))}
            {openWorkOrders.length === 0 && <p className="text-sm text-gray-500">{t('maintenance.none')}</p>}
          </div>
        </div>

        {kpis.expiringContracts.length > 0 && (
          <div className="bg-white rounded-lg shadow border-l-4 border-warning p-6">
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
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  sub,
  subColor,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-5 flex items-start gap-3">
      <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${color}`}>
        {icon}
      </span>
      <div>
        <div className="text-2xl font-semibold text-primary leading-tight">{value}</div>
        <div className="text-xs text-gray-500 mt-1">{label}</div>
        {sub && <div className={`text-xs font-medium mt-1 ${subColor ?? ''}`}>{sub}</div>}
      </div>
    </div>
  );
}

function UnitsDonut({
  unitsByStatus,
  occupancyRate,
}: {
  unitsByStatus: Record<string, number>;
  occupancyRate: number;
}) {
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
      <div className="relative w-40 h-40">
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
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-semibold text-primary">{Math.round(occupancyRate * 100)}%</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {entries.map(([status, count]) => (
          <div key={status} className="flex items-center gap-2 text-sm">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] ?? '#9ca3af' }}
            />
            <span className="text-gray-600">{status}</span>
            <span className="font-medium text-gray-800">({count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
