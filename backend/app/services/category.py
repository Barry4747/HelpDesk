import uuid
from collections.abc import Sequence

from fastapi import Depends

from app.exceptions.category import (
    CategoryNameAlreadyExistsError,
    CategoryNotFoundError,
)
from app.models.category import Category
from app.repositories.category import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryFilterParams, PaginatedCategoriesResponse


class CategoryService:
    def __init__(self, repository: CategoryRepository = Depends()):
        self.repository = repository

    def create_category(self, data: CategoryCreate) -> Category:
        if self.repository.get_by_name(data.name):
            raise CategoryNameAlreadyExistsError()

        category = Category(
            name=data.name,
            is_active=True,
        )
        return self.repository.create(category)

    def list_categories(self, filters: CategoryFilterParams) -> PaginatedCategoriesResponse:
        items, total = self.repository.get_filtered(filters)
        return PaginatedCategoriesResponse(
            items=items,
            total=total,
            page=filters.page,
            page_size=filters.page_size
        )

    def update_category(self, category_id: uuid.UUID, data: CategoryUpdate) -> Category:
        category = self.repository.get_by_id(category_id)
        if not category:
            raise CategoryNotFoundError()

        update_data = data.model_dump(exclude_unset=True)

        if "name" in update_data and update_data["name"] != category.name:
            if self.repository.get_by_name(update_data["name"]):
                raise CategoryNameAlreadyExistsError()

        for key, value in update_data.items():
            setattr(category, key, value)

        return self.repository.update(category)
