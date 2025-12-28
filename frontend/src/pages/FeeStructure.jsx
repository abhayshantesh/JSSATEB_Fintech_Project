import React, { useEffect, useState } from 'react';
import { getFeeStructures } from '../services/api';
import { IndianRupee } from 'lucide-react';
import { formatIndianNumber } from '../utils/formatUtils';

const FeeStructure = () => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('comedk'); // comedk, cet, mgmt, lateral

    useEffect(() => {
        const fetchFees = async () => {
            try {
                // Fetch for a representative year, e.g., 2025-2026 as per user instruction "same for all years"
                const data = await getFeeStructures('2025-2026');
                setFees(data);
            } catch (error) {
                console.error("Failed to fetch fees", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFees();
    }, []);

    // Helper to filter and format data for the tables
    const getFeeData = (type) => {
        // Groups definition based on Image 2/3/4 Logic
        const groups = {
            'A': ['CSE', 'ISE', 'ECE', 'CSE(AIML)', 'R&A'],
            'B': ['EIE'],
            'C': ['ME', 'Civil']
        };

        // Lateral Entry Groups (Image 4)
        const latGroups = {
            'L1': ['CSE', 'ISE', 'CSE (AIML)'],
            'L2': ['ECE'],
            'L3': ['ME', 'R&A'],
            'L4': ['EIE', 'Civil']
        };

        const common = {
            vtu: 10610,
            other: 20000,
            skill: 15000,
            nftw: 25
        };

        // Tuition Values (from Images)
        const tuition = {
            comedk: { 'A': 281100, 'B': 154365, 'C': 81800 },
            cet: { 'A': 81800, 'B': 81800, 'C': 81800 },
            mgmt: { 'A': 281100, 'B': 154365, 'C': 81800 }
        };

        // Lateral Total Fees (Image 4)
        const latTotal = {
            'L1': 132085,
            'L2': 132410,
            'L3': 132735,
            'L4': 132235
        };

        if (type === 'lateral') {
            return [
                { category: 'CSE / ISE / CSE (AIML)', total: latTotal['L1'] },
                { category: 'ECE', total: latTotal['L2'] },
                { category: 'ME / R&A', total: latTotal['L3'] },
                { category: 'EIE / Civil', total: latTotal['L4'] },
            ];
        }

        let tType = type;
        if (type === 'mgmt') tType = 'comedk'; // Same tuition

        return [
            { name: 'Tuition Fee', a: tuition[tType]['A'], b: tuition[tType]['B'], c: tuition[tType]['C'] },
            { name: 'VTU Fee', a: common.vtu, b: common.vtu, c: common.vtu },
            { name: 'Other Fee', a: common.other, b: common.other, c: common.other },
            { name: 'Skill Lab Fee', a: common.skill, b: common.skill, c: common.skill },
            { name: 'NFTW (Flag)', a: common.nftw, b: common.nftw, c: common.nftw },
            {
                name: 'Total', isTotal: true,
                a: tuition[tType]['A'] + common.vtu + common.other + common.skill + common.nftw,
                b: tuition[tType]['B'] + common.vtu + common.other + common.skill + common.nftw,
                c: tuition[tType]['C'] + common.vtu + common.other + common.skill + common.nftw
            }
        ];
    };

    if (loading) {
        return <div className="p-8 text-slate-600 text-center">Loading Fee Structures...</div>;
    }

    const renderTable = (data, isLateral = false) => {
        if (isLateral) {
            return (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-700">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Branch</th>
                                <th className="px-6 py-3 text-right font-semibold">Total Fees per year (in Rs.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr key={idx} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{row.category}</td>
                                    <td className="px-6 py-4 text-right font-mono text-accent font-bold">
                                        {formatIndianNumber(row.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-700">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Particulars</th>
                            <th className="px-6 py-3 text-right font-semibold">CSE / ISE / ECE / CSE(AIML) / R&A</th>
                            <th className="px-6 py-3 text-right font-semibold">EIE</th>
                            <th className="px-6 py-3 text-right font-semibold">Mech. / Civil</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={idx} className={`border-b border-slate-100 transition-colors ${row.isTotal ? 'bg-slate-50 font-bold border-t-2 border-slate-200' : 'hover:bg-slate-50'}`}>
                                <td className={`px-6 py-4 ${row.isTotal ? 'text-slate-900' : 'font-medium text-slate-700'}`}>{row.name}</td>
                                <td className={`px-6 py-4 text-right font-mono ${row.isTotal ? 'text-accent' : ''}`}>
                                    {formatIndianNumber(row.a)}
                                </td>
                                <td className={`px-6 py-4 text-right font-mono ${row.isTotal ? 'text-accent' : ''}`}>
                                    {formatIndianNumber(row.b)}
                                </td>
                                <td className={`px-6 py-4 text-right font-mono ${row.isTotal ? 'text-accent' : ''}`}>
                                    {formatIndianNumber(row.c)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Fee Structure</h2>
                <div className="flex space-x-2 bg-slate-200 p-1 rounded-lg">
                    {['comedk', 'cet', 'mgmt', 'lateral'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab
                                ? 'bg-white text-accent shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                                }`}
                        >
                            {tab === 'comedk' && 'COMED-K'}
                            {tab === 'cet' && 'CET'}
                            {tab === 'mgmt' && 'Management'}
                            {tab === 'lateral' && 'Lateral Entry'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                        {activeTab === 'lateral' ? 'Lateral Entry Fee Structure' : 'Fee Structure'}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {activeTab === 'mgmt' && 'Students admitted under Management Quota'}
                        {activeTab === 'comedk' && 'Students allotted through COMED-K'}
                        {activeTab === 'cet' && 'Students allotted through CET (GM, 2A, 2B, 3A, 3B)'}
                    </p>
                </div>

                {renderTable(getFeeData(activeTab), activeTab === 'lateral')}

                {activeTab === 'cet' && (
                    <div className="p-4 bg-yellow-50 text-xs text-yellow-800 border-t border-yellow-100">
                        * Note: SC/ST/Cat-1 income specific fees are different. SNQ Tuition Fee is 0.
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeeStructure;
