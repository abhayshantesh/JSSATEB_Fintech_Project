"""
Institutional Financial Analytics — Service
===========================================

Decision-support analytics for institutional financial management, computed from
the transaction ledger. Every function returns ready-to-present figures using
finance terms (see ``domain.py``).

Capability map
--------------
    executive_summary()      -> top-line KPIs + financial-health score + risk
    revenue_forecast()       -> revenue forecast with confidence band
    expense_forecast()       -> expense forecast with confidence band
    financial_position()     -> assets / liabilities / net worth / liquidity
    vendor_analysis()        -> spend, transactions, concentration risk per vendor
    expense_breakdown()      -> spend by category + year-over-year change
    budget_variance()        -> budget vs actual variance by category
    expense_anomalies()      -> statistically unusual expense transactions
    monthly_trends()         -> revenue vs expense time series for charts
    simulate_scenario()      -> enrolment / fee / grant / salary what-if
"""

import math
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from sqlalchemy import func
from sqlalchemy.orm import Session

try:
    from .. import models, domain
except ImportError:  # pragma: no cover - runtime import shim
    import models
    import domain

try:
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    _STATS_AVAILABLE = True
except ImportError:  # pragma: no cover
    _STATS_AVAILABLE = False


# =============================================================================
# Internal helpers
# =============================================================================

def _monthly_series(db: Session, model_cls) -> pd.DataFrame:
    """Return a monthly-aggregated [month, value] frame for a txn model."""
    rows = db.query(model_cls.txn_date, model_cls.amount).all()
    if not rows:
        return pd.DataFrame(columns=["month", "value"])
    df = pd.DataFrame(rows, columns=["month", "value"])
    df["month"] = pd.to_datetime(df["month"])
    df["value"] = df["value"].astype(float)
    monthly = df.set_index("month").resample("MS").sum().reset_index()
    return monthly.rename(columns={"value": "value"})


def _forecast_series(monthly: pd.DataFrame, periods: int) -> List[Dict[str, Any]]:
    """
    Forecast a monthly series with a confidence band.

    Uses Holt-Winters exponential smoothing (level + additive trend) when
    available, otherwise an OLS linear trend. The band is derived from the
    in-sample residual standard deviation (±1.96σ ≈ 95%).
    """
    if len(monthly) < 4:
        return []

    y = monthly["value"].to_numpy(dtype=float)
    last_date = monthly["month"].iloc[-1]
    future_dates = [last_date + pd.DateOffset(months=i) for i in range(1, periods + 1)]

    point: np.ndarray
    resid_std: float

    if _STATS_AVAILABLE and len(y) >= 6:
        try:
            model = ExponentialSmoothing(
                y, trend="add", seasonal=None, initialization_method="estimated"
            ).fit()
            point = np.asarray(model.forecast(periods), dtype=float)
            resid = y - model.fittedvalues
            resid_std = float(np.std(resid)) if len(resid) else 0.0
        except Exception:
            point, resid_std = _linear_trend(y, periods)
    else:
        point, resid_std = _linear_trend(y, periods)

    band = 1.96 * resid_std
    out: List[Dict[str, Any]] = []
    for d, p in zip(future_dates, point):
        p = max(0.0, float(p))
        out.append(
            {
                "period": d.strftime("%Y-%m"),
                "forecast": round(p, 2),
                "lower": round(max(0.0, p - band), 2),
                "upper": round(p + band, 2),
            }
        )
    return out


def _linear_trend(y: np.ndarray, periods: int):
    """OLS linear-trend fallback. Returns (point_forecast, residual_std)."""
    x = np.arange(len(y))
    A = np.vstack([x, np.ones(len(x))]).T
    (slope, intercept), *_ = np.linalg.lstsq(A, y, rcond=None)
    fitted = slope * x + intercept
    resid_std = float(np.std(y - fitted))
    future_x = np.arange(len(y), len(y) + periods)
    return slope * future_x + intercept, resid_std


def _forecast_confidence(monthly: pd.DataFrame) -> float:
    """
    Forecast confidence (0-100) from the stability of the historical series.

    Lower coefficient-of-variation => higher confidence. A transparent,
    defensible heuristic.
    """
    if len(monthly) < 4:
        return 60.0
    y = monthly["value"].to_numpy(dtype=float)
    mean = float(np.mean(y))
    if mean <= 0:
        return 60.0
    cv = float(np.std(y) / mean)
    confidence = 100.0 - min(cv * 120.0, 45.0)
    return round(max(50.0, min(95.0, confidence)), 1)


