"""
Fintech Project API

FastAPI backend for institutional financial forecasting and analytics.
Provides endpoints for dashboard metrics, transactions, forecasts, and analytics.
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

try:
    from . import models, schemas, database, ml_engine
except ImportError:
    import models, schemas, database, ml_engine

# =============================================================================
# APP CONFIGURATION
# =============================================================================

app = FastAPI(
    title="Fintech Project API",
    description="AI-Driven Institutional Financial Forecasting and Analytics System",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
get_db = database.get_db


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": "1.0.0"}


# =============================================================================
# DEPARTMENT ENDPOINTS
# =============================================================================

@app.get("/departments", response_model=List[schemas.Department], tags=["Departments"])
def read_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get list of departments."""
    departments = db.query(models.Department).offset(skip).limit(limit).all()
    return departments


# =============================================================================
# TRANSACTION ENDPOINTS
# =============================================================================

@app.get("/transactions/revenue", response_model=List[schemas.RevenueTransaction], tags=["Transactions"])
def read_revenue_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get revenue transactions, ordered by date descending."""
    txns = db.query(models.RevenueTransaction)\
        .order_by(models.RevenueTransaction.txn_date.desc())\
        .offset(skip).limit(limit).all()
    return txns


@app.get("/transactions/expenses", response_model=List[schemas.ExpenseTransaction], tags=["Transactions"])
def read_expense_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get expense transactions, ordered by date descending."""
    txns = db.query(models.ExpenseTransaction)\
        .order_by(models.ExpenseTransaction.txn_date.desc())\
        .offset(skip).limit(limit).all()
    return txns


# =============================================================================
# BUDGET ENDPOINTS
# =============================================================================

