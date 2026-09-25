import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import _TEST_PASSWORD, _make_user, _set_auth_cookies_no_secure, make_ticket
from app.models.user import UserRole


def _make_second_client(db_session, monkeypatch, login: str) -> TestClient:
    from app.dependencies.database import get_db

    app.state.limiter.reset()
    import app.routers.auth as auth_router

    monkeypatch.setattr(auth_router, "set_auth_cookies", _set_auth_cookies_no_secure)

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    c = TestClient(app, raise_server_exceptions=True)
    resp = c.post("/api/v1/auth/login", json={"login": login, "password": _TEST_PASSWORD})
    assert resp.status_code == 200, f"Second client login failed: {resp.text}"
    return c


class TestTicketVisibility:
    def test_reporter_sees_own_ticket_on_list(self, reporter_client, reporter_user, db_session):
        ticket = make_ticket(db_session, reporter_user)
        resp = reporter_client.get("/api/v1/tickets")
        assert resp.status_code == 200
        ids = [t["id"] for t in resp.json()["items"]]
        assert str(ticket.id) in ids

    def test_second_reporter_does_not_see_first_reporters_ticket(
        self, reporter_client, reporter_user, db_session, monkeypatch
    ):
        ticket = make_ticket(db_session, reporter_user)
        reporter2 = _make_user(db_session, "reporter2@test.local", UserRole.reporter)
        c2 = _make_second_client(db_session, monkeypatch, reporter2.login)

        resp = c2.get("/api/v1/tickets")
        assert resp.status_code == 200
        ids = [t["id"] for t in resp.json()["items"]]
        assert str(ticket.id) not in ids

    def test_second_reporter_gets_403_on_detail_of_other_ticket(
        self, reporter_client, reporter_user, db_session, monkeypatch
    ):
        ticket = make_ticket(db_session, reporter_user)
        reporter2 = _make_user(db_session, "reporter2b@test.local", UserRole.reporter)
        c2 = _make_second_client(db_session, monkeypatch, reporter2.login)

        resp = c2.get(f"/api/v1/tickets/{ticket.id}")
        assert resp.status_code == 403

    def test_support_sees_unprocessed_new_tickets_from_all_reporters(
        self, support_client, reporter_user, db_session
    ):
        reporter2 = _make_user(db_session, "reporter3@test.local", UserRole.reporter)
        ticket1 = make_ticket(db_session, reporter_user)
        ticket2 = make_ticket(db_session, reporter2)

        resp = support_client.get("/api/v1/tickets")
        assert resp.status_code == 200
        ids = [t["id"] for t in resp.json()["items"]]
        assert str(ticket1.id) in ids
        assert str(ticket2.id) in ids

    def test_support_does_not_see_ticket_still_being_ai_processed(
        self, support_client, reporter_user, db_session
    ):
        locked_ticket = make_ticket(db_session, reporter_user, ai_processing=True)
        resp = support_client.get("/api/v1/tickets")
        assert resp.status_code == 200
        ids = [t["id"] for t in resp.json()["items"]]
        assert str(locked_ticket.id) not in ids
