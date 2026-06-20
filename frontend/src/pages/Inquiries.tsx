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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {STATUSES.map((status) => (
          <div key={status} className="bg-white rounded-lg shadow flex flex-col">
            <div className="px-3 py-2 border-b font-medium text-sm text-gray-700">
              {t(`inquiries.status.${status}`)} ({inquiries.filter((i) => i.status === status).length})
            </div>
            <div className="p-2 space-y-2 flex-1 min-h-[100px]">
              {inquiries
                .filter((i) => i.status === status)
                .map((inquiry) => (
                  <div key={inquiry.id} className="border rounded p-2 text-xs space-y-1">
                    <div className="font-medium text-gray-800">
                      {inquiry.tenantType === 'COMPANY'
                        ? inquiry.companyName
                        : `${inquiry.firstName} ${inquiry.lastName ?? ''}`}
                    </div>
                    <div className="text-gray-500">{inquiry.mobile}</div>
                    <div className="text-gray-500">{inquiry.channel}</div>
                    {inquiry.unitTypeInterest && (
                      <div className="text-gray-500">{inquiry.unitTypeInterest}</div>
                    )}
                    <select
                      value={inquiry.status}
                      onChange={(e) => moveStatus(inquiry, e.target.value as InquiryStatus)}
                      className="w-full border rounded text-xs px-1 py-1 mt-1"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(`inquiries.status.${s}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
            </div>
          </div>
        ))}
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
