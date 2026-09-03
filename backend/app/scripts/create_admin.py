"""Create or promote a BuildTrack administrator without exposing admin signup."""
import argparse
import getpass

from app.core.database import SessionLocal
from app.models.user import UserRole
from app.schemas.user import UserCreate
from app.services.user_service import create_user, get_user_by_email


def main() -> None:
    parser = argparse.ArgumentParser(description="Create or promote a BuildTrack administrator.")
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", required=True)
    args = parser.parse_args()
    password = getpass.getpass("Administrator password: ")

    db = SessionLocal()
    try:
        existing = get_user_by_email(db, args.email)
        if existing:
            existing.role = UserRole.admin
            db.commit()
            print(f"Promoted {existing.email} to administrator.")
            return
        user = create_user(db, UserCreate(
            full_name=args.name,
            email=args.email,
            password=password,
            role=UserRole.admin,
        ))
        print(f"Created administrator {user.email}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
