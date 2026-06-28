import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppSettings, getSettings, updateSettings } from '../api/settings';

type Tab = 'company' | 'contract';

export function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('company');
  const [settings, setSettingsState] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getSettings()
      .then(setSettingsState)
      .catch(() => setError(t('settings.loadError')));
  }, [t]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateSettings(settings);
      setSettingsState(updated);
      setSuccess(t('settings.saved'));
    } catch {
      setError(t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-gray-500">{t('settings.loading')}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-primary">{t('nav.settings')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('settings.subtitle')}</p>
      </div>

      <div className="flex border-b-2 border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] ${
            activeTab === 'company' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-primary'
          }`}
        >
          {t('settings.companyInfo')}
        </button>
        <button
          onClick={() => setActiveTab('contract')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[2px] ${
            activeTab === 'contract' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-primary'
          }`}
        >
          {t('settings.contractSettings')}
        </button>
      </div>

      {error && <p className="text-danger text-sm mb-3">{error}</p>}
      {success && <p className="text-success text-sm mb-3">{success}</p>}

      <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 max-w-2xl">
        {activeTab === 'company' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.companyName')}</label>
              <input
                required
                value={settings.companyName}
                onChange={(e) => setSettingsState((s) => s && { ...s, companyName: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.country')}</label>
                <input
                  required
                  value={settings.country}
                  onChange={(e) => setSettingsState((s) => s && { ...s, country: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.currency')}</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettingsState((s) => s && { ...s, currency: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="KWD">KWD - Kuwaiti Dinar</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.defaultLanguage')}</label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => setSettingsState((s) => s && { ...s, defaultLanguage: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="English">English</option>
                <option value="Arabic">Arabic</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'contract' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.contractPrefix')}</label>
              <input
                required
                value={settings.contractNumberPrefix}
                onChange={(e) => setSettingsState((s) => s && { ...s, contractNumberPrefix: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
              <p className="text-xs text-gray-400 mt-1">{t('settings.contractPrefixHint')}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.expiryWarningDays')}</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={settings.expiryWarningDays}
                  onChange={(e) =>
                    setSettingsState((s) => s && { ...s, expiryWarningDays: Number(e.target.value) })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.overdueGraceDays')}</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={settings.overdueGraceDays}
                  onChange={(e) =>
                    setSettingsState((s) => s && { ...s, overdueGraceDays: Number(e.target.value) })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoLock"
                checked={settings.autoLockOnSigning}
                onChange={(e) => setSettingsState((s) => s && { ...s, autoLockOnSigning: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="autoLock" className="text-sm font-medium text-gray-700">
                {t('settings.autoLockOnSigning')}
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-[-0.5rem]">{t('settings.autoLockHint')}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <button type="submit" disabled={saving} className="px-6 py-2 text-sm rounded bg-primary text-white disabled:opacity-50">
            {saving ? t('settings.saving') : t('settings.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
