
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// =============================================================================
// DASHBOARD & TRENDS
// =============================================================================

export const fetchDashboardMetrics = async () => {
    const response = await api.get('/dashboard/metrics');
    return response.data;
};

export const fetchMonthlyTrends = async (limit = 24) => {
    const response = await api.get(`/analytics/trends?limit_months=${limit}`);
    return response.data;
};

export const fetchDashboardStats = async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
};

// =============================================================================
// FORECASTS
// =============================================================================

export const fetchRevenueForecast = async (months = 12) => {
    const response = await api.get(`/analytics/forecast/revenue?months=${months}`);
    return response.data;
};

export const fetchExpenseForecast = async (months = 12) => {
    const response = await api.get(`/analytics/forecast/expense?months=${months}`);
    return response.data;
};

// Aliases for component imports (some components use get* naming)
export const getRevenueForecast = fetchRevenueForecast;
export const getExpenseForecast = fetchExpenseForecast;

// =============================================================================
// ANALYTICS
// =============================================================================

export const fetchAnomalies = async (threshold = 2.0) => {
    const response = await api.get(`/analytics/anomalies?threshold=${threshold}`);
    return response.data;
};
export const getAnomalies = fetchAnomalies;

export const fetchFinancialHealth = async () => {
    const response = await api.get('/analytics/financial-health');
    return response.data;
};

export const fetchExpenseDistribution = async () => {
    const response = await api.get('/analytics/expense-distribution');
    return response.data;
};

export const fetchCorrelations = async () => {
    const response = await api.get('/analytics/correlation');
    return response.data;
};
export const getCorrelations = fetchCorrelations;

// =============================================================================
// RECOMMENDATIONS (Prescriptive Analytics)
// =============================================================================

export const fetchRecommendations = async () => {
    const response = await api.get('/analytics/recommendations');
    return response.data;
};
export const getRecommendations = fetchRecommendations;

// =============================================================================
// SCENARIO ANALYSIS
// =============================================================================

export const runScenarioAnalysis = async (params) => {
    // params: { enrollment_change, fee_change, grant_change, salary_change }
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/analytics/scenario?${queryString}`);
    return response.data;
};
export const getScenarioAnalysis = runScenarioAnalysis;

// =============================================================================
// FINANCIAL POSITION (Assets & Liabilities)
// =============================================================================

export const fetchAssets = async (skip = 0, limit = 100) => {
    const response = await api.get(`/assets?skip=${skip}&limit=${limit}`);
    return response.data;
};

export const fetchLiabilities = async (skip = 0, limit = 100) => {
    const response = await api.get(`/liabilities?skip=${skip}&limit=${limit}`);
    return response.data;
};

export const fetchFinancialPosition = async () => {
    const response = await api.get('/financial-position/summary');
    return response.data;
};

// =============================================================================
// BUDGETS
// =============================================================================

export const fetchBudgets = async (fiscalYear = null, deptId = null, skip = 0, limit = 100) => {
    let url = `/budgets?skip=${skip}&limit=${limit}`;
    if (fiscalYear) url += `&fiscal_year=${fiscalYear}`;
    if (deptId) url += `&dept_id=${deptId}`;
    const response = await api.get(url);
    return response.data;
};
export const getBudgets = fetchBudgets;

export const fetchBudgetSummary = async (fiscalYear = null) => {
    let url = '/budgets/summary';
    if (fiscalYear) url += `?fiscal_year=${fiscalYear}`;
    const response = await api.get(url);
    return response.data;
};
export const getBudgetSummary = fetchBudgetSummary;

// =============================================================================
// DEPARTMENTS
// =============================================================================

export const fetchDepartments = async (skip = 0, limit = 100) => {
    const response = await api.get(`/departments?skip=${skip}&limit=${limit}`);
    return response.data;
};
export const getDepartments = fetchDepartments;

// =============================================================================
// TRANSACTIONS
// =============================================================================

export const fetchRevenueTransactions = async (skip = 0, limit = 100) => {
    const response = await api.get(`/transactions/revenue?skip=${skip}&limit=${limit}`);
    return response.data;
};
export const getRevenueTransactions = fetchRevenueTransactions;

export const fetchExpenseTransactions = async (skip = 0, limit = 100) => {
    const response = await api.get(`/transactions/expenses?skip=${skip}&limit=${limit}`);
    return response.data;
};
export const getExpenseTransactions = fetchExpenseTransactions;

// =============================================================================
// FEE STRUCTURES
// =============================================================================

export const fetchFeeStructures = async (academicYear = null, deptId = null, feeType = null, skip = 0, limit = 100) => {
    let url = `/fee-structures?skip=${skip}&limit=${limit}`;
    if (academicYear) url += `&academic_year=${academicYear}`;
    if (deptId) url += `&dept_id=${deptId}`;
    if (feeType) url += `&fee_type=${feeType}`;
    const response = await api.get(url);
    return response.data;
};
export const getFeeStructures = fetchFeeStructures;

// =============================================================================
// REPORTS (SRS Section 8)
// =============================================================================

export const fetchQuarterlyReport = async () => {
    const response = await api.get('/reports/quarterly');
    return response.data;
};

export default api;

