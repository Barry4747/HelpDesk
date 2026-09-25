import uuid
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.exceptions.ticket import (
    InvalidAssigneeError,
    TicketAccessDeniedError,
    TicketDeleteNotAllowedError,
    TicketMissingDataError,
    TicketNotFoundError,
)
from app.models.ticket import TicketPriority, TicketStatus
from app.models.user import UserRole
from app.schemas.ticket import TicketUpdateAdmin, TicketUpdateSupport
from app.services.ticket import TicketService


def _make_service(repo=None, user_repo=None) -> TicketService:
    svc = TicketService.__new__(TicketService)
    svc.repository = repo or MagicMock()
    svc.user_repo = user_repo or MagicMock()
    return svc


def _ticket(**kwargs) -> SimpleNamespace:
    defaults = dict(
        id=uuid.uuid4(),
        title="Test",
        description="desc",
        status=TicketStatus.nowe,
        reporter_id=uuid.uuid4(),
        assigned_to_id=None,
        category_id=None,
        priority=None,
        suggested_category_id=None,
        suggested_priority=None,
        is_ai_processing=False,
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def _user(role: UserRole = UserRole.support, user_id: uuid.UUID | None = None) -> SimpleNamespace:
    return SimpleNamespace(
        id=user_id or uuid.uuid4(),
        role=role,
        is_active=True,
    )


class TestGetTicketAccessControl:
    def test_reporter_cannot_access_other_reporters_ticket(self):
        ticket = _ticket(reporter_id=uuid.uuid4())
        repo = MagicMock()
        repo.get_by_id.return_value = ticket
        svc = _make_service(repo=repo)
        current = _user(UserRole.reporter, uuid.uuid4())
        with pytest.raises(TicketAccessDeniedError):
            svc.get_ticket(ticket.id, current)

    def test_reporter_can_access_own_ticket(self):
        owner_id = uuid.uuid4()
        ticket = _ticket(reporter_id=owner_id)
        repo = MagicMock()
        repo.get_by_id.return_value = ticket
        svc = _make_service(repo=repo)
        current = _user(UserRole.reporter, owner_id)
        result = svc.get_ticket(ticket.id, current)
        assert result is ticket

    def test_support_cannot_access_ticket_assigned_to_others(self):
        other_support_id = uuid.uuid4()
        ticket = _ticket(assigned_to_id=other_support_id)
        repo = MagicMock()
        repo.get_by_id.return_value = ticket
        svc = _make_service(repo=repo)
        current = _user(UserRole.support, uuid.uuid4())
        with pytest.raises(TicketAccessDeniedError):
            svc.get_ticket(ticket.id, current)

    def test_ticket_not_found_raises(self):
        repo = MagicMock()
        repo.get_by_id.return_value = None
        svc = _make_service(repo=repo)
        with pytest.raises(TicketNotFoundError):
            svc.get_ticket(uuid.uuid4(), _user())


class TestUpdateTicketPermissions:
    def test_assigning_reporter_as_assignee_raises(self):
        ticket = _ticket(assigned_to_id=None, category_id=uuid.uuid4(), priority=TicketPriority.sredni)
        assignee = _user(UserRole.reporter)
        repo = MagicMock()
        repo.get_by_id.return_value = ticket
        user_repo = MagicMock()
        user_repo.get_by_id.return_value = assignee
        svc = _make_service(repo=repo, user_repo=user_repo)
        current = _user(UserRole.admin)
        data = TicketUpdateAdmin(assigned_to_id=assignee.id, category_id=ticket.category_id, priority=ticket.priority)
        with pytest.raises(InvalidAssigneeError):
            svc.update_ticket(ticket.id, data, current)

    def test_assigning_without_category_and_priority_raises(self):
        assignee_id = uuid.uuid4()
        ticket = _ticket(assigned_to_id=None, category_id=None, priority=None)
        assignee = _user(UserRole.support, assignee_id)
        repo = MagicMock()
        repo.get_by_id.return_value = ticket
        user_repo = MagicMock()
        user_repo.get_by_id.return_value = assignee
        svc = _make_service(repo=repo, user_repo=user_repo)
        current = _user(UserRole.admin)
        data = TicketUpdateAdmin(assigned_to_id=assignee_id)
        with pytest.raises(TicketMissingDataError):
            svc.update_ticket(ticket.id, data, current)

    def test_support_cannot_assign_ticket_to_someone_else(self):
        other_id = uuid.uuid4()
        ticket = _ticket(assigned_to_id=None, category_id=uuid.uuid4(), priority=TicketPriority.niski)
        repo = MagicMock()
        repo.get_by_id.return_value = ticket
        svc = _make_service(repo=repo)
        current = _user(UserRole.support, uuid.uuid4())
        data = TicketUpdateSupport(assigned_to_id=other_id)
        with pytest.raises(TicketAccessDeniedError):
            svc.update_ticket(ticket.id, data, current)

    def test_assigning_to_self_changes_status_to_przyjete(self):
        support_id = uuid.uuid4()
        cat_id = uuid.uuid4()
        ticket = _ticket(assigned_to_id=None, category_id=cat_id, priority=TicketPriority.niski)
        assignee = _user(UserRole.support, support_id)
        repo = MagicMock()
        repo.get_by_id.return_value = ticket
        repo.update.return_value = ticket
        user_repo = MagicMock()
        user_repo.get_by_id.return_value = assignee
        svc = _make_service(repo=repo, user_repo=user_repo)
        current = _user(UserRole.support, support_id)
        data = TicketUpdateSupport(assigned_to_id=support_id)
        svc.update_ticket(ticket.id, data, current)
        assert ticket.status == TicketStatus.przyjete
        repo.update.assert_called_once()


class TestDeleteTicket:
    def test_admin_can_delete_any_ticket(self):
        ticket = _ticket()
        repo = MagicMock()
        repo.get_by_id.return_value = ticket
        svc = _make_service(repo=repo)
        svc.delete_ticket(ticket.id, _user(UserRole.admin))
        repo.delete.assert_called_once_with(ticket)

    def test_support_cannot_delete_unassigned_ticket(self):
        ticket = _ticket(assigned_to_id=None, status=TicketStatus.zamkniete)
        repo = MagicMock()
        repo.get_by_id.return_value = ticket
        svc = _make_service(repo=repo)
        with pytest.raises(TicketDeleteNotAllowedError):
            svc.delete_ticket(ticket.id, _user(UserRole.support))

    def test_support_cannot_delete_open_own_ticket(self):
        support_id = uuid.uuid4()
        ticket = _ticket(assigned_to_id=support_id, status=TicketStatus.przyjete)
        repo = MagicMock()
        repo.get_by_id.return_value = ticket
        svc = _make_service(repo=repo)
        with pytest.raises(TicketDeleteNotAllowedError):
            svc.delete_ticket(ticket.id, _user(UserRole.support, support_id))

    def test_support_can_delete_own_closed_ticket(self):
        support_id = uuid.uuid4()
        ticket = _ticket(assigned_to_id=support_id, status=TicketStatus.zamkniete)
        repo = MagicMock()
        repo.get_by_id.return_value = ticket
        svc = _make_service(repo=repo)
        svc.delete_ticket(ticket.id, _user(UserRole.support, support_id))
        repo.delete.assert_called_once_with(ticket)
