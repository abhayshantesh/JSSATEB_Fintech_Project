import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 40000,
});

// --- Executive ---------------------------------------------------------------
export const getExecutiveSummary = () => api.get('/api/executive-summary').then((r) => r.data);
export const getTrends = (months = 18) =>
    api.get(`/api/trends?months=${months}`).then((r) => r.data);

// --- Forecasting -------------------------------------------------------------
export const getRevenueForecast = (periods = 12) =>
    api.get(`/api/forecast/revenue?periods=${periods}`).then((r) => r.data);
export const getExpenseForecast = (periods = 12) =>
    api.get(`/api/forecast/expense?periods=${periods}`).then((r) => r.data);

// --- Financial analytics -----------------------------------------------------
export const getVendors = (limit = 12) =>
    api.get(`/api/vendors?limit=${limit}`).then((r) => r.data);
export const getExpenseBreakdown = () => api.get('/api/expense-breakdown').then((r) => r.data);
export const getBudgetVariance = () => api.get('/api/budget-variance').then((r) => r.data);
export const getFinancialPosition = () => api.get('/api/financial-position').then((r) => r.data);
export const getAnomalies = (threshold = 2.5) =>
    api.get(`/api/anomalies?threshold=${threshold}`).then((r) => r.data);

// --- Scenario analysis -------------------------------------------------------
export const runScenario = (params) =>
    api.get(`/api/scenario?${new URLSearchParams(params).toString()}`).then((r) => r.data);

// --- AI insights -------------------------------------------------------------
export const getAiExecutiveSummary = () =>
    api.get('/api/ai/executive-summary').then((r) => r.data);
export const getSuggestedQuestions = () =>
    api.get('/api/ai/suggested-questions').then((r) => r.data);
export const askAnalyst = (question) =>
    api.post('/api/ai/ask', { question }).then((r) => r.data);

export default api;
