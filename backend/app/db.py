"""
Database configuration
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()


# --- Database selection logic ---
# By default, use SQLite for local development and testing.
# For production (Render), set DATABASE_URL to your PostgreSQL connection string in Render's environment settings.
# Example: postgresql://user:password@host:port/dbname
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./gods_ping.db"  # Local default
)

# Render/Heroku sometimes use 'postgres://' prefix, but SQLAlchemy expects 'postgresql://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create SQLAlchemy engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Usage:
# - Local: Do nothing, uses SQLite file gods_ping.db
# - Render: Set DATABASE_URL to your PostgreSQL URL in environment settings
#   (e.g. postgresql://user:password@host:port/dbname)
# Tables will auto-create on startup via Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
