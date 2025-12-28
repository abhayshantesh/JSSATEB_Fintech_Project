import React, { useEffect, useState } from 'react';
import { getRevenueTransactions, getExpenseTransactions } from '../services/api';

const Transactions = ({ type }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = type === 'revenue'
                    ? await getRevenueTransactions()
                    : await getExpenseTransactions();
                setData(result);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [type]);

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 capitalize">{type} Transactions</h2>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                    <thead className="text-xs uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Dept ID</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Payment Mode</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr key={item.txn_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3">{item.txn_date}</td>
                                <td className="px-4 py-3">{item.category}</td>
                                <td className={`px-4 py-3 font-medium ${type === 'revenue' ? 'text-success' : 'text-danger'}`}>
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.amount)}
                                </td>
                                <td className="px-4 py-3">{item.dept_id || '-'}</td>
                                <td className="px-4 py-3">{item.description}</td>
                                <td className="px-4 py-3">{item.payment_mode || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Transactions;
