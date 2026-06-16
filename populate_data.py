
import os
import random
import datetime
from faker import Faker
from sqlalchemy import create_engine, Column, Integer, String, Date, Float, ForeignKey, DateTime, Boolean, DECIMAL, Text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# --- Configuration ---
DB_NAME = "fintech.db"
# If db exists, remove it to start fresh
if os.path.exists(DB_NAME):
    try:
        os.remove(DB_NAME)
    except PermissionError:
        print("Could not remove existing DB. It might be in use.")

DATABASE_URL = f"sqlite:///{DB_NAME}"
Base = declarative_base()
fake = Faker()
Faker.seed(42)  # For reproducibility

# --- Table Definitions (Strictly following the Schema) ---

class Department(Base):
    __tablename__ = 'departments'
    dept_id = Column(String(20), primary_key=True)
    dept_name = Column(String(100), nullable=False)
    budget_code = Column(String(50), nullable=False)
    sanctioned_intake = Column(Integer, default=60)
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

# --- Data Generation Logic ---

def _create_student_record(session, usn, enrollment_year, dept_id, student_usns, is_lateral):
    current_year_sim = 2025
    
    # Determine Status & Sem
    # If lateral, they join 1 year after enrollment_year
    join_year = enrollment_year + 1 if is_lateral else enrollment_year
    
    grad_year = enrollment_year + 4
    
    if grad_year <= current_year_sim:
        status = "Graduated"
        sem = 8
    elif join_year > current_year_sim:
         return # Not joined yet
    else:
        status = "Active"
        # Sem calc
        sem = (current_year_sim - enrollment_year) * 2 + 1
        if sem > 8: sem = 8
    
    if is_lateral and sem < 3: return # Shouldn't happen if join_year check works
    
    is_hostel = random.choice([True, False])
    
    stud = Student(
        usn=usn,
        name=Faker().name(),
        dept_id=dept_id,
        enrollment_year=enrollment_year,
        current_semester=sem,
        hostel=is_hostel,
        status=status
    )
    session.add(stud)
    student_usns.append(stud)
    
    if is_hostel:
        hs = HostelStay(
            usn=usn,
            year_1=True if not is_lateral else False,
            year_2=random.choice([True, False]) if sem >=3 else False,
            year_3=random.choice([True, False]) if sem >=5 else False,
            year_4=random.choice([True, False]) if sem >=7 else False,
        )
        session.add(hs)

