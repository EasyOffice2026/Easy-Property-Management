import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccountNode,
  BalanceSheet,
  FinancialSummary,
  JournalEntry,
  LedgerData,
  Projection,
  ProfitAndLoss,
  ReconciliationData,
  TrialBalanceData,
  Voucher,
  approveVoucher,
  createJournalEntry,
  createVoucher,
  getAccountTree,
  getBalanceSheet,
  getFinancialSummary,
  getJournalEntries,
  getLedger,
  getProfitAndLoss,
  getProjections,
  getReconciliation,
  getTrialBalance,
  getVouchers,
  postJournalEntry,
  voidJournalEntry,
  voidVoucher,
} from '../api/accounting';

type Tab = 'accounts' | 'journals' | 'receipts' | 'payments' | 'ledger' | 'trial' | 'pl' | 'bs' | 'recon' | 'proj';

const TABS: { key: Tab; labelKey: string }[] = [
  { key: 'accounts', labelKey: 'acct.tabs.accounts' },
  { key: 'journals', labelKey: 'acct.tabs.journals' },
  { key: 'receipts', labelKey: 'acct.tabs.receipts' },
  { key: 'payments', labelKey: 'acct.tabs.payments' },
  { key: 'ledger', labelKey: 'acct.tabs.ledger' },
  { key: 'trial', labelKey: 'acct.tabs.trial' },
  { key: 'pl', labelKey: 'acct.tabs.pl' },
  { key: 'bs', labelKey: 'acct.tabs.bs' },
  { key: 'recon', labelKey: 'acct.tabs.recon' },
  { key: 'proj', labelKey: 'acct.tabs.proj' },
];

export function Accounting() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('accounts');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);

  useEffect(() => {
    getFinancialSummary().then(setSummary).catch(() => {});
  }, []);

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">{t('nav.accounting')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('acct.subtitle')}</p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Kpi label={t('acct.kpi.revenue')} value={`KWD ${summary.totalRevenue.toLocaleString()}`} />
          <Kpi label={t('acct.kpi.expenses')} value={`KWD ${summary.totalExpenses.toLocaleString()}`} color="text-danger" />
          <Kpi label={t('acct.kpi.netProfit')} value={`KWD ${summary.netProfit.toLocaleString()}`} color="text-success" />
          <Kpi label={t('acct.kpi.receivables')} value={`KWD ${summary.outstandingReceivables.toLocaleString()}`} />
          <Kpi label={t('acct.kpi.payables')} value={`KWD ${summary.outstandingPayables.toLocaleString()}`} color="text-warning" />
        </div>
      )}

      <div className="flex border-b-2 border-gray-200 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-[2px] transition-colors ${
              activeTab === tab.key ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-primary'
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {activeTab === 'accounts' && <AccountTreeTab />}
      {activeTab === 'journals' && <JournalsTab />}
      {activeTab === 'receipts' && <VouchersTab type="RECEIPT" />}
      {activeTab === 'payments' && <VouchersTab type="PAYMENT" />}
      {activeTab === 'ledger' && <LedgerTab />}
      {activeTab === 'trial' && <TrialBalanceTab />}
      {activeTab === 'pl' && <PLTab />}
      {activeTab === 'bs' && <BSTab />}
      {activeTab === 'recon' && <ReconciliationTab />}
      {activeTab === 'proj' && <ProjectionsTab />}
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className={`text-xl font-semibold ${color ?? 'text-primary'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// ========================
// CHART OF ACCOUNTS TAB
// ========================

function AccountTreeTab() {
  const { t, i18n } = useTranslation();
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const isAr = i18n.language === 'ar';

  useEffect(() => {
    getAccountTree().then(setAccounts).catch(() => {});
  }, []);

  const roots = useMemo(() => accounts.filter((a) => !a.parentId), [accounts]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderAccount = (acc: AccountNode, depth: number): JSX.Element[] => {
    const children = accounts.filter((a) => a.parentId === acc.id);
    const isOpen = expanded.has(acc.id);
    const rows: JSX.Element[] = [];

    rows.push(
      <tr key={acc.id} className="border-t hover:bg-gray-50">
        <td className="px-4 py-2.5" style={{ paddingLeft: `${16 + depth * 24}px` }}>
          {children.length > 0 ? (
            <button onClick={() => toggle(acc.id)} className="mr-2 text-gray-400 hover:text-primary text-xs w-4">
              {isOpen ? '▼' : '▶'}
            </button>
          ) : (
            <span className="mr-2 w-4 inline-block" />
          )}
          <span className="font-mono text-xs text-gray-400 mr-2">{acc.code}</span>
          <span className={depth === 0 ? 'font-semibold' : ''}>{isAr ? acc.nameAr : acc.nameEn}</span>
        </td>
        <td className="px-4 py-2.5">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor(acc.type)}`}>{acc.type}</span>
        </td>
        <td className="px-4 py-2.5 text-sm text-gray-500">
          {acc.isActive ? (
            <span className="text-success">{t('users.active')}</span>
          ) : (
            <span className="text-danger">{t('users.inactive')}</span>
          )}
        </td>
      </tr>
    );

    if (isOpen) {
      children.forEach((child) => rows.push(...renderAccount(child, depth + 1)));
    }

    return rows;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th className="px-4 py-3">{t('acct.accountName')}</th>
            <th className="px-4 py-3">{t('acct.accountType')}</th>
            <th className="px-4 py-3">{t('tenants.status')}</th>
          </tr>
        </thead>
        <tbody>{roots.map((r) => renderAccount(r, 0))}</tbody>
      </table>
      {accounts.length === 0 && <div className="px-4 py-6 text-center text-gray-500">{t('acct.noEntries')}</div>}
    </div>
  );
}

