"""
AI-Driven Institutional Financial Forecasting and Analytics System — API
========================================================================

FastAPI backend for institutional financial planning: revenue & expense
forecasting, financial-position monitoring, vendor and expense analysis,
budget-variance and anomaly detection, scenario analysis, and an AI financial
analyst.

Analytics live in ``services/analytics.py``; AI features in
``services/ai_insights.py``. ``domain.py`` defines display labels.
"""

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

try:
    from . import database
    from .services import ai_insights, analytics
except ImportError:
    import database
    from services import ai_insights, analytics

app = FastAPI(
    title="Institutional Financial Analytics API",
    description="AI-driven institutional financial forecasting, analytics and "
    "decision support.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

get_db = database.get_db


# =============================================================================
# Health
# =============================================================================

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": "2.0.0"}


# =============================================================================
# Executive summary & KPIs
# =============================================================================

@app.get("/api/executive-summary", tags=["Executive"])
def executive_summary(db: Session = Depends(get_db)):
    """Top-line KPIs, financial-health score and risk posture for management."""
    return analytics.executive_summary(db)


@app.get("/api/trends", tags=["Executive"])
def trends(months: int = 18, db: Session = Depends(get_db)):
    """Monthly revenue vs expenses (and surplus) for trend charts."""
    if not 1 <= months <= 60:
        raise HTTPException(status_code=400, detail="months must be 1-60")
    return analytics.monthly_trends(db, months)


# =============================================================================
# Forecasting
# =============================================================================

@app.get("/api/forecast/revenue", tags=["Forecasting"])
def forecast_revenue(periods: int = 12, db: Session = Depends(get_db)):
    """Revenue forecast with a 95% confidence band."""
    if not 1 <= periods <= 36:
        raise HTTPException(status_code=400, detail="periods must be 1-36")
    return analytics.revenue_forecast(db, periods)


@app.get("/api/forecast/expense", tags=["Forecasting"])
def forecast_expense(periods: int = 12, db: Session = Depends(get_db)):
    """Expense forecast with a 95% confidence band."""
    if not 1 <= periods <= 36:
        raise HTTPException(status_code=400, detail="periods must be 1-36")
    return analytics.expense_forecast(db, periods)


# =============================================================================
# Financial intelligence
# =============================================================================

@app.get("/api/vendors", tags=["Analytics"])
def vendors(limit: int = 12, db: Session = Depends(get_db)):
    """Per-vendor spend, transactions, average value and concentration risk."""
    return analytics.vendor_analysis(db, limit)


@app.get("/api/expense-breakdown", tags=["Analytics"])
def expense_breakdown(db: Session = Depends(get_db)):
    """Spend by expense category with year-over-year change."""
    return analytics.expense_breakdown(db)


@app.get("/api/budget-variance", tags=["Analytics"])
def budget_variance(db: Session = Depends(get_db)):
    """Budget vs actual variance by category."""
    return analytics.budget_variance(db)


@app.get("/api/financial-position", tags=["Analytics"])
def financial_position(db: Session = Depends(get_db)):
    """Assets, liabilities, net worth and liquidity snapshot."""
    return analytics.financial_position(db)


@app.get("/api/anomalies", tags=["Analytics"])
def anomalies(threshold: float = 2.5, db: Session = Depends(get_db)):
    """Statistically unusual expense transactions (per-category Z-score)."""
    if not 1.5 <= threshold <= 5.0:
        raise HTTPException(status_code=400, detail="threshold must be 1.5-5.0")
    return analytics.expense_anomalies(db, threshold)


# =============================================================================
# Scenario analysis
# =============================================================================

@app.get("/api/scenario", tags=["Planning"])
def scenario(
    enrollment_change: float = 0.0,
    fee_change: float = 0.0,
    grant_change: float = 0.0,
    salary_change: float = 0.0,
    db: Session = Depends(get_db),
):
    """Model enrolment, fee, grant and salary changes on net surplus."""
    for name, val, lo, hi in [
        ("enrollment_change", enrollment_change, -50, 50),
        ("fee_change", fee_change, -30, 30),
        ("grant_change", grant_change, -100, 100),
        ("salary_change", salary_change, -20, 20),
    ]:
        if not lo <= val <= hi:
            raise HTTPException(status_code=400, detail=f"{name} must be {lo}..{hi}")
    return analytics.simulate_scenario(
        db,
        enrollment_change=enrollment_change,
        fee_change=fee_change,
        grant_change=grant_change,
        salary_change=salary_change,
    )


# =============================================================================
# AI insights
# =============================================================================

class AskRequest(BaseModel):
    question: str


@app.get("/api/ai/executive-summary", tags=["AI"])
def ai_executive_summary(db: Session = Depends(get_db)):
    """AI-generated executive summary: observations, risks, opportunities, actions."""
    return ai_insights.generate_executive_summary(db)


@app.get("/api/ai/suggested-questions", tags=["AI"])
def ai_suggested_questions():
    """Starter questions for the AI financial analyst."""
    return {"questions": ai_insights.SUGGESTED_QUESTIONS}


@app.post("/api/ai/ask", tags=["AI"])
def ai_ask(req: AskRequest, db: Session = Depends(get_db)):
    """Ask the AI financial analyst a question grounded in current metrics."""
    question = (req.question or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="question is required")
    return ai_insights.answer_question(db, question)
