import uuid
from collections.abc import Sequence

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.models.user import User


class UserRepository:
    def __init__(self, session: Session = Depends(get_db)):
        self.session = session

    def get_by_id(self, user_id: str | uuid.UUID) -> User | None:
        stmt = select(User).where(User.id == user_id)
        return self.session.scalars(stmt).first()

    def get_by_login(self, login: str) -> User | None:
        stmt = select(User).where(User.login == login)
        return self.session.scalars(stmt).first()

    def get_all(self) -> Sequence[User]:
        stmt = select(User)
        return self.session.scalars(stmt).all()

    def get_filtered(self, filters) -> tuple[Sequence[User], int]:
        from sqlalchemy import func, or_, case
        
        stmt = select(User)
        count_stmt = select(func.count()).select_from(User)
        
        conditions = []
        if filters.role:
            conditions.append(User.role == filters.role)
        if filters.department_id:
            conditions.append(User.department_id == filters.department_id)
        if filters.is_active is not None:
            conditions.append(User.is_active == filters.is_active)
        if filters.search:
            search_term = f"%{filters.search}%"
            conditions.append(or_(
                User.login.ilike(search_term),
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term)
            ))
            
        if conditions:
            stmt = stmt.where(*conditions)
            count_stmt = count_stmt.where(*conditions)
            
        total = self.session.scalar(count_stmt) or 0
        
        if filters.sort_by == "role":
            order_col = case(
                (User.role == "admin", 3),
                (User.role == "support", 2),
                (User.role == "reporter", 1),
                else_=0
            )
        else:
            order_col = getattr(User, filters.sort_by)
            
        if filters.sort_order == "desc":
            stmt = stmt.order_by(order_col.desc())
        else:
            stmt = stmt.order_by(order_col.asc())
            
        stmt = stmt.limit(filters.page_size).offset((filters.page - 1) * filters.page_size)
        
        items = self.session.scalars(stmt).all()
        return items, total

    def create(self, user: User) -> User:
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def update(self, user: User) -> User:
        self.session.commit()
        self.session.refresh(user)
        return user
