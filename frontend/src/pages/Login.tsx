import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAppStore } from '../store';

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAppStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      setAuth(result.user, result.accessToken, result.refreshToken);
      navigate('/dashboard');
    } catch {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-primary mb-6">{t('login.title')}</h1>

        <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.email')}</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.password')}</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
        />

        {error && <p className="text-danger text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white rounded py-2 font-medium disabled:opacity-50"
        >
          {t('login.submit')}
        </button>
      </form>
    </div>
  );
}
