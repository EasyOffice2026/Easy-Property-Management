import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const navItems = [
  { to: '/dashboard', key: 'dashboard' },
  { to: '/properties', key: 'properties' },
  { to: '/tenants', key: 'tenants' },
  { to: '/inquiries', key: 'inquiries' },
  { to: '/contracts', key: 'contracts' },
  { to: '/maintenance', key: 'maintenance' },
  { to: '/assets', key: 'assets' },
  { to: '/accounting', key: 'accounting' },
  { to: '/petty-cash', key: 'pettyCash' },
  { to: '/reports', key: 'reports' },
  { to: '/users', key: 'users' },
  { to: '/settings', key: 'settings' },
];

export function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="w-sidebar shrink-0 bg-primary text-white min-h-screen">
      <div className="px-4 py-5 text-lg font-semibold border-b border-white/10">{t('app.name')}</div>
      <nav className="py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-4 py-2.5 text-sm border-s-4 ${
                isActive ? 'border-gold bg-white/10' : 'border-transparent hover:bg-white/5'
              }`
            }
          >
            {t(`nav.${item.key}`)}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
