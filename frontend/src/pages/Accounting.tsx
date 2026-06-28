import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BalanceSheet,
  CashFlow,
  ExpenseEntry,
  FinancialSummary,
  getBalanceSheet,
  getCashFlow,
  getExpenseEntries,
  getFinancialSummary,
  getProfitAndLoss,
  getProjections,
  getRevenueEntries,
  ProfitAndLoss,
  Projection,
  RevenueEntry,
} from '../api/accounting';

type Tab = 'revenue' | 'expenses' | 'invoices' | 'bank' | 'pl' | 'bs' | 'cf' | 'proj';

const TABS: { key: Tab; labelKey: string }[] = [
  { key: 'revenue', labelKey: 'accounting.tabs.revenue' },
  { key: 'expenses', labelKey: 'accounting.tabs.expenses' },
  { key: 'invoices', labelKey: 'accounting.tabs.invoices' },
  { key: 'bank', labelKey: 'accounting.tabs.bank' },
  { key: 'pl', labelKey: 'accounting.tabs.pl' },
  { key: 'bs', labelKey: 'accounting.tabs.bs' },
  { key: 'cf', labelKey: 'accounting.tabs.cf' },
  { key: 'proj', labelKey: 'accounting.tabs.proj' },
];

export function Accounting() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('revenue');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [pl, setPl] = useState<ProfitAndLoss | null>(null);
  const [bs, setBs] = useState<BalanceSheet | null>(null);
  const [cf, setCf] = useState<CashFlow | null>(null);
  const [projections, setProjections] = useState<Projection[]>([]);

  useEffect(() => {
    getFinancialSummary().then(setSummary).catch(() => {});
    getRevenueEntries().then(setRevenue).catch(() => {});
    getExpenseEntries().then(setExpenses).catch(() => {});
    getProfitAndLoss().then(setPl).catch(() => {});
    getBalanceSheet().then(setBs).catch(() => {});
    getCashFlow().then(setCf).catch(() => {});
    getProjections().then(setProjections).catch(() => {});
  }, []);

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">{t('nav.accounting')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('accounting.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="border rounded px-3 py-2 text-sm font-medium text-gray-700">Export PDF</button>
          <button className="bg-primary text-white rounded px-4 py-2 text-sm font-medium">+ New Entry</button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Kpi label={t('accounting.kpi.revenue')} value={`KWD ${summary.totalRevenue.toLocaleString()}`} />
          <Kpi label={t('accounting.kpi.expenses')} value={`KWD ${summary.totalExpenses.toLocaleString()}`} color="text-danger" />
          <Kpi label={t('accounting.kpi.netProfit')} value={`KWD ${summary.netProfit.toLocaleString()}`} color="text-success" />
          <Kpi label={t('accounting.kpi.receivables')} value={`KWD ${summary.outstandingReceivables.toLocaleString()}`} />
          <Kpi label={t('accounting.kpi.payables')} value={`KWD ${summary.outstandingPayables.toLocaleString()}`} color="text-warning" />
        </div>
      )}

      <div className="flex border-b-2 border-gray-200 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-[2px] transition-colors ${
              activeTab === tab.key
                ? 'text-primary border-primary'
                : 'text-gray-500 border-transparent hover:text-primary'
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {activeTab === 'revenue' && <RevenueTab items={revenue} />}
      {activeTab === 'expenses' && <ExpensesTab items={expenses} />}
      {activeTab === 'invoices' && <InvoicesTab items={revenue} />}
      {activeTab === 'bank' && <BankReconTab items={revenue} />}
      {activeTab === 'pl' && pl && <PLTab data={pl} />}
      {activeTab === 'bs' && bs && <BSTab data={bs} />}
      {activeTab === 'cf' && cf && <CFTab data={cf} />}
      {activeTab === 'proj' && <ProjectionsTab items={projections} />}
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

