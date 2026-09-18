import uuid
from collections.abc import Sequence

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.models.category import Category


class CategoryRepository:
    def __init__(self, session: Session = Depends(get_db)):
        self.session = session

    def get_by_id(self, category_id: str | uuid.UUID) -> Category | None:
        stmt = select(Category).where(Category.id == category_id)
        return self.session.scalars(stmt).first()

    def get_by_name(self, name: str) -> Category | None:
        stmt = select(Category).where(Category.name == name)
        return self.session.scalars(stmt).first()

    def get_all(self) -> Sequence[Category]:
        stmt = select(Category).order_by(Category.name.asc())
        return self.session.scalars(stmt).all()

    def create(self, category: Category) -> Category:
        self.session.add(category)
        self.session.commit()
        self.session.refresh(category)
        return category

    def update(self, category: Category) -> Category:
        self.session.commit()
        self.session.refresh(category)
        return category
