#!/usr/bin/env python3
"""
Script to create or reset the admin user.
Run after the database is initialised:  python create_admin.py
"""
from passlib.context import CryptContext
from app.database import SessionLocal, engine
from app.models import Base, User
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_admin():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        admin = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
        if admin:
            print("Admin user already exists — no changes made.")
            return

        admin_user = User(
            email=settings.ADMIN_EMAIL,
            username=settings.ADMIN_USERNAME,
            hashed_password=pwd_context.hash(settings.ADMIN_PASSWORD),
            role="admin",
            is_active=True,
            force_password_change=True,
        )
        db.add(admin_user)
        db.commit()

        print("Admin user created successfully.")
        print(f"  Username : {settings.ADMIN_USERNAME}")
        print(f"  Password : {settings.ADMIN_PASSWORD}  <- CHANGE THIS ON FIRST LOGIN")

    except Exception as exc:
        print(f"Error creating admin: {exc}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
