
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, Wallet, Activity, ArrowUpRight
} from 'lucide-react';
import { fetchDashboardMetrics, fetchMonthlyTrends, fetchDashboardStats } from '../services/api';
import { formatIndianNumber, formatIndianNumberCompact } from '../utils/formatUtils';

const Dashboard = () => {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState(null);
    const [trends, setTrends] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [metricsData, trendsData, statsData] = await Promise.all([
                    fetchDashboardMetrics(),
                    fetchMonthlyTrends(12),
                    fetchDashboardStats()
                ]);
                setMetrics(metricsData);
                setTrends(trendsData);
                setStats(statsData);
            } catch (error) {
                console.error("Failed to load dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Financial Overview</h1>
                    <p className="text-slate-500">Welcome back, here's what's happening today.</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => navigate('/reports')}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Export Report
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
                        Analysis Mode
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Revenue"
                    value={metrics?.total_revenue}
                    icon={DollarSign}
                    trend={`+${stats?.revenue_growth}%`}
                    color="indigo"
                />
                <KPICard
                    title="Total Expenses"
                    value={metrics?.total_expenses}
                    icon={Wallet}
                    trend={`+${stats?.expense_growth}%`}
                    color="amber"
                    isCurrency
                />
                <KPICard
                    title="Net Surplus"
                    value={metrics?.net_surplus}
                    icon={TrendingUp}
                    trend={stats?.operating_margin > 0 ? "Positive" : "Negative"}
                    color="emerald"
                    isCurrency
                />
                <KPICard
                    title="Salary Exp. Ratio"
                    value={`${((metrics?.salary_expense / metrics?.total_expenses) * 100 || 0).toFixed(1)}%`}
                    icon={Activity}
                    trend={stats?.budget_utilization > 90 ? "High" : "Normal"}
                    color="blue"
                    isCurrency={false}
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Trend Chart */}
                <div className="lg:col-span-2 card">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Revenue vs Expenses (Last 12 Months)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => formatIndianNumberCompact(value)} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [formatIndianNumber(value, { currency: true }), undefined]}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                                <Area type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" name="Expenses" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Stats / Distribution */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-slate-600">Operating Margin</span>
                                <span className="text-sm font-bold text-emerald-600">{stats?.operating_margin}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(stats?.operating_margin || 0, 100)}%` }}></div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-slate-600">Budget Utilization</span>
                                <span className="text-sm font-bold text-indigo-600">{stats?.budget_utilization}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(stats?.budget_utilization || 0, 100)}%` }}></div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-slate-600">Cash Flow Stability</span>
                                <span className="text-sm font-bold text-amber-600">{stats?.cash_flow_stability}/100</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${stats?.cash_flow_stability || 0}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ title, value, icon: Icon, trend, color, isCurrency = true }) => {
    const formattedValue = isCurrency && typeof value === 'number'
        ? formatIndianNumber(value, { currency: true, decimals: 0 })
        : value || '-';

    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        blue: 'bg-blue-50 text-blue-600',
        red: 'bg-red-50 text-red-600',
    };

    return (
        <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
                <div className="flex items-center space-x-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <ArrowUpRight size={14} />
                    <span>{trend}</span>
                </div>
            </div>
            <div>
                <h3 className="text-sm font-medium text-slate-500">{title}</h3>
                <p className="text-2xl font-bold text-slate-800 mt-1">{formattedValue}</p>
            </div>
        </div>
    );
};

export default Dashboard;
