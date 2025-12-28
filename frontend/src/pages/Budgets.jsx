import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getBudgetSummary, getBudgets } from '../services/api';
import { Wallet, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatIndianNumber, formatIndianNumberCompact } from '../utils/formatUtils';

const Budgets = () => {
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getBudgetSummary();
                setSummary(data);
            } catch (error) {
                console.error("Failed to fetch budget data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
        );
    }

    const totalAllocated = summary.reduce((acc, item) => acc + item.allocated, 0);
    const totalSpent = summary.reduce((acc, item) => acc + item.spent, 0);
    const overallUtilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Budget Overview</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Allocated</p>
                            <p className="text-2xl font-bold text-slate-900">{formatIndianNumber(totalAllocated, { currency: true, decimals: 0 })}</p>
                        </div>
                        <Wallet className="w-8 h-8 text-accent" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Spent</p>
                            <p className="text-2xl font-bold text-slate-900">{formatIndianNumber(totalSpent, { currency: true, decimals: 0 })}</p>
                        </div>
                        <Wallet className="w-8 h-8 text-warning" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Overall Utilization</p>
                            <p className={`text-2xl font-bold ${overallUtilization > 100 ? 'text-danger' : 'text-success'}`}>
                                {overallUtilization.toFixed(1)}%
                            </p>
                        </div>
                        {overallUtilization > 100 ? (
                            <AlertTriangle className="w-8 h-8 text-danger" />
                        ) : (
                            <CheckCircle className="w-8 h-8 text-success" />
                        )}
                    </div>
                </div>
            </div>

            {/* Budget Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Allocated vs Spent by Category</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={summary} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" stroke="#64748b" tickFormatter={(v) => formatIndianNumberCompact(v)} />
                            <YAxis type="category" dataKey="category" stroke="#64748b" width={100} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => [formatIndianNumber(value, { currency: true }), '']}
                            />
                            <Legend />
                            <Bar dataKey="allocated" name="Allocated" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="spent" name="Spent" fill="#22c55e" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Budget Table */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Budget Details</h3>
                <table className="w-full text-left text-sm text-slate-700">
                    <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Allocated</th>
                            <th className="px-4 py-3">Spent</th>
                            <th className="px-4 py-3">Remaining</th>
                            <th className="px-4 py-3">Utilization</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summary.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-900">{item.category}</td>
                                <td className="px-4 py-3">{formatIndianNumber(item.allocated, { currency: true, decimals: 0 })}</td>
                                <td className="px-4 py-3">{formatIndianNumber(item.spent, { currency: true, decimals: 0 })}</td>
                                <td className={`px-4 py-3 ${item.allocated - item.spent < 0 ? 'text-danger' : 'text-success'}`}>
                                    {formatIndianNumber(item.allocated - item.spent, { currency: true, decimals: 0 })}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center">
                                        <div className="w-24 bg-slate-200 rounded-full h-2 mr-2">
                                            <div
                                                className={`h-2 rounded-full ${item.utilization > 100 ? 'bg-danger' : 'bg-success'}`}
                                                style={{ width: `${Math.min(item.utilization, 100)}%` }}
                                            ></div>
                                        </div>
                                        <span className={item.utilization > 100 ? 'text-danger' : ''}>
                                            {item.utilization.toFixed(1)}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Budgets;