def _pct_change(curr: float, prev: float) -> float:
    if prev == 0:
        return 0.0
    return round((curr - prev) / abs(prev) * 100, 1)


def _trailing_growth(monthly: pd.DataFrame) -> float:
    """
    Year-over-year growth: trailing-12-month total vs the prior 12 months.

    The right trend metric for strongly seasonal revenue/expense series — it is
    immune to seasonality and partial trailing months (which otherwise produce
    wild swings). Falls back to shorter windows when history is thin.
    """
    y = monthly["value"].to_numpy(dtype=float) if not monthly.empty else np.array([])
    if len(y) >= 24:
        recent = float(np.sum(y[-12:]))
        prior = float(np.sum(y[-24:-12]))
        return _pct_change(recent, prior)
    if len(y) >= 6:
        half = len(y) // 2
        return _pct_change(float(np.sum(y[-half:])), float(np.sum(y[-2 * half : -half])))
    if len(y) >= 2:
        return _pct_change(float(y[-1]), float(y[-2]))
    return 0.0


# =============================================================================
# Executive summary & KPIs
# =============================================================================

def executive_summary(db: Session) -> Dict[str, Any]:
    """Top-line KPIs, financial-health score and risk posture for management."""
    revenue = _monthly_series(db, models.RevenueTransaction)
    expense = _monthly_series(db, models.ExpenseTransaction)

    total_revenue = float(revenue["value"].sum()) if not revenue.empty else 0.0
    total_expenses = float(expense["value"].sum()) if not expense.empty else 0.0
    surplus_value = total_revenue - total_expenses
    margin_pct = (surplus_value / total_revenue * 100) if total_revenue else 0.0

    # Year-over-year growth (trailing 12 months vs prior 12).
    revenue_growth = _trailing_growth(revenue)
    expense_growth = _trailing_growth(expense)

    # Budget adherence.
    alloc = float(db.query(func.sum(models.Budget.allocated_amount)).scalar() or 0)
    spent = float(db.query(func.sum(models.Budget.spent_amount)).scalar() or 0)
    budget_adherence = (spent / alloc * 100) if alloc else 0.0

    pos = financial_position(db)
    risk = _risk_posture(db, margin_pct, expense_growth, pos)
    health = _health_score(margin_pct, expense_growth, pos["liquidity_ratio"], risk["score"])

    return {
        "total_revenue": round(total_revenue, 2),
        "student_fee_count": domain.value_to_students(total_revenue),
        "total_expenses": round(total_expenses, 2),
        "net_surplus": round(surplus_value, 2),
        "operating_margin_pct": round(margin_pct, 2),
        "revenue_growth_pct": revenue_growth,
        "expense_growth_pct": expense_growth,
        "budget_adherence_pct": round(budget_adherence, 1),
        "forecast_confidence_pct": _forecast_confidence(revenue),
        "total_assets": pos["total_assets"],
        "net_worth": pos["net_worth"],
        "liquidity_ratio": pos["liquidity_ratio"],
        "health_score": health["score"],
        "health_status": health["status"],
        "risk_score": risk["score"],
        "risk_level": risk["level"],
    }


def _health_score(margin_pct, expense_growth, liquidity_ratio, risk_score) -> Dict[str, Any]:
    """Composite financial-health score (0-100)."""
    margin_component = max(0.0, min(40.0, margin_pct * 0.8))          # up to 40
    cost_component = max(0.0, 25.0 - max(0.0, expense_growth) * 1.5)   # up to 25
    liquidity_component = max(0.0, min(20.0, liquidity_ratio * 10.0))  # up to 20
    risk_component = max(0.0, 15.0 - risk_score * 0.15)               # up to 15
    score = round(margin_component + cost_component + liquidity_component + risk_component, 1)
    score = max(0.0, min(100.0, score))
    status = (
        "Strong" if score >= 75 else
        "Stable" if score >= 60 else
        "Watch" if score >= 45 else
        "At Risk"
    )
    return {"score": score, "status": status}


