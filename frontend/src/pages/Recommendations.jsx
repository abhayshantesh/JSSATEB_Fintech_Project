import React, { useEffect, useState } from 'react';
import { getRecommendations } from '../services/api';
import { Lightbulb, AlertTriangle, CheckCircle, ArrowRight, TrendingUp, Zap, DollarSign, Users } from 'lucide-react';
import { formatIndianNumber } from '../utils/formatUtils';

const Recommendations = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getRecommendations();
                setData(result);
            } catch (error) {
                console.error("Failed to fetch recommendations", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'high':
                return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'medium':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'low':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getCategoryIcon = (category) => {
        if (category.toLowerCase().includes('salary')) return Users;
        if (category.toLowerCase().includes('energy') || category.toLowerCase().includes('utility')) return Zap;
        if (category.toLowerCase().includes('revenue')) return TrendingUp;
        if (category.toLowerCase().includes('budget')) return DollarSign;
        return Lightbulb;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
        );
    }

    const recommendations = data?.recommendations || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Financial Recommendations</h2>
                <p className="text-slate-500 text-sm">AI-generated insights for optimization</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
                    <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-rose-600" />
                        <span className="text-sm font-medium text-rose-700">High Priority</span>
                    </div>
                    <p className="text-2xl font-bold text-rose-800 mt-2">
                        {recommendations.filter(r => r.priority === 'high').length}
                    </p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <div className="flex items-center">
                        <Lightbulb className="w-5 h-5 mr-2 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">Medium Priority</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-800 mt-2">
                        {recommendations.filter(r => r.priority === 'medium').length}
                    </p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                    <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">Low Priority</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-800 mt-2">
                        {recommendations.filter(r => r.priority === 'low').length}
                    </p>
                </div>
            </div>

            {/* Recommendations List */}
            {recommendations.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center">
                    <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">All Good!</h3>
                    <p className="text-slate-500">No critical recommendations at this time. Financial health is optimal.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {recommendations.map((rec, idx) => {
                        const Icon = getCategoryIcon(rec.category);
                        return (
                            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start">
                                        <div className={`p-3 rounded-lg mr-4 ${getPriorityStyle(rec.priority).replace('text-', 'bg-').split(' ')[0]}/20`}>
                                            <Icon className={`w-6 h-6 ${getPriorityStyle(rec.priority).split(' ')[1]}`} />
                                        </div>
                                        <div>
                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getPriorityStyle(rec.priority)}`}>
                                                {rec.priority.toUpperCase()} PRIORITY
                                            </span>
                                            <h3 className="text-lg font-bold text-slate-900">{rec.title}</h3>
                                            <p className="text-sm text-slate-500 mt-1">{rec.category}</p>
                                        </div>
                                    </div>
                                    {rec.potential_savings && (
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">Potential Savings</p>
                                            <p className="text-lg font-bold text-emerald-600">{formatIndianNumber(rec.potential_savings, { currency: true, decimals: 0 })}</p>
                                        </div>
                                    )}
                                </div>

                                <p className="text-slate-600 mb-4">{rec.description}</p>

                                <div className="bg-slate-50 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-slate-700 mb-2">Recommended Actions:</p>
                                    <ul className="space-y-2">
                                        {rec.action_items.map((item, i) => (
                                            <li key={i} className="flex items-start text-sm text-slate-600">
                                                <ArrowRight className="w-4 h-4 mr-2 text-accent flex-shrink-0 mt-0.5" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer Note */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> These recommendations are generated based on current financial data and industry best practices.
                    Review with your finance committee before implementation.
                </p>
            </div>
        </div>
    );
};

export default Recommendations;
