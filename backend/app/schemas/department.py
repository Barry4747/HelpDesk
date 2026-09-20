import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DepartmentCreate(BaseModel):
    name: str = Field(min_length=1)


class DepartmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    is_active: bool | None = None


class DepartmentResponse(BaseModel):
    id: uuid.UUID
    name: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class DepartmentFilterParams(BaseModel):
    is_active: bool | None = None
    search: str | None = None
    sort_by: Literal["name", "created_at", "is_active"] = "name"
    sort_order: Literal["asc", "desc"] = "asc"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=1000)


class PaginatedDepartmentsResponse(BaseModel):
    items: list[DepartmentResponse]
    total: int
    page: int
    page_size: int
