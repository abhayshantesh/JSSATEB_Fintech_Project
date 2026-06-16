# Architecture — AI-Driven Institutional Financial Forecasting & Analytics System

A simple, plain-English guide to how the project is built and how data flows
through it. Good for a quick read before a walkthrough or interview.

---

## 1. The big picture

The system has **three layers**:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. FRONTEND  (React + Vite)            what the user sees        │
│     5 screens · charts · AI chat                                 │
└───────────────┬─────────────────────────────────────────────────┘
                │  HTTP (JSON) — calls /api/* endpoints
                ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. BACKEND  (FastAPI)                  the brains                │
│     • API routes        (main.py)                               │
│     • Analytics engine  (services/analytics.py)                 │
│     • AI analyst        (services/ai_insights.py)               │
│     • Label mapping     (domain.py)                             │
└───────────────┬───────────────────────────────┬─────────────────┘
                │  SQL (SQLAlchemy)              │  HTTPS (optional)
                ▼                                ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│  3. DATABASE  (SQLite)        │   │  OpenRouter (LLM API)        │
│     fintech.db                │   │  used by the AI features     │
│     revenue, expenses,        │   │  (falls back to a built-in   │
│     budgets, assets, etc.     │   │   engine if no key)          │
└──────────────────────────────┘   └──────────────────────────────┘
```

**In one sentence:** the React app asks the FastAPI backend for numbers, the
backend computes them from the SQLite database (and optionally asks an AI model
to explain them in words), and sends everything back as JSON for the charts.

---

## 2. The three layers in detail

### Layer 1 — Frontend (`frontend/`)

React single-page app built with Vite, styled with Tailwind CSS, charts by
Recharts.

| File / folder | What it does |
|---|---|
| `src/App.jsx` | Defines the 5 routes (screens). |
| `src/components/Layout.jsx` | Sidebar + top bar shell around every page. |
| `src/components/ui.jsx` | Reusable building blocks (KPI cards, status pills, loading states). |
| `src/pages/` | The 5 screens (see below). |
| `src/services/api.js` | One place that calls every backend endpoint. |
| `src/utils/format.js` | Formats numbers as Indian currency (₹ Lakh / Crore). |

**The 5 screens:**

1. **Executive Summary** — headline KPIs, health score, revenue-vs-expense
   trend, and a short AI briefing.
2. **Forecasting** — revenue & expense forecasts with confidence bands.
3. **Financial Analytics** — financial position, top vendors, expense
   breakdown, budget variance, expense anomalies.
4. **AI Insights** — full AI executive briefing + an interactive AI analyst you
   can ask questions.
5. **Scenario Analysis** — "what-if" sliders (enrolment, fees, grants, salaries).

### Layer 2 — Backend (`backend/`)

FastAPI app. Everything is split by responsibility so each file has one job.

| File | Responsibility |
|---|---|
| `main.py` | Declares the API endpoints and validates inputs. Thin — it just calls the services. |
| `services/analytics.py` | **The analytics engine.** All the maths: KPIs, forecasting, vendor analysis, variance, anomalies, scenarios. |
| `services/ai_insights.py` | **The AI layer.** Builds a fact sheet from the analytics, calls the LLM, and falls back to a built-in engine if there's no key. |
| `domain.py` | Central place for display labels (category names, department names). |
| `models.py` | Database table definitions (SQLAlchemy ORM). |
| `database.py` | Opens the database connection / session. |

### Layer 3 — Data & AI

- **SQLite database (`fintech.db`)** — a single file holding ~20,000 revenue and
  expense transactions over FY20–FY24, plus budgets, departments, vendors,
  assets and liabilities. Created by `populate_data.py`.
- **OpenRouter (optional)** — the AI features call a hosted LLM through
  OpenRouter. If no API key is configured, the app uses a **built-in rule-based
  engine** instead, so it always works.

---

## 3. How a request flows (example)

What happens when you open the **Executive Summary** screen:

```
1. Browser loads the page.
2. api.js calls  GET /api/executive-summary
3. main.py receives it and calls analytics.executive_summary(db)
4. analytics.py queries fintech.db, computes revenue, expenses,
   surplus, margin, growth, health score, risk → returns a dict
5. FastAPI sends that dict back as JSON
6. React stores it and renders the KPI cards + charts
7. Separately, the page calls /api/ai/executive-summary, which builds a
   fact sheet and asks the AI to write the briefing (or uses the fallback)
```

Every screen follows the same pattern: **page → api.js → endpoint → service →
database → JSON → charts.**

---

## 4. How the AI stays accurate (and safe)

The AI never makes up numbers:

1. `analytics.py` computes the real figures from the database.
2. `ai_insights.py` packs those figures into a small **fact sheet**.
3. The LLM is told: *"answer using ONLY these facts."*
4. The response is labelled **"Live AI"** or **"Rule-based"** so it's always
   honest about its source.

If the API key is missing or the network is down, the **rule-based engine**
produces the same kind of answer from the same facts — so a demo never breaks.

---

## 5. Screen → API endpoint reference

Each screen is powered by a few endpoints. Every endpoint lives in `main.py` and
delegates to a function in `services/analytics.py` (or `ai_insights.py`).

| Screen | Endpoints it calls |
|---|---|
| Executive Summary | `GET /api/executive-summary`, `GET /api/trends`, `GET /api/expense-breakdown`, `GET /api/vendors`, `GET /api/ai/executive-summary` |
| Forecasting | `GET /api/forecast/revenue`, `GET /api/forecast/expense` |
| Financial Analytics | `GET /api/financial-position`, `GET /api/vendors`, `GET /api/expense-breakdown`, `GET /api/budget-variance`, `GET /api/anomalies` |
| AI Insights | `GET /api/ai/executive-summary`, `GET /api/ai/suggested-questions`, `POST /api/ai/ask` |
| Scenario Analysis | `GET /api/scenario` (with enrolment / fee / grant / salary parameters) |

Health check: `GET /health`. Interactive docs for all endpoints:
`http://localhost:8000/docs`.

---

## 6. The data model (tables)

```
departments ── budgets
     │
     ├── revenue_transactions   (tuition, grants)
     ├── expense_transactions   (salaries, equipment, utilities… by vendor)
     ├── employees
     └── students

assets        (buildings, equipment)      ─┐
liabilities   (loans, payables)            ─┴─ financial position / net worth
```

The two tables that power most of the analytics are **`revenue_transactions`**
and **`expense_transactions`** — they're time-stamped, so we can aggregate by
month and forecast.

---

## 7. Tech stack at a glance

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, Recharts, Axios |
| Backend | FastAPI, Uvicorn, SQLAlchemy, Pydantic |
| Analytics | pandas, NumPy, statsmodels (Holt-Winters forecasting) |
| Database | SQLite |
| AI | OpenRouter API (optional) + built-in rule-based fallback |

---

## 8. How the analytics actually work (the honest details)

- **Forecasting** uses Holt-Winters exponential smoothing (a standard
  time-series method). The shaded band is the 95% confidence range, derived
  from how well the model fit the history.
- **Growth numbers are year-over-year** (this year vs last year). The data is
  seasonal — fees arrive in a few months each year — so comparing month-to-month
  would be misleading; year-over-year is the correct lens.
- **Anomaly detection** compares each expense to others *in the same category*
  using a Z-score, so it flags a genuinely unusual purchase rather than every
  routine salary payment.
- **Financial health score** blends operating margin, expense trend, liquidity
  and risk into a single 0–100 number for a quick read.
