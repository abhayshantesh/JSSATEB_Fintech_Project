import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ExecutiveSummary from './pages/ExecutiveSummary';
import Forecasting from './pages/Forecasting';
import Analytics from './pages/Analytics';
import AiInsights from './pages/AiInsights';
import Scenario from './pages/Scenario';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<ExecutiveSummary />} />
                    <Route path="forecasting" element={<Forecasting />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="ai-insights" element={<AiInsights />} />
                    <Route path="scenario" element={<Scenario />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
