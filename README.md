# AI-Driven Institutional Financial Forecasting and Analytics System

A financial planning and analytics platform for an educational institution
(JSS Academy of Technical Education, Bengaluru). It turns historical financial
data into forecasting, analytics and executive decision support — including an
AI financial analyst — to help management with budgeting, planning and
long-term sustainability.

It is built to answer the questions institutional leadership actually asks:
**"How are our finances trending, where are the risks, and what should we do?"**

---

## Overview

The system integrates an institution's revenue and expense history with
forecasting and AI to provide predictive insights, anomaly detection, and
decision-support dashboards for management. Core goals:

- **Forecast** — project revenue and expenses with confidence bands.
- **Analyze** — track financial health, expense structure and budget variance.
- **Detect** — flag unusual transactions and budget overruns.
- **Decide** — generate AI-written briefings and answer ad-hoc questions.

---

## What it does

| Screen | Description |
|---|---|
| **Executive Summary** | Financial-health score, revenue/expense/surplus KPIs, risk posture, revenue-vs-expense trend, and an AI briefing — all on one screen. |
| **Forecasting** | Revenue and expense forecasts with 95% confidence bands and a plain-language read-out. |
| **Financial Analytics** | Financial position (assets, liabilities, net worth, liquidity), top vendors, expense breakdown, budget variance, and expense-anomaly detection. |
| **AI Insights** | An auto-generated executive briefing and an interactive AI financial analyst, both grounded in live metrics. |
| **Scenario Analysis** | Model the impact of enrolment, fee, grant and salary changes on net surplus in real time. |

---

## Architecture

```
backend/                     FastAPI service
├── main.py                  API routes (/api/*)
├── domain.py                Display labels (categories, departments)
├── models.py                SQLAlchemy ORM models
├── database.py              DB connection / session
└── services/
    ├── analytics.py         Analytics: KPIs, forecasting, vendors, variance, anomalies, scenarios
    └── ai_insights.py       AI financial analyst + executive summary (OpenRouter + fallback)

frontend/                    React (Vite) + Tailwind v4 + Recharts
└── src/
    ├── pages/               ExecutiveSummary, Forecasting, Analytics, AiInsights, Scenario
    ├── components/          Layout + shared UI primitives (ui.jsx)
    ├── services/api.js      API client
    └── utils/format.js      Indian-numbering / currency formatting (₹)

populate_data.py             Seeds a realistic FY20–FY24 transactional dataset
test_backend.py              API smoke tests
start_app.bat                One-click launcher (Windows)
ARCHITECTURE.md              Plain-English architecture guide
```

**Stack:** FastAPI · SQLAlchemy · SQLite · pandas · statsmodels (Holt-Winters) ·
React 19 · Vite · Tailwind CSS v4 · Recharts · OpenRouter (optional).

> For a deeper, plain-English explanation of how everything fits together, see
> [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Quick start

### Option A — One click (Windows)

Double-click **`start_app.bat`**. It creates a virtual environment, installs all
dependencies, seeds the database (first run only), and launches both servers.
The app opens at `http://localhost:5173`.

### Option B — Manual

**Prerequisites:** Python 3.9+ and Node.js 18+.

**1 · Backend**

```bash
pip install -r backend/requirements.txt

# Seed the demo database (creates fintech.db)
python populate_data.py

# Run the API
cd backend
python -m uvicorn main:app --reload --port 8000
```

API: `http://localhost:8000` · interactive docs: `http://localhost:8000/docs`

**2 · Frontend**

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

---

## Enabling live AI (optional)

The AI features work out of the box using a deterministic, metric-driven engine
(labelled **"Rule-based"** in the UI). To use a live LLM via
[OpenRouter](https://openrouter.ai):

1. Create a file named **`.env`** in the project root.
2. Add your key:
   ```
   OPENROUTER_API_KEY=your_key_here
   # optional — defaults to a sensible model
   OPENROUTER_MODEL=anthropic/claude-3.5-haiku
   ```
3. Restart the backend.

Responses then switch to **"Live AI"**. If the key is missing or the network is
unavailable, the platform **automatically falls back** to the rule-based engine —
so the app always works, online or offline.

---

## Usage guide

1. **Executive Summary** — start here for the high-level financial picture.
2. **Forecasting** — review projected revenue and expenses; switch the horizon
   (6 / 12 / 18 / 24 months).
3. **Financial Analytics** — drill into position, vendors, expense mix, budget
   variance and anomalies.
4. **AI Insights** — read the AI briefing and ask the analyst questions
   (e.g. "Why are expenses increasing?").
5. **Scenario Analysis** — move the sliders to test "what-if" plans.

---

## Testing

With the API running, run the endpoint smoke tests from the project root:

```bash
python test_backend.py
```

---

## Design notes

- **Revenue/expense trends are year-over-year**, the correct metric for highly
  seasonal fee collection (a month-to-month view would just track the season).
- **Forecasts** use Holt-Winters exponential smoothing with confidence bands
  derived from in-sample residuals.
- **Anomalies** are detected per expense category (Z-score), so genuine outliers
  surface instead of every routine salary payment.
- **AI answers are grounded** — the model only reasons over a structured snapshot
  of current metrics, and every answer is labelled "Live AI" or "Rule-based".
