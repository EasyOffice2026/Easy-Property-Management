import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';

export function Topbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, language, setLanguage, clearAuth } = useAppStore();

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  return (
    <header className="h-16 bg-white border-b flex items-center justify-end gap-4 px-6">
      <button
        type="button"
        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
        className="text-sm font-medium text-primary border border-primary rounded px-3 py-1.5"
      >
        {language === 'en' ? 'العربية' : 'English'}
      </button>
      <span className="text-sm text-gray-700">{user?.name}</span>
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm font-medium text-white bg-primary rounded px-3 py-1.5"
      >
        {t('nav.logout')}
      </button>
    </header>
  );
}
