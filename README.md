# AI-Driven Institutional Financial Forecasting and Analytics System

## Overview

The **AI-Driven Institutional Financial Forecasting and Analytics System** is a comprehensive solution designed to assist educational institutions in financial planning, budgeting, and long-term sustainability. By integrating historical financial data with advanced AI/ML models, the system provides predictive insights, anomaly detection, and decision-support dashboards for management.

**Key Goals:**
*   **Forecast**: Revenue, expenses, and cash flow using ARIMA and LSTM models.
*   **Analyze**: Identify trends, correlations, and financial health indicators.
*   **Optimize**: Provide prescriptive recommendations for budget allocation and cost reduction.
*   **Monitor**: Detect financial anomalies and track real-time KPIs.

## Features

### 1. Dashboard & Visualization
*   Interactive dashboards for revenue, expenses, and surplus.
*   Visualizations for budget utilization, department-wise breakdown, and historical trends.
*   Key Financial Indicators (KPIs) like Operating Margin and Cash Flow Stability.

### 2. Predictive Analytics
*   **Revenue & Expense Forecasting**: 12-60 month projections using time-series analysis.
*   **Scenario Analysis**: Simulate the impact of changes in enrollment, fees, grants, and salaries on the bottom line.

### 3. Advanced Analytics
*   **Correlation Analysis**: Understand relationships between student count, faculty size, utility costs, and revenue.
*   **Anomaly Detection**: Automatically flag unusual financial transactions or spikes.
*   **Financial Health Index**: A composite score (0-100) indicating the institution's financial stability.

### 4. Reporting
*   Automated generation of quarterly financial health reports for audits and governance.

## Technology Stack

### Backend
*   **Framework**: FastAPI (Python)
*   **Database**: SQLite (via SQLAlchemy)
*   **ML/Analytics**:
    *   `pandas`, `numpy` for data manipulation.
    *   `statsmodels` for ARIMA forecasting.
    *   `scikit-learn` for Isolation Forest (Anomaly Detection) and Linear Regression.
    *   `scipy` for optimization tasks.

### Frontend
*   **Framework**: React (Vite)
*   **Styling**: Vanilla CSS (Modern, Responsive Design)
*   **Charting**: Chart.js / Recharts (implied)

## Project Structure

```
Project/
├── backend/                # FastAPI Application
│   ├── services/           # Business logic & Analytic services
│   ├── main.py             # API Entry point
│   ├── ml_engine.py        # Core ML & Forecasting logic
│   ├── models.py           # SQLAlchemy Database Models
│   ├── schemas.py          # Pydantic Schemas
│   ├── database.py         # DB Connection
│   └── requirements.txt    # Python Dependencies
├── frontend/               # React Application
│   ├── src/                # Source code
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages (Dashboard, Reports, etc.)
│   │   ├── services/       # API integration
│   │   └── App.jsx         # Root component
│   └── package.json        # Node Dependencies
├── fintech.db              # SQLite Database (Auto-generated)
├── populate_data.py        # Script to seed database with mock data
└── start_app.bat           # Utility script to launch the app
```

## Getting Started

### Prerequisites
*   **Python**: 3.9+
*   **Node.js**: 16+

### 1. Backend Setup

Navigate to the project root:

```bash
# Create a virtual environment (optional but recommended)
python -m venv venv
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Seed the database with sample data
python populate_data.py
```

Start the backend server:

```bash
uvicorn backend.main:app --reload
```
The API will be available at `http://127.0.0.1:8000`.
API Docs: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup

Open a new terminal and navigate to the `frontend` directory:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The application will launch at `http://localhost:5173`.

## Usage Guide
1.  **Dashboard**: View high-level metrics and recent trends.
2.  **Forecast**: Check future revenue/expense projections.
3.  **Scenario Analysis**: Use the sliders to simulate "What-If" scenarios (e.g., "What if enrollment drops by 10%?").
4.  **Anomalies**: Review flagged transactions that deviate from normal patterns.
5.  **Reports**: Generate and view quarterly financial summaries.

## License
Proprietary - JSSATEB Fintech Project
