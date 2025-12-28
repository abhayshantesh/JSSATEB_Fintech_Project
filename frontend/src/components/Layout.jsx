
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    TrendingUp,
    PieChart,
    AlertTriangle,
    Landmark,
    Wallet,
    Settings,
    Menu,
    X,
    ChevronRight,
    Calculator,
    Lightbulb,
    ArrowLeftRight,
    Building,
    Receipt,
    FileText
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Forecasts', path: '/forecasts', icon: TrendingUp },
        { name: 'Financial Position', path: '/financial-position', icon: Landmark },
        { name: 'Correlations', path: '/correlations', icon: PieChart },
        { name: 'Scenario Analysis', path: '/scenario', icon: Calculator },
        { name: 'Anomalies', path: '/anomalies', icon: AlertTriangle },
        { name: 'Recommendations', path: '/recommendations', icon: Lightbulb },
        { name: 'Budgets', path: '/budgets', icon: Wallet },
        { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
        { name: 'Reports', path: '/reports', icon: FileText },
    ];

    return (
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-auto`}>
            <div className="flex items-center justify-between h-16 px-6 bg-slate-950">
                <span className="text-xl font-bold tracking-tight text-white">JSSATEB <span className="text-indigo-500">Fintech</span></span>
                <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>

            <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${isActive
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} className="mr-3" />
                            {item.name}
                            {isActive && <ChevronRight size={16} className="ml-auto" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
                <Link to="/settings" className="flex items-center px-4 py-3 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                    <Settings size={20} className="mr-3" />
                    Settings
                </Link>
            </div>
        </aside>
    );
};

const Navbar = ({ toggleSidebar }) => {
    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center">
                <button onClick={toggleSidebar} className="lg:hidden text-slate-600 hover:text-slate-900 mr-4">
                    <Menu size={24} />
                </button>
                <h2 className="text-lg font-semibold text-slate-800 hidden sm:block">Institutional Financial Analytics</h2>
            </div>

            <div className="flex items-center space-x-4">
                <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-slate-900">Admin User</p>
                    <p className="text-xs text-slate-500">Finance Dept</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                    AU
                </div>
            </div>
        </header>
    );
};

const Layout = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Navbar toggleSidebar={toggleSidebar} />

                <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <Outlet />
                </main>
            </div>

            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
                    onClick={toggleSidebar}
                />
            )}
        </div>
    );
};

export default Layout;
