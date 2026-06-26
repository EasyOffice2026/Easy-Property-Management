import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createInquiry,
  Inquiry,
  InquiryChannel,
  InquiryInput,
  InquiryStatus,
  listInquiries,
  updateInquiry,
} from '../api/inquiries';

const STATUSES: InquiryStatus[] = ['NEW', 'IN_PROGRESS', 'QUOTED', 'CONVERTED', 'LOST'];

const EMPTY_FORM: Partial<InquiryInput> = {
  tenantType: 'INDIVIDUAL',
  firstName: '',
  lastName: '',
  mobile: '',
  email: '',
  channel: 'WALK_IN',
  notes: '',
};

function MiniKpi({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className={`text-2xl font-semibold ${color ?? 'text-primary'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export function Inquiries() {
  const { t } = useTranslation();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<InquiryInput>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const result = await listInquiries({ pageSize: 100 });
    setInquiries(result.items);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createInquiry(form);
      setModalOpen(false);
      setForm(EMPTY_FORM);
      refresh();
    } finally {
      setSaving(false);
    }
  }

  async function moveStatus(inquiry: Inquiry, status: InquiryStatus) {
    await updateInquiry(inquiry.id, { status });
    refresh();
  }

  const now = new Date();
  const totalThisMonth = inquiries.filter((i) => {
    const created = new Date(i.createdAt);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;
  const newCount = inquiries.filter((i) => i.status === 'NEW').length;
  const inProgressCount = inquiries.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'QUOTED').length;
  const convertedCount = inquiries.filter((i) => i.status === 'CONVERTED').length;

  const CHANNEL_COLORS: Record<string, string> = {
    WEBSITE: 'bg-info/15 text-info',
    WHATSAPP: 'bg-success/15 text-success',
    INSTAGRAM: 'bg-warning/15 text-warning',
    CALL_CENTER: 'bg-primary/10 text-primary',
    WALK_IN: 'bg-gray-100 text-gray-600',
  };

  const STATUS_BADGE: Record<InquiryStatus, string> = {
    NEW: 'bg-warning/15 text-warning',
    IN_PROGRESS: 'bg-info/15 text-info',
    QUOTED: 'bg-info/15 text-info',
    CONVERTED: 'bg-success/15 text-success',
    LOST: 'bg-danger/15 text-danger',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-primary">{t('nav.inquiries')}</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-primary text-white rounded px-4 py-2 text-sm font-medium"
        >
          {t('inquiries.add')}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <MiniKpi value={totalThisMonth} label="Total This Month" />
        <MiniKpi value={newCount} label="New / Unassigned" color="text-info" />
        <MiniKpi value={inProgressCount} label="In Progress" color="text-warning" />
        <MiniKpi value={convertedCount} label="Converted" color="text-success" />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">{t('tenants.name')}</th>
              <th className="px-4 py-3">{t('inquiries.channel')}</th>
              <th className="px-4 py-3">Unit Interest</th>
              <th className="px-4 py-3">{t('contracts.period')}</th>
              <th className="px-4 py-3">{t('tenants.status')}</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry) => (
              <tr key={inquiry.id} className="border-t">
                <td className="px-4 py-3 whitespace-nowrap">{new Date(inquiry.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {inquiry.tenantType === 'COMPANY'
                    ? inquiry.companyName
                    : `${inquiry.firstName} ${inquiry.lastName ?? ''}`}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CHANNEL_COLORS[inquiry.channel]}`}>
                    {inquiry.channel}
                  </span>
                </td>
                <td className="px-4 py-3">{inquiry.unitTypeInterest ?? '—'}</td>
                <td className="px-4 py-3">{inquiry.rentPeriod ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[inquiry.status]}`}>
                    {t(`inquiries.status.${inquiry.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3">{inquiry.assignedToId ? 'Assigned' : '—'}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {inquiry.status === 'NEW' ? (
                    <button
                      onClick={() => moveStatus(inquiry, 'IN_PROGRESS')}
                      className="text-xs font-medium px-2 py-1 rounded bg-primary text-white"
                    >
                      Assign
                    </button>
                  ) : (
                    <select
                      value={inquiry.status}
                      onChange={(e) => moveStatus(inquiry, e.target.value as InquiryStatus)}
                      className="border rounded text-xs px-2 py-1"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(`inquiries.status.${s}`)}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
            {inquiries.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  No inquiries found.
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
            <h2 className="text-lg font-semibold text-primary mb-4">{t('inquiries.add')}</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('tenants.type')}</label>
                <select
                  value={form.tenantType}
                  onChange={(e) => setForm((f) => ({ ...f, tenantType: e.target.value as InquiryInput['tenantType'] }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="INDIVIDUAL">{t('tenants.individual')}</option>
                  <option value="COMPANY">{t('tenants.company')}</option>
                </select>
              </div>

              {form.tenantType === 'COMPANY' ? (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('tenants.companyName')}</label>
                  <input
                    required
                    value={form.companyName ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('tenants.firstName')}</label>
                    <input
                      required
                      value={form.firstName ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('tenants.lastName')}</label>
                    <input
                      value={form.lastName ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('tenants.mobile')}</label>
                <input
                  required
                  value={form.mobile ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('tenants.email')}</label>
                <input
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('inquiries.channel')}</label>
                <select
                  value={form.channel}
                  onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as InquiryChannel }))}
                  className="w-full border rounded px-3 py-2"
                >
                  {(['WEBSITE', 'WHATSAPP', 'INSTAGRAM', 'CALL_CENTER', 'WALK_IN'] as InquiryChannel[]).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('inquiries.notes')}</label>
                <textarea
                  value={form.notes ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm rounded border">
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
