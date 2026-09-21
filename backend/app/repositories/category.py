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
        stmt = select(Category)
        return self.session.scalars(stmt).all()

    def get_filtered(self, filters) -> tuple[Sequence[Category], int]:
        from sqlalchemy import func

        stmt = select(Category)
        count_stmt = select(func.count()).select_from(Category)

        conditions = []
        if filters.is_active is not None:
            conditions.append(Category.is_active == filters.is_active)
        if filters.search:
            conditions.append(Category.name.ilike(f"%{filters.search}%"))

        if conditions:
            stmt = stmt.where(*conditions)
            count_stmt = count_stmt.where(*conditions)

        total = self.session.scalar(count_stmt) or 0

        order_col = getattr(Category, filters.sort_by)
        if filters.sort_order == "desc":
            stmt = stmt.order_by(order_col.desc())
        else:
            stmt = stmt.order_by(order_col.asc())

        stmt = stmt.limit(filters.page_size).offset((filters.page - 1) * filters.page_size)

        items = self.session.scalars(stmt).all()
        return items, total

    def create(self, category: Category) -> Category:
        self.session.add(category)
        self.session.commit()
        self.session.refresh(category)
        return category

    def update(self, category: Category) -> Category:
        self.session.commit()
        self.session.refresh(category)
        return category
