import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store';

const navGroups = [
  {
    label: 'MAIN',
    items: [{ to: '/dashboard', key: 'dashboard', icon: '📊' }],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/properties', key: 'properties', icon: '🏢' },
      { to: '/tenants', key: 'tenants', icon: '👥' },
      { to: '/inquiries', key: 'inquiries', icon: '📩' },
      { to: '/contracts', key: 'contracts', icon: '📄' },
    ],
  },
  {
    label: 'MAINTENANCE',
    items: [
      { to: '/maintenance', key: 'maintenance', icon: '🛠️' },
      { to: '/assets', key: 'assets', icon: '🧰' },
    ],
  },
  {
    label: 'ACCOUNTING',
    items: [
      { to: '/accounting', key: 'accounting', icon: '💰' },
      { to: '/petty-cash', key: 'pettyCash', icon: '💵' },
      { to: '/reports', key: 'reports', icon: '📈' },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { to: '/users', key: 'users', icon: '👤' },
      { to: '/settings', key: 'settings', icon: '⚙️' },
    ],
  },
];

export function Sidebar() {
  const { t } = useTranslation();
  const { language, setLanguage } = useAppStore();

  return (
    <aside className="w-sidebar shrink-0 bg-primary text-white min-h-screen flex flex-col">
      <div className="px-4 py-5 border-b border-white/10">
        <div className="text-lg font-semibold">{t('app.name')}</div>
        <div className="text-xs text-white/60 mt-0.5">Property Management System</div>
      </div>

      <nav className="py-2 flex-1 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2">
            <div className="px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-white/40">
              {group.label}
            </div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4 py-2.5 text-sm border-s-4 ${
                    isActive ? 'border-gold-light bg-white/10' : 'border-transparent hover:bg-white/5'
                  }`
                }
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{t(`nav.${item.key}`)}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="w-full text-sm font-medium text-white border border-white/30 rounded px-3 py-1.5 hover:bg-white/10"
        >
          {language === 'en' ? 'العربية' : 'English'}
        </button>
      </div>
    </aside>
  );
}
