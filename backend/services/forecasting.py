
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
try:
    from .. import models
except ImportError:
    import models
from typing import List, Dict, Any
from datetime import timedelta

def _linear_forecast(monthly_df: pd.DataFrame, months: int) -> List[Dict[str, Any]]:
    """
    Generate linear regression forecast from monthly aggregated data.
    """
    if len(monthly_df) < 2:
        return []
    
    monthly_df = monthly_df.copy()
    monthly_df['month_index'] = np.arange(len(monthly_df))
    
    x = monthly_df['month_index'].values
    y = monthly_df['y'].values
    
    # Linear regression: y = mx + c
    A = np.vstack([x, np.ones(len(x))]).T
    m, c = np.linalg.lstsq(A, y, rcond=None)[0]
    
    # Generate future predictions
    last_idx = x[-1]
    future_indices = np.arange(last_idx + 1, last_idx + 1 + months)
    future_dates = [
        monthly_df['ds'].iloc[-1] + timedelta(days=30 * i) 
        for i in range(1, months + 1)
    ]
    
    predictions = m * future_indices + c
    
    return [
        {
            "date": d.strftime("%Y-%m-%d"), 
            "predicted_amount": max(0, float(val))
        }
        for d, val in zip(future_dates, predictions)
    ]

def _aggregate_monthly(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate transaction data by month."""
    df = df.copy()
    df['ds'] = pd.to_datetime(df['ds'])
    return df.set_index('ds').resample('M').sum().reset_index()

def generate_revenue_forecast(db: Session, months: int = 12) -> List[Dict[str, Any]]:
    """Generate revenue forecast using linear regression."""
    results = db.query(
        models.RevenueTransaction.txn_date, 
        models.RevenueTransaction.amount
    ).all()
    
    if not results:
        return []

    df = pd.DataFrame(results, columns=['ds', 'y'])
    monthly_df = _aggregate_monthly(df)
    
    return _linear_forecast(monthly_df, months)

def generate_expense_forecast(db: Session, months: int = 12) -> List[Dict[str, Any]]:
    """Generate expense forecast using linear regression."""
    results = db.query(
        models.ExpenseTransaction.txn_date, 
        models.ExpenseTransaction.amount
    ).all()
    
    if not results:
        return []

    df = pd.DataFrame(results, columns=['ds', 'y'])
    monthly_df = _aggregate_monthly(df)
    
    return _linear_forecast(monthly_df, months)
