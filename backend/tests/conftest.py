import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import shutil
import tempfile

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.main import app
from app.database.base import Base
from app.database.session import get_db

TEST_DB_FILE = "test_buildtrack.db"
# Set TEST_DATABASE_URL (e.g. a PostgreSQL URL) to run the whole suite against another database.
TEST_DB_URL = os.environ.get("TEST_DATABASE_URL", f"sqlite:///./{TEST_DB_FILE}")
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False} if TEST_DB_URL.startswith("sqlite") else {},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def _test_database():
    """One isolated SQLite DB shared by every test file in the session."""
    upload_dir = tempfile.mkdtemp(prefix="buildtrack-uploads-")
    settings.UPLOAD_DIR = upload_dir
    app.dependency_overrides[get_db] = _override_get_db
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)
    shutil.rmtree(upload_dir, ignore_errors=True)
    if os.path.exists(TEST_DB_FILE):
        os.remove(TEST_DB_FILE)
