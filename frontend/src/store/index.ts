import { create } from 'zustand';
import i18n from '../i18n';

export type Role =
  | 'SUPER_ADMIN'
  | 'PROPERTY_MANAGER'
  | 'LEASING_AGENT'
  | 'MAINTENANCE_SUPERVISOR'
  | 'ACCOUNTANT'
  | 'VIEWER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  language: 'EN' | 'AR';
}

type Language = 'en' | 'ar';

interface AppState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  language: Language;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setLanguage: (language: Language) => void;
}

function applyDirection(language: Language) {
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
}

const initialLanguage = (localStorage.getItem('epm-language') as Language) ?? 'en';
applyDirection(initialLanguage);

export const useAppStore = create<AppState>((set) => ({
  user: JSON.parse(localStorage.getItem('epm-user') ?? 'null'),
  accessToken: localStorage.getItem('epm-access-token'),
  refreshToken: localStorage.getItem('epm-refresh-token'),
  language: initialLanguage,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('epm-user', JSON.stringify(user));
    localStorage.setItem('epm-access-token', accessToken);
    localStorage.setItem('epm-refresh-token', refreshToken);
    set({ user, accessToken, refreshToken });
  },

  clearAuth: () => {
    localStorage.removeItem('epm-user');
    localStorage.removeItem('epm-access-token');
    localStorage.removeItem('epm-refresh-token');
    set({ user: null, accessToken: null, refreshToken: null });
  },

  setLanguage: (language) => {
    localStorage.setItem('epm-language', language);
    applyDirection(language);
    i18n.changeLanguage(language);
    set({ language });
  },
}));
