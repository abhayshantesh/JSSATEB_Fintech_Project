import React, { useEffect, useState } from 'react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';
import { SlidersHorizontal, RotateCcw, TrendingUp, TrendingDown } from 'lucide-react';
import { runScenario } from '../services/api';
import {
    PageHeader, Card, SectionHeader, Loading, ErrorState,
} from '../components/ui';
import { formatCompact } from '../utils/format';

const LEVERS = [
    { key: 'enrollment_change', label: 'Enrollment', min: -50, max: 50, hint: 'Student enrolment' },
    { key: 'fee_change', label: 'Fee Structure', min: -30, max: 30, hint: 'Tuition fee level' },
    { key: 'grant_change', label: 'Research Grants', min: -100, max: 100, hint: 'Grant income' },
    { key: 'salary_change', label: 'Salary Expense', min: -20, max: 20, hint: 'Faculty & staff salaries' },
];

const PRESETS = [
    { name: 'Enrollment growth', values: { enrollment_change: 15, fee_change: 0, grant_change: 0, salary_change: 5 } },
    { name: 'Fee revision', values: { enrollment_change: 0, fee_change: 10, grant_change: 0, salary_change: 0 } },
    { name: 'Grant shortfall', values: { enrollment_change: 0, fee_change: 0, grant_change: -40, salary_change: 8 } },
];

const ZERO = { enrollment_change: 0, fee_change: 0, grant_change: 0, salary_change: 0 };

const Scenario = () => {
    const [params, setParams] = useState(ZERO);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const run = async (p = params) => {
        setLoading(true);
        setError(false);
        try {
            setResult(await runScenario(p));
        } catch (e) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { run(ZERO); }, []);

    const apply = (values) => { setParams(values); run(values); };

    const chartData = result
        ? [
              { name: 'Revenue', Baseline: result.baseline.total_revenue, Projected: result.projected.total_revenue },
              { name: 'Expenses', Baseline: result.baseline.total_expenses, Projected: result.projected.total_expenses },
              { name: 'Surplus', Baseline: result.baseline.net_surplus, Projected: result.projected.net_surplus },
          ]
        : [];

    const up = result && result.impact.surplus_change >= 0;

    return (
        <>
            <PageHeader
                title="Scenario Analysis"
                subtitle="Model enrolment, fee, grant and salary changes on net surplus"
            >
                <button className="btn-secondary" onClick={() => apply(ZERO)}>
                    <RotateCcw size={14} /> Reset
                </button>
            </PageHeader>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                {/* Levers */}
                <Card className="lg:col-span-2">
                    <SectionHeader title="Assumptions" subtitle="Adjust and re-run the simulation" action={<SlidersHorizontal size={16} className="text-ink-300" />} />
                    <div className="space-y-5">
                        {LEVERS.map((l) => (
                            <div key={l.key}>
                                <div className="flex items-baseline justify-between">
                                    <div>
                                        <span className="text-[13px] font-medium text-ink-700">{l.label}</span>
                                        <span className="ml-2 text-[11.5px] text-ink-400">{l.hint}</span>
                                    </div>
                                    <span className={`tnum text-[13px] font-semibold ${params[l.key] > 0 ? 'text-positive-600' : params[l.key] < 0 ? 'text-negative-600' : 'text-ink-400'}`}>
                                        {params[l.key] > 0 ? '+' : ''}{params[l.key]}%
                                    </span>
                                </div>
                                <input
                                    type="range" min={l.min} max={l.max} value={params[l.key]}
                                    onChange={(e) => setParams((p) => ({ ...p, [l.key]: parseInt(e.target.value, 10) }))}
                                    onMouseUp={() => run()} onTouchEnd={() => run()}
                                    className="mt-2 w-full"
                                />
                                <div className="flex justify-between text-[10.5px] text-ink-300">
                                    <span>{l.min}%</span><span>0</span><span>+{l.max}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 border-t border-ink-100 pt-4">
                        <p className="eyebrow mb-2">Quick scenarios</p>
                        <div className="flex flex-wrap gap-2">
                            {PRESETS.map((p) => (
                                <button key={p.name} onClick={() => apply(p.values)} className="rounded-full border border-ink-200 bg-surface px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:border-ink-300 hover:bg-ink-50">
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Results */}
                <div className="lg:col-span-3">
                    {loading ? (
                        <Card><Loading label="Running simulation…" /></Card>
                    ) : error ? (
                        <ErrorState onRetry={() => run()} />
                    ) : result && (
                        <div className="space-y-4">
                            {/* Headline impact */}
                            <Card className={up ? 'border-positive-500/30' : 'border-negative-500/30'}>
                                <div className="flex items-center gap-4">
                                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${up ? 'bg-positive-50 text-positive-600' : 'bg-negative-50 text-negative-600'}`}>
                                        {up ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-semibold text-ink-900">{result.impact.summary}</p>
                                        <p className="text-[13px] text-ink-500 mt-0.5">
                                            Projected margin {result.projected.margin_pct}%
                                            <span className="text-ink-400"> (from {result.baseline.margin_pct}%)</span>
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* Impact deltas */}
                            <div className="grid grid-cols-3 gap-4">
                                <ImpactCard label="Revenue Δ" value={result.impact.revenue_change} />
                                <ImpactCard label="Expense Δ" value={result.impact.expense_change} invert />
                                <ImpactCard label="Surplus Δ" value={result.impact.surplus_change} />
                            </div>

                            {/* Comparison chart */}
                            <Card>
                                <SectionHeader title="Baseline vs Projected" />
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                        <BarChart data={chartData} margin={{ left: -6, right: 6 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f4" />
                                            <XAxis dataKey="name" tick={{ fill: '#4a5563', fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <YAxis tickFormatter={(v) => formatCompact(v, false)} tick={{ fill: '#94a0ae', fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                                            <Tooltip formatter={(v) => formatCompact(v)} contentStyle={{ borderRadius: 10, border: '1px solid #e6e9ee', fontSize: 12 }} cursor={{ fill: '#f6f7f9' }} />
                                            <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                                            <Bar dataKey="Baseline" fill="#cbd2da" radius={[4, 4, 0, 0]} barSize={26} />
                                            <Bar dataKey="Projected" fill="#a81f2a" radius={[4, 4, 0, 0]} barSize={26} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

const ImpactCard = ({ label, value, invert = false }) => {
    // For expenses, a decrease is favourable (invert the colour logic).
    const favourable = invert ? value <= 0 : value >= 0;
    return (
        <Card>
            <p className="eyebrow">{label}</p>
            <p className={`tnum mt-2 text-[18px] font-semibold ${favourable ? 'text-positive-600' : 'text-negative-600'}`}>
                {value >= 0 ? '+' : ''}{formatCompact(value)}
            </p>
        </Card>
    );
};

export default Scenario;
