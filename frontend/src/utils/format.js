/* Formatting helpers (Indian numbering, used across the platform). */

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** Full INR currency, e.g. ₹40,04,66,464 */
export const formatCurrency = (value, decimals = 0) => {
    if (value == null || isNaN(value)) return '—';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
};

/** Compact INR for charts/KPIs, e.g. ₹40.0 Cr, ₹5.2 L */
export const formatCompact = (value, withSymbol = true) => {
    if (value == null || isNaN(value)) return '—';
    const s = withSymbol ? '₹' : '';
    const a = Math.abs(value);
    if (a >= 1e7) return `${s}${(value / 1e7).toFixed(2)} Cr`;
    if (a >= 1e5) return `${s}${(value / 1e5).toFixed(2)} L`;
    if (a >= 1e3) return `${s}${(value / 1e3).toFixed(1)} K`;
    return `${s}${inr.format(value)}`;
};

/** Plain integer with Indian grouping. */
export const formatNumber = (value) => (value == null ? '—' : inr.format(value));

/** Signed percentage, e.g. +9.5%, -3.4% */
export const formatPct = (value, decimals = 1) => {
    if (value == null || isNaN(value)) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
};

/** YYYY-MM -> "Mon ’YY" */
export const formatPeriod = (period) => {
    if (!period) return '';
    const [y, m] = period.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m, 10) - 1]} ’${y.slice(2)}`;
};