def _risk_posture(db: Session, margin_pct, expense_growth, pos) -> Dict[str, Any]:
    """Aggregate financial-risk score (0-100, higher = more risk)."""
    vendors = vendor_analysis(db)
    high_risk = sum(1 for v in vendors if v["risk_tier"] == "High")
    concentration = vendors[0]["spend_share_pct"] if vendors else 0.0

    score = 0.0
    score += max(0.0, expense_growth) * 1.2                  # rising expenses
    score += max(0.0, 8.0 - margin_pct) * 2.0               # thin surplus
    score += high_risk * 6.0                                 # vendor concentration
    score += max(0.0, concentration - 25) * 0.8             # over-concentration
    score += max(0.0, 1.0 - pos["liquidity_ratio"]) * 20.0  # weak liquidity
    score = round(max(0.0, min(100.0, score)), 1)
    level = "High" if score >= 60 else "Moderate" if score >= 30 else "Low"
    return {"score": score, "level": level}


# =============================================================================
# Forecasting
# =============================================================================

def revenue_forecast(db: Session, periods: int = 12) -> Dict[str, Any]:
    """Forecast revenue with a 95% confidence band."""
    monthly = _monthly_series(db, models.RevenueTransaction)
    return {
        "metric": "Revenue",
        "unit": "INR",
        "confidence_pct": _forecast_confidence(monthly),
        "history": [
            {"period": r["month"].strftime("%Y-%m"), "actual": round(float(r["value"]), 2)}
            for _, r in monthly.tail(18).iterrows()
        ],
        "forecast": _forecast_series(monthly, periods),
    }


def expense_forecast(db: Session, periods: int = 12) -> Dict[str, Any]:
    """Forecast expenses with a 95% confidence band."""
    monthly = _monthly_series(db, models.ExpenseTransaction)
    return {
        "metric": "Expenses",
        "unit": "INR",
        "confidence_pct": _forecast_confidence(monthly),
        "history": [
            {"period": r["month"].strftime("%Y-%m"), "actual": round(float(r["value"]), 2)}
            for _, r in monthly.tail(18).iterrows()
        ],
        "forecast": _forecast_series(monthly, periods),
    }


# =============================================================================
# Financial position (assets / liabilities)
# =============================================================================

def financial_position(db: Session) -> Dict[str, Any]:
    """
    Financial-position snapshot: assets, liabilities, net worth and liquidity.

    Liquidity ratio compares total assets to total liabilities — a standard
    indicator of an institution's ability to cover obligations.
    """
    total_assets = float(db.query(func.sum(models.Asset.value)).scalar() or 0)
    total_liabilities = float(db.query(func.sum(models.Liability.amount)).scalar() or 0)
    net_worth = total_assets - total_liabilities
    liquidity_ratio = (total_assets / total_liabilities) if total_liabilities else 0.0

    return {
        "total_assets": round(total_assets, 2),
        "total_liabilities": round(total_liabilities, 2),
        "net_worth": round(net_worth, 2),
        "liquidity_ratio": round(liquidity_ratio, 2),
    }


# =============================================================================
# Vendor analysis
# =============================================================================

def vendor_analysis(db: Session, limit: int = 12) -> List[Dict[str, Any]]:
    """
    Per-vendor spend, transaction count, average value and concentration risk.

    All figures are derived directly from the expense ledger. The risk tier
    flags spend concentration (over-reliance on a single vendor), a genuine
    procurement-governance concern for institutions.
    """
    rows = (
        db.query(
            models.ExpenseTransaction.vendor,
            func.sum(models.ExpenseTransaction.amount).label("spend"),
            func.count(models.ExpenseTransaction.txn_id).label("txns"),
        )
        .filter(models.ExpenseTransaction.vendor.isnot(None))
        .filter(models.ExpenseTransaction.vendor != "Bank Payroll")
        .group_by(models.ExpenseTransaction.vendor)
        .order_by(func.sum(models.ExpenseTransaction.amount).desc())
        .limit(limit)
        .all()
    )
    if not rows:
        return []

    total_spend = sum(float(r.spend) for r in rows) or 1.0
    vendors: List[Dict[str, Any]] = []
    for r in rows:
        spend = float(r.spend)
        txns = int(r.txns)
        share = round(spend / total_spend * 100, 1)
        avg_value = round(spend / txns, 2) if txns else 0.0

        risk_tier = (
            "High" if share > 30 else
            "Medium" if share > 18 else
            "Low"
        )
        vendors.append(
            {
                "vendor": r.vendor,
                "spend": round(spend, 2),
                "transactions": txns,
                "avg_transaction": avg_value,
                "spend_share_pct": share,
                "risk_tier": risk_tier,
            }
        )
    return vendors


