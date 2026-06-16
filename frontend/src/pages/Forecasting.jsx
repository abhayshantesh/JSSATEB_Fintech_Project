import React, { useEffect, useMemo, useState } from 'react';
import {
    ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { TrendingUp, Wallet, Target } from 'lucide-react';
import { getRevenueForecast, getExpenseForecast } from '../services/api';
import {
    PageHeader, Card, SectionHeader, KpiCard, Loading, ErrorState,
} from '../components/ui';
import { formatCompact, formatPeriod } from '../utils/format';

const HORIZONS = [6, 12, 18, 24];

const ForecastChart = ({ series, color }) => {
    // Merge history + forecast into one continuous series with a band.
    const data = useMemo(() => {
        const hist = series.history.map((h) => ({ period: h.period, actual: h.actual }));
        const fc = series.forecast.map((f) => ({
            period: f.period, forecast: f.forecast, lower: f.lower, band: f.upper - f.lower,
        }));
        // Bridge the line: last actual seeds the forecast line.
        if (hist.length && fc.length) {
            const last = hist[hist.length - 1];
            fc.unshift({ period: last.period, forecast: last.actual, lower: last.actual, band: 0 });
        }
        const map = new Map();
        [...hist, ...fc].forEach((row) => {
            map.set(row.period, { ...(map.get(row.period) || { period: row.period }), ...row });
        });
        return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period));
    }, [series]);

    const firstForecast = series.forecast[0]?.period;

    return (
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <ComposedChart data={data} margin={{ left: -6, right: 6, top: 6 }}>
                    <defs>
                        <linearGradient id={`fill-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.14} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f4" />
                    <XAxis dataKey="period" tickFormatter={formatPeriod} tick={{ fill: '#94a0ae', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tickFormatter={(v) => formatCompact(v, false)} tick={{ fill: '#94a0ae', fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                    <Tooltip
                        contentStyle={{ borderRadius: 10, border: '1px solid #e6e9ee', fontSize: 12 }}
                        formatter={(v, n) => {
                            if (n === 'Confidence band' || n === 'lower') return [null, null];
                            return [formatCompact(v), n];
                        }}
                        labelFormatter={formatPeriod}
                    />
                    {firstForecast && <ReferenceLine x={firstForecast} stroke="#cbd2da" strokeDasharray="4 4" label={{ value: 'Forecast', position: 'insideTopRight', fill: '#94a0ae', fontSize: 11 }} />}
                    {/* Confidence band: invisible base + visible thickness */}
                    <Area dataKey="lower" stackId="band" stroke="none" fill="transparent" name="lower" isAnimationActive={false} />
                    <Area dataKey="band" stackId="band" stroke="none" fill={`url(#fill-${color})`} name="Confidence band" isAnimationActive={false} />
                    <Line type="monotone" dataKey="actual" name="Actual" stroke="#1f2937" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="forecast" name="Forecast" stroke={color} strokeWidth={2} strokeDasharray="5 4" dot={false} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

const sumForecast = (s) => s.forecast.reduce((a, b) => a + b.forecast, 0);

const Forecasting = () => {
    const [periods, setPeriods] = useState(12);
    const [revenue, setRevenue] = useState(null);
    const [expense, setExpense] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = async () => {
        setLoading(true);
        setError(false);
        try {
            const [r, e] = await Promise.all([getRevenueForecast(periods), getExpenseForecast(periods)]);
            setRevenue(r);
            setExpense(e);
        } catch (e) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [periods]);

    if (loading) return <Loading label="Generating forecasts…" />;
    if (error) return <ErrorState onRetry={load} />;

    const projRevenue = sumForecast(revenue);
    const projExpense = sumForecast(expense);
    const projSurplus = projRevenue - projExpense;
    const projMarginPct = projRevenue ? (projSurplus / projRevenue) * 100 : 0;

    return (
        <>
            <PageHeader
                title="Revenue & Expense Forecasting"
                subtitle="Exponential-smoothing projections with 95% confidence bands"
            >
                <div className="flex items-center gap-1 rounded-lg border border-ink-200 bg-surface p-1">
                    {HORIZONS.map((h) => (
                        <button
                            key={h}
                            onClick={() => setPeriods(h)}
                            className={`rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                                periods === h ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-50'
                            }`}
                        >
                            {h}M
                        </button>
                    ))}
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <KpiCard label={`Projected Revenue · ${periods}M`} icon={TrendingUp} value={formatCompact(projRevenue)} sub={`${revenue.confidence_pct}% confidence`} />
                <KpiCard label={`Projected Expenses · ${periods}M`} icon={Wallet} value={formatCompact(projExpense)} sub={`${expense.confidence_pct}% confidence`} />
                <KpiCard label="Projected Surplus" icon={Target} value={formatCompact(projSurplus)} sub={`${projMarginPct.toFixed(1)}% margin over ${periods} months`} />
            </div>

            <Card className="mt-4">
                <SectionHeader
                    title="Revenue Forecast"
                    subtitle="Historical actuals (solid) and projected revenue (dashed) with confidence band"
                />
                <ForecastChart series={revenue} color="#a81f2a" />
            </Card>

            <Card className="mt-4">
                <SectionHeader
                    title="Expense Forecast"
                    subtitle="Projected expense trajectory to support budgeting and planning"
                />
                <ForecastChart series={expense} color="#2f6fed" />
            </Card>

            <Card className="mt-4 bg-ink-950 border-ink-950">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                        <Target size={15} />
                    </div>
                    <div>
                        <p className="eyebrow text-ink-400">Forecast read-out</p>
                        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-100">
                            Over the next {periods} months, revenue is projected at{' '}
                            <span className="font-semibold text-white">{formatCompact(projRevenue)}</span> against
                            expenses of{' '}
                            <span className="font-semibold text-white">{formatCompact(projExpense)}</span>, holding
                            the operating margin near{' '}
                            <span className="font-semibold text-white">{projMarginPct.toFixed(1)}%</span>. Forecast
                            confidence is {revenue.confidence_pct}% for revenue and {expense.confidence_pct}% for
                            expenses; the shaded band shows the 95% range. Revenue is seasonal — concentrated in
                            fee-collection months — so plan reserves and cash flow around the troughs.
                        </p>
                    </div>
                </div>
            </Card>
        </>
    );
};

export default Forecasting;
