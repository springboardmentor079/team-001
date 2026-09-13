"""
Seed the database with demo accounts (one per role) and a couple of sample
projects, so the application can be explored immediately after setup.

Usage:
    python seed_demo.py

Safe to re-run: existing demo users are left untouched (matched by email).

  DEMO CREDENTIALS — for local development / evaluation only.
  Change or remove these before deploying to any shared or production
  environment.
"""
import datetime

from app.core.security import hash_password
from app.database.base import Base
from app.database.database import SessionLocal, engine
from app.models.project import Project, ProjectCategory, ProjectStatus
from app.models.user import User, UserRole

DEMO_PASSWORD = "Password123!"

DEMO_USERS = [
    {
        "full_name": "Alice Anderson",
        "email": "admin@buildtrack.com",
        "role": UserRole.ADMIN,
        "phone_number": "+1-555-0100",
    },
    {
        "full_name": "Priya Manager",
        "email": "manager@buildtrack.com",
        "role": UserRole.PROJECT_MANAGER,
        "phone_number": "+1-555-0101",
    },
    {
        "full_name": "Ethan Engineer",
        "email": "engineer@buildtrack.com",
        "role": UserRole.SITE_ENGINEER,
        "phone_number": "+1-555-0102",
    },
    {
        "full_name": "Carlos Contractor",
        "email": "contractor@buildtrack.com",
        "role": UserRole.CONTRACTOR,
        "phone_number": "+1-555-0103",
    },
    {
        "full_name": "Wendy Worker",
        "email": "worker@buildtrack.com",
        "role": UserRole.WORKER,
        "phone_number": "+1-555-0104",
    },
    {
        "full_name": "Client Co. Representative",
        "email": "client@buildtrack.com",
        "role": UserRole.CLIENT,
        "phone_number": "+1-555-0105",
    },
]


def seed() -> None:
    # Ensure tables exist (useful for the SQLite quick-start path).
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        created_users = {}

        for entry in DEMO_USERS:
            existing = db.query(User).filter(User.email == entry["email"]).first()
            if existing:
                print(f"  - {entry['email']} already exists, skipping.")
                created_users[entry["role"]] = existing
                continue

            user = User(
                full_name=entry["full_name"],
                email=entry["email"],
                hashed_password=hash_password(DEMO_PASSWORD),
                role=entry["role"],
                phone_number=entry["phone_number"],
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.flush()
            created_users[entry["role"]] = user
            print(f"  + Created {entry['role'].value} account: {entry['email']}")

        db.commit()

        # Seed a couple of sample projects if none exist yet.
        if db.query(Project).count() == 0:
            manager = created_users.get(UserRole.PROJECT_MANAGER)
            client = created_users.get(UserRole.CLIENT)

            sample_projects = [
                Project(
                    project_name="Riverside Residential Complex",
                    project_code="BT-RES001",
                    description="A 120-unit residential complex with underground parking.",
                    category=ProjectCategory.RESIDENTIAL,
                    location="Riverside, CA",
                    start_date=datetime.date(2026, 1, 15),
                    expected_end_date=datetime.date(2027, 6, 30),
                    budget=8500000,
                    status=ProjectStatus.IN_PROGRESS,
                    project_manager_id=manager.id if manager else None,
                    client_id=client.id if client else None,
                ),
                Project(
                    project_name="Downtown Office Tower",
                    project_code="BT-COM002",
                    description="18-storey Class-A commercial office tower.",
                    category=ProjectCategory.COMMERCIAL,
                    location="Metro City",
                    start_date=datetime.date(2026, 3, 1),
                    expected_end_date=datetime.date(2028, 2, 28),
                    budget=42000000,
                    status=ProjectStatus.PLANNED,
                    project_manager_id=manager.id if manager else None,
                    client_id=client.id if client else None,
                ),
            ]
            db.add_all(sample_projects)
            db.commit()
            print(f"  + Created {len(sample_projects)} sample project(s).")
        else:
            print("  - Sample projects already exist, skipping.")

        print("\nDemo data seeded successfully.")
        print(f"All demo accounts use the password: {DEMO_PASSWORD}")
        print("These are DEVELOPMENT credentials only — change them before production use.")
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding BuildTrack demo data...")
    seed()
