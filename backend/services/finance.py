
from sqlalchemy.orm import Session
from sqlalchemy import func
try:
    from .. import models
except ImportError:
    import models
from typing import List, Dict, Any
from datetime import datetime

def calculate_financial_health(db: Session) -> Dict[str, Any]:
    """
    Calculate Financial Health Index based on multiple indicators.
    """
    total_revenue = db.query(func.sum(models.RevenueTransaction.amount)).scalar() or 0
    total_expenses = db.query(func.sum(models.ExpenseTransaction.amount)).scalar() or 0
    salary_expenses = db.query(func.sum(models.ExpenseTransaction.amount)).filter(
        models.ExpenseTransaction.category == 'Salary'
    ).scalar() or 0
    
    total_revenue = float(total_revenue)
    total_expenses = float(total_expenses)
    salary_expenses = float(salary_expenses)
    
    surplus = total_revenue - total_expenses
    
    # 1. Surplus Ratio
    surplus_ratio = surplus / total_revenue if total_revenue > 0 else 0
    surplus_score = min(100, max(0, (surplus_ratio + 0.2) * 250))
    
    # 2. Liquidity Index
    liquidity_index = surplus / total_expenses if total_expenses > 0 else 0
    liquidity_score = min(100, max(0, (liquidity_index + 0.5) * 100))
    
    # 3. Salary to Revenue Ratio
    salary_to_revenue = salary_expenses / total_revenue if total_revenue > 0 else 1
    salary_score = min(100, max(0, (1 - salary_to_revenue) * 100))
    
    # 4. Budget variance
    budget_results = db.query(
        func.sum(models.Budget.allocated_amount),
        func.sum(models.Budget.spent_amount)
    ).first()
    
    total_allocated = float(budget_results[0]) if budget_results[0] else 0
    total_spent = float(budget_results[1]) if budget_results[1] else 0
    
    expense_deviation = abs(total_spent - total_allocated) / total_allocated if total_allocated > 0 else 0
    deviation_score = min(100, max(0, (1 - expense_deviation) * 100))
    
    overall_score = (
        surplus_score * 0.30 +
        liquidity_score * 0.25 +
        salary_score * 0.25 +
        deviation_score * 0.20
    )
    
    if overall_score >= 80:
        health_status = "Excellent"
    elif overall_score >= 60:
        health_status = "Good"
    elif overall_score >= 40:
        health_status = "Fair"
    else:
        health_status = "Needs Attention"
    
    return {
        "overall_score": round(overall_score, 2),
        "surplus_ratio": round(surplus_ratio, 4),
        "liquidity_index": round(liquidity_index, 4),
        "expense_deviation": round(expense_deviation, 4),
        "salary_to_revenue_ratio": round(salary_to_revenue, 4),
        "health_status": health_status
    }

def generate_recommendations(db: Session) -> Dict[str, Any]:
    """
    Generate prescriptive recommendations for cost optimization.
    """
    recommendations = []
    
    total_revenue = float(db.query(func.sum(models.RevenueTransaction.amount)).scalar() or 0)
    total_expenses = float(db.query(func.sum(models.ExpenseTransaction.amount)).scalar() or 0)
    salary_expense = float(db.query(func.sum(models.ExpenseTransaction.amount)).filter(
        models.ExpenseTransaction.category == 'Salary'
    ).scalar() or 0)
    
    utility_expense = float(db.query(func.sum(models.ExpenseTransaction.amount)).filter(
        models.ExpenseTransaction.category == 'Utilities'
    ).scalar() or 0)
    
    maintenance_expense = float(db.query(func.sum(models.ExpenseTransaction.amount)).filter(
        models.ExpenseTransaction.category == 'Maintenance'
    ).scalar() or 0)
    
    # Budget data
    budget_results = db.query(
        func.sum(models.Budget.allocated_amount),
        func.sum(models.Budget.spent_amount)
    ).first()
    
    total_allocated = float(budget_results[0]) if budget_results[0] else 0
    total_spent = float(budget_results[1]) if budget_results[1] else 0
    
    # Recommendations logic
    if total_revenue > 0:
        salary_ratio = salary_expense / total_revenue
        if salary_ratio > 0.6:
            recommendations.append({
                "category": "Salary Optimization",
                "priority": "high",
                "title": "High Salary-to-Revenue Ratio",
                "description": f"Salary expenses are {salary_ratio*100:.1f}% of revenue, exceeding the 60% recommended limit.",
                "potential_savings": (salary_ratio - 0.6) * total_revenue,
                "action_items": [
                    "Review faculty-to-student ratios",
                    "Consider natural attrition",
                    "Evaluate non-teaching staff optimization"
                ]
            })
    
    if total_allocated > 0:
        utilization = total_spent / total_allocated
        if utilization > 1.0:
            recommendations.append({
                "category": "Budget Control",
                "priority": "high",
                "title": "Budget Overrun",
                "description": f"Spending exceeds budget by {(utilization-1)*100:.1f}%.",
                "potential_savings": total_spent - total_allocated,
                "action_items": [
                    "Stricter approval processes",
                    "Reduce discretionary spending"
                ]
            })
    
    if total_expenses > 0 and utility_expense > 0:
        utility_ratio = utility_expense / total_expenses
        if utility_ratio > 0.08:
            recommendations.append({
                "category": "Energy Efficiency",
                "priority": "medium",
                "title": "High Utility Costs",
                "description": f"Utility expenses are {utility_ratio*100:.1f}% of total expenses.",
                "potential_savings": utility_expense * 0.15,
                "action_items": [
                    "Install LED lighting",
                    "Smart HVAC controls",
                    "Energy audit"
                ]
            })
    
    # Sort recommendations
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda x: priority_order.get(x["priority"], 3))
    
    return {
        "recommendations": recommendations,
        "generated_at": datetime.now().isoformat()
    }

def get_expense_distribution(db: Session) -> List[Dict[str, Any]]:
    """
    Get expense breakdown by category.
    """
    results = db.query(
        models.ExpenseTransaction.category,
        func.sum(models.ExpenseTransaction.amount).label('total')
    ).group_by(models.ExpenseTransaction.category).all()
    
    return [
        {"category": r[0], "amount": float(r[1])}
        for r in results
    ]