# =============================================================================
# Expense breakdown & budget variance
# =============================================================================

def expense_breakdown(db: Session) -> List[Dict[str, Any]]:
    """Spend by expense category with year-over-year change."""
    totals = (
        db.query(
            models.ExpenseTransaction.category,
            func.sum(models.ExpenseTransaction.amount),
        )
        .group_by(models.ExpenseTransaction.category)
        .all()
    )

    rows = db.query(
        models.ExpenseTransaction.txn_date,
        models.ExpenseTransaction.category,
        models.ExpenseTransaction.amount,
    ).all()
    df = pd.DataFrame(rows, columns=["date", "category", "amount"])
    delta_map: Dict[str, float] = {}
    if not df.empty:
        df["date"] = pd.to_datetime(df["date"])
        df["month"] = df["date"].dt.to_period("M")
        # Year-over-year change per category (trailing 12 months vs prior 12).
        months = sorted(df["month"].unique())
        if len(months) >= 24:
            recent_set, prior_set = set(months[-12:]), set(months[-24:-12])
            g_recent = df[df["month"].isin(recent_set)].groupby("category")["amount"].sum()
            g_prior = df[df["month"].isin(prior_set)].groupby("category")["amount"].sum()
            for cat in set(g_recent.index) | set(g_prior.index):
                delta_map[cat] = _pct_change(
                    float(g_recent.get(cat, 0)), float(g_prior.get(cat, 0))
                )

    grand_total = sum(float(t[1]) for t in totals) or 1.0
    breakdown = []
    for cat, amt in totals:
        amt = float(amt)
        breakdown.append(
            {
                "category": domain.expense_category(cat),
                "amount": round(amt, 2),
                "share_pct": round(amt / grand_total * 100, 1),
                "yoy_change_pct": delta_map.get(cat, 0.0),
            }
        )
    breakdown.sort(key=lambda d: d["amount"], reverse=True)
    return breakdown


def budget_variance(db: Session) -> List[Dict[str, Any]]:
    """Budget vs actual variance by category."""
    rows = (
        db.query(
            models.Budget.category,
            func.sum(models.Budget.allocated_amount).label("planned"),
            func.sum(models.Budget.spent_amount).label("actual"),
        )
        .group_by(models.Budget.category)
        .all()
    )
    out = []
    for cat, planned, actual in rows:
        planned = float(planned or 0)
        actual = float(actual or 0)
        variance = actual - planned
        out.append(
            {
                "category": domain.budget_category(cat),
                "planned": round(planned, 2),
                "actual": round(actual, 2),
                "variance": round(variance, 2),
                "variance_pct": _pct_change(actual, planned),
                "status": "Over" if variance > 0 else "Under",
            }
        )
    out.sort(key=lambda d: abs(d["variance"]), reverse=True)
    return out


# =============================================================================
# Expense anomalies
# =============================================================================

def expense_anomalies(db: Session, threshold: float = 2.5) -> Dict[str, Any]:
    """
    Flag unusually large expense transactions using a per-category Z-score.

    Comparing each transaction against its own category (rather than the whole
    ledger) avoids flagging every payroll run and surfaces genuine outliers.
    """
    rows = db.query(models.ExpenseTransaction).filter(
        models.ExpenseTransaction.category != "Salary"
    ).all()
    if not rows:
        return {"anomalies": [], "total_count": 0}

    df = pd.DataFrame(
        [
            {
                "txn_id": r.txn_id,
                "date": r.txn_date,
                "amount": float(r.amount),
                "category": r.category,
                "vendor": r.vendor,
            }
            for r in rows
        ]
    )

    anomalies: List[Dict[str, Any]] = []
    for category, grp in df.groupby("category"):
        if len(grp) < 5:
            continue
        mean, std = grp["amount"].mean(), grp["amount"].std()
        if not std or math.isnan(std):
            continue
        grp = grp.assign(z=(grp["amount"] - mean).abs() / std)
        for _, row in grp[grp["z"] > threshold].iterrows():
            z = float(row["z"])
            anomalies.append(
                {
                    "txn_id": row["txn_id"],
                    "date": str(row["date"]),
                    "amount": round(float(row["amount"]), 2),
                    "category": domain.expense_category(row["category"]),
                    "vendor": row["vendor"] or "—",
                    "deviation_sigma": round(z, 1),
                    "severity": "High" if z > 3.5 else "Medium",
                }
            )

    anomalies.sort(key=lambda a: a["deviation_sigma"], reverse=True)
    return {"anomalies": anomalies[:50], "total_count": len(anomalies)}


