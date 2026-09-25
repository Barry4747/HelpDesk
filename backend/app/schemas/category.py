import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1)


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    is_active: bool | None = None


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class CategoryFilterParams(BaseModel):
    is_active: bool | None = None
    search: str | None = None
    sort_by: Literal["name", "created_at", "is_active"] = "name"
    sort_order: Literal["asc", "desc"] = "asc"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=1000)


class PaginatedCategoriesResponse(BaseModel):
    items: list[CategoryResponse]
    total: int
    page: int
    page_size: int
