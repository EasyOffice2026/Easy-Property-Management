import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  clearContract,
  Contract,
  ContractStatus,
  createContract,
  downloadContractPdf,
  listContracts,
  renewContract,
  signContract,
  terminateContract,
} from '../api/contracts';
import { listAvailableUnits, Unit } from '../api/properties';
import { listTenants, Tenant } from '../api/tenants';
import { RentPeriod } from '../api/inquiries';

const STATUS_COLORS: Record<ContractStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600 border-gray-300',
  ACTIVE: 'bg-success/10 text-success border-success/30',
  EXPIRING: 'bg-warning/10 text-warning border-warning/30',
  EXPIRED: 'bg-danger/10 text-danger border-danger/30',
  TERMINATED: 'bg-danger/10 text-danger border-danger/30',
  CLEARED: 'bg-info/10 text-info border-info/30',
};

const EMPTY_FORM = {
  tenantId: '',
  unitId: '',
  rentPeriod: 'MONTHLY' as RentPeriod,
  rentAmount: 0,
  securityDeposit: 0,
  startDate: '',
  endDate: '',
  notes: '',
};

export function Contracts() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Contract[]>([]);
  const [statusFilter, setStatusFilter] = useState<ContractStatus | ''>('');
  const [periodFilter, setPeriodFilter] = useState<RentPeriod | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  async function refresh() {
    const result = await listContracts({
      status: statusFilter || undefined,
      rentPeriod: periodFilter || undefined,
      pageSize: 100,
    });
    setItems(result.items);
  }

  useEffect(() => {
    refresh();
  }, [statusFilter, periodFilter]);

  async function openModal() {
    setForm(EMPTY_FORM);
    const [units, tenantsResult] = await Promise.all([listAvailableUnits(), listTenants({ pageSize: 100 })]);
    setAvailableUnits(units);
    setTenants(tenantsResult.items);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setActionError('');
    try {
      await createContract(form);
      setModalOpen(false);
      refresh();
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message ?? 'Failed to create contract');
    } finally {
      setSaving(false);
    }
  }

  async function handleAction(contract: Contract, action: 'sign' | 'clear' | 'terminate' | 'renew') {
    setActionError('');
    try {
      if (action === 'sign') await signContract(contract.id);
      if (action === 'clear') await clearContract(contract.id);
      if (action === 'terminate') await terminateContract(contract.id);
      if (action === 'renew') await renewContract(contract.id);
      refresh();
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message ?? 'Action failed');
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-primary">{t('nav.contracts')}</h1>
        <button onClick={openModal} className="bg-primary text-white rounded px-4 py-2 text-sm font-medium">
          {t('contracts.add')}
        </button>
      </div>

      {actionError && <p className="text-danger text-sm mb-3">{actionError}</p>}

      <div className="flex gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ContractStatus | '')}
          className="border rounded px-3 py-2 bg-white text-sm"
        >
          <option value="">{t('tenants.allStatuses')}</option>
          {(['DRAFT', 'ACTIVE', 'EXPIRING', 'EXPIRED', 'TERMINATED', 'CLEARED'] as ContractStatus[]).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value as RentPeriod | '')}
          className="border rounded px-3 py-2 bg-white text-sm"
        >
          <option value="">{t('contracts.allPeriods')}</option>
          {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as RentPeriod[]).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">{t('contracts.number')}</th>
              <th className="px-4 py-3">{t('tenants.name')}</th>
              <th className="px-4 py-3">{t('contracts.unit')}</th>
              <th className="px-4 py-3">{t('contracts.period')}</th>
              <th className="px-4 py-3">{t('contracts.rent')}</th>
              <th className="px-4 py-3">{t('contracts.dates')}</th>
              <th className="px-4 py-3">{t('tenants.status')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((contract) => (
              <tr key={contract.id} className="border-t">
                <td className="px-4 py-3 font-medium">{contract.contractNumber}</td>
                <td className="px-4 py-3">
                  {contract.tenant?.tenantType === 'COMPANY'
                    ? contract.tenant?.companyName
                    : `${contract.tenant?.firstName ?? ''} ${contract.tenant?.lastName ?? ''}`}
                </td>
                <td className="px-4 py-3">{contract.unit?.unitNumber}</td>
                <td className="px-4 py-3">{contract.rentPeriod}</td>
                <td className="px-4 py-3">{contract.rentAmount} KWD</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(contract.startDate).toLocaleDateString()} -{' '}
                  {new Date(contract.endDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[contract.status]}`}>
                    {contract.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                  {contract.status === 'DRAFT' && (
                    <button
                      onClick={() => handleAction(contract, 'sign')}
                      className="text-xs font-medium px-2 py-1 rounded bg-gold text-white"
                    >
                      {t('contracts.signLock')}
                    </button>
                  )}
                  {(contract.status === 'ACTIVE' || contract.status === 'EXPIRING') && (
                    <>
                      <button
                        onClick={() => handleAction(contract, 'clear')}
                        className="text-xs font-medium text-primary"
                      >
                        {t('contracts.clear')}
                      </button>
                      <button
                        onClick={() => handleAction(contract, 'terminate')}
                        className="text-xs font-medium text-danger"
                      >
                        {t('contracts.terminate')}
                      </button>
                    </>
                  )}
                  {(contract.status === 'CLEARED' || contract.status === 'EXPIRED') && (
                    <button
                      onClick={() => handleAction(contract, 'renew')}
                      className="text-xs font-medium text-primary"
                    >
                      {t('contracts.renew')}
                    </button>
                  )}
                  <button
                    onClick={() => downloadContractPdf(contract.id, contract.contractNumber)}
                    className="text-xs font-medium text-gray-500"
                  >
                    {t('contracts.pdf')}
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  {t('contracts.none')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">{t('contracts.add')}</h2>

            {actionError && <p className="text-danger text-sm mb-3">{actionError}</p>}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('nav.tenants')}</label>
                <select
                  required
                  value={form.tenantId}
                  onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">--</option>
                  {tenants.map((tn) => (
                    <option key={tn.id} value={tn.id}>
                      {tn.tenantType === 'COMPANY' ? tn.companyName : `${tn.firstName} ${tn.lastName}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('contracts.unit')}</label>
                <select
                  required
                  value={form.unitId}
                  onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">--</option>
                  {availableUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      Unit {unit.unitNumber} ({unit.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('contracts.period')}</label>
                <select
                  value={form.rentPeriod}
                  onChange={(e) => setForm((f) => ({ ...f, rentPeriod: e.target.value as RentPeriod }))}
                  className="w-full border rounded px-3 py-2"
                >
                  {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as RentPeriod[]).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('contracts.rent')}</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.rentAmount}
                    onChange={(e) => setForm((f) => ({ ...f, rentAmount: Number(e.target.value) }))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('contracts.deposit')}</label>
                  <input
                    type="number"
                    min={0}
                    value={form.securityDeposit}
                    onChange={(e) => setForm((f) => ({ ...f, securityDeposit: Number(e.target.value) }))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('contracts.startDate')}</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('contracts.endDate')}</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
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
