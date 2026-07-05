import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Role } from '../store';
import { createUser, CreateUserInput, listUsers, updateUser, User } from '../api/users';

const ROLES: Role[] = [
  'SUPER_ADMIN',
  'PROPERTY_MANAGER',
  'LEASING_AGENT',
  'MAINTENANCE_SUPERVISOR',
  'ACCOUNTANT',
  'VIEWER',
];

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: 'bg-danger/15 text-danger',
  PROPERTY_MANAGER: 'bg-primary/15 text-primary',
  LEASING_AGENT: 'bg-info/15 text-info',
  MAINTENANCE_SUPERVISOR: 'bg-warning/15 text-warning',
  ACCOUNTANT: 'bg-success/15 text-success',
  VIEWER: 'bg-gray-100 text-gray-600',
};

const EMPTY_FORM: Partial<CreateUserInput> = {
  name: '',
  email: '',
  password: '',
  role: 'VIEWER',
};

export function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<CreateUserInput>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');

  async function refresh() {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch {
      setError(t('users.loadError'));
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function openAddModal() {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: form.name,
          role: form.role,
        });
      } else {
        await createUser({
          name: form.name ?? '',
          email: form.email ?? '',
          password: form.password ?? '',
          role: form.role ?? 'VIEWER',
        });
      }
      setModalOpen(false);
      refresh();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message ??
            t('users.saveFailed'))
          : t('users.saveFailed');
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: User) {
    try {
      await updateUser(user.id, { isActive: !user.isActive });
      refresh();
    } catch {
      setError(t('users.saveFailed'));
    }
  }

  const filteredUsers = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">{t('nav.users')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('users.subtitle')}</p>
        </div>
        <button onClick={openAddModal} className="bg-primary text-white rounded px-4 py-2 text-sm font-medium">
          {t('users.add')}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <StatCard label={t('users.totalUsers')} value={users.length} />
        <StatCard label={t('users.activeUsers')} value={activeCount} color="text-success" />
        <StatCard label={t('users.admins')} value={users.filter((u) => u.role === 'SUPER_ADMIN').length} color="text-danger" />
        <StatCard
          label={t('users.agents')}
          value={users.filter((u) => u.role === 'LEASING_AGENT').length}
          color="text-info"
        />
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('users.searchPlaceholder')}
          className="border rounded px-3 py-2 bg-white text-sm flex-1 max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | '')}
          className="border rounded px-3 py-2 bg-white text-sm"
        >
          <option value="">{t('users.allRoles')}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {t(`users.roles.${r}`)}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-danger text-sm mb-3">{error}</p>}

      <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">{t('users.name')}</th>
              <th className="px-4 py-3">{t('users.email')}</th>
              <th className="px-4 py-3">{t('users.role')}</th>
              <th className="px-4 py-3">{t('users.status')}</th>
              <th className="px-4 py-3">{t('users.created')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-gray-500">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
                    {t(`users.roles.${user.role}`)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      user.isActive ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                    }`}
                  >
                    {user.isActive ? t('users.active') : t('users.inactive')}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                  <button onClick={() => openEditModal(user)} className="text-xs font-medium text-primary">
                    {t('users.edit')}
                  </button>
                  <button
                    onClick={() => toggleActive(user)}
                    className={`text-xs font-medium ${user.isActive ? 'text-danger' : 'text-success'}`}
                  >
                    {user.isActive ? t('users.deactivate') : t('users.activate')}
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  {t('users.none')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-semibold text-primary mb-4">
              {editingUser ? t('users.editUser') : t('users.add')}
            </h2>

            {error && <p className="text-danger text-sm mb-3">{error}</p>}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('users.name')}</label>
                <input
                  required
                  value={form.name ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('users.email')}</label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={form.email ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('users.password')}</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={form.password ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('users.role')}</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
                  className="w-full border rounded px-3 py-2"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {t(`users.roles.${r}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm rounded border">
                {t('users.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm rounded bg-primary text-white disabled:opacity-50"
              >
                {t('users.save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className={`text-2xl font-semibold ${color ?? 'text-primary'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
