import React, { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getRevenueForecast, getExpenseForecast } from '../services/api';
import { TrendingUp } from 'lucide-react';
import { formatIndianNumber, formatIndianNumberCompact } from '../utils/formatUtils';

const Forecast = () => {
    const [revForecast, setRevForecast] = useState([]);
    const [expForecast, setExpForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [months, setMonths] = useState(12);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [rev, exp] = await Promise.all([
                    getRevenueForecast(months),
                    getExpenseForecast(months)
                ]);
                setRevForecast(rev);
                setExpForecast(exp);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [months]);

    // Merge data for combined chart
    const mergedData = revForecast.map((r, idx) => ({
        date: r.date,
        revenue: r.predicted_amount,
        expenses: expForecast[idx]?.predicted_amount || 0,
        surplus: r.predicted_amount - (expForecast[idx]?.predicted_amount || 0)
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Financial Forecasts</h2>
                <div className="flex items-center space-x-4">
                    <label className="text-slate-600 text-sm font-medium">Forecast Period:</label>
                    <select
                        value={months}
                        onChange={(e) => setMonths(parseInt(e.target.value))}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    >
                        <option value={6}>6 Months</option>
                        <option value={12}>12 Months</option>
                        <option value={24}>24 Months</option>
                        <option value={36}>36 Months</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
                </div>
            ) : (
                <>
                    {/* Combined Forecast Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Projected Revenue vs Expenses</h3>
                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={mergedData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => formatIndianNumberCompact(val)} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#1e293b' }}
                                        formatter={(value) => [formatIndianNumber(value, { currency: true }), '']}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Predicted Revenue"
                                        stroke="#22c55e"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="expenses"
                                        name="Predicted Expenses"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="surplus"
                                        name="Projected Surplus"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 text-sm font-medium mb-2">Total Projected Revenue</p>
                            <p className="text-2xl font-bold text-success">
                                {formatIndianNumber(mergedData.reduce((a, b) => a + b.revenue, 0), { currency: true })}
                            </p>
                            <p className="text-slate-400 text-sm mt-2">Over {months} months</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 text-sm font-medium mb-2">Total Projected Expenses</p>
                            <p className="text-2xl font-bold text-danger">
                                {formatIndianNumber(mergedData.reduce((a, b) => a + b.expenses, 0), { currency: true })}
                            </p>
                            <p className="text-slate-400 text-sm mt-2">Over {months} months</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 text-sm font-medium mb-2">Projected Net Surplus</p>
                            <p className={`text-2xl font-bold ${mergedData.reduce((a, b) => a + b.surplus, 0) >= 0 ? 'text-purple-500' : 'text-danger'}`}>
                                {formatIndianNumber(mergedData.reduce((a, b) => a + b.surplus, 0), { currency: true })}
                            </p>
                            <p className="text-slate-400 text-sm mt-2">Over {months} months</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Forecast;
