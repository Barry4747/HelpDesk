import uuid
from collections.abc import Sequence

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.models.ticket import Ticket


class TicketRepository:
    def __init__(self, session: Session = Depends(get_db)):
        self.session = session

    def get_by_id(self, ticket_id: uuid.UUID) -> Ticket | None:
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        return self.session.scalars(stmt).first()

    def get_all(self) -> Sequence[Ticket]:
        stmt = select(Ticket)
        return self.session.scalars(stmt).all()

    def create(self, ticket: Ticket) -> Ticket:
        self.session.add(ticket)
        self.session.commit()
        self.session.refresh(ticket)
        return ticket

    def update(self, ticket: Ticket) -> Ticket:
        self.session.commit()
        self.session.refresh(ticket)
        return ticket

    def delete(self, ticket: Ticket) -> None:
        self.session.delete(ticket)
        self.session.commit()
