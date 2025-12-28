import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { getScenarioAnalysis } from '../services/api';
import { Calculator, TrendingUp, TrendingDown, RefreshCw, Lightbulb } from 'lucide-react';
import { formatIndianNumber, formatIndianNumberCompact } from '../utils/formatUtils';

const ScenarioAnalysis = () => {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [params, setParams] = useState({
        enrollment_change: 0,
        fee_change: 0,
        grant_change: 0,
        salary_change: 0
    });

    const fetchScenario = async () => {
        setLoading(true);
        try {
            const data = await getScenarioAnalysis(params);
            setResult(data);
        } catch (error) {
            console.error("Failed to fetch scenario", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScenario();
    }, []);

    const handleParamChange = (key, value) => {
        setParams(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
    };

    const handleReset = () => {
        setParams({
            enrollment_change: 0,
            fee_change: 0,
            grant_change: 0,
            salary_change: 0
        });
    };

    const comparisonData = result ? [
        { name: 'Revenue', baseline: result.baseline.total_revenue, projected: result.projected.total_revenue },
        { name: 'Expenses', baseline: result.baseline.total_expenses, projected: result.projected.total_expenses },
        { name: 'Surplus', baseline: result.baseline.net_surplus, projected: result.projected.net_surplus }
    ] : [];

    const sliderConfig = [
        { key: 'enrollment_change', label: 'Enrollment Change', min: -50, max: 50, unit: '%', color: 'accent' },
        { key: 'fee_change', label: 'Fee Structure Change', min: -30, max: 30, unit: '%', color: 'blue-500' },
        { key: 'grant_change', label: 'Grant/Donation Change', min: -100, max: 100, unit: '%', color: 'purple-500' },
        { key: 'salary_change', label: 'Salary Expense Change', min: -20, max: 20, unit: '%', color: 'orange-500' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Scenario Analysis</h2>
                <p className="text-slate-500 text-sm">What-if financial simulations</p>
            </div>

            {/* Parameter Controls */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center">
                        <Lightbulb className="w-5 h-5 mr-2 text-amber-500" />
                        Scenario Parameters
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" /> Reset
                        </button>
                        <button
                            onClick={fetchScenario}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors flex items-center disabled:opacity-50"
                        >
                            <Calculator className="w-4 h-4 mr-2" /> Simulate
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sliderConfig.map((config) => (
                        <div key={config.key} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-slate-700">{config.label}</label>
                                <span className={`text-sm font-bold ${params[config.key] > 0 ? 'text-emerald-600' : params[config.key] < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                    {params[config.key] > 0 ? '+' : ''}{params[config.key]}{config.unit}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={config.min}
                                max={config.max}
                                value={params[config.key]}
                                onChange={(e) => handleParamChange(config.key, e.target.value)}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-accent"
                            />
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>{config.min}{config.unit}</span>
                                <span>0{config.unit}</span>
                                <span>+{config.max}{config.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
                </div>
            ) : result && (
                <>
                    {/* Impact Summary */}
                    <div className={`p-6 rounded-xl border shadow-sm ${result.impact.surplus_change >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                        <div className="flex items-center">
                            {result.impact.surplus_change >= 0 ? (
                                <TrendingUp className="w-8 h-8 mr-4 text-emerald-600" />
                            ) : (
                                <TrendingDown className="w-8 h-8 mr-4 text-rose-600" />
                            )}
                            <div>
                                <p className={`text-lg font-bold ${result.impact.surplus_change >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                                    {result.impact.impact_summary}
                                </p>
                                <p className="text-sm text-slate-600 mt-1">
                                    Projected surplus: {formatIndianNumber(result.impact.projected_surplus, { currency: true, decimals: 0 })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Comparison Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Baseline vs Projected Comparison</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis type="number" stroke="#64748b" tickFormatter={(v) => formatIndianNumberCompact(v)} />
                                    <YAxis type="category" dataKey="name" stroke="#64748b" width={80} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                                        formatter={(value) => formatIndianNumber(value, { currency: true, decimals: 0 })}
                                    />
                                    <Legend />
                                    <Bar dataKey="baseline" name="Current (Baseline)" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="projected" name="Projected" fill="#990000" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Detailed Numbers */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 text-sm font-medium mb-2">Revenue Change</p>
                            <p className={`text-2xl font-bold ${result.impact.revenue_change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {result.impact.revenue_change >= 0 ? '+' : ''}{formatIndianNumber(result.impact.revenue_change, { currency: true, decimals: 0 })}
                            </p>
                            <p className="text-slate-400 text-sm mt-2">
                                From {formatIndianNumber(result.baseline.total_revenue, { currency: true, decimals: 0 })}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 text-sm font-medium mb-2">Expense Change</p>
                            <p className={`text-2xl font-bold ${result.impact.expense_change <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {result.impact.expense_change >= 0 ? '+' : ''}{formatIndianNumber(result.impact.expense_change, { currency: true, decimals: 0 })}
                            </p>
                            <p className="text-slate-400 text-sm mt-2">
                                From {formatIndianNumber(result.baseline.total_expenses, { currency: true, decimals: 0 })}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 text-sm font-medium mb-2">Surplus Change</p>
                            <p className={`text-2xl font-bold ${result.impact.surplus_change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {result.impact.surplus_change >= 0 ? '+' : ''}{formatIndianNumber(result.impact.surplus_change, { currency: true, decimals: 0 })}
                            </p>
                            <p className="text-slate-400 text-sm mt-2">
                                From {formatIndianNumber(result.baseline.net_surplus, { currency: true, decimals: 0 })}
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ScenarioAnalysis;
