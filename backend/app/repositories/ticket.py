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

    def get_filtered(self, filters, extra_conditions: list = None) -> tuple[Sequence[Ticket], int]:
        from sqlalchemy import case, func
        
        stmt = select(Ticket)
        count_stmt = select(func.count()).select_from(Ticket)
        
        conditions = []
        if extra_conditions:
            conditions.extend(extra_conditions)
            
        if filters.status:
            conditions.append(Ticket.status == filters.status)
        if filters.priority:
            conditions.append(Ticket.priority == filters.priority)
        if filters.category_id:
            conditions.append(Ticket.category_id == filters.category_id)
        if filters.search:
            conditions.append(Ticket.title.ilike(f"%{filters.search}%"))
            
        if conditions:
            stmt = stmt.where(*conditions)
            count_stmt = count_stmt.where(*conditions)
            
        total = self.session.scalar(count_stmt) or 0
        
        if filters.sort_by == "priority":
            order_col = case(
                (Ticket.priority == "krytyczny", 4),
                (Ticket.priority == "wysoki", 3),
                (Ticket.priority == "sredni", 2),
                (Ticket.priority == "niski", 1),
                else_=0
            )
        elif filters.sort_by == "status":
            order_col = case(
                (Ticket.status == "nowe", 1),
                (Ticket.status == "przyjete", 2),
                (Ticket.status == "zamkniete", 3),
                else_=4
            )
        else:
            order_col = getattr(Ticket, filters.sort_by)
            
        if filters.sort_order == "desc":
            stmt = stmt.order_by(order_col.desc())
        else:
            stmt = stmt.order_by(order_col.asc())
            
        stmt = stmt.limit(filters.page_size).offset((filters.page - 1) * filters.page_size)
        
        items = self.session.scalars(stmt).all()
        return items, total

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
