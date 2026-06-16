"""
Financial Domain Mapping
========================

Central definitions that give the institutional financial ledger consistent,
human-readable labels across the API. The underlying data is time-series
financial data for an educational institution: categorised revenue inflows,
expense outflows by vendor and department, budgets, assets and liabilities.

Keeping these maps in one place ensures category names, department names and
revenue sources are presented consistently everywhere.
"""

# --- Expense category display names (expense.category -> display label) -------
# The ledger already stores clean category names; this map exists so labels can
# be adjusted in one place if needed.
EXPENSE_CATEGORY_MAP = {
    "Salary": "Salaries",
    "Equipment": "Equipment & Infrastructure",
    "Maintenance": "Maintenance",
    "Utilities": "Utilities",
    "Travel": "Travel & Logistics",
}

# Expense categories treated as variable / controllable spend for cost-driver
# and variance analysis (everything except fixed salaries).
CONTROLLABLE_EXPENSE_CATEGORIES = {
    "Equipment & Infrastructure",
    "Maintenance",
    "Utilities",
    "Travel & Logistics",
}

# --- Revenue source mapping (revenue.category -> display label) ---------------
REVENUE_SOURCE_MAP = {
    "Tuition Fee (CET)": "Tuition (CET)",
    "Tuition Fee (COMEDK)": "Tuition (COMEDK)",
    "Tuition Fee (MGMT)": "Tuition (Management)",
    "Research Grant": "Research Grants",
}

# Department code -> full department name (JSSATEB programmes).
DEPARTMENT_MAP = {
    "CSE": "Computer Science & Engineering",
    "ISE": "Information Science & Engineering",
    "ECE": "Electronics & Communication",
    "AIML": "CSE (AI & ML)",
    "EIE": "Electronics & Instrumentation",
    "ME": "Mechanical Engineering",
    "CV": "Civil Engineering",
    "R&A": "Robotics & Automation",
    "ADM": "Administration",
}

# Budget category display names (budget.category -> display label).
BUDGET_CATEGORY_MAP = {
    "Salaries": "Salaries",
    "Infrastructure": "Infrastructure",
    "Research": "Research",
    "Maintenance": "Maintenance",
    "Utilities": "Utilities",
}


def expense_category(category: str) -> str:
    """Map a raw expense category to its display label."""
    return EXPENSE_CATEGORY_MAP.get(category, category)


def revenue_source(category: str) -> str:
    """Map a raw revenue category to its display label."""
    return REVENUE_SOURCE_MAP.get(category, category)


def department_name(dept_id: str) -> str:
    """Map a department code to its full name."""
    return DEPARTMENT_MAP.get(dept_id, dept_id)


def budget_category(category: str) -> str:
    """Map a raw budget category to its display label."""
    return BUDGET_CATEGORY_MAP.get(category, category)


# Average tuition value per enrolled student-fee transaction. Used to translate
# total revenue into an approximate enrolment/headcount view for reporting.
AVG_FEE_PER_STUDENT = 185_000.0


def value_to_students(value: float) -> int:
    """Approximate the number of fee payments behind a revenue figure."""
    if not value:
        return 0
    return int(round(value / AVG_FEE_PER_STUDENT))
