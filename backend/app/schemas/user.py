import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.user import UserRole


class UserCreate(BaseModel):
    login: str = Field(min_length=3)
    password: str = Field(min_length=8)
    first_name: str
    last_name: str
    role: Literal["reporter", "support"]
    department_id: uuid.UUID | None = None

    model_config = ConfigDict(extra="forbid")


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    role: Literal["reporter", "support", "admin"] | None = None
    department_id: uuid.UUID | None = None

    model_config = ConfigDict(extra="forbid")


class UserResponse(BaseModel):
    id: uuid.UUID
    login: str
    first_name: str
    last_name: str
    role: str
    department_id: uuid.UUID | None
    is_active: bool
    is_temporary_password: bool

    model_config = ConfigDict(from_attributes=True)


class UserFilterParams(BaseModel):
    role: UserRole | None = None
    department_id: uuid.UUID | None = None
    is_active: bool | None = None
    search: str | None = None
    sort_by: Literal["login", "first_name", "last_name", "created_at", "role", "department_id", "is_active"] = "created_at"
    sort_order: Literal["asc", "desc"] = "desc"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginatedUsersResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    page_size: int
