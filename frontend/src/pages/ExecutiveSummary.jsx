import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    BarChart, Bar, Cell,
} from 'recharts';
import {
    Landmark, Wallet, Percent, ShieldAlert, Gauge, ArrowRight, Sparkles,
} from 'lucide-react';
import {
    getExecutiveSummary, getTrends, getExpenseBreakdown, getVendors, getAiExecutiveSummary,
} from '../services/api';
import {
    PageHeader, Card, SectionHeader, KpiCard, StatusPill, Loading, ErrorState, Meter,
} from '../components/ui';
import { formatCompact, formatPct, formatPeriod } from '../utils/format';

const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="card px-3 py-2 text-[12px]">
            <p className="font-medium text-ink-700 mb-1">{formatPeriod(label)}</p>
            {payload.map((p) => (
                <p key={p.dataKey} className="tnum flex items-center justify-between gap-4 text-ink-600">
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                        {p.name}
                    </span>
                    <span className="font-medium">{formatCompact(p.value)}</span>
                </p>
            ))}
        </div>
    );
};

const CATEGORY_COLORS = ['#a81f2a', '#c8323a', '#4a5563', '#94a0ae', '#cbd2da'];

const HealthGauge = ({ score, status }) => {
    const pct = Math.max(0, Math.min(100, score));
    return (
        <Card className="flex flex-col">
            <SectionHeader title="Financial Health" subtitle="Composite of margin, expense trend, liquidity & risk" />
            <div className="flex items-center gap-5">
                <div className="relative h-24 w-24 shrink-0">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-ink-100)" strokeWidth="9" />
                        <circle
                            cx="50" cy="50" r="42" fill="none" stroke="var(--color-brand-600)" strokeWidth="9"
                            strokeLinecap="round" strokeDasharray={`${(pct / 100) * 264} 264`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="tnum text-[24px] font-semibold text-ink-900">{score}</span>
                        <span className="text-[10px] text-ink-400">/ 100</span>
                    </div>
                </div>
                <div>
                    <StatusPill status={status} />
                    <p className="text-[12.5px] text-ink-500 mt-2 leading-relaxed">
                        A composite of operating margin, expense trajectory, liquidity and financial
                        risk indicators.
                    </p>
                </div>
            </div>
        </Card>
    );
};

