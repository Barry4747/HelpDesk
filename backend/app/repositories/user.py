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
        stmt = select(User).order_by(User.created_at.desc())
        return self.session.scalars(stmt).all()

    def create(self, user: User) -> User:
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def update(self, user: User) -> User:
        self.session.commit()
        self.session.refresh(user)
        return user
