import uuid
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field
from app.models.user import UserRole


class UserCreate(BaseModel):
    login: str = Field(min_length=3)
    password: str = Field(min_length=6)
    first_name: str
    last_name: str
    role: Literal["reporter", "support"]
    department_id: uuid.UUID | None = None


class UserUpdate(BaseModel):
    login: str | None = Field(default=None, min_length=3)
    password: str | None = Field(default=None, min_length=6)
    first_name: str | None = None
    last_name: str | None = None
    role: Literal["reporter", "support"] | None = None
    department_id: uuid.UUID | None = None


class UserResponse(BaseModel):
    id: uuid.UUID
    login: str
    first_name: str
    last_name: str
    role: UserRole
    department_id: uuid.UUID | None
    is_temporary_password: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
