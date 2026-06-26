import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createTenant,
  listTenants,
  Tenant,
  TenantInput,
  TenantType,
  updateTenant,
  uploadTenantDocument,
} from '../api/tenants';

const EMPTY_FORM: Partial<TenantInput> = {
  tenantType: 'INDIVIDUAL',
  firstName: '',
  lastName: '',
  companyName: '',
  nationality: '',
  email: '',
  phone: '',
  mobile: '',
  civilId: '',
  passportNumber: '',
  emergencyContact: '',
  isActive: true,
};

type QuickFilter = 'ALL' | 'INDIVIDUAL' | 'COMPANY' | 'ACTIVE' | 'INACTIVE';

export function Tenants() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('ALL');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState<Partial<TenantInput>>(EMPTY_FORM);
  const [docType, setDocType] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const result = await listTenants({
      page,
      pageSize,
      tenantType: quickFilter === 'INDIVIDUAL' || quickFilter === 'COMPANY' ? quickFilter : undefined,
      isActive: quickFilter === 'ACTIVE' ? true : quickFilter === 'INACTIVE' ? false : undefined,
    });
    setItems(result.items);
    setTotal(result.total);
  }

  useEffect(() => {
    refresh();
  }, [page, quickFilter]);

  const visibleItems = items.filter((tenant) => {
    if (!search) return true;
    const name =
      tenant.tenantType === 'COMPANY' ? tenant.companyName ?? '' : `${tenant.firstName ?? ''} ${tenant.lastName ?? ''}`;
    const haystack = `${name} ${tenant.email} ${tenant.mobile}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDocType('');
    setDocFile(null);
    setModalOpen(true);
  }

  function openEdit(tenant: Tenant) {
    setEditing(tenant);
    setForm({ ...tenant });
    setDocType('');
    setDocFile(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let tenant: Tenant;
      if (editing) {
        tenant = await updateTenant(editing.id, form);
      } else {
        tenant = await createTenant(form);
      }
      if (docFile && docType) {
        await uploadTenantDocument(tenant.id, docType, docFile);
      }
      setModalOpen(false);
      refresh();
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="flex justify-between items-start mb-4 gap-3">
        <h1 className="text-2xl font-semibold text-primary">{t('nav.tenants')}</h1>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenants..."
            className="border rounded px-3 py-2 text-sm w-56"
          />
          <button onClick={openAdd} className="bg-primary text-white rounded px-4 py-2 text-sm font-medium shrink-0">
            {t('tenants.add')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-3 mb-4 flex gap-2 overflow-x-auto">
        {(
          [
            ['ALL', `All (${total})`],
            ['INDIVIDUAL', t('tenants.individual')],
            ['COMPANY', t('tenants.company')],
            ['ACTIVE', t('tenants.active')],
            ['INACTIVE', t('tenants.inactive')],
          ] as [QuickFilter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setQuickFilter(key)}
            className={`shrink-0 rounded px-4 py-2 text-sm font-medium ${
              quickFilter === key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">{t('tenants.name')}</th>
              <th className="px-4 py-3">{t('tenants.type')}</th>
              <th className="px-4 py-3">{t('tenants.nationality')}</th>
              <th className="px-4 py-3">{t('tenants.mobile')}</th>
              <th className="px-4 py-3">{t('tenants.civilId')}</th>
              <th className="px-4 py-3">{t('tenants.status')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((tenant) => (
              <tr key={tenant.id} className="border-t">
                <td className="px-4 py-3 text-gray-500">T-{tenant.id.slice(0, 6).toUpperCase()}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">
                    {tenant.tenantType === 'COMPANY'
                      ? tenant.companyName
                      : `${tenant.firstName ?? ''} ${tenant.lastName ?? ''}`}
                  </div>
                  <div className="text-xs text-gray-500">{tenant.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      tenant.tenantType === 'COMPANY' ? 'bg-info/15 text-info' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {tenant.tenantType === 'COMPANY' ? t('tenants.company') : t('tenants.individual')}
                  </span>
                </td>
                <td className="px-4 py-3">{tenant.nationality}</td>
                <td className="px-4 py-3">{tenant.mobile}</td>
                <td className="px-4 py-3">{tenant.civilId ?? tenant.passportNumber ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      tenant.isActive ? 'bg-success/15 text-success' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {tenant.isActive ? t('tenants.active') : t('tenants.inactive')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                  <button onClick={() => openEdit(tenant)} className="text-primary text-sm font-medium">
                    {t('tenants.edit')}
                  </button>
                </td>
              </tr>
            ))}
            {visibleItems.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  {t('tenants.none')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > pageSize && (
        <div className="flex justify-end gap-2 mt-4 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-2 py-1">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-semibold text-primary mb-4">
              {editing ? t('tenants.edit') : t('tenants.add')}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('tenants.type')}>
                <select
                  value={form.tenantType}
                  onChange={(e) => setForm((f) => ({ ...f, tenantType: e.target.value as TenantType }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="INDIVIDUAL">{t('tenants.individual')}</option>
                  <option value="COMPANY">{t('tenants.company')}</option>
                </select>
              </Field>

              <Field label={t('tenants.nationality')}>
                <input
                  required
                  value={form.nationality ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </Field>

              {form.tenantType === 'COMPANY' ? (
                <Field label={t('tenants.companyName')} span2>
                  <input
                    required
                    value={form.companyName ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  />
                </Field>
              ) : (
                <>
                  <Field label={t('tenants.firstName')}>
                    <input
                      required
                      value={form.firstName ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    />
                  </Field>
                  <Field label={t('tenants.lastName')}>
                    <input
                      required
                      value={form.lastName ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    />
                  </Field>
                </>
              )}

              <Field label={t('tenants.email')}>
                <input
                  type="email"
                  required
                  value={form.email ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </Field>

              <Field label={t('tenants.mobile')}>
                <input
                  required
                  value={form.mobile ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </Field>

              <Field label={t('tenants.phone')}>
                <input
                  value={form.phone ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </Field>

              <Field label={t('tenants.civilId')}>
                <input
                  value={form.civilId ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, civilId: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </Field>

              <Field label={t('tenants.passportNumber')}>
                <input
                  value={form.passportNumber ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, passportNumber: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </Field>

              <Field label={t('tenants.emergencyContact')}>
                <input
                  value={form.emergencyContact ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, emergencyContact: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </Field>

              <Field label={t('tenants.status')}>
                <select
                  value={form.isActive ? 'true' : 'false'}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === 'true' }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="true">{t('tenants.active')}</option>
                  <option value="false">{t('tenants.inactive')}</option>
                </select>
              </Field>
            </div>

            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">{t('tenants.document')}</p>
              <div className="flex gap-2">
                <input
                  placeholder={t('tenants.documentType')}
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="flex-1 border rounded px-3 py-2 text-sm"
                />
                <input
                  type="file"
                  onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                  className="flex-1 text-sm"
                />
              </div>
              {editing?.documents && editing.documents.length > 0 && (
                <ul className="mt-2 text-xs text-gray-500 space-y-1">
                  {editing.documents.map((doc) => (
                    <li key={doc.id}>
                      {doc.type}: <a href={doc.fileUrl} className="text-primary underline">{doc.fileUrl}</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm rounded border"
              >
                {t('tenants.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm rounded bg-primary text-white disabled:opacity-50"
              >
                {t('tenants.save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, span2 }: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
