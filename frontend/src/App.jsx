
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FinancialPosition from './pages/FinancialPosition';
import Forecast from './pages/Forecast';
import Anomalies from './pages/Anomalies';
import Budgets from './pages/Budgets';
import ScenarioAnalysis from './pages/ScenarioAnalysis';
import Recommendations from './pages/Recommendations';
import Transactions from './pages/Transactions';
import Departments from './pages/Departments';
import FeeStructure from './pages/FeeStructure';
import Correlations from './pages/Correlations';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Placeholder for future pages
const Placeholder = ({ title }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-slate-800 mb-4">{title}</h1>
    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center text-slate-500">
      Module content coming soon...
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="forecasts" element={<Forecast />} />
          <Route path="financial-position" element={<FinancialPosition />} />
          <Route path="scenario" element={<ScenarioAnalysis />} />
          <Route path="anomalies" element={<Anomalies />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="budgets" element={<Budgets />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="departments" element={<Departments />} />
          <Route path="fees" element={<FeeStructure />} />
          <Route path="correlations" element={<Correlations />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Placeholder title="404 - Page Not Found" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
