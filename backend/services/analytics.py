
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func
try:
    from .. import models
except ImportError:
    import models

try:
    from ..utils import format_indian_number
except ImportError:
    from utils import format_indian_number

from typing import List, Dict, Any

def get_monthly_trends(db: Session, limit_months: int = 24) -> List[Dict[str, Any]]:
    """
    Get monthly revenue and expense trends.
    """
    # Revenue by month
    rev_results = db.query(
        models.RevenueTransaction.txn_date, 
        models.RevenueTransaction.amount
    ).all()
    
    # Expenses by month
    exp_results = db.query(
        models.ExpenseTransaction.txn_date, 
        models.ExpenseTransaction.amount
    ).all()
    
    if not rev_results and not exp_results:
        return []
    
    # Process revenue
    rev_df = pd.DataFrame(rev_results, columns=['ds', 'amount']) if rev_results else pd.DataFrame(columns=['ds', 'amount'])
    if not rev_df.empty:
        rev_df['ds'] = pd.to_datetime(rev_df['ds'])
        rev_monthly = rev_df.set_index('ds').resample('M').sum().reset_index()
        rev_monthly.columns = ['month', 'revenue']
    else:
        rev_monthly = pd.DataFrame(columns=['month', 'revenue'])
    
    # Process expenses
    exp_df = pd.DataFrame(exp_results, columns=['ds', 'amount']) if exp_results else pd.DataFrame(columns=['ds', 'amount'])
    if not exp_df.empty:
        exp_df['ds'] = pd.to_datetime(exp_df['ds'])
        exp_monthly = exp_df.set_index('ds').resample('M').sum().reset_index()
        exp_monthly.columns = ['month', 'expenses']
    else:
        exp_monthly = pd.DataFrame(columns=['month', 'expenses'])
    
    # Merge
    if rev_monthly.empty and exp_monthly.empty:
        return []
    
    if rev_monthly.empty:
        merged = exp_monthly.copy()
        merged['revenue'] = 0
    elif exp_monthly.empty:
        merged = rev_monthly.copy()
        merged['expenses'] = 0
    else:
        merged = pd.merge(rev_monthly, exp_monthly, on='month', how='outer').fillna(0)
    
    merged = merged.sort_values('month').tail(limit_months)
    
    return [
        {
            "month": row['month'].strftime("%Y-%m"),
            "revenue": float(row['revenue']),
            "expenses": float(row['expenses'])
        }
        for _, row in merged.iterrows()
    ]

def get_correlation_analysis(db: Session) -> Dict[str, float]:
    """
    Compute correlations between financial metrics.
    """
    trends = get_monthly_trends(db, limit_months=60)
    if len(trends) < 3:
        return {}
    
    df = pd.DataFrame(trends)
    correlations = {}
    
    # Revenue vs Expenses correlation
    if 'revenue' in df.columns and 'expenses' in df.columns:
        if df['revenue'].std() > 0 and df['expenses'].std() > 0:
            correlations['revenue_expenses'] = float(df['revenue'].corr(df['expenses']))
    
    # Student count proxy (if needed in future)
    
    # Net surplus ratio trend
    df['surplus'] = df['revenue'] - df['expenses']
    df['surplus_ratio'] = df['surplus'] / df['revenue'].replace(0, np.nan)
    
    if df['surplus_ratio'].notna().sum() > 2:
        df['time_idx'] = range(len(df))
        correlations['surplus_trend'] = float(df['surplus_ratio'].corr(df['time_idx']))
    
    return correlations

def detect_anomalies(db: Session, threshold: float = 2.0) -> Dict[str, Any]:
    """
    Detect anomalies in financial transactions using statistical methods.
    """
    anomalies = []
    
    # Detect revenue anomalies
    rev_results = db.query(models.RevenueTransaction).all()
    if rev_results:
        amounts = [float(r.amount) for r in rev_results]
        mean_amt = np.mean(amounts)
        std_amt = np.std(amounts)
        
        if std_amt > 0:
            for txn in rev_results:
                z_score = abs(float(txn.amount) - mean_amt) / std_amt
                if z_score > threshold:
                    severity = "high" if z_score > threshold * 1.5 else "medium"
                    anomaly_type = "unusually_high" if float(txn.amount) > mean_amt else "unusually_low"
                    anomalies.append({
                        "txn_id": txn.txn_id,
                        "txn_date": txn.txn_date,
                        "amount": float(txn.amount),
                        "category": txn.category,
                        "anomaly_type": f"revenue_{anomaly_type}",
                        "severity": severity
                    })
    
    # Detect expense anomalies
    exp_results = db.query(models.ExpenseTransaction).all()
    if exp_results:
        amounts = [float(r.amount) for r in exp_results]
        mean_amt = np.mean(amounts)
        std_amt = np.std(amounts)
        
        if std_amt > 0:
            for txn in exp_results:
                z_score = abs(float(txn.amount) - mean_amt) / std_amt
                if z_score > threshold:
                    severity = "high" if z_score > threshold * 1.5 else "medium"
                    anomaly_type = "unusually_high" if float(txn.amount) > mean_amt else "unusually_low"
                    anomalies.append({
                        "txn_id": txn.txn_id,
                        "txn_date": txn.txn_date,
                        "amount": float(txn.amount),
                        "category": txn.category,
                        "anomaly_type": f"expense_{anomaly_type}",
                        "severity": severity
                    })
    
    anomalies.sort(key=lambda x: (x['severity'] == 'high', x['amount']), reverse=True)
    
    return {
        "anomalies": anomalies[:100],
        "total_count": len(anomalies)
    }

