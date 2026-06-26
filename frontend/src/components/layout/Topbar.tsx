import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { getDashboardKpis } from '../../api/dashboard';

const TITLE_KEYS: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/properties': 'nav.properties',
  '/tenants': 'nav.tenants',
  '/inquiries': 'nav.inquiries',
  '/contracts': 'nav.contracts',
  '/maintenance': 'nav.maintenance',
  '/assets': 'nav.assets',
  '/accounting': 'nav.accounting',
  '/petty-cash': 'nav.pettyCash',
  '/reports': 'nav.reports',
  '/users': 'nav.users',
  '/settings': 'nav.settings',
};

export function Topbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [emergencyCount, setEmergencyCount] = useState(0);

  useEffect(() => {
    getDashboardKpis()
      .then((kpis) => setEmergencyCount(kpis.openWorkOrders.EMERGENCY))
      .catch(() => setEmergencyCount(0));
  }, [location.pathname]);

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  const titleKey = TITLE_KEYS[location.pathname];
  const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between gap-4 px-6">
      <h1 className="text-lg font-semibold text-primary">{titleKey ? t(titleKey) : ''}</h1>

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-lg"
        >
          🔔
          {emergencyCount > 0 && (
            <span className="absolute top-0.5 end-0.5 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] font-semibold flex items-center justify-center">
              {emergencyCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2"
          >
            <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
              {initial}
            </span>
            <span className="text-start hidden sm:block">
              <span className="block text-sm font-medium text-gray-800 leading-tight">{user?.name}</span>
              <span className="block text-xs text-gray-500 leading-tight">{user?.role}</span>
            </span>
          </button>

          {menuOpen && (
            <div className="absolute end-0 mt-2 w-40 bg-white border rounded shadow-lg z-10">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-start text-sm px-4 py-2.5 hover:bg-gray-50 text-danger"
              >
                {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
