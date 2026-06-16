import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatPct } from '../utils/format';

/* ------------------------------------------------------------------ Card -- */
export const Card = ({ className = '', children, pad = true }) => (
    <div className={`card ${pad ? 'card-pad' : ''} ${className}`}>{children}</div>
);

export const SectionHeader = ({ title, subtitle, action }) => (
    <div className="flex items-start justify-between mb-4">
        <div>
            <h3 className="section-title">{title}</h3>
            {subtitle && <p className="section-sub">{subtitle}</p>}
        </div>
        {action}
    </div>
);

/* ------------------------------------------------------------- Page head -- */
export const PageHeader = ({ title, subtitle, children }) => (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
            <h1 className="text-[22px] font-semibold text-ink-900">{title}</h1>
            {subtitle && <p className="text-[14px] text-ink-500 mt-1">{subtitle}</p>}
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
);

/* ------------------------------------------------------------- KPI card --- */
export const KpiCard = ({ label, value, sub, delta, deltaTone = 'auto', icon: Icon }) => {
    const tone =
        deltaTone === 'auto'
            ? delta == null
                ? 'neutral'
                : delta >= 0
                    ? 'positive'
                    : 'negative'
            : deltaTone;
    const toneClass = {
        positive: 'text-positive-600 bg-positive-50',
        negative: 'text-negative-600 bg-negative-50',
        neutral: 'text-ink-500 bg-ink-100',
    }[tone];
    const DeltaIcon = delta >= 0 ? ArrowUpRight : ArrowDownRight;

    return (
        <Card>
            <div className="flex items-center justify-between">
                <span className="eyebrow">{label}</span>
                {Icon && (
                    <span className="text-ink-300">
                        <Icon size={18} strokeWidth={2} />
                    </span>
                )}
            </div>
            <div className="mt-3 flex items-end gap-2.5">
                <span className="tnum text-[26px] leading-none font-semibold text-ink-900">{value}</span>
                {delta != null && (
                    <span className={`pill ${toneClass} mb-0.5`}>
                        <DeltaIcon size={13} strokeWidth={2.5} />
                        {formatPct(Math.abs(delta))}
                    </span>
                )}
            </div>
            {sub && <p className="text-[12.5px] text-ink-500 mt-2">{sub}</p>}
        </Card>
    );
};

/* ----------------------------------------------------------- Status pill -- */
const TONES = {
    Strong: 'bg-positive-50 text-positive-600',
    Stable: 'bg-info-50 text-info-600',
    Watch: 'bg-warning-50 text-warning-600',
    'At Risk': 'bg-negative-50 text-negative-600',
    Low: 'bg-positive-50 text-positive-600',
    Moderate: 'bg-warning-50 text-warning-600',
    Medium: 'bg-warning-50 text-warning-600',
    High: 'bg-negative-50 text-negative-600',
    Over: 'bg-negative-50 text-negative-600',
    Under: 'bg-positive-50 text-positive-600',
};
export const StatusPill = ({ status, dot = true }) => (
    <span className={`pill ${TONES[status] || 'bg-ink-100 text-ink-600'}`}>
        {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
        {status}
    </span>
);

/* --------------------------------------------------------------- States --- */
export const Loading = ({ label = 'Loading…' }) => (
    <div className="flex flex-col items-center justify-center py-24 text-ink-400">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
        <p className="mt-3 text-[13px]">{label}</p>
    </div>
);

export const ErrorState = ({ message, onRetry }) => (
    <Card className="text-center py-16">
        <p className="text-[14px] text-ink-600">{message || 'Unable to load data.'}</p>
        <p className="text-[13px] text-ink-400 mt-1">
            Ensure the API is running at <code className="text-ink-600">localhost:8000</code>.
        </p>
        {onRetry && (
            <button onClick={onRetry} className="btn-secondary mt-4 mx-auto">
                Retry
            </button>
        )}
    </Card>
);

/* ----------------------------------------------------- Mini progress bar -- */
export const Meter = ({ value, max = 100, tone = 'brand' }) => {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    const bar = {
        brand: 'bg-brand-600',
        positive: 'bg-positive-500',
        warning: 'bg-warning-500',
        negative: 'bg-negative-500',
        ink: 'bg-ink-700',
    }[tone];
    return (
        <div className="h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
            <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
        </div>
    );
};
