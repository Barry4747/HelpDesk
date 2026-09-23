import pytest

from tests.conftest import make_ticket


class TestTicketPatchPermissions:
    def test_support_can_patch_category(
        self, support_client, reporter_user, db_session, active_category
    ):
        ticket = make_ticket(db_session, reporter_user)

        resp = support_client.patch(
            f"/api/v1/tickets/{ticket.id}",
            json={"category_id": str(active_category.id)},
        )
        assert resp.status_code == 200
        assert resp.json()["category_id"] == str(active_category.id)

    def test_support_cannot_patch_title(
        self, support_client, reporter_user, db_session
    ):
        ticket = make_ticket(db_session, reporter_user)

        resp = support_client.patch(
            f"/api/v1/tickets/{ticket.id}",
            json={"title": "Hacked title"},
        )
        assert resp.status_code == 422

    def test_admin_can_patch_title(
        self, admin_client, reporter_user, db_session
    ):
        ticket = make_ticket(db_session, reporter_user)

        resp = admin_client.patch(
            f"/api/v1/tickets/{ticket.id}",
            json={"title": "Updated by admin"},
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated by admin"

    def test_admin_assigning_reporter_as_assignee_returns_400(
        self, admin_client, reporter_user, db_session, active_category
    ):
        ticket = make_ticket(db_session, reporter_user)

        resp = admin_client.patch(
            f"/api/v1/tickets/{ticket.id}",
            json={
                "assigned_to_id": str(reporter_user.id),
                "category_id": str(active_category.id),
                "priority": "sredni",
            },
        )
        assert resp.status_code == 400

    def test_reporter_cannot_patch_any_ticket(
        self, reporter_client, reporter_user, db_session
    ):
        ticket = make_ticket(db_session, reporter_user)

        resp = reporter_client.patch(
            f"/api/v1/tickets/{ticket.id}",
            json={"priority": "niski"},
        )
        assert resp.status_code == 403