@app.get("/budgets", response_model=List[schemas.Budget], tags=["Budgets"])
def read_budgets(
    fiscal_year: str = None, 
    dept_id: str = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Get budgets with optional filters for fiscal year and department."""
    query = db.query(models.Budget)
    
    if fiscal_year:
        query = query.filter(models.Budget.fiscal_year == fiscal_year)
    if dept_id:
        query = query.filter(models.Budget.dept_id == dept_id)
    
    budgets = query.offset(skip).limit(limit).all()
    return budgets


# =============================================================================
# FEE STRUCTURE ENDPOINTS
# =============================================================================

@app.get("/fee-structures", response_model=List[schemas.FeeStructure], tags=["Fees"])
def read_fee_structures(
    academic_year: str = None,
    dept_id: str = None,
    fee_type: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get fee structures with optional filters."""
    query = db.query(models.FeeStructure)

    if academic_year:
        query = query.filter(models.FeeStructure.academic_year == academic_year)
    if dept_id:
        query = query.filter(models.FeeStructure.dept_id == dept_id)
    if fee_type:
        query = query.filter(models.FeeStructure.fee_type == fee_type)

    fees = query.offset(skip).limit(limit).all()
    return fees


@app.get("/budgets/summary", tags=["Budgets"])
def get_budget_summary(fiscal_year: str = None, db: Session = Depends(get_db)):
    """Get budget summary with allocated vs spent by category."""
    query = db.query(
        models.Budget.category,
        func.sum(models.Budget.allocated_amount).label('allocated'),
        func.sum(models.Budget.spent_amount).label('spent')
    ).group_by(models.Budget.category)
    
    if fiscal_year:
        query = query.filter(models.Budget.fiscal_year == fiscal_year)
    
    results = query.all()
    
    return [
        {
            "category": r[0],
            "allocated": float(r[1]) if r[1] else 0,
            "spent": float(r[2]) if r[2] else 0,
            "utilization": round(float(r[2]) / float(r[1]) * 100, 2) if r[1] and float(r[1]) > 0 else 0
        }
        for r in results
    ]


# =============================================================================
# DASHBOARD ENDPOINTS
# =============================================================================

@app.get("/dashboard/metrics", response_model=schemas.DashboardMetrics, tags=["Dashboard"])
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Get aggregate dashboard metrics."""
    total_rev = db.query(func.sum(models.RevenueTransaction.amount)).scalar() or 0.0
    total_exp = db.query(func.sum(models.ExpenseTransaction.amount)).scalar() or 0.0
    salary_exp = db.query(func.sum(models.ExpenseTransaction.amount))\
        .filter(models.ExpenseTransaction.category == 'Salary').scalar() or 0.0
    
    return {
        "total_revenue": float(total_rev),
        "total_expenses": float(total_exp),
        "net_surplus": float(total_rev - total_exp),
        "salary_expense": float(salary_exp)
    }


@app.get("/dashboard/stats", response_model=schemas.DashboardStats, tags=["Dashboard"])
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get calculated dashboard statistics.
    
    Returns:
    - Operating Margin
    - Budget Utilization
    - Cash Flow Stability
    - Growth Rates
    """
    return ml_engine.calculate_dashboard_stats(db)


# =============================================================================
# ANALYTICS ENDPOINTS
# =============================================================================

@app.get("/analytics/trends", response_model=List[schemas.MonthlyTrend], tags=["Analytics"])
def get_monthly_trends(limit_months: int = 24, db: Session = Depends(get_db)):
    """
    Get monthly revenue and expense trends.
    
    Used for dashboard charts and trend analysis.
    """
    if limit_months < 1 or limit_months > 60:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 60 months")
    return ml_engine.get_monthly_trends(db, limit_months)


@app.get("/analytics/forecast/revenue", tags=["Analytics"])
def get_revenue_forecast(months: int = 12, db: Session = Depends(get_db)):
    """
    Generate revenue forecast using ARIMA model.
    """
    if months < 1 or months > 60:
        raise HTTPException(status_code=400, detail="Months must be between 1 and 60")
    return ml_engine.generate_revenue_forecast(db, months)


@app.get("/analytics/forecast/expense", tags=["Analytics"])
def get_expense_forecast(months: int = 12, db: Session = Depends(get_db)):
    """
    Generate expense forecast using ARIMA model.
    """
    if months < 1 or months > 60:
        raise HTTPException(status_code=400, detail="Months must be between 1 and 60")
    return ml_engine.generate_expense_forecast(db, months)


@app.get("/analytics/correlation", response_model=schemas.CorrelationResult, tags=["Analytics"])
def get_correlations(db: Session = Depends(get_db)):
    """
    Get correlation analysis between financial metrics.
    
    Implements SRS 6.3 - Correlation Analysis requirements.
    """
    correlations = ml_engine.get_correlation_analysis(db)
    return {"correlations": correlations}


@app.get("/analytics/anomalies", response_model=schemas.AnomalyResponse, tags=["Analytics"])
def get_anomalies(threshold: float = 2.0, db: Session = Depends(get_db)):
    """
    Detect anomalies in financial transactions.
    
    Uses statistical Z-score method for anomaly detection.
    Implements SRS 6.5 - Anomaly Detection requirements.
    
    Args:
        threshold: Number of standard deviations for anomaly threshold (default: 2.0)
    """
    if threshold < 1.0 or threshold > 5.0:
        raise HTTPException(status_code=400, detail="Threshold must be between 1.0 and 5.0")
    return ml_engine.detect_anomalies(db, threshold)


@app.get("/analytics/financial-health", response_model=schemas.FinancialHealthIndex, tags=["Analytics"])
def get_financial_health(db: Session = Depends(get_db)):
    """
    Calculate Financial Health Index.
    
    Returns composite score based on surplus ratio, liquidity, 
    expense deviation, and salary-to-revenue ratio.
    Implements SRS 6.8 - Financial Health Scoring requirements.
    """
    return ml_engine.calculate_financial_health(db)


@app.get("/analytics/expense-distribution", tags=["Analytics"])
def get_expense_distribution(db: Session = Depends(get_db)):
    """
    Get expense breakdown by category.
    
    Returns data suitable for pie chart visualization.
    """
    return ml_engine.get_expense_distribution(db)


# =============================================================================
# SCENARIO ANALYSIS ENDPOINTS (SRS 6.7)
# =============================================================================

@app.get("/analytics/scenario", tags=["Analytics"])
def run_scenario_analysis(
    enrollment_change: float = 0.0,
    fee_change: float = 0.0,
    grant_change: float = 0.0,
    salary_change: float = 0.0,
    db: Session = Depends(get_db)
):
    """
    Simulate what-if scenarios for financial planning.
    
    Implements SRS 6.7 - Scenario Analysis requirements.
    
    Args:
        enrollment_change: Percentage change in enrollment (-50 to +50)
        fee_change: Percentage change in fee structure (-30 to +30)
        grant_change: Percentage change in grants (-100 to +100)
        salary_change: Percentage change in salary expenses (-20 to +20)
    
    Returns:
        Baseline vs projected financial comparison with impact summary.
    """
    # Validate ranges
    if not -50 <= enrollment_change <= 50:
        raise HTTPException(status_code=400, detail="Enrollment change must be between -50% and +50%")
    if not -30 <= fee_change <= 30:
        raise HTTPException(status_code=400, detail="Fee change must be between -30% and +30%")
    if not -100 <= grant_change <= 100:
        raise HTTPException(status_code=400, detail="Grant change must be between -100% and +100%")
    if not -20 <= salary_change <= 20:
        raise HTTPException(status_code=400, detail="Salary change must be between -20% and +20%")
    
    return ml_engine.simulate_scenario(
        db,
        enrollment_change=enrollment_change,
        fee_change=fee_change,
        grant_change=grant_change,
        salary_change=salary_change
    )


# =============================================================================
# PRESCRIPTIVE ANALYTICS ENDPOINTS (SRS 6.6)
# =============================================================================

@app.get("/analytics/recommendations", tags=["Analytics"])
def get_recommendations(db: Session = Depends(get_db)):
    """
    Generate prescriptive recommendations for cost optimization.
    
    Implements SRS 6.6 - Prescriptive Analytics requirements.
    
    Returns actionable recommendations for:
    - Optimal fund allocation
    - Cost optimization strategies
    - Salary-to-revenue ratio limits
    - Energy efficiency opportunities
    """
    return ml_engine.generate_recommendations(db)


# =============================================================================
# FINANCIAL POSITION ENDPOINTS
# =============================================================================

@app.get("/assets", response_model=List[schemas.Asset], tags=["Financial Position"])
def read_assets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get list of assets."""
    assets = db.query(models.Asset).offset(skip).limit(limit).all()
    return assets


@app.get("/liabilities", response_model=List[schemas.Liability], tags=["Financial Position"])
def read_liabilities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get list of liabilities."""
    liabilities = db.query(models.Liability).offset(skip).limit(limit).all()
    return liabilities


@app.get("/financial-position/summary", tags=["Financial Position"])
def get_financial_position(db: Session = Depends(get_db)):
    """
    Get financial position summary (Assets vs Liabilities).
    Calculates Net Worth.
    """
    total_assets = db.query(func.sum(models.Asset.value)).scalar() or 0.0
    total_liabilities = db.query(func.sum(models.Liability.amount)).scalar() or 0.0
    
    return {
        "total_assets": float(total_assets),
        "total_liabilities": float(total_liabilities),
        "net_worth": float(total_assets - total_liabilities)
    }


# =============================================================================
# REPORTS ENDPOINTS (SRS Section 8)
# =============================================================================

@app.get("/reports/quarterly", tags=["Reports"])
def get_quarterly_report(db: Session = Depends(get_db)):
    """
    Generate quarterly financial health report.
    
    Implements SRS Section 8 - Reporting Requirements.
    Returns comprehensive report data for audits, accreditation, and governance.
    """
    try:
        from .services.reports import generate_quarterly_report
    except ImportError:
        from services.reports import generate_quarterly_report
    return generate_quarterly_report(db)