function RevenueTab({ items }: { items: RevenueEntry[] }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th className="px-4 py-3">{t('accounting.date')}</th>
            <th className="px-4 py-3">{t('contracts.number')}</th>
            <th className="px-4 py-3">{t('tenants.name')}</th>
            <th className="px-4 py-3">{t('contracts.unit')}</th>
            <th className="px-4 py-3">{t('accounting.description')}</th>
            <th className="px-4 py-3">{t('accounting.amount')}</th>
            <th className="px-4 py-3">{t('accounting.payment')}</th>
            <th className="px-4 py-3">{t('tenants.status')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((entry) => (
            <tr key={entry.id} className="border-t">
              <td className="px-4 py-3 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
              <td className="px-4 py-3 font-medium">{entry.contractNumber}</td>
              <td className="px-4 py-3">{entry.tenantName}</td>
              <td className="px-4 py-3">{entry.unitNumber}</td>
              <td className="px-4 py-3">{entry.description}</td>
              <td className="px-4 py-3 font-medium">{entry.amount.toFixed(3)}</td>
              <td className="px-4 py-3">{entry.paymentMethod ?? '—'}</td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    entry.status === 'PAID' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                  }`}
                >
                  {entry.status}
                </span>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                {t('accounting.noEntries')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ExpensesTab({ items }: { items: ExpenseEntry[] }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th className="px-4 py-3">{t('accounting.date')}</th>
            <th className="px-4 py-3">{t('accounting.category')}</th>
            <th className="px-4 py-3">{t('accounting.description')}</th>
            <th className="px-4 py-3">{t('accounting.vendor')}</th>
            <th className="px-4 py-3">{t('accounting.amount')}</th>
            <th className="px-4 py-3">{t('tenants.status')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((entry) => (
            <tr key={entry.id} className="border-t">
              <td className="px-4 py-3 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
              <td className="px-4 py-3">{entry.category}</td>
              <td className="px-4 py-3">{entry.description}</td>
              <td className="px-4 py-3">{entry.vendor}</td>
              <td className="px-4 py-3 font-medium">{entry.amount.toFixed(3)}</td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    entry.status === 'APPROVED'
                      ? 'bg-success/15 text-success'
                      : entry.status === 'REJECTED'
                      ? 'bg-danger/15 text-danger'
                      : 'bg-warning/15 text-warning'
                  }`}
                >
                  {entry.status}
                </span>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                {t('accounting.noEntries')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function InvoicesTab({ items }: { items: RevenueEntry[] }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th className="px-4 py-3">{t('accounting.invoiceNo')}</th>
            <th className="px-4 py-3">{t('accounting.date')}</th>
            <th className="px-4 py-3">{t('tenants.name')}</th>
            <th className="px-4 py-3">{t('accounting.amount')}</th>
            <th className="px-4 py-3">{t('accounting.dueDate')}</th>
            <th className="px-4 py-3">{t('tenants.status')}</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((entry, idx) => (
            <tr key={entry.id} className="border-t">
              <td className="px-4 py-3 font-medium">INV-{String(idx + 230).padStart(4, '0')}</td>
              <td className="px-4 py-3 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
              <td className="px-4 py-3">{entry.tenantName}</td>
              <td className="px-4 py-3 font-medium">KWD {entry.amount.toFixed(3)}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {new Date(new Date(entry.date).getTime() + 30 * 86400000).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    entry.status === 'PAID' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                  }`}
                >
                  {entry.status === 'PAID' ? 'Paid' : 'Overdue'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {entry.status === 'PAID' ? (
                  <button className="text-xs border rounded px-2 py-1 text-gray-600">PDF</button>
                ) : (
                  <button className="text-xs bg-danger text-white rounded px-2 py-1">Remind</button>
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                {t('accounting.noEntries')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function BankReconTab({ items }: { items: RevenueEntry[] }) {
  const { t } = useTranslation();
  const paidItems = items.filter((i) => i.status === 'PAID');
  const totalBank = paidItems.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6 border-dashed border-2 border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-sm font-semibold">{t('accounting.bankName')}</div>
          <div className="text-xs text-gray-500">{t('accounting.statementPeriod')}</div>
        </div>
        <button className="border rounded px-3 py-1.5 text-sm text-gray-700">{t('accounting.importStatement')}</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Kpi label={t('accounting.bankBalance')} value={`KWD ${totalBank.toLocaleString()}`} />
        <Kpi label={t('accounting.systemBalance')} value={`KWD ${totalBank.toLocaleString()}`} />
        <Kpi label={t('accounting.difference')} value="KWD 0" color="text-success" />
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th className="px-4 py-3">{t('accounting.date')}</th>
            <th className="px-4 py-3">{t('accounting.description')}</th>
            <th className="px-4 py-3">{t('accounting.bankAmount')}</th>
            <th className="px-4 py-3">{t('accounting.systemMatch')}</th>
            <th className="px-4 py-3">{t('tenants.status')}</th>
          </tr>
        </thead>
        <tbody>
          {paidItems.map((entry) => (
            <tr key={entry.id} className="border-t">
              <td className="px-4 py-3 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
              <td className="px-4 py-3">Transfer from {entry.tenantName}</td>
              <td className="px-4 py-3 font-medium">{entry.amount.toFixed(3)}</td>
              <td className="px-4 py-3">{entry.contractNumber}</td>
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-success/15 text-success">
                  Matched
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PLTab({ data }: { data: ProfitAndLoss }) {
  const { t } = useTranslation();
  const monthLabel = new Date(data.month + '-01').toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-primary">
          {t('accounting.plTitle')} — {monthLabel}
        </h2>
        <button className="border rounded px-3 py-1.5 text-sm text-gray-700">Export PDF</button>
      </div>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td colSpan={2} className="bg-gray-50 font-bold text-primary px-4 py-2">
              {t('accounting.revenue')}
            </td>
          </tr>
          <tr className="border-t">
            <td className="px-8 py-2">Rental Income</td>
            <td className="px-4 py-2 text-right">KWD {data.revenue.rentalIncome.toLocaleString()}</td>
          </tr>
          <tr className="border-t">
            <td className="px-4 py-2 font-semibold">{t('accounting.totalRevenue')}</td>
            <td className="px-4 py-2 text-right font-semibold">KWD {data.revenue.total.toLocaleString()}</td>
          </tr>
          <tr>
            <td colSpan={2} className="bg-gray-50 font-bold text-primary px-4 py-2">
              {t('accounting.expensesLabel')}
            </td>
          </tr>
          {data.expenses.breakdown.map((e) => (
            <tr key={e.category} className="border-t">
              <td className="px-8 py-2">{e.category}</td>
              <td className="px-4 py-2 text-right">KWD {e.amount.toLocaleString()}</td>
            </tr>
          ))}
          <tr className="border-t">
            <td className="px-4 py-2 font-semibold">{t('accounting.totalExpenses')}</td>
            <td className="px-4 py-2 text-right font-semibold">KWD {data.expenses.total.toLocaleString()}</td>
          </tr>
          <tr className="bg-success/10">
            <td className="px-4 py-3 font-bold text-success text-base">{t('accounting.netProfit')}</td>
            <td className="px-4 py-3 text-right font-bold text-success text-base">
              KWD {data.netProfit.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function BSTab({ data }: { data: BalanceSheet }) {
  const { t } = useTranslation();
  const totalAssets =
    data.assets.cashAndBank +
    data.assets.accountsReceivable +
    data.assets.securityDeposits +
    data.assets.propertyAssets +
    data.assets.furnitureAndEquipment;
  const totalLiabilitiesEquity =
    data.liabilities.accountsPayable +
    data.liabilities.advanceRents +
    data.liabilities.longTermLoans +
    data.equity.ownersEquity +
    data.equity.retainedEarnings;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-primary">{t('accounting.bsTitle')}</h2>
        <button className="border rounded px-3 py-1.5 text-sm text-gray-700">Export PDF</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="font-bold text-primary mb-2">{t('accounting.assets')}</div>
          <table className="w-full text-sm">
            <tbody>
              <BSRow label="Cash & Bank" value={data.assets.cashAndBank} />
              <BSRow label="Accounts Receivable" value={data.assets.accountsReceivable} />
              <BSRow label="Security Deposits Held" value={data.assets.securityDeposits} />
              <BSRow label="Property Assets" value={data.assets.propertyAssets} />
              <BSRow label="Furniture & Equipment" value={data.assets.furnitureAndEquipment} />
              <tr className="bg-primary/5">
                <td className="px-4 py-2 font-bold">{t('accounting.totalAssets')}</td>
                <td className="px-4 py-2 text-right font-bold">KWD {totalAssets.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <div className="font-bold text-primary mb-2">{t('accounting.liabilitiesEquity')}</div>
          <table className="w-full text-sm">
            <tbody>
              <BSRow label="Accounts Payable" value={data.liabilities.accountsPayable} />
              <BSRow label="Advance Rents (Deferred)" value={data.liabilities.advanceRents} />
              <BSRow label="Long-term Loans" value={data.liabilities.longTermLoans} />
              <BSRow label="Owner's Equity" value={data.equity.ownersEquity} />
              <BSRow label="Retained Earnings" value={data.equity.retainedEarnings} />
              <tr className="bg-primary/5">
                <td className="px-4 py-2 font-bold">{t('accounting.totalLiabilitiesEquity')}</td>
                <td className="px-4 py-2 text-right font-bold">KWD {totalLiabilitiesEquity.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BSRow({ label, value }: { label: string; value: number }) {
  return (
    <tr className="border-t">
      <td className="px-4 py-2">{label}</td>
      <td className="px-4 py-2 text-right">KWD {value.toLocaleString()}</td>
    </tr>
  );
}

function CFTab({ data }: { data: CashFlow }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-sm font-semibold text-primary mb-4">{t('accounting.cfTitle')}</h2>
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td colSpan={2} className="bg-gray-50 font-bold px-4 py-2">
              {t('accounting.operatingActivities')}
            </td>
          </tr>
          <tr className="border-t">
            <td className="px-8 py-2">Rent Collected</td>
            <td className="px-4 py-2 text-right">KWD {data.operating.rentCollected.toLocaleString()}</td>
          </tr>
          <tr className="border-t">
            <td className="px-8 py-2">Expenses Paid</td>
            <td className="px-4 py-2 text-right text-danger">-KWD {data.operating.expensesPaid.toLocaleString()}</td>
          </tr>
          <tr className="border-t">
            <td className="px-4 py-2 font-semibold">Net Operating Cash Flow</td>
            <td className="px-4 py-2 text-right font-semibold">KWD {data.operating.net.toLocaleString()}</td>
          </tr>
          <tr>
            <td colSpan={2} className="bg-gray-50 font-bold px-4 py-2">
              {t('accounting.investingActivities')}
            </td>
          </tr>
          <tr className="border-t">
            <td className="px-8 py-2">Asset Purchases</td>
            <td className="px-4 py-2 text-right text-danger">-KWD {data.investing.assetPurchases.toLocaleString()}</td>
          </tr>
          <tr>
            <td colSpan={2} className="bg-gray-50 font-bold px-4 py-2">
              {t('accounting.financingActivities')}
            </td>
          </tr>
          <tr className="border-t">
            <td className="px-8 py-2">Loan Repayment</td>
            <td className="px-4 py-2 text-right text-danger">-KWD {data.financing.loanRepayment.toLocaleString()}</td>
          </tr>
          <tr className="bg-success/10">
            <td className="px-4 py-3 font-bold text-success text-base">{t('accounting.netCashIncrease')}</td>
            <td className="px-4 py-3 text-right font-bold text-success text-base">
              KWD {data.netCashIncrease.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ProjectionsTab({ items }: { items: Projection[] }) {
  const { t } = useTranslation();
  const totals = items.reduce(
    (acc, p) => ({
      revenue: acc.revenue + p.revenue,
      expenses: acc.expenses + p.expenses,
      profit: acc.profit + p.profit,
    }),
    { revenue: 0, expenses: 0, profit: 0 }
  );
  const avgOccupancy = items.length > 0 ? Math.round(items.reduce((s, p) => s + p.occupancy, 0) / items.length) : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-sm font-semibold text-primary mb-4">{t('accounting.projTitle')}</h2>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th className="px-4 py-3">{t('accounting.month')}</th>
            <th className="px-4 py-3">{t('accounting.projectedOccupancy')}</th>
            <th className="px-4 py-3">{t('accounting.projectedRevenue')}</th>
            <th className="px-4 py-3">{t('accounting.projectedExpenses')}</th>
            <th className="px-4 py-3">{t('accounting.projectedProfit')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.month} className="border-t">
              <td className="px-4 py-3">{p.month}</td>
              <td className="px-4 py-3">{p.occupancy}%</td>
              <td className="px-4 py-3">KWD {p.revenue.toLocaleString()}</td>
              <td className="px-4 py-3">KWD {p.expenses.toLocaleString()}</td>
              <td className="px-4 py-3 text-success">KWD {p.profit.toLocaleString()}</td>
            </tr>
          ))}
          {items.length > 0 && (
            <tr className="bg-primary/5 font-semibold">
              <td className="px-4 py-3">6-Month Total</td>
              <td className="px-4 py-3">~{avgOccupancy}% avg</td>
              <td className="px-4 py-3">KWD {totals.revenue.toLocaleString()}</td>
              <td className="px-4 py-3">KWD {totals.expenses.toLocaleString()}</td>
              <td className="px-4 py-3 text-success">KWD {totals.profit.toLocaleString()}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
