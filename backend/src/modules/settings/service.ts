import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const SETTINGS_PATH = join(__dirname, '..', '..', '..', 'data', 'settings.json');

export interface AppSettings {
  companyName: string;
  country: string;
  currency: string;
  defaultLanguage: string;
  contractNumberPrefix: string;
  expiryWarningDays: number;
  overdueGraceDays: number;
  autoLockOnSigning: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  companyName: process.env.COMPANY_NAME ?? 'Easy Property Management Co.',
  country: 'Kuwait',
  currency: 'KWD',
  defaultLanguage: 'English',
  contractNumberPrefix: process.env.CONTRACT_NUMBER_PREFIX ?? 'EPM',
  expiryWarningDays: Number(process.env.EXPIRY_WARNING_DAYS ?? 30),
  overdueGraceDays: Number(process.env.OVERDUE_GRACE_DAYS ?? 7),
  autoLockOnSigning: true,
};

function ensureDir() {
  const dir = dirname(SETTINGS_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function getSettings(): AppSettings {
  try {
    if (existsSync(SETTINGS_PATH)) {
      const raw = readFileSync(SETTINGS_PATH, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // fall through
  }
  return { ...DEFAULT_SETTINGS };
}

export function updateSettings(data: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...data };
  ensureDir();
  writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}
