import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import _TEST_PASSWORD, _make_user, _set_auth_cookies_no_secure, make_ticket
from app.models.user import UserRole


class TestTicketAssign:
    def test_assigning_without_category_and_priority_returns_400(
        self, support_client, support_user, reporter_user, db_session
    ):
        ticket = make_ticket(db_session, reporter_user)
        resp = support_client.patch(
            f"/api/v1/tickets/{ticket.id}",
            json={"assigned_to_id": str(support_user.id)},
        )
        assert resp.status_code == 400

    def test_support_assigns_ticket_to_self_changes_status(
        self, support_client, support_user, reporter_user, db_session, active_category
    ):
        ticket = make_ticket(db_session, reporter_user)
        resp = support_client.patch(
            f"/api/v1/tickets/{ticket.id}",
            json={
                "assigned_to_id": str(support_user.id),
                "category_id": str(active_category.id),
                "priority": "sredni",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["assigned_to_id"] == str(support_user.id)
        assert data["status"] == "przyjete"

    def test_second_support_cannot_patch_already_assigned_ticket(
        self, support_client, support_user, reporter_user, db_session, active_category, monkeypatch
    ):
        ticket = make_ticket(db_session, reporter_user)

        support_client.patch(
            f"/api/v1/tickets/{ticket.id}",
            json={
                "assigned_to_id": str(support_user.id),
                "category_id": str(active_category.id),
                "priority": "wysoki",
            },
        )

        support2 = _make_user(db_session, "support2@test.local", UserRole.support)

        from app.dependencies.database import get_db

        app.state.limiter.reset()
        import app.routers.auth as auth_router

        monkeypatch.setattr(auth_router, "set_auth_cookies", _set_auth_cookies_no_secure)

        def override_get_db():
            yield db_session

        app.dependency_overrides[get_db] = override_get_db
        c2 = TestClient(app, raise_server_exceptions=True)
        resp_login = c2.post("/api/v1/auth/login", json={"login": support2.login, "password": _TEST_PASSWORD})
        assert resp_login.status_code == 200

        resp = c2.patch(
            f"/api/v1/tickets/{ticket.id}",
            json={
                "assigned_to_id": str(support2.id),
                "category_id": str(active_category.id),
                "priority": "wysoki",
            },
        )
        assert resp.status_code == 403
