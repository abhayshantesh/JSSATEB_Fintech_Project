import React, { useEffect, useState, useRef } from 'react';
import { fetchQuarterlyReport } from '../services/api';
import {
    FileText, Download, Printer, TrendingUp, TrendingDown,
    DollarSign, Users, Building, Calendar, CheckCircle, AlertCircle
} from 'lucide-react';
import { formatIndianNumber } from '../utils/formatUtils';

const Reports = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const reportRef = useRef(null);

    useEffect(() => {
        const loadReport = async () => {
            try {
                const data = await fetchQuarterlyReport();
                setReport(data);
            } catch (error) {
                console.error("Failed to load report:", error);
            } finally {
                setLoading(false);
            }
        };
        loadReport();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-600">Failed to generate report. Please try again.</p>
            </div>
        );
    }

    const { report_metadata, financial_summary, revenue_breakdown, expense_breakdown,
        budget_analysis, balance_sheet, institutional_metrics, key_performance_indicators } = report;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Financial Reports</h1>
                    <p className="text-slate-500">Quarterly health reports for audits and accreditation</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Print / Export PDF
                    </button>
                </div>
            </div>

            {/* Report Content */}
            <div ref={reportRef} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-0">
                {/* Report Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white print:bg-indigo-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold">{report_metadata.institution}</h2>
                            <p className="text-indigo-100 text-lg mt-1">Quarterly Financial Health Report</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center text-indigo-100">
                                <Calendar className="w-5 h-5 mr-2" />
                                <span>{report_metadata.fiscal_year} • {report_metadata.quarter}</span>
                            </div>
                            <p className="text-sm text-indigo-200 mt-1">
                                Generated: {new Date(report_metadata.generated_at).toLocaleDateString('en-IN')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Financial Health Score */}
                <div className="p-6 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Overall Financial Health Score</p>
                            <p className="text-5xl font-bold text-slate-900 mt-2">
                                {key_performance_indicators.financial_health_score}
                                <span className="text-2xl text-slate-500">/100</span>
                            </p>
                        </div>
                        <div className={`p-4 rounded-full ${key_performance_indicators.financial_health_score >= 70 ? 'bg-emerald-100' : key_performance_indicators.financial_health_score >= 50 ? 'bg-amber-100' : 'bg-rose-100'}`}>
                            {key_performance_indicators.financial_health_score >= 70 ? (
                                <CheckCircle className="w-12 h-12 text-emerald-600" />
                            ) : (
                                <AlertCircle className={`w-12 h-12 ${key_performance_indicators.financial_health_score >= 50 ? 'text-amber-600' : 'text-rose-600'}`} />
                            )}
                        </div>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-200">
                    <KPICard
                        label="Operating Margin"
                        value={`${financial_summary.operating_margin_percent}%`}
                        positive={financial_summary.operating_margin_percent > 0}
                    />
                    <KPICard
                        label="Budget Utilization"
                        value={`${key_performance_indicators.budget_utilization_percent}%`}
                        positive={key_performance_indicators.budget_utilization_percent <= 100}
                    />
                    <KPICard
                        label="Salary/Revenue"
                        value={`${key_performance_indicators.salary_to_revenue_percent}%`}
                        positive={key_performance_indicators.salary_to_revenue_percent < 60}
                    />
                    <KPICard
                        label="Surplus Ratio"
                        value={`${key_performance_indicators.surplus_ratio_percent}%`}
                        positive={key_performance_indicators.surplus_ratio_percent > 0}
                    />
                </div>

                {/* Financial Summary */}
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-indigo-600" />
                        Financial Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SummaryCard
                            title="Total Revenue"
                            value={formatIndianNumber(financial_summary.total_revenue, { currency: true, decimals: 0 })}
                            icon={TrendingUp}
                            color="emerald"
                        />
                        <SummaryCard
                            title="Total Expenses"
                            value={formatIndianNumber(financial_summary.total_expenses, { currency: true, decimals: 0 })}
                            icon={TrendingDown}
                            color="rose"
                        />
                        <SummaryCard
                            title="Net Surplus"
                            value={formatIndianNumber(financial_summary.net_surplus, { currency: true, decimals: 0 })}
                            icon={DollarSign}
                            color={financial_summary.net_surplus >= 0 ? "indigo" : "rose"}
                        />
                    </div>
                </div>

                {/* Revenue & Expense Breakdown */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-200">
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-3">Revenue Breakdown</h4>
                        <div className="space-y-2">
                            {revenue_breakdown.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-slate-600">{item.category}</span>
                                    <span className="font-medium text-emerald-600">{formatIndianNumber(item.amount, { currency: true, decimals: 0 })}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-3">Expense Breakdown</h4>
                        <div className="space-y-2">
                            {expense_breakdown.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-slate-600">{item.category}</span>
                                    <span className="font-medium text-rose-600">{formatIndianNumber(item.amount, { currency: true, decimals: 0 })}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Balance Sheet */}
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <Building className="w-5 h-5 mr-2 text-indigo-600" />
                        Balance Sheet Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <p className="text-sm text-slate-500">Total Assets</p>
                            <p className="text-xl font-bold text-slate-800">{formatIndianNumber(balance_sheet.total_assets, { currency: true, decimals: 0 })}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <p className="text-sm text-slate-500">Total Liabilities</p>
                            <p className="text-xl font-bold text-rose-600">{formatIndianNumber(balance_sheet.total_liabilities, { currency: true, decimals: 0 })}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <p className="text-sm text-slate-500">Net Worth</p>
                            <p className={`text-xl font-bold ${balance_sheet.net_worth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatIndianNumber(balance_sheet.net_worth, { currency: true, decimals: 0 })}
                            </p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <p className="text-sm text-slate-500">Liquidity Ratio</p>
                            <p className="text-xl font-bold text-indigo-600">{balance_sheet.liquidity_ratio}</p>
                        </div>
                    </div>
                </div>

                {/* Institutional Metrics */}
                <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-indigo-600" />
                        Institutional Metrics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-indigo-50 rounded-lg">
                            <p className="text-3xl font-bold text-indigo-600">{institutional_metrics.student_count}</p>
                            <p className="text-sm text-slate-600 mt-1">Active Students</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-3xl font-bold text-purple-600">{institutional_metrics.faculty_count}</p>
                            <p className="text-sm text-slate-600 mt-1">Faculty Members</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-3xl font-bold text-blue-600">{institutional_metrics.department_count}</p>
                            <p className="text-sm text-slate-600 mt-1">Departments</p>
                        </div>
                        <div className="text-center p-4 bg-emerald-50 rounded-lg">
                            <p className="text-3xl font-bold text-emerald-600">{institutional_metrics.student_faculty_ratio}:1</p>
                            <p className="text-sm text-slate-600 mt-1">Student:Faculty</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-100 text-center text-sm text-slate-500 print:bg-white">
                    <p>This report is auto-generated for institutional audit and accreditation purposes (NBA/NAAC).</p>
                    <p className="mt-1">© {new Date().getFullYear()} JSSATEB Financial Analytics System</p>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ label, value, positive }) => (
    <div className={`p-4 rounded-lg ${positive ? 'bg-emerald-50' : 'bg-amber-50'}`}>
        <p className="text-xs font-medium text-slate-600">{label}</p>
        <p className={`text-xl font-bold ${positive ? 'text-emerald-600' : 'text-amber-600'}`}>{value}</p>
    </div>
);

const SummaryCard = ({ title, value, icon: Icon, color }) => {
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-600',
        rose: 'bg-rose-50 text-rose-600',
        indigo: 'bg-indigo-50 text-indigo-600',
    };

    return (
        <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500">{title}</p>
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <p className={`text-2xl font-bold ${color === 'rose' ? 'text-rose-600' : color === 'emerald' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                {value}
            </p>
        </div>
    );
};

export default Reports;
