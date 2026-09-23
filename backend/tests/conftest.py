import os

import pytest
from fastapi import Response
from fastapi.testclient import TestClient
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.database import Base
from app.core.security import hash_password
from app.dependencies.database import get_db
from app.main import app
from app.models.category import Category
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User, UserRole

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql://helpdesk:changeme@postgres:5432/helpdesk_test",
)

_TEST_PASSWORD = "TestPass123!"


@pytest.fixture(scope="session")
def db_engine():
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


def _set_auth_cookies_no_secure(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(key="access_token", value=access_token, httponly=True)
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True)


@pytest.fixture(scope="function")
def client(db_session, monkeypatch):
    app.state.limiter.reset()

    import app.routers.auth as auth_router

    monkeypatch.setattr(auth_router, "set_auth_cookies", _set_auth_cookies_no_secure)

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


def _make_user(db_session: Session, login: str, role: UserRole) -> User:
    user = User(
        login=login,
        password_hash=hash_password(_TEST_PASSWORD),
        first_name="Test",
        last_name=role.value.capitalize(),
        role=role,
        is_temporary_password=False,
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    return user


@pytest.fixture()
def reporter_user(db_session):
    return _make_user(db_session, "reporter@test.local", UserRole.reporter)


@pytest.fixture()
def support_user(db_session):
    return _make_user(db_session, "support@test.local", UserRole.support)


@pytest.fixture()
def admin_user(db_session):
    return _make_user(db_session, "admin@test.local", UserRole.admin)


def _login(c: TestClient, login: str) -> TestClient:
    resp = c.post(
        "/api/v1/auth/login",
        json={"login": login, "password": _TEST_PASSWORD},
    )
    assert resp.status_code == 200, f"Login failed for {login}: {resp.text}"
    return c


@pytest.fixture()
def reporter_client(client, reporter_user):
    return _login(client, reporter_user.login)


@pytest.fixture()
def support_client(client, support_user):
    return _login(client, support_user.login)


@pytest.fixture()
def admin_client(client, admin_user):
    return _login(client, admin_user.login)


@pytest.fixture()
def active_category(db_session):
    cat = Category(name="Sprzęt", is_active=True)
    db_session.add(cat)
    db_session.flush()
    return cat


def make_ticket(db_session: Session, reporter: User, ai_processing: bool = False) -> Ticket:
    ticket = Ticket(
        title="Test ticket",
        description="Test description",
        status=TicketStatus.nowe,
        reporter_id=reporter.id,
        is_ai_processing=ai_processing,
    )
    db_session.add(ticket)
    db_session.flush()
    return ticket
