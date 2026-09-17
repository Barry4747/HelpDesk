import uuid
from collections.abc import Sequence

from fastapi import Depends

from app.exceptions.ticket import TicketNotFoundError
from app.models.ticket import Ticket, TicketStatus
from app.repositories.ticket import TicketRepository
from app.schemas.ticket import TicketCreate, TicketStatusUpdate, TicketUpdate


class TicketService:
    def __init__(self, repository: TicketRepository = Depends()):
        self.repository = repository

    def create_ticket(self, data: TicketCreate) -> Ticket:
        ticket = Ticket(
            title=data.title,
            description=data.description,
            reporter_id=data.reporter_id,
            status=TicketStatus.nowe,
        )
        return self.repository.create(ticket)

    def get_ticket(self, ticket_id: uuid.UUID) -> Ticket:
        ticket = self.repository.get_by_id(ticket_id)
        if not ticket:
            raise TicketNotFoundError()
        return ticket

    def list_tickets(self) -> Sequence[Ticket]:
        return self.repository.get_all()

    def update_ticket(self, ticket_id: uuid.UUID, data: TicketUpdate) -> Ticket:
        ticket = self.get_ticket(ticket_id)

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(ticket, key, value)

        return self.repository.update(ticket)

    def update_status(
        self, ticket_id: uuid.UUID, data: TicketStatusUpdate
    ) -> Ticket:
        ticket = self.get_ticket(ticket_id)
        ticket.status = data.status
        return self.repository.update(ticket)

    def delete_ticket(self, ticket_id: uuid.UUID) -> None:
        ticket = self.get_ticket(ticket_id)
        self.repository.delete(ticket)
