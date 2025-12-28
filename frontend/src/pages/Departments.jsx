import React, { useEffect, useState } from 'react';
import { getDepartments } from '../services/api';
import { Building2, Users } from 'lucide-react';

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getDepartments();
                setDepartments(data);
            } catch (error) {
                console.error("Failed to fetch departments", error);
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

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Departments</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => (
                    <div
                        key={dept.dept_id}
                        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-accent hover:shadow-md transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-lg bg-accent/20">
                                <Building2 className="w-6 h-6 text-accent" />
                            </div>
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                {dept.dept_id}
                            </span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{dept.dept_name}</h3>
                        <div className="flex items-center text-slate-400 text-sm">
                            <span className="mr-4">Budget Code: {dept.budget_code}</span>
                            <span>Intake: {dept.sanctioned_intake}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-xs text-slate-500">
                                Created: {new Date(dept.created_at).toLocaleDateString('en-IN')}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {
                departments.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        No departments found.
                    </div>
                )
            }
        </div >
    );
};

export default Departments;