def populate_db():
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    print("Generating Departments (JSSATEB Real Data)...")
    # Data from Image 0 (Under Graduate Programs)
    depts_data = [
        ("CV", "Civil Engineering", "CV-001", 60),
        ("ME", "Mechanical Engineering", "ME-001", 60),
        ("ISE", "Information Science & Engineering", "ISE-001", 180),
        ("CSE", "Computer Science & Engineering", "CSE-001", 240),
        ("EIE", "Electronics & Instrumentation Engineering", "EIE-001", 60),
        ("ECE", "Electronics & Communication Engineering", "ECE-001", 180),
        ("AIML", "Computer Science & Engineering (AIML)", "AIML-001", 120),
        ("R&A", "Robotics and Automation", "RA-001", 30),
        ("ADM", "Administration", "ADM-001", 0)
    ]
    
    dept_objs = []
    depts = depts_data # Alias for compatibility with downstream code
    for d_id, d_name, b_code, intake in depts_data:
        d = Department(dept_id=d_id, dept_name=d_name, budget_code=b_code, sanctioned_intake=intake)
        session.add(d)
        dept_objs.append(d)
    session.commit()

    print("Generating Fee Structures & Budgets (2025-26 Basis)...")
    years = ["2023-2024", "2024-2025", "2025-2026"]
    
    # Fee Groups based on images
    def get_fee_group(dept_id):
        if dept_id in ["CSE", "ISE", "ECE", "AIML", "R&A"]: return "A"
        if dept_id in ["EIE"]: return "B"
        if dept_id in ["ME", "CV"]: return "C"
        return "None"

    for year in years:
        start_year = int(year.split("-")[0])
        effective_from = datetime.date(start_year, 6, 1)
        effective_to = datetime.date(start_year+1, 5, 31)

        for d in dept_objs:
            if d.dept_id == "ADM": continue
            
            # Budgets
            b_cats = ["Salaries", "Infrastructure", "Research", "Maintenance", "Utilities"]
            for cat in b_cats:
                alloc = random.uniform(2000000, 10000000) 
                b = Budget(
                    budget_id=fake.uuid4()[:20],
                    dept_id=d.dept_id,
                    fiscal_year=year,
                    category=cat,
                    allocated_amount=round(alloc, 2),
                    spent_amount=0 
                )
                session.add(b)

            # --- FEE STRUCTURE IMPLEMENTATION ---
            group = get_fee_group(d.dept_id)
            comedk_tuition = 0
            if group == "A": comedk_tuition = 281100
            elif group == "B": comedk_tuition = 154365
            elif group == "C": comedk_tuition = 81800
            
            vtu_fee, other_fee, skill_lab_fee, nftw_flag = 10610, 20000, 15000, 25
            cet_tuition = 81800
            snq_tuition = 0
            
            lat_total = 0
            if d.dept_id in ["CSE", "ISE", "AIML"]: lat_total = 132085
            elif d.dept_id == "ECE": lat_total = 132410
            elif d.dept_id in ["ME", "R&A"]: lat_total = 132735
            elif d.dept_id in ["EIE", "CV"]: lat_total = 132235
            
            lat_tuition_derived = lat_total - (vtu_fee + other_fee + skill_lab_fee + nftw_flag)

            # Add Fee Entries
            session.add(FeeStructure(fee_id=fake.uuid4()[:20], academic_year=year, dept_id=d.dept_id, fee_type="Tuition Fee (COMEDK)", amount=comedk_tuition, effective_from=effective_from, effective_to=effective_to))
            session.add(FeeStructure(fee_id=fake.uuid4()[:20], academic_year=year, dept_id=d.dept_id, fee_type="Tuition Fee (CET)", amount=cet_tuition, effective_from=effective_from, effective_to=effective_to))
            session.add(FeeStructure(fee_id=fake.uuid4()[:20], academic_year=year, dept_id=d.dept_id, fee_type="Tuition Fee (SNQ)", amount=snq_tuition, effective_from=effective_from, effective_to=effective_to))
            session.add(FeeStructure(fee_id=fake.uuid4()[:20], academic_year=year, dept_id=d.dept_id, fee_type="Tuition Fee (Lateral Entry)", amount=lat_tuition_derived, effective_from=effective_from, effective_to=effective_to))

            for f_name, f_amt in [("VTU Fee", vtu_fee), ("Other Fee", other_fee), ("Skill Lab Fee", skill_lab_fee), ("NFTW (Flag)", nftw_flag)]:
                 session.add(FeeStructure(fee_id=fake.uuid4()[:20], academic_year=year, dept_id=d.dept_id, fee_type=f_name, amount=f_amt, effective_from=effective_from, effective_to=effective_to))

    session.commit()

    print("Generating Assets & Liabilities...")
    # New: Populate Assets
    asset_types = ["Infrastructure", "Equipment", "Vehicle", "Software", "Furniture"]
    for _ in range(50):
        val = random.uniform(100000, 5000000)
        session.add(Asset(
            asset_id=fake.uuid4()[:20],
            name=f"{random.choice(asset_types)} - {fake.word()}",
            type=random.choice(asset_types),
            value=round(val, 2),
            purchase_date=fake.date_between(start_date='-5y', end_date='today'),
            depreciation_rate=random.choice([0.05, 0.1, 0.15])
        ))
    
    # New: Populate Liabilities
    liability_types = ["Bank Loan", "Vendor Payable", "Salary Payable"]
    for _ in range(10):
        amt = random.uniform(500000, 10000000)
        session.add(Liability(
            liability_id=fake.uuid4()[:20],
            name=f"{random.choice(liability_types)} - {fake.company()}",
            type=random.choice(liability_types),
            amount=round(amt, 2),
            interest_rate=random.uniform(5.0, 12.0) if "Loan" in liability_types else 0.0,
            due_date=fake.date_between(start_date='today', end_date='+2y')
        ))
    session.commit()

    print("Generating Employees...")
    emp_ids = []
    for d in dept_objs:
        count = 10 if d.dept_id == "ADM" else 20
        for _ in range(count):
            e_id = f"EMP-{fake.unique.random_number(digits=5)}"
            emp = Employee(
                emp_id=e_id,
                dept_id=d.dept_id,
                designation=random.choice(["Professor", "Associate Prof", "Assistant Prof", "Clerk", "Technician"]),
                current_salary=round(random.uniform(30000, 150000), 2),
                join_date=fake.date_between(start_date='-10y', end_date='today'),
                status="Active"
            )
            session.add(emp)
            emp_ids.append(e_id)
    session.commit()

    print("Generating Students (Current & Alumni for 5 years)...")
    student_usns = []
    start_years = range(2019, 2026)
    for s_year in start_years:
        for d in dept_objs:
            if d.dept_id == "ADM": continue
            intake_limit = d.sanctioned_intake
            actual_enrolled = random.randint(int(intake_limit * 0.8), intake_limit)
            lat_intake = int(intake_limit * 0.10)
            
            for i in range(actual_enrolled):
                usn = f"1JS{s_year % 100:02d}{d.dept_id}{i+1:03d}"
                _create_student_record(session, usn, s_year, d.dept_id, student_usns, is_lateral=False)
                
            for i in range(lat_intake):
                 usn = f"1JS{s_year % 100:02d}{d.dept_id}4{i:02d}"
                 _create_student_record(session, usn, s_year, d.dept_id, student_usns, is_lateral=True)
    session.commit()

    print("Generating Transactions (Revenue & Expenses)...")
    # Recurring named suppliers per procurement category. A small, stable pool
    # makes supplier-spend concentration and risk analytics meaningful and keeps
    # the demo narrative consistent across re-seeds.
    supplier_pool = {
        "Equipment": [
            "Apex Components Pvt Ltd", "Meridian Electronics", "TitanTech Industries",
            "Nova Precision Parts", "Sigma Materials Co",
        ],
        "Travel": [
            "BlueDart Logistics", "TransGlobal Freight", "Reliant Carriers",
            "SwiftLine Shipping",
        ],
        "Utilities": ["State Power Utility", "GreenGrid Energy", "Metro Water Board"],
        "Maintenance": ["FacilityCare Services", "ProMaint Solutions", "UptimeFM Ltd"],
    }

    current_date = datetime.date(2020, 1, 1)
    end_date = datetime.date(2024, 12, 31)
    batch_size = 1000
    txns_buffer = []
    exp_buffer = []

    while current_date <= end_date:
        month_str = current_date.strftime("%Y-%m")
        # --- Revenue ---
        if current_date.month in [8, 9, 1, 2]:
            daily_collections = random.randint(10, 50)
            for _ in range(daily_collections):
                stu = random.choice(student_usns)
                dice = random.random()
                quota = "CET" if dice < 0.45 else "COMEDK" if dice < 0.75 else "MGMT"
                
                base_tuition = 81800
                dept_grp = "C"
                if stu.dept_id in ["CSE", "ISE", "ECE", "AIML", "R&A"]: dept_grp = "A"
                elif stu.dept_id == "EIE": dept_grp = "B"

                if quota == "COMEDK" or quota == "MGMT":
                    if dept_grp == "A": base_tuition = 281100
                    elif dept_grp == "B": base_tuition = 154365
                
                total_fee = base_tuition + 10610 + 20000 + 15000 + 25
                
                txns_buffer.append(RevenueTransaction(
                    txn_id=fake.uuid4(),
                    txn_date=current_date,
                    amount=round(total_fee, 2),
                    category=f"Tuition Fee ({quota})",
                    dept_id=stu.dept_id,
                    usn=stu.usn,
                    description=f"Sem Fee payment ({quota})",
                    payment_mode=random.choice(["Online", "Cheque", "DD"])
                ))
        
        # 2. Grants
        if random.random() < 0.05:
             dept = random.choice(depts)
             if dept[0] != "ADM":
                txns_buffer.append(RevenueTransaction(
                    txn_id=fake.uuid4(),
                    txn_date=current_date,
                    amount=round(random.uniform(100000, 2000000), 2),
                    category="Research Grant",
                    dept_id=dept[0],
                    usn=None,
                    description="Govt Research Grant",
                    payment_mode="Transfer"
                ))

        # --- Expenses (supply-chain cost structure) ---
        # The expense ledger is shaped to read as a manufacturer's cost base:
        # Direct Labor is a recurring monthly payroll (~35-40% of total), while
        # the bulk of spend is procurement — Materials/Components, Freight,
        # Energy and Facility — booked frequently against recurring suppliers
        # so supplier-spend, cost-driver and anomaly analytics have real signal.

        # Monthly Direct Labor (payroll) per plant — moderate, so it does not
        # dwarf procurement spend.
        if current_date.day >= 28:
            for d in depts:
                if d[0] == "ADM":
                    continue
                exp_buffer.append(ExpenseTransaction(
                    txn_id=fake.uuid4(),
                    txn_date=current_date,
                    amount=round(random.uniform(180000, 320000), 2),
                    category="Salary",
                    dept_id=d[0],
                    emp_id=None,
                    vendor="Bank Payroll",
                    description="Monthly Direct Labor",
                    payment_mode="Transfer"
                ))

        # Procurement purchases — several most days, scaled with order season so
        # cost tracks demand. Materials & Freight dominate (true COGS drivers).
        season = current_date.month in [8, 9, 1, 2]
        n_purchases = random.randint(4, 9) if season else random.randint(2, 5)
        for _ in range(n_purchases):
            roll = random.random()
            if roll < 0.45:
                cat, lo, hi = "Equipment", 120000, 900000       # Materials & Components
            elif roll < 0.72:
                cat, lo, hi = "Travel", 60000, 450000           # Inbound/Outbound Freight
            elif roll < 0.88:
                cat, lo, hi = "Utilities", 45000, 220000        # Energy & Utilities
            else:
                cat, lo, hi = "Maintenance", 30000, 180000      # Facility & Maintenance

            d = random.choice([x for x in depts if x[0] != "ADM"])
            supplier = random.choice(supplier_pool[cat])
            exp_buffer.append(ExpenseTransaction(
                txn_id=fake.uuid4(),
                txn_date=current_date,
                amount=round(random.uniform(lo, hi), 2),
                category=cat,
                dept_id=d[0],
                emp_id=None,
                vendor=supplier,
                description=f"{cat} purchase order",
                payment_mode="Transfer"
            ))

        current_date += datetime.timedelta(days=1)
        
        if len(txns_buffer) > batch_size:
            session.add_all(txns_buffer)
            txns_buffer = []
        if len(exp_buffer) > batch_size:
            session.add_all(exp_buffer)
            exp_buffer = []
            
    session.add_all(txns_buffer)
    session.add_all(exp_buffer)
    session.commit()

    print("Injecting spend anomalies...")
    # A few deliberate outliers so anomaly monitoring has clear, explainable
    # hits to demonstrate (e.g. an emergency freight charge, a rush material buy).
    anomaly_specs = [
        (datetime.date(2024, 3, 14), "Travel", 2450000, "TransGlobal Freight",
         "Emergency air freight - line-down recovery"),
        (datetime.date(2024, 7, 22), "Equipment", 3850000, "TitanTech Industries",
         "Expedited material buy - supplier shortfall"),
        (datetime.date(2024, 10, 9), "Utilities", 1180000, "State Power Utility",
         "Peak-demand energy surcharge"),
    ]
    for d_date, cat, amt, vendor, desc in anomaly_specs:
        session.add(ExpenseTransaction(
            txn_id=fake.uuid4(), txn_date=d_date, amount=amt, category=cat,
            dept_id="CSE", emp_id=None, vendor=vendor, description=desc,
            payment_mode="Transfer",
        ))
    session.commit()

    print("Reconciling procurement budgets (allocated vs actual spend)...")
    # Backfill each budget's spent_amount from the actual expense ledger so
    # budget-vs-actual variance analysis reflects real spend (the generator
    # otherwise leaves spent_amount at zero).
    from sqlalchemy import func as _func
    # Map raw expense categories to the budget categories used in seeding.
    exp_to_budget = {
        "Salary": "Salaries", "Equipment": "Infrastructure",
        "Maintenance": "Maintenance", "Utilities": "Utilities", "Travel": "Research",
    }
    actuals = {}  # (dept_id, budget_category) -> total actual spend
    rows = session.query(
        ExpenseTransaction.dept_id, ExpenseTransaction.category,
        _func.sum(ExpenseTransaction.amount).label("total"),
    ).group_by(ExpenseTransaction.dept_id, ExpenseTransaction.category).all()
    for dept_id, exp_cat, total in rows:
        bcat = exp_to_budget.get(exp_cat)
        if not bcat:
            continue
        actuals[(dept_id, bcat)] = actuals.get((dept_id, bcat), 0) + float(total or 0)

    # Set BOTH allocated and spent from the actual ledger so budget-vs-actual
    # variance is realistic by construction (utilisation clusters near 100% with
    # a believable spread of over/under per line) regardless of spend scale.
    for b in session.query(Budget).all():
        key = (b.dept_id, b.category)
        if key in actuals:
            share = actuals[key] / 3.0  # actual spend split across 3 fiscal years
            # Deterministic per-row factors (avoid Python's salted hash()).
            seed = sum(ord(c) for c in b.budget_id)
            spent_factor = 0.90 + ((seed % 22) / 100.0)        # 0.90 - 1.11
            target_util = 0.82 + ((seed % 36) / 100.0)         # 0.82 - 1.17 (over & under)
            b.spent_amount = round(share * spent_factor, 2)
            b.allocated_amount = round(b.spent_amount / target_util, 2)
    session.commit()

    print("Database Population Complete: fintech.db")

if __name__ == "__main__":
    populate_db()
