from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from decimal import Decimal


class DepartmentBase(BaseModel):
    dept_id: str
    dept_name: str
    budget_code: str


class Department(DepartmentBase):
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class StudentBase(BaseModel):
    usn: str
    name: str
    dept_id: str
    enrollment_year: int
    current_semester: int
    hostel: bool
    status: str


class Student(StudentBase):
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RevenueTransactionBase(BaseModel):
    txn_id: str
    txn_date: date
    amount: float
    category: str
    dept_id: Optional[str] = None
    usn: Optional[str] = None
    description: Optional[str] = None
    payment_mode: Optional[str] = None


class RevenueTransaction(RevenueTransactionBase):
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ExpenseTransactionBase(BaseModel):
    txn_id: str
    txn_date: date
    amount: float
    category: str
    dept_id: Optional[str] = None
    emp_id: Optional[str] = None
    vendor: Optional[str] = None
    description: Optional[str] = None
    payment_mode: Optional[str] = None


class ExpenseTransaction(ExpenseTransactionBase):
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class BudgetBase(BaseModel):
    budget_id: str
    dept_id: str
    fiscal_year: str
    category: str
    allocated_amount: float
    spent_amount: float


class Budget(BudgetBase):
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class FeeStructureBase(BaseModel):
    fee_id: str
    academic_year: str
    dept_id: str
    fee_type: str
    amount: float
    effective_from: date
    effective_to: Optional[date] = None


class FeeStructure(FeeStructureBase):
    model_config = ConfigDict(from_attributes=True)


# Dashboard Aggregates
class DashboardMetrics(BaseModel):
    total_revenue: float
    total_expenses: float
    net_surplus: float
    salary_expense: float


class DashboardStats(BaseModel):
    operating_margin: float
    budget_utilization: float
    cash_flow_stability: float
    revenue_growth: float
    expense_growth: float


# Analytics Schemas
class MonthlyTrend(BaseModel):
    month: str
    revenue: float
    expenses: float


class CorrelationResult(BaseModel):
    correlations: Dict[str, float]


class AnomalyItem(BaseModel):
    txn_id: str
    txn_date: date
    amount: float
    category: str
    anomaly_type: str
    severity: str


class AnomalyResponse(BaseModel):
    anomalies: List[AnomalyItem]
    total_count: int


class FinancialHealthIndex(BaseModel):
    overall_score: float
    surplus_ratio: float
    liquidity_index: float
    expense_deviation: float
    salary_to_revenue_ratio: float
    health_status: str


# Scenario Analysis Schemas (SRS 6.7)
class ScenarioRequest(BaseModel):
    enrollment_change_percent: float = 0.0  # e.g., +10 for 10% increase
    fee_change_percent: float = 0.0         # e.g., +5 for 5% increase
    grant_change_percent: float = 0.0       # e.g., -20 for 20% decrease
    salary_change_percent: float = 0.0      # e.g., +8 for 8% increase


class ScenarioImpact(BaseModel):
    projected_revenue: float
    projected_expenses: float
    projected_surplus: float
    revenue_change: float
    expense_change: float
    surplus_change: float
    impact_summary: str


class ScenarioResult(BaseModel):
    baseline: Dict[str, float]
    projected: Dict[str, float]
    impact: ScenarioImpact


# Prescriptive Analytics Schemas (SRS 6.6)
class Recommendation(BaseModel):
    category: str
    priority: str  # high, medium, low
    title: str
    description: str
    potential_savings: Optional[float] = None
    action_items: List[str]


class RecommendationsResponse(BaseModel):
    recommendations: List[Recommendation]
    generated_at: datetime


class AssetBase(BaseModel):
    asset_id: str
    name: str
    type: str
    value: float
    purchase_date: date
    depreciation_rate: float


class Asset(AssetBase):
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LiabilityBase(BaseModel):
    liability_id: str
    name: str
    type: str
    amount: float
    interest_rate: float
    due_date: Optional[date] = None


class Liability(LiabilityBase):
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
