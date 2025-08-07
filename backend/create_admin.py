#!/usr/bin/env python3
"""
Script to create the first admin user
Run this after the database is initialized
"""
import sys
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import SessionLocal, engine
from app.models import Base, User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.username == "admin").first()
        if admin:
            print("Admin user already exists!")
            return
        
        # Create admin user
        admin_user = User(
            email="admin@sslmanager.local",
            username="admin",
            hashed_password=pwd_context.hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True,
            security_question="What is the default admin password?",
            hashed_security_answer=pwd_context.hash("admin123")
        )
        
        db.add(admin_user)
        db.commit()
        
        print("Admin user created successfully!")
        print("Username: admin")
        print("Password: admin123")
        print("Please change the password after first login!")
        
    except Exception as e:
        print(f"Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()