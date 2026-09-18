import uuid
from collections.abc import Sequence

from fastapi import Depends

from app.exceptions.ticket import (
    InvalidAssigneeError,
    TicketAccessDeniedError,
    TicketDeleteNotAllowedError,
    TicketNotFoundError,
)
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User
from app.repositories.ticket import TicketRepository
from app.repositories.user import UserRepository
from app.schemas.ticket import (
    TicketCreate,
    TicketStatusUpdate,
    TicketUpdateAdmin,
    TicketUpdateSupport,
)


class TicketService:
    def __init__(
        self,
        repository: TicketRepository = Depends(),
        user_repo: UserRepository = Depends(),
    ):
        self.repository = repository
        self.user_repo = user_repo

    def create_ticket(self, data: TicketCreate, reporter_id: uuid.UUID) -> Ticket:
        ticket = Ticket(
            title=data.title,
            description=data.description,
            reporter_id=reporter_id,
            category_id=data.category_id,
            priority=data.priority,
            status=TicketStatus.nowe,
        )
        return self.repository.create(ticket)

    def get_ticket(self, ticket_id: uuid.UUID, current_user: User) -> Ticket:
        ticket = self.repository.get_by_id(ticket_id)
        if not ticket:
            raise TicketNotFoundError()

        if current_user.role == "reporter" and ticket.reporter_id != current_user.id:
            raise TicketAccessDeniedError()

        return ticket

    def list_tickets(self, current_user: User) -> Sequence[Ticket]:
        if current_user.role == "reporter":
            all_tickets = self.repository.get_all()
            return [t for t in all_tickets if t.reporter_id == current_user.id]
        return self.repository.get_all()

    def update_ticket(
        self,
        ticket_id: uuid.UUID,
        data: TicketUpdateSupport | TicketUpdateAdmin,
        current_user: User,
    ) -> Ticket:
        ticket = self.get_ticket(ticket_id, current_user)

        update_data = data.model_dump(exclude_unset=True)

        if "assigned_to_id" in update_data and update_data["assigned_to_id"] is not None:
            assignee = self.user_repo.get_by_id(update_data["assigned_to_id"])
            if not assignee or assignee.role not in ["support", "admin"]:
                raise InvalidAssigneeError()

        for key, value in update_data.items():
            setattr(ticket, key, value)

        return self.repository.update(ticket)

    def update_status(
        self, ticket_id: uuid.UUID, data: TicketStatusUpdate, current_user: User
    ) -> Ticket:
        ticket = self.get_ticket(ticket_id, current_user)
        ticket.status = data.status
        return self.repository.update(ticket)

    def delete_ticket(self, ticket_id: uuid.UUID, current_user: User) -> None:
        ticket = self.get_ticket(ticket_id, current_user)

        if current_user.role == "admin":
            self.repository.delete(ticket)
        elif current_user.role == "support":
            if ticket.assigned_to_id != current_user.id or ticket.status != "zamkniete":
                raise TicketDeleteNotAllowedError()
            self.repository.delete(ticket)
