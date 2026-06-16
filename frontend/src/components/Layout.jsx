import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    TrendingUp,
    BarChart3,
    Sparkles,
    SlidersHorizontal,
    Menu,
    X,
    Landmark,
} from 'lucide-react';

const NAV = [
    { name: 'Executive Summary', path: '/', icon: LayoutDashboard, end: true },
    { name: 'Forecasting', path: '/forecasting', icon: TrendingUp },
    { name: 'Financial Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'AI Insights', path: '/ai-insights', icon: Sparkles },
    { name: 'Scenario Analysis', path: '/scenario', icon: SlidersHorizontal },
];

const PAGE_META = {
    '/': 'Executive Summary',
    '/forecasting': 'Revenue & Expense Forecasting',
    '/analytics': 'Financial Analytics',
    '/ai-insights': 'AI Insights',
    '/scenario': 'Scenario Analysis',
};

const Brand = () => (
    <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Landmark size={17} strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
            <div className="text-[14px] font-semibold tracking-tight text-white">JSSATEB</div>
            <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-400">
                Financial Analytics
            </div>
        </div>
    </div>
);

const Sidebar = ({ open, close }) => (
    <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink-950 transition-transform duration-300 lg:static lg:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
        }`}
    >
        <div className="flex h-16 items-center justify-between px-5">
            <Brand />
            <button onClick={close} className="text-ink-400 hover:text-white lg:hidden">
                <X size={20} />
            </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-3">
            {NAV.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={close}
                    className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                            isActive
                                ? 'bg-white/10 text-white'
                                : 'text-ink-400 hover:bg-white/5 hover:text-ink-100'
                        }`
                    }
                >
                    <item.icon size={18} strokeWidth={2} />
                    {item.name}
                </NavLink>
            ))}
        </nav>

        <div className="px-5 py-4">
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                <p className="text-[11px] font-medium text-ink-300">Institutional dataset</p>
                <p className="text-[11px] text-ink-500 mt-0.5">FY20–FY24 · 20k+ transactions</p>
            </div>
        </div>
    </aside>
);

const Topbar = ({ openSidebar, title }) => (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-ink-200 bg-canvas/85 px-5 backdrop-blur-md sm:px-7">
        <div className="flex items-center gap-3">
            <button onClick={openSidebar} className="text-ink-600 hover:text-ink-900 lg:hidden">
                <Menu size={22} />
            </button>
            <h2 className="text-[15px] font-semibold text-ink-800">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
                <p className="text-[12.5px] font-medium text-ink-800">Finance Office</p>
                <p className="text-[11px] text-ink-400">JSS Academy of Technical Education</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-[12px] font-semibold text-white">
                FO
            </div>
        </div>
    </header>
);

const Layout = () => {
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const title = PAGE_META[location.pathname] || 'Institutional Financial Analytics';

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar open={open} close={() => setOpen(false)} />
            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar openSidebar={() => setOpen(true)} title={title} />
                <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
                    <div className="mx-auto max-w-[1280px]">
                        <Outlet />
                    </div>
                </main>
            </div>
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}
        </div>
    );
};

export default Layout;
