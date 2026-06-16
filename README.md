# Supply Chain Intelligence Platform

An **AI-driven supply chain & operations intelligence platform** that turns raw
transactional data into executive decision support: demand and cost forecasting,
supplier and cost-driver analytics, working-capital monitoring, scenario
planning, and an AI operations analyst.

It is designed to answer the question a supply-chain leader actually asks:
**"Where are we exposed, what's driving it, and what should we do about it?"**

---

## What it does

| Capability | Description |
|---|---|
| **Executive Summary** | Health score, demand/cost/margin KPIs, risk posture and an AI briefing on one screen. |
| **Demand & Cost Forecasting** | Exponential-smoothing forecasts with 95% confidence bands and a plain-language read-out. |
| **Operational Intelligence** | Supplier performance (spend, on-time delivery, defects, risk tier), cost drivers, budget variance, and spend-anomaly detection. |
| **AI Insights** | An auto-generated executive briefing and an interactive AI operations analyst, both grounded in live metrics. |
| **Scenario Planning** | Model demand, price, material-cost and freight shocks on operating margin in real time. |

---

## Architecture

```
backend/                     FastAPI service
├── main.py                  API routes (/api/*)
├── domain.py                Supply-chain semantics (single source of meaning)
├── models.py                SQLAlchemy ORM models
├── database.py              DB connection / session
└── services/
    ├── supply_chain.py      Analytics: KPIs, forecasting, suppliers, variance…
    └── ai_insights.py       AI analyst + executive summary (OpenRouter + fallback)

frontend/                    React (Vite) + Tailwind v4 + Recharts
└── src/
    ├── pages/               ExecutiveSummary, Forecasting, Operations, AiInsights, Scenario
    ├── components/          Layout + shared UI primitives
    ├── services/api.js      API client
    └── utils/format.js      Indian-numbering / currency formatting

populate_data.py             Seeds a realistic FY20–FY24 transactional dataset
test_backend.py             API smoke tests
```

**Stack:** FastAPI · SQLAlchemy · SQLite · pandas · statsmodels (Holt-Winters) ·
React 19 · Vite · Tailwind CSS v4 · Recharts · OpenRouter (optional).

---

## Quick start

### Prerequisites
- Python 3.9+
- Node.js 18+

### 1 · Backend

```bash
pip install -r backend/requirements.txt

# Seed the demo database (creates fintech.db)
python populate_data.py

# Run the API
cd backend
python -m uvicorn main:app --reload --port 8000
```

API: `http://localhost:8000` · interactive docs: `http://localhost:8000/docs`

### 2 · Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

> On Windows you can launch both with `start_app.bat`.

---

## Enabling live AI (optional)

The AI features work out of the box using a deterministic, metric-driven engine
(labelled **"Rule-based"** in the UI). To use a live LLM via
[OpenRouter](https://openrouter.ai):

1. Copy `backend/.env.example` to `backend/.env`
2. Set `OPENROUTER_API_KEY=...`
3. Restart the backend

Responses then switch to **"Live AI"**. If the key is missing or the network is
unavailable, the platform **automatically falls back** to the rule-based engine —
so a demo always works.

---

## Design notes

- **Demand/cost trends are year-over-year**, the correct metric for seasonal
  order patterns (a quarter-on-quarter view would just track the season).
- **Forecasts** use Holt-Winters exponential smoothing with confidence bands
  derived from in-sample residuals.
- **Spend anomalies** are detected per cost bucket (Z-score), so genuine outliers
  surface instead of every routine payroll run.
- **AI answers are grounded**: the model only reasons over a structured snapshot
  of current metrics, never free-form invention.
