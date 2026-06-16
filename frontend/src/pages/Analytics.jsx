import React, { useEffect, useState } from 'react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import {
    getVendors, getExpenseBreakdown, getBudgetVariance, getAnomalies, getFinancialPosition,
} from '../services/api';
import {
    PageHeader, Card, SectionHeader, StatusPill, Loading, ErrorState, KpiCard, Meter,
} from '../components/ui';
import { formatCompact, formatPct } from '../utils/format';

const Analytics = () => {
    const [vendors, setVendors] = useState([]);
    const [breakdown, setBreakdown] = useState([]);
    const [variance, setVariance] = useState([]);
    const [anomalies, setAnomalies] = useState({ anomalies: [], total_count: 0 });
    const [position, setPosition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = async () => {
        setLoading(true);
        setError(false);
        try {
            const [v, b, varc, a, p] = await Promise.all([
                getVendors(10), getExpenseBreakdown(), getBudgetVariance(), getAnomalies(2.5), getFinancialPosition(),
            ]);
            setVendors(v);
            setBreakdown(b);
            setVariance(varc);
            setAnomalies(a);
            setPosition(p);
        } catch (e) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    if (loading) return <Loading label="Loading financial analytics…" />;
    if (error) return <ErrorState onRetry={load} />;

    return (
        <>
            <PageHeader
                title="Financial Analytics"
                subtitle="Financial position, expense breakdown, budget variance and anomaly detection"
            />

            {/* Financial position strip */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KpiCard label="Total Assets" value={formatCompact(position.total_assets)} sub="Fixed & current assets" />
                <KpiCard label="Total Liabilities" value={formatCompact(position.total_liabilities)} sub="Loans & payables" />
                <KpiCard label="Net Worth" value={formatCompact(position.net_worth)} sub="Assets − Liabilities" />
                <KpiCard label="Liquidity Ratio" value={`${position.liquidity_ratio}x`} sub="Assets ÷ Liabilities" />
            </div>

            {/* Vendor analysis */}
            <Card className="mt-4" pad={false}>
                <div className="card-pad pb-0">
                    <SectionHeader title="Top Vendors by Spend" subtitle="Spend, transaction volume and concentration risk" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                        <thead>
                            <tr className="border-b border-ink-200 text-[11px] uppercase tracking-wide text-ink-400">
                                <th className="px-6 py-2.5 font-semibold">Vendor</th>
                                <th className="px-4 py-2.5 font-semibold text-right">Total Spend</th>
                                <th className="px-4 py-2.5 font-semibold text-right">Share</th>
                                <th className="px-4 py-2.5 font-semibold text-right">Transactions</th>
                                <th className="px-4 py-2.5 font-semibold text-right">Avg Value</th>
                                <th className="px-6 py-2.5 font-semibold text-right">Concentration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.map((v) => (
                                <tr key={v.vendor} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/60">
                                    <td className="px-6 py-3 font-medium text-ink-800">{v.vendor}</td>
                                    <td className="tnum px-4 py-3 text-right text-ink-700">{formatCompact(v.spend)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="tnum text-ink-600">{v.spend_share_pct}%</span>
                                            <div className="w-12"><Meter value={v.spend_share_pct} max={35} tone="ink" /></div>
                                        </div>
                                    </td>
                                    <td className="tnum px-4 py-3 text-right text-ink-700">{v.transactions}</td>
                                    <td className="tnum px-4 py-3 text-right text-ink-700">{formatCompact(v.avg_transaction)}</td>
                                    <td className="px-6 py-3 text-right"><StatusPill status={v.risk_tier} dot={false} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Expense breakdown + variance */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                    <SectionHeader title="Expense Breakdown" subtitle="Spend by category with year-over-year change" />
                    <div className="space-y-3">
                        {breakdown.map((d) => (
                            <div key={d.category}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[13px] text-ink-700">{d.category}</span>
                                    <div className="flex items-center gap-2.5">
                                        <span className="tnum text-[13px] font-medium text-ink-900">{formatCompact(d.amount)}</span>
                                        <span className={`tnum inline-flex items-center gap-0.5 text-[11.5px] font-medium ${d.yoy_change_pct > 0 ? 'text-negative-600' : 'text-positive-600'}`}>
                                            {d.yoy_change_pct > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {formatPct(Math.abs(d.yoy_change_pct))}
                                        </span>
                                    </div>
                                </div>
                                <Meter value={d.share_pct} tone="brand" />
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <SectionHeader title="Budget Variance" subtitle="Actual vs allocated budget" />
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={variance} layout="vertical" margin={{ left: 4, right: 24 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef1f4" />
                                <XAxis type="number" tickFormatter={(v) => formatCompact(v, false)} tick={{ fill: '#94a0ae', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="category" width={120} tick={{ fill: '#4a5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f6f7f9' }}
                                    formatter={(v) => [formatCompact(v), 'Variance']}
                                    contentStyle={{ borderRadius: 10, border: '1px solid #e6e9ee', fontSize: 12 }}
                                />
                                <Bar dataKey="variance" radius={[0, 4, 4, 0]} barSize={16}>
                                    {variance.map((v, i) => (
                                        <Cell key={i} fill={v.variance > 0 ? '#dc3545' : '#12a150'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[11.5px] text-ink-400 mt-1">Red = over budget · Green = under budget</p>
                </Card>
            </div>

            {/* Anomalies */}
            <Card className="mt-4" pad={false}>
                <div className="card-pad pb-3">
                    <SectionHeader
                        title="Expense Anomalies"
                        subtitle="Transactions that deviate sharply from their category norm"
                        action={
                            <span className="pill bg-warning-50 text-warning-600">
                                <AlertTriangle size={13} /> {anomalies.total_count} flagged
                            </span>
                        }
                    />
                </div>
                {anomalies.anomalies.length === 0 ? (
                    <div className="px-6 pb-8 text-center text-[13px] text-ink-400">No anomalies at current sensitivity.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px]">
                            <thead>
                                <tr className="border-b border-ink-200 text-[11px] uppercase tracking-wide text-ink-400">
                                    <th className="px-6 py-2.5 font-semibold">Date</th>
                                    <th className="px-4 py-2.5 font-semibold">Category</th>
                                    <th className="px-4 py-2.5 font-semibold">Vendor</th>
                                    <th className="px-4 py-2.5 font-semibold text-right">Amount</th>
                                    <th className="px-4 py-2.5 font-semibold text-right">Deviation</th>
                                    <th className="px-6 py-2.5 font-semibold text-right">Severity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {anomalies.anomalies.slice(0, 10).map((a) => (
                                    <tr key={a.txn_id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/60">
                                        <td className="tnum px-6 py-3 text-ink-600">{a.date}</td>
                                        <td className="px-4 py-3 text-ink-800">{a.category}</td>
                                        <td className="px-4 py-3 text-ink-600">{a.vendor}</td>
                                        <td className="tnum px-4 py-3 text-right font-medium text-ink-900">{formatCompact(a.amount)}</td>
                                        <td className="tnum px-4 py-3 text-right text-ink-600">{a.deviation_sigma}σ</td>
                                        <td className="px-6 py-3 text-right"><StatusPill status={a.severity} dot={false} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </>
    );
};

export default Analytics;
