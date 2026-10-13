"""Populate the database with demo users and realistic sample data.

Used by `python seed_demo.py [--reset]` and, when SEED_DEMO_DATA=true, on app startup.

Every demo account uses the password:  Demo@1234
"""
from datetime import date, timedelta

from app.core.security import hash_password
from app.database.base import Base
from app.database.session import SessionLocal, engine
from app.models import (
    Attendance, Document, Expense, Inventory, Notification, Procurement, Project,
    ProjectMilestone, Report, Resource, Shift, User, Vendor, Worker,
)

PASSWORD = "Demo@1234"
USERS = [
    ("Asha Admin", "admin@buildtrack.demo", "admin"),
    ("Pranav Manager", "pm@buildtrack.demo", "project_manager"),
    ("Esha Engineer", "engineer@buildtrack.demo", "site_engineer"),
    ("Carlos Contractor", "contractor@buildtrack.demo", "contractor"),
    ("Wendy Worker", "worker@buildtrack.demo", "worker"),
    ("Clara Client", "client@buildtrack.demo", "client"),
]


def main(reset: bool = False) -> None:
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == "admin@buildtrack.demo").first():
            print("Demo data already present. Use --reset to start over.")
            return

        users = {}
        for name, email, role in USERS:
            u = User(full_name=name, email=email, hashed_password=hash_password(PASSWORD), role=role)
            db.add(u)
            users[role] = u
        db.flush()
        pm = users["project_manager"]
        today = date.today()

        projects = [
            Project(name="Green Valley Apartments", description="120-unit residential complex", category="residential",
                    status="in_progress", start_date=today - timedelta(days=60), end_date=today + timedelta(days=300),
                    budget=25000000, manager_id=pm.id),
            Project(name="Metro Bridge Phase 2", description="Elevated bridge section", category="infrastructure",
                    status="planned", start_date=today + timedelta(days=15), end_date=today + timedelta(days=400),
                    budget=80000000, manager_id=pm.id),
            Project(name="City Mall Fit-out", description="Interior works for a shopping mall", category="commercial",
                    status="in_progress", start_date=today - timedelta(days=30), end_date=today + timedelta(days=120),
                    budget=9000000, manager_id=pm.id),
        ]
        db.add_all(projects)
        db.flush()
        valley, bridge, mall = projects

        db.add_all([
            ProjectMilestone(project_id=valley.id, title="Foundation work", category="foundation",
                             due_date=today - timedelta(days=20), status="completed"),
            ProjectMilestone(project_id=valley.id, title="Structural frame", category="structural",
                             due_date=today + timedelta(days=2), status="in_progress"),
            ProjectMilestone(project_id=valley.id, title="Electrical wiring", category="electrical",
                             due_date=today + timedelta(days=60), status="pending"),
            ProjectMilestone(project_id=mall.id, title="Plumbing", category="plumbing",
                             due_date=today - timedelta(days=3), status="delayed"),
            ProjectMilestone(project_id=mall.id, title="Finishing", category="finishing",
                             due_date=today + timedelta(days=45), status="pending"),
            ProjectMilestone(project_id=bridge.id, title="Site survey", category="inspection",
                             due_date=today + timedelta(days=10), status="pending"),
        ])

        db.add_all([
            Resource(name="Excavator #1", category="excavator", project_id=valley.id, status="in_use"),
            Resource(name="Tower Crane A", category="crane", project_id=valley.id, status="in_use"),
            Resource(name="Concrete Mixer 2", category="concrete_mixer", status="available"),
            Resource(name="Dump Truck 7", category="dump_truck", status="maintenance"),
            Resource(name="Generator 5kVA", category="generator", project_id=mall.id, status="in_use"),
        ])

        db.add_all([
            Inventory(project_id=valley.id, material_name="Cement OPC 53", category="cement", quantity=40, unit="bags", reorder_level=100),
            Inventory(project_id=valley.id, material_name="TMT Steel 12mm", category="steel", quantity=900, unit="kg", reorder_level=300),
            Inventory(project_id=mall.id, material_name="Red Bricks", category="bricks", quantity=5000, unit="pcs", reorder_level=1000),
            Inventory(material_name="River Sand", category="sand", quantity=12, unit="tons", reorder_level=20),
            Inventory(material_name="PVC Pipes 4in", category="plumbing", quantity=150, unit="pcs", reorder_level=50),
        ])

        workers = [
            Worker(full_name="Ramesh Kumar", category="skilled", project_id=valley.id, contact_number="9876500001", daily_wage=700),
            Worker(full_name="Suresh Patil", category="unskilled", project_id=valley.id, contact_number="9876500002", daily_wage=450),
            Worker(full_name="Anita Sharma", category="engineer", project_id=mall.id, contact_number="9876500003", daily_wage=1800),
            Worker(full_name="Vikram Singh", category="supervisor", project_id=mall.id, contact_number="9876500004", daily_wage=1100),
        ]
        db.add_all(workers)
        db.flush()
        statuses = ["present", "present", "absent", "present", "half_day"]
        for offset in range(5):
            day = today - timedelta(days=offset)
            for i, w in enumerate(workers):
                db.add(Attendance(worker_id=w.id, project_id=w.project_id, date=day,
                                  status=statuses[(i + offset) % len(statuses)]))

        db.add_all([
            Vendor(name="UltraTech", category="raw_materials", contact_person="Meera Rao", email="sales@ultratech.demo", phone="9000000001"),
            Vendor(name="SafeBuild", category="equipment", contact_person="Dan Cole", email="hello@safebuild.demo", phone="9000000002"),
            Vendor(name="ProSafe", category="safety_equipment", contact_person="Lina Park", email="orders@prosafe.demo", phone="9000000003"),
        ])
        db.add_all([
            Procurement(project_id=valley.id, item_name="Cement 500 bags", category="raw_materials", vendor_name="UltraTech",
                        quantity=500, cost=190000, status="requested", requested_by=users["contractor"].id),
            Procurement(project_id=valley.id, item_name="Scaffolding set", category="equipment", vendor_name="SafeBuild",
                        quantity=4, cost=120000, status="approved", requested_by=users["contractor"].id),
            Procurement(project_id=mall.id, item_name="Safety helmets", category="safety_equipment", vendor_name="ProSafe",
                        quantity=60, cost=18000, status="delivered", requested_by=pm.id,
                        invoice_number="PS-2041", invoice_paid=False),
            Procurement(project_id=valley.id, item_name="TMT steel 2 tons", category="raw_materials", vendor_name="UltraTech",
                        quantity=2, cost=140000, status="delivered", requested_by=pm.id,
                        invoice_number="UT-0987", invoice_paid=True),
        ])
        shift_types = ["morning", "evening", "night"]
        for offset in range(-1, 6):
            for i, w in enumerate(workers):
                db.add(Shift(worker_id=w.id, project_id=w.project_id, shift_date=today + timedelta(days=offset),
                             shift_type=shift_types[(i + offset) % 3]))

        expenses = [
            ("labor", 3200000, "Labour wages - quarter 1"), ("material", 5400000, "Steel and cement"),
            ("equipment", 1800000, "Crane rental"), ("transportation", 450000, "Material haulage"),
            ("maintenance", 220000, "Machinery servicing"), ("administrative", 150000, "Site office"),
        ]
        for i, (cat, amt, desc) in enumerate(expenses):
            db.add(Expense(project_id=valley.id, category=cat, amount=amt, description=desc,
                           expense_date=today - timedelta(days=50 - i * 7), created_by=pm.id))
        db.add_all([
            Expense(project_id=mall.id, category="material", amount=4100000, description="Tiles and fixtures",
                    expense_date=today - timedelta(days=10), created_by=pm.id),
            Expense(project_id=mall.id, category="labor", amount=3900000, description="Fit-out crew",
                    expense_date=today - timedelta(days=5), created_by=pm.id),
        ])

        db.add_all([
            Notification(user_id=pm.id, title="Milestone deadline approaching", type="deadline",
                         message="'Structural frame' in project 'Green Valley Apartments' is due in 2 days."),
            Notification(user_id=pm.id, title="Low stock alert", type="procurement_alert",
                         message="Cement OPC 53 is at 40 bags (reorder level 100)."),
            Notification(user_id=users["worker"].id, title="Welcome to BuildTrack", type="system",
                         message="Your account is ready. Check your assigned tasks."),
        ])
        db.add(Report(report_type="progress", generated_by=pm.id, file_path="buildtrack-projects-demo.pdf"))
        db.commit()

        print("Demo data created.\n")
        print("Log in with any of these (password for all: %s):" % PASSWORD)
        for name, email, role in USERS:
            print(f"  {role:<16} {email}")
    finally:
        db.close()
