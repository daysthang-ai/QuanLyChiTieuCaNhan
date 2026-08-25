import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models import User, Wallet, Category
from backend.app.utils.security import get_password_hash, create_access_token
from backend.app.services.seed_service import DEFAULT_CATEGORIES

from sqlalchemy.pool import StaticPool

# Use in-memory SQLite for isolated test runs
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Creates a fresh in-memory database for each test function."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def test_user(db_session):
    """Creates a standard test user in the test database."""
    user = User(
        email="tester@fintrack.ai",
        full_name="Tester Nguyen",
        hashed_password=get_password_hash("Password@123"),
        role="USER",
        currency="VND"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Add default categories
    for c_data in DEFAULT_CATEGORIES:
        cat = Category(
            user_id=user.id,
            name=c_data["name"],
            type=c_data["type"],
            group=c_data["group"],
            icon=c_data["icon"],
            color=c_data["color"],
            is_default=True
        )
        db_session.add(cat)

    # Add test wallets
    w1 = Wallet(user_id=user.id, name="Techcombank", wallet_type="BANK", wallet_scope="real", balance=10000000.0, color="#DC2626")
    w2 = Wallet(user_id=user.id, name="Ví MoMo", wallet_type="EWALLET", wallet_scope="virtual", balance=2000000.0, color="#A21CAF")
    w3 = Wallet(user_id=user.id, name="Tiền mặt", wallet_type="CASH", wallet_scope="virtual", balance=500000.0, color="#16A34A")
    db_session.add_all([w1, w2, w3])

    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def auth_headers(test_user):
    """Generates valid JWT Authorization headers for test_user."""
    token = create_access_token(data={"sub": str(test_user.id), "email": test_user.email, "role": test_user.role})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def admin_user(db_session):
    """Creates a super admin user in the test database."""
    user = User(
        email="admin@fintrack.ai",
        full_name="Administrator",
        hashed_password=get_password_hash("Admin@123456"),
        role="ADMIN",
        plan="PREMIUM",
        status="ACTIVE",
        currency="VND"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def admin_headers(admin_user):
    """Generates valid JWT Authorization headers for admin_user."""
    token = create_access_token(data={"sub": str(admin_user.id), "email": admin_user.email, "role": admin_user.role})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def moderator_user(db_session):
    """Creates a moderator user in the test database."""
    user = User(
        email="moderator@fintrack.ai",
        full_name="Moderator Staff",
        hashed_password=get_password_hash("Mod@123456"),
        role="MODERATOR",
        plan="PRO",
        status="ACTIVE",
        currency="VND"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def moderator_headers(moderator_user):
    """Generates valid JWT Authorization headers for moderator_user."""
    token = create_access_token(data={"sub": str(moderator_user.id), "email": moderator_user.email, "role": moderator_user.role})
    return {"Authorization": f"Bearer {token}"}
