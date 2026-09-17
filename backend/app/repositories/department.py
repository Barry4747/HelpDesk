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
        stmt = select(Department).order_by(Department.name.asc())
        return self.session.scalars(stmt).all()

    def create(self, department: Department) -> Department:
        self.session.add(department)
        self.session.commit()
        self.session.refresh(department)
        return department

    def update(self, department: Department) -> Department:
        self.session.commit()
        self.session.refresh(department)
        return department
