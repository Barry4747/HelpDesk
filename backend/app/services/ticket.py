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
            status=TicketStatus.nowe,
        )
        return self.repository.create(ticket)

    def get_ticket(self, ticket_id: uuid.UUID, current_user: User) -> Ticket:
        ticket = self.repository.get_by_id(ticket_id)
        if not ticket:
            raise TicketNotFoundError()

        if current_user.role == "reporter" and ticket.reporter_id != current_user.id:
            raise TicketAccessDeniedError()

        if current_user.role == "support":
            if ticket.assigned_to_id is not None and ticket.assigned_to_id != current_user.id:
                raise TicketAccessDeniedError()

        return ticket

    def list_tickets(self, filters, current_user: User) -> tuple[Sequence[Ticket], int]:
        extra_conditions = []
        if current_user.role == "reporter":
            extra_conditions.append(Ticket.reporter_id == current_user.id)
        elif current_user.role == "support":
            if getattr(filters, "assigned_to_me", False):
                extra_conditions.append(Ticket.assigned_to_id == current_user.id)
            else:
                from sqlalchemy import or_
                extra_conditions.append(
                    or_(
                        Ticket.assigned_to_id == current_user.id,
                        (Ticket.status == TicketStatus.nowe) & (Ticket.assigned_to_id.is_(None))
                    )
                )
        elif current_user.role == "admin":
            if getattr(filters, "assigned_to_me", False):
                extra_conditions.append(Ticket.assigned_to_id == current_user.id)

        return self.repository.get_filtered(filters, extra_conditions)

    def update_ticket(
        self,
        ticket_id: uuid.UUID,
        data: TicketUpdateSupport | TicketUpdateAdmin,
        current_user: User,
    ) -> Ticket:
        ticket = self.get_ticket(ticket_id, current_user)

        update_data = data.model_dump(exclude_unset=True)

        if "assigned_to_id" in update_data:
            new_assignee = update_data["assigned_to_id"]
            if current_user.role == "support" and new_assignee is not None and new_assignee != current_user.id:
                raise TicketAccessDeniedError()

            if new_assignee is not None:
                assignee = self.user_repo.get_by_id(new_assignee)
                if not assignee or assignee.role not in ["support", "admin"]:
                    raise InvalidAssigneeError()
                
                final_category = update_data.get("category_id", ticket.category_id)
                final_priority = update_data.get("priority", ticket.priority)
                if not final_category or not final_priority:
                    from fastapi import HTTPException, status
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST, 
                        detail="Zgłoszenie musi mieć przypisaną kategorię i priorytet przed przypisaniem pracownika."
                    )
                
                if ticket.assigned_to_id is None and ticket.status == TicketStatus.nowe:
                    ticket.status = TicketStatus.przyjete

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
