"""Shared pytest fixtures: an isolated in-memory SQLite database per test run."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.base import Base
from app.database.database import get_db
from app.main import app

TEST_DATABASE_URL = "sqlite:///./test_buildtrack.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function", autouse=True)
def setup_database():
    """Create a fresh schema before each test and drop it afterwards."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def register_payload():
    return {
        "full_name": "Test User",
        "email": "testuser@example.com",
        "password": "TestPass123",
        "confirm_password": "TestPass123",
        "role": "PROJECT_MANAGER",
        "phone_number": "+1-555-9999",
    }
