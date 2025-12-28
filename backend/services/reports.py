"""
Reports Service - Quarterly Financial Health Reports

Implements SRS Section 8 - Reporting Requirements.
Generates automated quarterly financial health reports for audits,
accreditation (NBA/NAAC), and governance.
"""

from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List
try:
    from .. import models
except ImportError:
    import models


def generate_quarterly_report(db: Session) -> Dict[str, Any]:
    """
    Generate comprehensive quarterly financial health report.
    
    Returns aggregated data suitable for institutional reports including:
    - Financial summary (revenue, expenses, surplus)
    - Key performance indicators
    - Budget analysis
    - Anomaly summary
    - Recommendations count
    """
    
    # Get current fiscal period
    current_date = datetime.now()
    quarter = (current_date.month - 1) // 3 + 1
    fiscal_year = f"{current_date.year}-{current_date.year + 1}" if current_date.month >= 4 else f"{current_date.year - 1}-{current_date.year}"
    
    # Revenue breakdown
    revenue_by_category = db.query(
        models.RevenueTransaction.category,
        func.sum(models.RevenueTransaction.amount).label('total')
    ).group_by(models.RevenueTransaction.category).all()
    
    # Expense breakdown
    expense_by_category = db.query(
        models.ExpenseTransaction.category,
        func.sum(models.ExpenseTransaction.amount).label('total')
    ).group_by(models.ExpenseTransaction.category).all()
    
    # Totals
    total_revenue = db.query(func.sum(models.RevenueTransaction.amount)).scalar() or 0.0
    total_expenses = db.query(func.sum(models.ExpenseTransaction.amount)).scalar() or 0.0
    net_surplus = float(total_revenue) - float(total_expenses)
    
    # Salary expenses specifically
    salary_expenses = db.query(func.sum(models.ExpenseTransaction.amount)).filter(
        models.ExpenseTransaction.category == 'Salary'
    ).scalar() or 0.0
    
    # Budget analysis
    budget_data = db.query(
        func.sum(models.Budget.allocated_amount).label('allocated'),
        func.sum(models.Budget.spent_amount).label('spent')
    ).first()
    
    total_allocated = float(budget_data.allocated or 0)
    total_spent = float(budget_data.spent or 0)
    budget_utilization = (total_spent / total_allocated * 100) if total_allocated > 0 else 0
    
    # Assets and Liabilities
    total_assets = float(db.query(func.sum(models.Asset.value)).scalar() or 0)
    total_liabilities = float(db.query(func.sum(models.Liability.amount)).scalar() or 0)
    net_worth = total_assets - total_liabilities
    
    # Student and Faculty counts
    student_count = db.query(func.count(models.Student.usn)).filter(
        models.Student.status == 'Active'
    ).scalar() or 0
    
    faculty_count = db.query(func.count(models.Employee.emp_id)).filter(
        models.Employee.status == 'Active'
    ).scalar() or 0
    
    # Department count
    dept_count = db.query(func.count(models.Department.dept_id)).scalar() or 0
    
    # Calculate KPIs
    operating_margin = (net_surplus / float(total_revenue) * 100) if total_revenue > 0 else 0
    salary_to_revenue = (float(salary_expenses) / float(total_revenue) * 100) if total_revenue > 0 else 0
    liquidity_ratio = (total_assets / total_liabilities) if total_liabilities > 0 else float('inf')
    
    # Health score (simplified)
    health_score = min(100, max(0, 
        50 + (operating_margin * 0.5) + 
        (25 if budget_utilization < 100 else 0) +
        (25 if liquidity_ratio > 1.5 else liquidity_ratio * 15)
    ))
    
    return {
        "report_metadata": {
            "generated_at": datetime.now().isoformat(),
            "fiscal_year": fiscal_year,
            "quarter": f"Q{quarter}",
            "institution": "JSSATEB"
        },
        "financial_summary": {
            "total_revenue": float(total_revenue),
            "total_expenses": float(total_expenses),
            "net_surplus": net_surplus,
            "operating_margin_percent": round(operating_margin, 2)
        },
        "revenue_breakdown": [
            {"category": cat, "amount": float(total)} 
            for cat, total in revenue_by_category
        ],
        "expense_breakdown": [
            {"category": cat, "amount": float(total)} 
            for cat, total in expense_by_category
        ],
        "budget_analysis": {
            "total_allocated": total_allocated,
            "total_spent": total_spent,
            "remaining": total_allocated - total_spent,
            "utilization_percent": round(budget_utilization, 2)
        },
        "balance_sheet": {
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "net_worth": net_worth,
            "liquidity_ratio": round(liquidity_ratio, 2) if liquidity_ratio != float('inf') else "∞"
        },
        "institutional_metrics": {
            "student_count": student_count,
            "faculty_count": faculty_count,
            "department_count": dept_count,
            "student_faculty_ratio": round(student_count / faculty_count, 1) if faculty_count > 0 else 0
        },
        "key_performance_indicators": {
            "financial_health_score": round(health_score, 1),
            "salary_to_revenue_percent": round(salary_to_revenue, 2),
            "budget_utilization_percent": round(budget_utilization, 2),
            "surplus_ratio_percent": round((net_surplus / float(total_revenue) * 100) if total_revenue > 0 else 0, 2)
        }
    }
