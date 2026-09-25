import uuid
from collections.abc import Sequence

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.models.department import Department


class DepartmentRepository:
    def __init__(self, session: Session = Depends(get_db)):
        self.session = session

    def get_by_id(self, department_id: str | uuid.UUID) -> Department | None:
        stmt = select(Department).where(Department.id == department_id)
        return self.session.scalars(stmt).first()

    def get_by_name(self, name: str) -> Department | None:
        stmt = select(Department).where(Department.name == name)
        return self.session.scalars(stmt).first()

    def get_all(self) -> Sequence[Department]:
        stmt = select(Department)
        return self.session.scalars(stmt).all()

    def get_filtered(self, filters) -> tuple[Sequence[Department], int]:
        from sqlalchemy import func

        stmt = select(Department)
        count_stmt = select(func.count()).select_from(Department)

        conditions = []
        if filters.is_active is not None:
            conditions.append(Department.is_active == filters.is_active)
        if filters.search:
            conditions.append(Department.name.ilike(f"%{filters.search}%"))

        if conditions:
            stmt = stmt.where(*conditions)
            count_stmt = count_stmt.where(*conditions)

        total = self.session.scalar(count_stmt) or 0

        order_col = getattr(Department, filters.sort_by)
        if filters.sort_order == "desc":
            stmt = stmt.order_by(order_col.desc())
        else:
            stmt = stmt.order_by(order_col.asc())

        stmt = stmt.limit(filters.page_size).offset((filters.page - 1) * filters.page_size)

        items = self.session.scalars(stmt).all()
        return items, total

    def create(self, department: Department) -> Department:
        self.session.add(department)
        self.session.commit()
        self.session.refresh(department)
        return department

    def update(self, department: Department) -> Department:
        self.session.commit()
        self.session.refresh(department)
        return department
