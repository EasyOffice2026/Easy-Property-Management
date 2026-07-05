import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface ReportCard {
  key: string;
  icon: string;
  color: string;
  route?: string;
}

const REPORT_CARDS: ReportCard[] = [
  { key: 'occupancyReport', icon: '🏢', color: 'border-primary bg-primary/5' },
  { key: 'revenueSummary', icon: '💰', color: 'border-success bg-success/5', route: '/accounting' },
  { key: 'expenseBreakdown', icon: '💸', color: 'border-danger bg-danger/5', route: '/accounting' },
  { key: 'profitLoss', icon: '📈', color: 'border-info bg-info/5', route: '/accounting' },
  { key: 'contractExpiry', icon: '📄', color: 'border-warning bg-warning/5' },
  { key: 'maintenanceLog', icon: '🛠️', color: 'border-gray-400 bg-gray-50' },
  { key: 'tenantDirectory', icon: '👥', color: 'border-primary bg-primary/5' },
  { key: 'pettyCashReport', icon: '💵', color: 'border-success bg-success/5', route: '/petty-cash' },
  { key: 'balanceSheet', icon: '📊', color: 'border-info bg-info/5', route: '/accounting' },
];

export function Reports() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary">{t('nav.reports')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('reports.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <select className="border rounded px-3 py-2 bg-white text-sm">
            <option>{t('reports.thisMonth')}</option>
            <option>{t('reports.lastMonth')}</option>
            <option>{t('reports.thisQuarter')}</option>
            <option>{t('reports.thisYear')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {REPORT_CARDS.map((card) => (
          <button
            key={card.key}
            onClick={() => card.route && navigate(card.route)}
            className={`bg-white rounded-lg shadow border-l-4 p-6 text-left hover:shadow-md transition-shadow ${card.color}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden="true">
                {card.icon}
              </span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{t(`reports.cards.${card.key}.title`)}</h3>
                <p className="text-xs text-gray-500 mt-1">{t(`reports.cards.${card.key}.desc`)}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs text-gray-400">{t('reports.lastGenerated')}: {t('reports.today')}</span>
              <span className="text-xs font-medium text-primary">{t('reports.view')}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