# =============================================================================
# Scenario analysis (enrolment / fee / grant / salary)
# =============================================================================

def simulate_scenario(
    db: Session,
    enrollment_change: float = 0.0,
    fee_change: float = 0.0,
    grant_change: float = 0.0,
    salary_change: float = 0.0,
) -> Dict[str, Any]:
    """
    What-if planning: model enrolment, fee, grant and salary changes.

    Args (all percentages):
        enrollment_change : change in student enrolment (scales tuition revenue)
        fee_change        : change in fee structure (scales tuition revenue)
        grant_change      : change in research-grant income
        salary_change     : change in salary expense
    """
    total_revenue = float(db.query(func.sum(models.RevenueTransaction.amount)).scalar() or 0)
    total_expenses = float(db.query(func.sum(models.ExpenseTransaction.amount)).scalar() or 0)

    tuition = float(
        db.query(func.sum(models.RevenueTransaction.amount))
        .filter(models.RevenueTransaction.category.like("Tuition%"))
        .scalar() or 0
    )
    grants = float(
        db.query(func.sum(models.RevenueTransaction.amount))
        .filter(models.RevenueTransaction.category == "Research Grant")
        .scalar() or 0
    )
    other_revenue = total_revenue - tuition - grants

    salary = float(
        db.query(func.sum(models.ExpenseTransaction.amount))
        .filter(models.ExpenseTransaction.category == "Salary")
        .scalar() or 0
    )
    other_expense = total_expenses - salary

    # Tuition responds to BOTH enrolment and fee changes (compounding).
    tuition_factor = (1 + enrollment_change / 100) * (1 + fee_change / 100)
    proj_tuition = tuition * tuition_factor
    proj_grants = grants * (1 + grant_change / 100)
    proj_revenue = proj_tuition + proj_grants + other_revenue

    proj_salary = salary * (1 + salary_change / 100)
    proj_expenses = proj_salary + other_expense

    baseline_surplus = total_revenue - total_expenses
    projected_surplus = proj_revenue - proj_expenses
    surplus_change = projected_surplus - baseline_surplus

    baseline_margin_pct = (baseline_surplus / total_revenue * 100) if total_revenue else 0
    projected_margin_pct = (projected_surplus / proj_revenue * 100) if proj_revenue else 0

    if surplus_change > 0:
        summary = f"Net surplus improves by ₹{surplus_change:,.0f}"
    elif surplus_change < 0:
        summary = f"Net surplus declines by ₹{abs(surplus_change):,.0f}"
    else:
        summary = "No change to net surplus"

    return {
        "baseline": {
            "total_revenue": round(total_revenue, 2),
            "total_expenses": round(total_expenses, 2),
            "net_surplus": round(baseline_surplus, 2),
            "margin_pct": round(baseline_margin_pct, 2),
        },
        "projected": {
            "total_revenue": round(proj_revenue, 2),
            "total_expenses": round(proj_expenses, 2),
            "net_surplus": round(projected_surplus, 2),
            "margin_pct": round(projected_margin_pct, 2),
        },
        "impact": {
            "revenue_change": round(proj_revenue - total_revenue, 2),
            "expense_change": round(proj_expenses - total_expenses, 2),
            "surplus_change": round(surplus_change, 2),
            "margin_pct_change": round(projected_margin_pct - baseline_margin_pct, 2),
            "summary": summary,
        },
    }


# =============================================================================
# Time series for charts
# =============================================================================

def monthly_trends(db: Session, limit_months: int = 18) -> List[Dict[str, Any]]:
    """Monthly revenue vs expenses (and surplus) for trend charts."""
    revenue = _monthly_series(db, models.RevenueTransaction).rename(columns={"value": "revenue"})
    expense = _monthly_series(db, models.ExpenseTransaction).rename(columns={"value": "expenses"})
    if revenue.empty and expense.empty:
        return []
    merged = pd.merge(revenue, expense, on="month", how="outer").fillna(0)
    merged = merged.sort_values("month").tail(limit_months)
    return [
        {
            "period": r["month"].strftime("%Y-%m"),
            "revenue": round(float(r["revenue"]), 2),
            "expenses": round(float(r["expenses"]), 2),
            "surplus": round(float(r["revenue"] - r["expenses"]), 2),
        }
        for _, r in merged.iterrows()
    ]
