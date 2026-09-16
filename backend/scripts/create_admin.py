import argparse
import getpass
import os
import sys

from passlib.context import CryptContext
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def main():
    parser = argparse.ArgumentParser(description="Create admin user")
    parser.add_argument("--login", type=str, required=True, help="Admin login")
    args = parser.parse_args()

    password = os.environ.get("ADMIN_PASSWORD")
    if not password:
        password = getpass.getpass(prompt=f"Enter password for admin '{args.login}': ")
        confirm_password = getpass.getpass(prompt="Confirm password: ")
        if password != confirm_password:
            print("Passwords do not match!")
            sys.exit(1)

    db: Session = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.login == args.login).first()
        if existing_user:
            print(f"Error: User with login '{args.login}' already exists.")
            sys.exit(1)

        admin = User(
            login=args.login,
            password_hash=get_password_hash(password),
            first_name="Admin",
            last_name="Systemowy",
            role=UserRole.admin,
            is_temporary_password=False,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"Admin user '{args.login}' created successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
