import datetime
from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, DateTime, Boolean, DECIMAL, Text
from sqlalchemy.orm import relationship
try:
    from .database import Base
except ImportError:
    from database import Base

class Department(Base):
    __tablename__ = 'departments'
    dept_id = Column(String(20), primary_key=True)
    dept_name = Column(String(100), nullable=False)
    budget_code = Column(String(50), nullable=False)
    sanctioned_intake = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Student(Base):
    __tablename__ = 'students'
    usn = Column(String(20), primary_key=True)
    name = Column(String(100), nullable=False)
    dept_id = Column(String(20), ForeignKey('departments.dept_id'), nullable=False)
    enrollment_year = Column(Integer, nullable=False)
    current_semester = Column(Integer, nullable=False)
    hostel = Column(Boolean, default=False)
    status = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class HostelStay(Base):
    __tablename__ = 'hostel_stays'
    usn = Column(String(20), ForeignKey('students.usn'), primary_key=True)
    year_1 = Column(Boolean, default=False)
    year_2 = Column(Boolean, default=False)
    year_3 = Column(Boolean, default=False)
    year_4 = Column(Boolean, default=False)

class Employee(Base):
    __tablename__ = 'employees'
    emp_id = Column(String(20), primary_key=True)
    dept_id = Column(String(20), ForeignKey('departments.dept_id'), nullable=False)
    designation = Column(String(100), nullable=False)
    current_salary = Column(DECIMAL(12, 2), nullable=False)
    join_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class FeeStructure(Base):
    __tablename__ = 'fee_structures'
    fee_id = Column(String(20), primary_key=True)
    academic_year = Column(String(10), nullable=False)
    dept_id = Column(String(20), ForeignKey('departments.dept_id'), nullable=False)
    fee_type = Column(String(50), nullable=False)
    amount = Column(DECIMAL(12, 2), nullable=False)
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date)

class Budget(Base):
    __tablename__ = 'budgets'
    budget_id = Column(String(20), primary_key=True)
    dept_id = Column(String(20), ForeignKey('departments.dept_id'), nullable=False)
    fiscal_year = Column(String(10), nullable=False)
    category = Column(String(50), nullable=False)
    allocated_amount = Column(DECIMAL(14, 2), nullable=False)
    spent_amount = Column(DECIMAL(14, 2), default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class RevenueTransaction(Base):
    __tablename__ = 'revenue_transactions'
    txn_id = Column(String(30), primary_key=True)
    txn_date = Column(Date, nullable=False)
    amount = Column(DECIMAL(14, 2), nullable=False)
    category = Column(String(50), nullable=False)
    dept_id = Column(String(20), ForeignKey('departments.dept_id'))
    usn = Column(String(20), ForeignKey('students.usn'))
    description = Column(Text)
    payment_mode = Column(String(20))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ExpenseTransaction(Base):
    __tablename__ = 'expense_transactions'
    txn_id = Column(String(30), primary_key=True)
    txn_date = Column(Date, nullable=False)
    amount = Column(DECIMAL(14, 2), nullable=False)
    category = Column(String(50), nullable=False)
    dept_id = Column(String(20), ForeignKey('departments.dept_id'))
    emp_id = Column(String(20), ForeignKey('employees.emp_id'))
    vendor = Column(String(100))
    description = Column(Text)
    payment_mode = Column(String(20))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Asset(Base):
    __tablename__ = 'assets'
    asset_id = Column(String(30), primary_key=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # Fixed, Current, etc.
    value = Column(DECIMAL(14, 2), nullable=False)
    purchase_date = Column(Date, nullable=False)
    depreciation_rate = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Liability(Base):
    __tablename__ = 'liabilities'
    liability_id = Column(String(30), primary_key=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # Loan, Payable, etc.
    amount = Column(DECIMAL(14, 2), nullable=False)
    interest_rate = Column(Float, default=0.0)
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
