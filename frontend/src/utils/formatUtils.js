
/**
 * Formats a number according to the Indian numbering system.
 * @param {number} value - The number to format.
 * @param {object} options - Options for formatting.
 * @param {boolean} options.currency - whether to format as currency (adds ₹ symbol).
 * @param {number} options.decimals - number of decimal places.
 * @returns {string} - The formatted string.
 */
export const formatIndianNumber = (value, options = {}) => {
    if (value === null || value === undefined) return '-';

    const { currency = false, decimals = 0 } = options;

    const formatter = new Intl.NumberFormat('en-IN', {
        style: currency ? 'currency' : 'decimal',
        currency: 'INR',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    return formatter.format(value);
};

/**
 * Formats a large number into abbreviated Indian format (Thousands, Lakhs, Crores).
 * Useful for charts and compact displays.
 * @param {number} value - The number to format.
 * @param {number} decimals - Number of decimal places.
 * @returns {string} - The formatted string with suffix (e.g., 1.5 L, 2.3 Cr).
 */
export const formatIndianNumberCompact = (value, decimals = 1) => {
    if (value === null || value === undefined) return '-';
    if (value === 0) return '0';

    const absValue = Math.abs(value);

    if (absValue >= 10000000) { // 1 Crore = 10,000,000
        return `${(value / 10000000).toFixed(decimals)} Cr`;
    } else if (absValue >= 100000) { // 1 Lakh = 100,000
        return `${(value / 100000).toFixed(decimals)} L`;
    } else if (absValue >= 1000) {
        return `${(value / 1000).toFixed(decimals)} K`;
    } else {
        return value.toFixed(decimals);
    }
};
