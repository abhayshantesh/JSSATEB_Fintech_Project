
import React, { useEffect, useState } from 'react';
import {
    fetchAssets,
    fetchLiabilities,
    fetchFinancialPosition
} from '../services/api';
import {
    TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUp, ArrowDown
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatIndianNumber } from '../utils/formatUtils';

const FinancialPosition = () => {
    const [assets, setAssets] = useState([]);
    const [liabilities, setLiabilities] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [assetsData, liabilitiesData, summaryData] = await Promise.all([
                    fetchAssets(),
                    fetchLiabilities(),
                    fetchFinancialPosition()
                ]);
                setAssets(assetsData);
                setLiabilities(liabilitiesData);
                setSummary(summaryData);
            } catch (error) {
                console.error("Failed to load financial position data:", error);
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
                    <h1 className="text-2xl font-bold text-slate-800">Financial Position</h1>
                    <p className="text-slate-500">Balance Sheet Overview: Assets vs Liabilities</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard
                    title="Total Assets"
                    value={summary?.total_assets}
                    icon={TrendingUp}
                    color="indigo"
                    subtext="Total institutional assets"
                />
                <SummaryCard
                    title="Total Liabilities"
                    value={summary?.total_liabilities}
                    icon={TrendingDown}
                    color="red"
                    subtext="Total outstanding obligations"
                />
                <SummaryCard
                    title="Net Worth"
                    value={summary?.net_worth}
                    icon={DollarSign}
                    color={summary?.net_worth >= 0 ? "emerald" : "red"}
                    subtext="Assets - Liabilities"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assets Table */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Assets</h3>
                        <span className="text-sm px-2 py-1 rounded bg-indigo-50 text-indigo-600 font-medium">
                            {assets.length} items
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Name</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map((asset) => (
                                    <tr key={asset.asset_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{asset.name}</td>
                                        <td className="px-4 py-3">{asset.type}</td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                                            {formatIndianNumber(asset.value, { currency: true })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Liabilities Table */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Liabilities</h3>
                        <span className="text-sm px-2 py-1 rounded bg-red-50 text-red-600 font-medium">
                            {liabilities.length} items
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Name</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {liabilities.map((liability) => (
                                    <tr key={liability.liability_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{liability.name}</td>
                                        <td className="px-4 py-3">{liability.type}</td>
                                        <td className="px-4 py-3 text-right font-medium text-red-600">
                                            {formatIndianNumber(liability.amount, { currency: true })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ title, value, icon: Icon, color, subtext }) => {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
    };

    return (
        <div className="card">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-2">
                        {formatIndianNumber(value, { currency: true, decimals: 0 })}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{subtext}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
};

export default FinancialPosition;
