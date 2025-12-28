import React, { useEffect, useState } from 'react';
import { fetchCorrelations, fetchFinancialHealth } from '../services/api';
import { Activity, TrendingUp, Users, Zap, DollarSign, BookOpen } from 'lucide-react';

const Correlations = () => {
    const [correlations, setCorrelations] = useState({});
    const [healthData, setHealthData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [corrData, healthResult] = await Promise.all([
                    fetchCorrelations(),
                    fetchFinancialHealth()
                ]);
                setCorrelations(corrData.correlations || {});
                setHealthData(healthResult);
            } catch (error) {
                console.error("Failed to load correlation data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // SRS 6.3 Required Correlations
    const correlationPairs = [
        { key: 'student_revenue', label: 'Student Count ↔ Revenue', icon: Users, description: 'How enrollment impacts total revenue' },
        { key: 'faculty_salary', label: 'Faculty Count ↔ Salary Expenses', icon: BookOpen, description: 'Relationship between staff size and payroll' },
        { key: 'utility_students', label: 'Utility Cost ↔ Student Count', icon: Zap, description: 'Infrastructure costs relative to enrollment' },
        { key: 'budget_utilization', label: 'Budget Allocated ↔ Spent', icon: DollarSign, description: 'Budget planning accuracy' },
        { key: 'grants_revenue', label: 'Research Grants ↔ Revenue', icon: TrendingUp, description: 'Grant contribution to total income' },
        { key: 'liability_surplus', label: 'Liability ↔ Net Surplus', icon: Activity, description: 'Debt impact on financial health' },
    ];

    const getCorrelationColor = (value) => {
        if (value === undefined || value === null) return 'bg-slate-100 text-slate-400';
        if (value >= 0.7) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (value >= 0.4) return 'bg-blue-100 text-blue-700 border-blue-200';
        if (value >= 0) return 'bg-amber-100 text-amber-700 border-amber-200';
        if (value >= -0.4) return 'bg-orange-100 text-orange-700 border-orange-200';
        return 'bg-rose-100 text-rose-700 border-rose-200';
    };

    const getCorrelationStrength = (value) => {
        if (value === undefined || value === null) return 'N/A';
        const abs = Math.abs(value);
        if (abs >= 0.7) return 'Strong';
        if (abs >= 0.4) return 'Moderate';
        if (abs >= 0.2) return 'Weak';
        return 'Very Weak';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Correlation Analysis</h1>
                <p className="text-slate-500">Exploratory Data Analysis - Identifying relationships between financial metrics</p>
            </div>

            {/* Financial Health Summary */}
            {healthData && (
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium">Financial Health Index</p>
                            <h2 className="text-4xl font-bold mt-1">{healthData.overall_score?.toFixed(1) || 0}/100</h2>
                            <p className="text-indigo-200 mt-2">{healthData.health_status || 'Calculating...'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-white/10 p-3 rounded-lg">
                                <p className="text-indigo-200">Surplus Ratio</p>
                                <p className="font-bold">{(healthData.surplus_ratio * 100)?.toFixed(1) || 0}%</p>
                            </div>
                            <div className="bg-white/10 p-3 rounded-lg">
                                <p className="text-indigo-200">Liquidity</p>
                                <p className="font-bold">{healthData.liquidity_index?.toFixed(2) || 0}</p>
                            </div>
                            <div className="bg-white/10 p-3 rounded-lg">
                                <p className="text-indigo-200">Expense Dev.</p>
                                <p className="font-bold">{(healthData.expense_deviation * 100)?.toFixed(1) || 0}%</p>
                            </div>
                            <div className="bg-white/10 p-3 rounded-lg">
                                <p className="text-indigo-200">Salary/Rev</p>
                                <p className="font-bold">{(healthData.salary_to_revenue_ratio * 100)?.toFixed(1) || 0}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Correlation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {correlationPairs.map((pair) => {
                    const value = correlations[pair.key];
                    const Icon = pair.icon;
                    return (
                        <div key={pair.key} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-lg bg-slate-100">
                                    <Icon className="w-6 h-6 text-slate-600" />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCorrelationColor(value)}`}>
                                    {getCorrelationStrength(value)}
                                </span>
                            </div>
                            <h3 className="font-semibold text-slate-800 mb-1">{pair.label}</h3>
                            <p className="text-sm text-slate-500 mb-4">{pair.description}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-slate-900">
                                    {value !== undefined ? value.toFixed(3) : 'N/A'}
                                </span>
                                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${value >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                        style={{
                                            width: `${Math.abs(value || 0) * 100}%`,
                                            marginLeft: value < 0 ? 'auto' : 0
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Correlation Matrix */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Correlation Matrix</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="px-4 py-3 text-left font-medium text-slate-600">Metric Pair</th>
                                <th className="px-4 py-3 text-center font-medium text-slate-600">Correlation</th>
                                <th className="px-4 py-3 text-center font-medium text-slate-600">Strength</th>
                                <th className="px-4 py-3 text-left font-medium text-slate-600">Interpretation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(correlations).map(([key, value]) => (
                                <tr key={key} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-800">
                                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getCorrelationColor(value)}`}>
                                            {value?.toFixed(3) || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-600">
                                        {getCorrelationStrength(value)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">
                                        {value > 0 ? 'Positive relationship' : value < 0 ? 'Inverse relationship' : 'No correlation'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-600 mb-3 font-medium">Correlation Strength Legend</p>
                <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">Strong (≥0.7)</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">Moderate (0.4-0.7)</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">Weak (0-0.4)</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">Negative Weak</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200">Negative Strong</span>
                </div>
            </div>
        </div>
    );
};

export default Correlations;
