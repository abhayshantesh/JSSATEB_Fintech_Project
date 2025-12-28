import React, { useEffect, useState } from 'react';
import { getAnomalies } from '../services/api';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatIndianNumber } from '../utils/formatUtils';

const Anomalies = () => {
    const [anomalyData, setAnomalyData] = useState({ anomalies: [], total_count: 0 });
    const [loading, setLoading] = useState(true);
    const [threshold, setThreshold] = useState(2.0);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getAnomalies(threshold);
                setAnomalyData(data);
            } catch (error) {
                console.error("Failed to fetch anomalies", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [threshold]);

    const getSeverityColor = (severity) => {
        return severity === 'high' ? 'text-danger bg-danger/20' : 'text-warning bg-warning/20';
    };

    const getTypeIcon = (type) => {
        if (type.includes('high')) {
            return <TrendingUp className="w-4 h-4" />;
        }
        return <TrendingDown className="w-4 h-4" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Anomaly Detection</h2>
                <div className="flex items-center space-x-4">
                    <label className="text-slate-600 text-sm font-medium">Sensitivity:</label>
                    <select
                        value={threshold}
                        onChange={(e) => setThreshold(parseFloat(e.target.value))}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    >
                        <option value={1.5}>High (1.5σ)</option>
                        <option value={2.0}>Medium (2σ)</option>
                        <option value={2.5}>Low (2.5σ)</option>
                        <option value={3.0}>Very Low (3σ)</option>
                    </select>
                </div>
            </div>

            {/* Summary Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-warning/20 mr-4">
                            <AlertTriangle className="w-8 h-8 text-warning" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Detected Anomalies</p>
                            <p className="text-3xl font-bold text-slate-900">{anomalyData.total_count}</p>
                        </div>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                        <p>Using Z-score threshold: {threshold}σ</p>
                        <p>Showing top {anomalyData.anomalies.length} results</p>
                    </div>
                </div>
            </div>

            {/* Anomalies List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700">
                        <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">Severity</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Transaction ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {anomalyData.anomalies.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(item.severity)}`}>
                                            {item.severity.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{item.txn_date}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center">
                                            {getTypeIcon(item.anomaly_type)}
                                            <span className="ml-2">{item.anomaly_type.replace(/_/g, ' ')}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">{item.category}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        {formatIndianNumber(item.amount, { currency: true, decimals: 2 })}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs">{item.txn_id.slice(0, 12)}...</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {anomalyData.anomalies.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No anomalies detected at current sensitivity level.</p>
                            <p className="text-sm">Try increasing sensitivity to detect more variations.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Anomalies;