function typeColor(type: string) {
  switch (type) {
    case 'ASSET': return 'bg-blue-100 text-blue-700';
    case 'LIABILITY': return 'bg-red-100 text-red-700';
    case 'EQUITY': return 'bg-purple-100 text-purple-700';
    case 'REVENUE': return 'bg-green-100 text-green-700';
    case 'EXPENSE': return 'bg-orange-100 text-orange-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

// ========================
// JOURNAL ENTRIES TAB
// ========================

function JournalsTab() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [expandedJe, setExpandedJe] = useState<string | null>(null);

  useEffect(() => {
    loadJournals();
    getAccountTree().then(setAccounts).catch(() => {});
  }, []);

  const loadJournals = () => getJournalEntries().then(setEntries).catch(() => {});

  const leafAccounts = useMemo(() => accounts.filter((a) => !a.hasChildren), [accounts]);

  const handlePost = async (id: string) => {
    await postJournalEntry(id);
    loadJournals();
  };

  const handleVoid = async (id: string) => {
    await voidJournalEntry(id);
    loadJournals();
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white rounded px-4 py-2 text-sm font-medium">
          {showForm ? t('tenants.cancel') : `+ ${t('acct.newJournal')}`}
        </button>
      </div>

      {showForm && (
        <JournalForm
          accounts={leafAccounts}
          onSave={() => { setShowForm(false); loadJournals(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">{t('acct.entryNo')}</th>
              <th className="px-4 py-3">{t('acct.date')}</th>
              <th className="px-4 py-3">{t('acct.description')}</th>
              <th className="px-4 py-3">{t('acct.reference')}</th>
              <th className="px-4 py-3">{t('acct.amount')}</th>
              <th className="px-4 py-3">{t('tenants.status')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((je) => (
              <>
                <tr key={je.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedJe(expandedJe === je.id ? null : je.id)}>
                  <td className="px-4 py-3 font-medium">{je.entryNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(je.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{je.description}</td>
                  <td className="px-4 py-3">{je.reference ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">KWD {Number(je.totalAmount).toFixed(3)}</td>
                  <td className="px-4 py-3"><StatusBadge status={je.status} /></td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {je.status === 'DRAFT' && (
                      <button onClick={(e) => { e.stopPropagation(); handlePost(je.id); }} className="text-xs bg-success text-white rounded px-2 py-1">
                        {t('acct.post')}
                      </button>
                    )}
                    {je.status !== 'VOID' && (
                      <button onClick={(e) => { e.stopPropagation(); handleVoid(je.id); }} className="text-xs border rounded px-2 py-1 text-gray-600">
                        {t('acct.void')}
                      </button>
                    )}
                  </td>
                </tr>
                {expandedJe === je.id && (
                  <tr key={`${je.id}-lines`}>
                    <td colSpan={7} className="bg-gray-50 px-8 py-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500">
                            <th className="text-left py-1">{t('acct.accountName')}</th>
                            <th className="text-right py-1">{t('acct.debit')}</th>
                            <th className="text-right py-1">{t('acct.credit')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {je.lines.map((l) => (
                            <tr key={l.id} className="border-t border-gray-200">
                              <td className="py-1"><span className="font-mono text-gray-400 mr-1">{l.account.code}</span>{l.account.nameEn}</td>
                              <td className="text-right py-1">{Number(l.debit) > 0 ? `KWD ${Number(l.debit).toFixed(3)}` : ''}</td>
                              <td className="text-right py-1">{Number(l.credit) > 0 ? `KWD ${Number(l.credit).toFixed(3)}` : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">{t('acct.noEntries')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JournalForm({ accounts, onSave, onCancel }: { accounts: AccountNode[]; onSave: () => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState([
    { accountId: '', debit: '', credit: '' },
    { accountId: '', debit: '', credit: '' },
  ]);
  const [error, setError] = useState('');

  const addLine = () => setLines([...lines, { accountId: '', debit: '', credit: '' }]);

  const updateLine = (idx: number, field: string, val: string) => {
    setLines(lines.map((l, i) => (i === idx ? { ...l, [field]: val } : l)));
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;

  const handleSubmit = async () => {
    if (!description || !date) { setError(t('acct.fillRequired')); return; }
    if (!isBalanced) { setError(t('acct.mustBalance')); return; }
    const validLines = lines.filter((l) => l.accountId && (parseFloat(l.debit) || parseFloat(l.credit)));
    if (validLines.length < 2) { setError(t('acct.minTwoLines')); return; }

    try {
      await createJournalEntry({
        date,
        description,
        reference: reference || undefined,
        lines: validLines.map((l) => ({
          accountId: l.accountId,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
        })),
      });
      onSave();
    } catch {
      setError(t('acct.saveFailed'));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-4">
      <h3 className="text-sm font-semibold text-primary mb-4">{t('acct.newJournal')}</h3>
      {error && <div className="text-danger text-sm mb-3">{error}</div>}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">{t('acct.date')}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded w-full px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">{t('acct.description')}</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="border rounded w-full px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">{t('acct.reference')}</label>
          <input value={reference} onChange={(e) => setReference(e.target.value)} className="border rounded w-full px-3 py-2 text-sm" />
        </div>
      </div>

      <table className="w-full text-sm mb-4">
        <thead className="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th className="px-3 py-2">{t('acct.accountName')}</th>
            <th className="px-3 py-2 w-36">{t('acct.debit')}</th>
            <th className="px-3 py-2 w-36">{t('acct.credit')}</th>
            <th className="px-3 py-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, idx) => (
            <tr key={idx} className="border-t">
              <td className="px-3 py-2">
                <select value={line.accountId} onChange={(e) => updateLine(idx, 'accountId', e.target.value)} className="border rounded w-full px-2 py-1.5 text-sm">
                  <option value="">{t('acct.selectAccount')}</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.nameEn}</option>)}
                </select>
              </td>
              <td className="px-3 py-2">
                <input type="number" step="0.001" min="0" value={line.debit} onChange={(e) => updateLine(idx, 'debit', e.target.value)}
                  className="border rounded w-full px-2 py-1.5 text-sm text-right" placeholder="0.000" />
              </td>
              <td className="px-3 py-2">
                <input type="number" step="0.001" min="0" value={line.credit} onChange={(e) => updateLine(idx, 'credit', e.target.value)}
                  className="border rounded w-full px-2 py-1.5 text-sm text-right" placeholder="0.000" />
              </td>
              <td className="px-3 py-2">
                {lines.length > 2 && (
                  <button onClick={() => removeLine(idx)} className="text-danger text-xs">✕</button>
                )}
              </td>
            </tr>
          ))}
          <tr className="border-t font-semibold bg-gray-50">
            <td className="px-3 py-2 text-right">{t('acct.totals')}</td>
            <td className="px-3 py-2 text-right">KWD {totalDebit.toFixed(3)}</td>
            <td className={`px-3 py-2 text-right ${isBalanced ? 'text-success' : 'text-danger'}`}>KWD {totalCredit.toFixed(3)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-between">
        <button onClick={addLine} className="text-sm text-primary hover:underline">+ {t('acct.addLine')}</button>
        <div className="space-x-2">
          <button onClick={onCancel} className="border rounded px-4 py-2 text-sm text-gray-700">{t('tenants.cancel')}</button>
          <button onClick={handleSubmit} disabled={!isBalanced} className="bg-primary text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50">
            {t('tenants.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================
// VOUCHERS TAB (Receipt & Payment)
// ========================

function VouchersTab({ type }: { type: 'RECEIPT' | 'PAYMENT' }) {
  const { t } = useTranslation();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [accounts, setAccounts] = useState<AccountNode[]>([]);

  useEffect(() => {
    loadVouchers();
    getAccountTree().then(setAccounts).catch(() => {});
  }, [type]);

  const loadVouchers = () => getVouchers({ type }).then(setVouchers).catch(() => {});
  const leafAccounts = useMemo(() => accounts.filter((a) => !a.hasChildren), [accounts]);

  const handleApprove = async (id: string) => {
    await approveVoucher(id);
    loadVouchers();
  };

  const handleVoid = async (id: string) => {
    await voidVoucher(id);
    loadVouchers();
  };

  const titleKey = type === 'RECEIPT' ? 'acct.newReceipt' : 'acct.newPayment';

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white rounded px-4 py-2 text-sm font-medium">
          {showForm ? t('tenants.cancel') : `+ ${t(titleKey)}`}
        </button>
      </div>

      {showForm && (
        <VoucherForm
          type={type}
          accounts={leafAccounts}
          onSave={() => { setShowForm(false); loadVouchers(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">{t('acct.voucherNo')}</th>
              <th className="px-4 py-3">{t('acct.date')}</th>
              <th className="px-4 py-3">{t('acct.partyName')}</th>
              <th className="px-4 py-3">{t('acct.description')}</th>
              <th className="px-4 py-3">{t('acct.amount')}</th>
              <th className="px-4 py-3">{t('acct.paymentMethod')}</th>
              <th className="px-4 py-3">{t('tenants.status')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{v.voucherNumber}</td>
                <td className="px-4 py-3 whitespace-nowrap">{new Date(v.date).toLocaleDateString()}</td>
                <td className="px-4 py-3">{v.partyName}</td>
                <td className="px-4 py-3">{v.description}</td>
                <td className="px-4 py-3 font-medium">KWD {Number(v.amount).toFixed(3)}</td>
                <td className="px-4 py-3">{v.paymentMethod ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                <td className="px-4 py-3 text-right space-x-1">
                  {v.status === 'DRAFT' && (
                    <button onClick={() => handleApprove(v.id)} className="text-xs bg-success text-white rounded px-2 py-1">
                      {t('acct.approve')}
                    </button>
                  )}
                  {v.status !== 'VOID' && (
                    <button onClick={() => handleVoid(v.id)} className="text-xs border rounded px-2 py-1 text-gray-600">
                      {t('acct.void')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">{t('acct.noEntries')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VoucherForm({ type, accounts, onSave, onCancel }: {
  type: 'RECEIPT' | 'PAYMENT'; accounts: AccountNode[]; onSave: () => void; onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [partyName, setPartyName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [debitAccountId, setDebitAccountId] = useState('');
  const [creditAccountId, setCreditAccountId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!partyName || !description || !amount || !debitAccountId || !creditAccountId) {
      setError(t('acct.fillRequired'));
      return;
    }
    try {
      await createVoucher({
        type,
        date,
        partyName,
        description,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod || undefined,
        referenceNo: referenceNo || undefined,
        debitAccountId,
        creditAccountId,
      });
      onSave();
    } catch {
      setError(t('acct.saveFailed'));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-4">
      <h3 className="text-sm font-semibold text-primary mb-4">
        {type === 'RECEIPT' ? t('acct.newReceipt') : t('acct.newPayment')}
      </h3>
      {error && <div className="text-danger text-sm mb-3">{error}</div>}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">{t('acct.date')}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded w-full px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">{t('acct.partyName')}</label>
          <input value={partyName} onChange={(e) => setPartyName(e.target.value)} className="border rounded w-full px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">{t('acct.description')}</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="border rounded w-full px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">{t('acct.amount')}</label>
          <input type="number" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} className="border rounded w-full px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">{t('acct.paymentMethod')}</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="border rounded w-full px-3 py-2 text-sm">
            <option value="Bank Transfer">{t('acct.bankTransfer')}</option>
            <option value="Cash">{t('acct.cash')}</option>
            <option value="Cheque">{t('acct.cheque')}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">{t('acct.referenceNo')}</label>
          <input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} className="border rounded w-full px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">{t('acct.debitAccount')}</label>
          <select value={debitAccountId} onChange={(e) => setDebitAccountId(e.target.value)} className="border rounded w-full px-3 py-2 text-sm">
            <option value="">{t('acct.selectAccount')}</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.nameEn}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">{t('acct.creditAccount')}</label>
          <select value={creditAccountId} onChange={(e) => setCreditAccountId(e.target.value)} className="border rounded w-full px-3 py-2 text-sm">
            <option value="">{t('acct.selectAccount')}</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.nameEn}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <button onClick={onCancel} className="border rounded px-4 py-2 text-sm text-gray-700">{t('tenants.cancel')}</button>
        <button onClick={handleSubmit} className="bg-primary text-white rounded px-4 py-2 text-sm font-medium">{t('tenants.save')}</button>
      </div>
    </div>
  );
}

// ========================
// LEDGER TAB
// ========================

function LedgerTab() {
  const { t, i18n } = useTranslation();
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const isAr = i18n.language === 'ar';

  useEffect(() => {
    getAccountTree().then(setAccounts).catch(() => {});
  }, []);

  const leafAccounts = useMemo(() => accounts.filter((a) => !a.hasChildren), [accounts]);

  useEffect(() => {
    if (selectedAccountId) {
      getLedger(selectedAccountId).then(setLedger).catch(() => setLedger(null));
    }
  }, [selectedAccountId]);

  return (
    <div>
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <label className="block text-xs text-gray-600 mb-1">{t('acct.selectAccount')}</label>
        <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className="border rounded w-full max-w-md px-3 py-2 text-sm">
          <option value="">{t('acct.selectAccount')}</option>
          {leafAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {isAr ? a.nameAr : a.nameEn}</option>)}
        </select>
      </div>

      {ledger && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <span className="font-semibold text-primary">{ledger.account.code} — {isAr ? ledger.account.nameAr : ledger.account.nameEn}</span>
            <span className="ml-4 text-sm text-gray-500">{t('acct.closingBalance')}: <span className="font-semibold">KWD {ledger.closingBalance.toFixed(3)}</span></span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3">{t('acct.date')}</th>
                <th className="px-4 py-3">{t('acct.entryNo')}</th>
                <th className="px-4 py-3">{t('acct.description')}</th>
                <th className="px-4 py-3 text-right">{t('acct.debit')}</th>
                <th className="px-4 py-3 text-right">{t('acct.credit')}</th>
                <th className="px-4 py-3 text-right">{t('acct.balance')}</th>
              </tr>
            </thead>
            <tbody>
              {ledger.entries.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-2.5 whitespace-nowrap">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 font-medium">{e.entryNumber}</td>
                  <td className="px-4 py-2.5">{e.description}</td>
                  <td className="px-4 py-2.5 text-right">{e.debit > 0 ? `KWD ${e.debit.toFixed(3)}` : ''}</td>
                  <td className="px-4 py-2.5 text-right">{e.credit > 0 ? `KWD ${e.credit.toFixed(3)}` : ''}</td>
                  <td className="px-4 py-2.5 text-right font-medium">KWD {e.balance.toFixed(3)}</td>
                </tr>
              ))}
              {ledger.entries.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">{t('acct.noEntries')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ========================
// TRIAL BALANCE TAB
// ========================

function TrialBalanceTab() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const isAr = i18n.language === 'ar';

  useEffect(() => {
    getTrialBalance().then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="text-center py-8 text-gray-500">{t('settings.loading')}</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 border-b flex justify-between items-center">
        <h2 className="text-sm font-semibold text-primary">{t('acct.trialBalanceTitle')}</h2>
        {data.isBalanced ? (
          <span className="text-xs text-success font-medium">{t('acct.balanced')}</span>
        ) : (
          <span className="text-xs text-danger font-medium">{t('acct.unbalanced')}</span>
        )}
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th className="px-4 py-3">{t('acct.code')}</th>
            <th className="px-4 py-3">{t('acct.accountName')}</th>
            <th className="px-4 py-3">{t('acct.accountType')}</th>
            <th className="px-4 py-3 text-right">{t('acct.debit')}</th>
            <th className="px-4 py-3 text-right">{t('acct.credit')}</th>
          </tr>
        </thead>
        <tbody>
          {data.accounts.map((a) => (
            <tr key={a.accountId} className="border-t">
              <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{a.code}</td>
              <td className="px-4 py-2.5">{isAr ? a.nameAr : a.nameEn}</td>
              <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor(a.type)}`}>{a.type}</span></td>
              <td className="px-4 py-2.5 text-right">{a.debit > 0 ? `KWD ${a.debit.toFixed(3)}` : ''}</td>
              <td className="px-4 py-2.5 text-right">{a.credit > 0 ? `KWD ${a.credit.toFixed(3)}` : ''}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-primary font-bold bg-primary/5">
            <td colSpan={3} className="px-4 py-3">{t('acct.totals')}</td>
            <td className="px-4 py-3 text-right">KWD {data.totalDebit.toFixed(3)}</td>
            <td className="px-4 py-3 text-right">KWD {data.totalCredit.toFixed(3)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ========================
// PROFIT & LOSS TAB
// ========================

function PLTab() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<ProfitAndLoss | null>(null);
  const isAr = i18n.language === 'ar';

  useEffect(() => {
    getProfitAndLoss().then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="text-center py-8 text-gray-500">{t('settings.loading')}</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-sm font-semibold text-primary mb-4">{t('acct.plTitle')}</h2>
      <table className="w-full text-sm">
        <tbody>
          <tr><td colSpan={2} className="bg-gray-50 font-bold text-primary px-4 py-2">{t('acct.revenue')}</td></tr>
          {data.revenue.items.map((item) => (
            <tr key={item.code} className="border-t">
              <td className="px-8 py-2"><span className="font-mono text-xs text-gray-400 mr-2">{item.code}</span>{isAr ? item.nameAr : item.nameEn}</td>
              <td className="px-4 py-2 text-right">KWD {item.amount.toFixed(3)}</td>
            </tr>
          ))}
          <tr className="border-t"><td className="px-4 py-2 font-semibold">{t('acct.totalRevenue')}</td><td className="px-4 py-2 text-right font-semibold">KWD {data.revenue.total.toFixed(3)}</td></tr>

          <tr><td colSpan={2} className="bg-gray-50 font-bold text-primary px-4 py-2">{t('acct.expensesLabel')}</td></tr>
          {data.expenses.items.map((item) => (
            <tr key={item.code} className="border-t">
              <td className="px-8 py-2"><span className="font-mono text-xs text-gray-400 mr-2">{item.code}</span>{isAr ? item.nameAr : item.nameEn}</td>
              <td className="px-4 py-2 text-right">KWD {item.amount.toFixed(3)}</td>
            </tr>
          ))}
          <tr className="border-t"><td className="px-4 py-2 font-semibold">{t('acct.totalExpenses')}</td><td className="px-4 py-2 text-right font-semibold">KWD {data.expenses.total.toFixed(3)}</td></tr>

          <tr className={`${data.netProfit >= 0 ? 'bg-success/10' : 'bg-danger/10'}`}>
            <td className={`px-4 py-3 font-bold text-base ${data.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>{t('acct.netProfit')}</td>
            <td className={`px-4 py-3 text-right font-bold text-base ${data.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>KWD {data.netProfit.toFixed(3)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ========================
// BALANCE SHEET TAB
// ========================

function BSTab() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<BalanceSheet | null>(null);
  const isAr = i18n.language === 'ar';

  useEffect(() => {
    getBalanceSheet().then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="text-center py-8 text-gray-500">{t('settings.loading')}</div>;

  const BSSection = ({ title, items, total }: { title: string; items: { code: string; nameEn: string; nameAr: string; balance: number }[]; total: number }) => (
    <div>
      <div className="font-bold text-primary mb-2">{title}</div>
      <table className="w-full text-sm">
        <tbody>
          {items.map((item) => (
            <tr key={item.code} className="border-t">
              <td className="px-4 py-2"><span className="font-mono text-xs text-gray-400 mr-2">{item.code}</span>{isAr ? item.nameAr : item.nameEn}</td>
              <td className="px-4 py-2 text-right">KWD {item.balance.toFixed(3)}</td>
            </tr>
          ))}
          <tr className="bg-primary/5">
            <td className="px-4 py-2 font-bold">{t('acct.total')}</td>
            <td className="px-4 py-2 text-right font-bold">KWD {total.toFixed(3)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-primary">{t('acct.bsTitle')}</h2>
        <span className="text-xs text-gray-500">{t('acct.asOf')} {data.asOfDate}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BSSection title={t('acct.assets')} items={data.assets.items} total={data.assets.total} />
        <div>
          <BSSection title={t('acct.liabilities')} items={data.liabilities.items} total={data.liabilities.total} />
          <div className="mt-4">
            <BSSection title={t('acct.equity')} items={data.equity.items} total={data.equity.total} />
          </div>
          <div className="mt-4 bg-primary/5 rounded px-4 py-2 flex justify-between font-bold text-sm">
            <span>{t('acct.totalLiabilitiesEquity')}</span>
            <span>KWD {data.totalLiabilitiesAndEquity.toFixed(3)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================
// BANK RECONCILIATION TAB
// ========================

function ReconciliationTab() {
  const { t } = useTranslation();
  const [data, setData] = useState<ReconciliationData | null>(null);

  useEffect(() => {
    getReconciliation().then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="text-center py-8 text-gray-500">{t('settings.loading')}</div>;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Kpi label={t('acct.bankBalance')} value={`KWD ${data.summary.bankBalance.toLocaleString()}`} />
        <Kpi label={t('acct.systemBalance')} value={`KWD ${data.summary.systemBalance.toLocaleString()}`} />
        <Kpi label={t('acct.difference')} value={`KWD ${data.summary.difference.toLocaleString()}`} color={data.summary.difference === 0 ? 'text-success' : 'text-danger'} />
        <Kpi label={t('acct.unmatchedCount')} value={String(data.summary.unmatchedCount)} color={data.summary.unmatchedCount === 0 ? 'text-success' : 'text-warning'} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">{t('acct.date')}</th>
              <th className="px-4 py-3">{t('acct.description')}</th>
              <th className="px-4 py-3">{t('acct.reference')}</th>
              <th className="px-4 py-3 text-right">{t('acct.debit')}</th>
              <th className="px-4 py-3 text-right">{t('acct.credit')}</th>
              <th className="px-4 py-3 text-right">{t('acct.balance')}</th>
              <th className="px-4 py-3">{t('tenants.status')}</th>
            </tr>
          </thead>
          <tbody>
            {data.transactions.map((tx) => (
              <tr key={tx.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2.5 whitespace-nowrap">{new Date(tx.date).toLocaleDateString()}</td>
                <td className="px-4 py-2.5">{tx.description}</td>
                <td className="px-4 py-2.5">{tx.reference ?? '—'}</td>
                <td className="px-4 py-2.5 text-right text-danger">{tx.debit > 0 ? `KWD ${tx.debit.toFixed(3)}` : ''}</td>
                <td className="px-4 py-2.5 text-right text-success">{tx.credit > 0 ? `KWD ${tx.credit.toFixed(3)}` : ''}</td>
                <td className="px-4 py-2.5 text-right font-medium">KWD {tx.balance.toFixed(3)}</td>
                <td className="px-4 py-2.5"><ReconStatusBadge status={tx.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ========================
// PROJECTIONS TAB
// ========================

function ProjectionsTab() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Projection[]>([]);

  useEffect(() => {
    getProjections().then(setItems).catch(() => {});
  }, []);

  const totals = items.reduce(
    (acc, p) => ({ revenue: acc.revenue + p.revenue, expenses: acc.expenses + p.expenses, profit: acc.profit + p.profit }),
    { revenue: 0, expenses: 0, profit: 0 }
  );
  const avgOccupancy = items.length > 0 ? Math.round(items.reduce((s, p) => s + p.occupancy, 0) / items.length) : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-sm font-semibold text-primary mb-4">{t('acct.projTitle')}</h2>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th className="px-4 py-3">{t('acct.month')}</th>
            <th className="px-4 py-3">{t('acct.occupancy')}</th>
            <th className="px-4 py-3">{t('acct.projRevenue')}</th>
            <th className="px-4 py-3">{t('acct.projExpenses')}</th>
            <th className="px-4 py-3">{t('acct.projProfit')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.month} className="border-t">
              <td className="px-4 py-3">{p.month}</td>
              <td className="px-4 py-3">{p.occupancy}%</td>
              <td className="px-4 py-3">KWD {p.revenue.toFixed(3)}</td>
              <td className="px-4 py-3">KWD {p.expenses.toFixed(3)}</td>
              <td className="px-4 py-3 text-success">KWD {p.profit.toFixed(3)}</td>
            </tr>
          ))}
          {items.length > 0 && (
            <tr className="bg-primary/5 font-semibold">
              <td className="px-4 py-3">{t('acct.sixMonthTotal')}</td>
              <td className="px-4 py-3">~{avgOccupancy}% avg</td>
              <td className="px-4 py-3">KWD {totals.revenue.toFixed(3)}</td>
              <td className="px-4 py-3">KWD {totals.expenses.toFixed(3)}</td>
              <td className="px-4 py-3 text-success">KWD {totals.profit.toFixed(3)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ========================
// SHARED COMPONENTS
// ========================

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    POSTED: 'bg-success/15 text-success',
    APPROVED: 'bg-success/15 text-success',
    VOID: 'bg-danger/15 text-danger',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

function ReconStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    MATCHED: 'bg-success/15 text-success',
    UNMATCHED: 'bg-warning/15 text-warning',
    EXCLUDED: 'bg-gray-100 text-gray-500',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}
