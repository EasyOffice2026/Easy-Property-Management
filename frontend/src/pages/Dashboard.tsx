import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';

export function Dashboard() {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary mb-2">
        {t('dashboard.welcome')}, {user?.name}
      </h1>
      <p className="text-gray-600">{user?.role}</p>
    </div>
  );
}
