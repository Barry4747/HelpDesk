import uuid
from typing import TYPE_CHECKING

from fastapi import Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.models.category import Category
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User, UserRole

if TYPE_CHECKING:
    from app.schemas.stats import StatsOverviewFilterParams, StatsWorkloadFilterParams


class StatsRepository:
    def __init__(self, session: Session = Depends(get_db)):
        self.session = session

    def count_by_status(self, filters: "StatsOverviewFilterParams") -> list[tuple[str, int]]:
        stmt = select(Ticket.status, func.count().label("cnt")).group_by(Ticket.status)
        stmt = self._apply_overview_filters(stmt, filters)
        rows = self.session.execute(stmt).all()
        return [(str(row[0].value if hasattr(row[0], "value") else row[0]), row[1]) for row in rows]

    def count_by_priority(self, filters: "StatsOverviewFilterParams") -> list[tuple[str, int]]:
        stmt = (
            select(Ticket.priority, func.count().label("cnt"))
            .where(Ticket.priority.isnot(None))
            .group_by(Ticket.priority)
        )
        stmt = self._apply_overview_filters(stmt, filters)
        rows = self.session.execute(stmt).all()
        return [(str(row[0].value if hasattr(row[0], "value") else row[0]), row[1]) for row in rows]

    def count_by_category(self, filters: "StatsOverviewFilterParams") -> list[tuple[uuid.UUID | None, str | None, int]]:
        stmt = (
            select(Ticket.category_id, Category.name, func.count().label("cnt"))
            .outerjoin(Category, Ticket.category_id == Category.id)
            .group_by(Ticket.category_id, Category.name)
        )
        stmt = self._apply_overview_filters(stmt, filters)
        rows = self.session.execute(stmt).all()
        return [(row[0], row[1], row[2]) for row in rows]

    def _apply_overview_filters(self, stmt, filters: "StatsOverviewFilterParams"):
        conditions = []
        if filters.date_from:
            conditions.append(Ticket.created_at >= filters.date_from)
        if filters.date_to:
            conditions.append(Ticket.created_at <= filters.date_to)

        if filters.department_ids:
            try:
                parts = filters.department_ids.split(",")
                dept_ids = [uuid.UUID(p.strip()) for p in parts if p.strip()]
                if dept_ids:
                    stmt = stmt.join(User, Ticket.reporter_id == User.id)
                    conditions.append(User.department_id.in_(dept_ids))
            except ValueError:
                pass

        if conditions:
            stmt = stmt.where(*conditions)
        return stmt

    def workload(self, filters: "StatsWorkloadFilterParams") -> list[tuple[uuid.UUID, str, str, int]]:

        statuses_to_count = [TicketStatus.przyjete]
        if filters.workload_statuses:
            try:
                parts = filters.workload_statuses.split(",")
                statuses_to_count = [TicketStatus(p.strip()) for p in parts if p.strip()]
            except ValueError:
                pass

        ticket_conditions = [
            Ticket.status.in_(statuses_to_count),
            Ticket.assigned_to_id == User.id,
        ]

        if filters.date_from:
            ticket_conditions.append(Ticket.created_at >= filters.date_from)
        if filters.date_to:
            ticket_conditions.append(Ticket.created_at <= filters.date_to)

        active_ticket_count = func.count(Ticket.id).filter(*ticket_conditions).label("active_ticket_count")
        stmt = (
            select(
                User.id,
                User.first_name,
                User.last_name,
                active_ticket_count,
            )
            .where(
                User.role.in_([UserRole.support, UserRole.admin]),
                User.is_active == True,
            )
            .group_by(User.id, User.first_name, User.last_name)
            .order_by(active_ticket_count.desc())
        )
        rows = self.session.execute(stmt).all()
        return [(row[0], row[1], row[2], row[3]) for row in rows]