const ExecutiveSummary = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [trend, setTrend] = useState([]);
    const [breakdown, setBreakdown] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [ai, setAi] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = async () => {
        setLoading(true);
        setError(false);
        try {
            const [summary, trends, expenseBreakdown, vnd] = await Promise.all([
                getExecutiveSummary(), getTrends(18), getExpenseBreakdown(), getVendors(12),
            ]);
            setData(summary);
            setTrend(trends);
            setBreakdown(expenseBreakdown);
            setVendors(vnd);
        } catch (e) {
            setError(true);
        } finally {
            setLoading(false);
        }
        // AI summary loaded separately so a slow LLM call never blocks the page.
        getAiExecutiveSummary().then(setAi).catch(() => setAi(null));
    };

    useEffect(() => { load(); }, []);

    if (loading) return <Loading label="Loading executive summary…" />;
    if (error) return <ErrorState onRetry={load} />;

    const highRisk = vendors.filter((v) => v.risk_tier === 'High');

    return (
        <>
            <PageHeader
                title="Executive Summary"
                subtitle="Institutional financial performance · trailing period vs prior year"
            >
                <button className="btn-secondary" onClick={() => navigate('/ai-insights')}>
                    <Sparkles size={15} /> AI Insights
                </button>
                <button className="btn-primary" onClick={() => navigate('/forecasting')}>
                    View Forecasts <ArrowRight size={15} />
                </button>
            </PageHeader>

            {/* KPI row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    label="Total Revenue" icon={Landmark}
                    value={formatCompact(data.total_revenue)}
                    delta={data.revenue_growth_pct}
                    sub={`~${data.student_fee_count.toLocaleString('en-IN')} fee payments · YoY`}
                />
                <KpiCard
                    label="Total Expenses" icon={Wallet}
                    value={formatCompact(data.total_expenses)}
                    delta={data.expense_growth_pct} deltaTone={data.expense_growth_pct <= 0 ? 'positive' : 'negative'}
                    sub="Salaries, infrastructure, utilities · YoY"
                />
                <KpiCard
                    label="Net Surplus" icon={Percent}
                    value={formatCompact(data.net_surplus)}
                    sub={`${data.operating_margin_pct}% operating margin`}
                />
                <KpiCard
                    label="Risk Score" icon={ShieldAlert}
                    value={data.risk_score}
                    sub={<StatusPill status={data.risk_level} dot={false} />}
                />
            </div>

            {/* Trend + health */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <SectionHeader
                        title="Revenue vs Expenses"
                        subtitle="Monthly trend, last 18 months"
                        action={
                            <div className="flex items-center gap-4 text-[12px] text-ink-500">
                                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ink-800" />Revenue</span>
                                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" />Expenses</span>
                            </div>
                        }
                    />
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <ComposedChart data={trend} margin={{ left: -8, right: 4, top: 4 }}>
                                <defs>
                                    <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#1f2937" stopOpacity={0.12} />
                                        <stop offset="100%" stopColor="#1f2937" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f4" />
                                <XAxis dataKey="period" tickFormatter={formatPeriod} tick={{ fill: '#94a0ae', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                                <YAxis tickFormatter={(v) => formatCompact(v, false)} tick={{ fill: '#94a0ae', fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                                <Tooltip content={<ChartTooltip />} />
                                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#1f2937" strokeWidth={2} fill="url(#gRevenue)" />
                                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#c8323a" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <HealthGauge score={data.health_score} status={data.health_status} />
            </div>

            {/* Expense mix + secondary KPIs + vendors */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card>
                    <SectionHeader title="Expense Structure" subtitle="Share of total expenses" />
                    <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={breakdown} layout="vertical" margin={{ left: 0, right: 16 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="category" width={132} tick={{ fill: '#4a5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f6f7f9' }} formatter={(v) => [`${v}%`, 'Share']} contentStyle={{ borderRadius: 10, border: '1px solid #e6e9ee', fontSize: 12 }} />
                                <Bar dataKey="share_pct" radius={[0, 4, 4, 0]} barSize={16}>
                                    {breakdown.map((_, i) => (
                                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card>
                    <SectionHeader title="Efficiency & Confidence" />
                    <div className="space-y-4">
                        <MetricRow label="Budget Adherence" value={`${data.budget_adherence_pct}%`} meter={data.budget_adherence_pct} tone="positive" />
                        <MetricRow label="Forecast Confidence" value={`${data.forecast_confidence_pct}%`} meter={data.forecast_confidence_pct} tone="brand" />
                        <MetricRow label="Liquidity Ratio" value={`${data.liquidity_ratio}x`} meter={Math.min(100, (data.liquidity_ratio / 3) * 100)} tone="warning" />
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-[13px] text-ink-600">Net Worth</span>
                            <span className="tnum text-[13px] font-semibold text-ink-900">{formatCompact(data.net_worth)}</span>
                        </div>
                    </div>
                </Card>

                <Card>
                    <SectionHeader
                        title="Vendor Concentration"
                        subtitle={`${highRisk.length} high-concentration of ${vendors.length} top vendors`}
                        action={<Gauge size={16} className="text-ink-300" />}
                    />
                    <div className="space-y-2.5">
                        {(highRisk.length ? highRisk : vendors.slice(0, 4)).slice(0, 4).map((v) => (
                            <div key={v.vendor} className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="truncate text-[13px] font-medium text-ink-800">{v.vendor}</p>
                                    <p className="text-[11.5px] text-ink-400">
                                        {v.spend_share_pct}% of spend · {v.transactions} txns
                                    </p>
                                </div>
                                <StatusPill status={v.risk_tier} dot={false} />
                            </div>
                        ))}
                    </div>
                    <button onClick={() => navigate('/analytics')} className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-600 hover:text-brand-700">
                        Financial analytics <ArrowRight size={13} />
                    </button>
                </Card>
            </div>

            {/* AI briefing */}
            <Card className="mt-4">
                <SectionHeader
                    title="AI Executive Briefing"
                    subtitle="Auto-generated from current financial metrics"
                    action={
                        ai && (
                            <span className="pill bg-ink-100 text-ink-500">
                                {ai.source === 'openrouter' ? 'Live AI' : 'Rule-based'}
                            </span>
                        )
                    }
                />
                {!ai ? (
                    <div className="flex items-center gap-2 text-[13px] text-ink-400 py-3">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
                        Generating briefing…
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <div>
                            <p className="text-[14px] font-medium text-ink-900 leading-snug">{ai.headline}</p>
                            <ul className="mt-3 space-y-2">
                                {ai.observations?.slice(0, 3).map((o, i) => (
                                    <li key={i} className="flex gap-2 text-[13px] text-ink-600 leading-relaxed">
                                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-300" />{o}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            <Briefing label="Top Risk" tone="negative" text={ai.risks?.[0]} />
                            <Briefing label="Recommended Action" tone="positive" text={ai.actions?.[0]} />
                        </div>
                    </div>
                )}
            </Card>
        </>
    );
};

const MetricRow = ({ label, value, meter, tone }) => (
    <div>
        <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] text-ink-600">{label}</span>
            <span className="tnum text-[13px] font-semibold text-ink-900">{value}</span>
        </div>
        <Meter value={meter} tone={tone} />
    </div>
);

const Briefing = ({ label, tone, text }) => {
    const cls = {
        negative: 'border-negative-500/30 bg-negative-50',
        positive: 'border-positive-500/30 bg-positive-50',
    }[tone];
    return (
        <div className={`rounded-lg border px-3.5 py-3 ${cls}`}>
            <p className="eyebrow mb-1">{label}</p>
            <p className="text-[12.5px] text-ink-700 leading-relaxed">{text || '—'}</p>
        </div>
    );
};

export default ExecutiveSummary;