def simulate_scenario(
    db: Session,
    enrollment_change: float = 0.0,
    fee_change: float = 0.0,
    grant_change: float = 0.0,
    salary_change: float = 0.0
) -> Dict[str, Any]:
    """
    Simulate what-if scenarios for financial planning.
    """
    # Get current baseline
    total_revenue = db.query(func.sum(models.RevenueTransaction.amount)).scalar() or 0
    total_expenses = db.query(func.sum(models.ExpenseTransaction.amount)).scalar() or 0
    
    # Revenue breakdown
    fee_revenue = db.query(func.sum(models.RevenueTransaction.amount)).filter(
        models.RevenueTransaction.category.in_(['Tuition', 'Hostel', 'Transport'])
    ).scalar() or 0
    
    grant_revenue = db.query(func.sum(models.RevenueTransaction.amount)).filter(
        models.RevenueTransaction.category.in_(['Research Grant', 'Donation', 'Consultancy'])
    ).scalar() or 0
    
    other_revenue = float(total_revenue) - float(fee_revenue) - float(grant_revenue)
    
    # Expense breakdown
    salary_expense = db.query(func.sum(models.ExpenseTransaction.amount)).filter(
        models.ExpenseTransaction.category == 'Salary'
    ).scalar() or 0
    
    other_expense = float(total_expenses) - float(salary_expense)
    
    # Convert to floats
    total_revenue = float(total_revenue)
    total_expenses = float(total_expenses)
    fee_revenue = float(fee_revenue)
    grant_revenue = float(grant_revenue)
    salary_expense = float(salary_expense)
    
    # Calculate projected
    enrollment_factor = 1 + (enrollment_change / 100)
    fee_factor = 1 + (fee_change / 100)
    projected_fee_revenue = fee_revenue * enrollment_factor * fee_factor
    
    grant_factor = 1 + (grant_change / 100)
    projected_grant_revenue = grant_revenue * grant_factor
    
    projected_revenue = projected_fee_revenue + projected_grant_revenue + other_revenue
    
    salary_factor = 1 + (salary_change / 100)
    projected_salary = salary_expense * salary_factor
    
    enrollment_expense_factor = 1 + ((enrollment_change / 100) * 0.3)
    projected_other_expense = other_expense * enrollment_expense_factor
    
    projected_expenses = projected_salary + projected_other_expense
    
    # Changes
    revenue_change = projected_revenue - total_revenue
    expense_change = projected_expenses - total_expenses
    baseline_surplus = total_revenue - total_expenses
    projected_surplus = projected_revenue - projected_expenses
    surplus_change = projected_surplus - baseline_surplus
    
    if surplus_change > 0:
        impact_summary = f"Positive impact: Surplus increases by ₹{format_indian_number(abs(surplus_change))}"
    elif surplus_change < 0:
        impact_summary = f"Negative impact: Surplus decreases by ₹{format_indian_number(abs(surplus_change))}"
    else:
        impact_summary = "Neutral impact: No significant change in surplus"
    
    return {
        "baseline": {
            "total_revenue": round(total_revenue, 2),
            "total_expenses": round(total_expenses, 2),
            "net_surplus": round(baseline_surplus, 2),
            "fee_revenue": round(fee_revenue, 2),
            "grant_revenue": round(grant_revenue, 2),
            "salary_expense": round(salary_expense, 2)
        },
        "projected": {
            "total_revenue": round(projected_revenue, 2),
            "total_expenses": round(projected_expenses, 2),
            "net_surplus": round(projected_surplus, 2),
            "fee_revenue": round(projected_fee_revenue, 2),
            "grant_revenue": round(projected_grant_revenue, 2),
            "salary_expense": round(projected_salary, 2)
        },
        "impact": {
            "projected_revenue": round(projected_revenue, 2),
            "projected_expenses": round(projected_expenses, 2),
            "projected_surplus": round(projected_surplus, 2),
            "revenue_change": round(revenue_change, 2),
            "expense_change": round(expense_change, 2),
            "surplus_change": round(surplus_change, 2),
            "impact_summary": impact_summary
        }
    }
