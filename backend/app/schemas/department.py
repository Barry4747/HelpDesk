import uuid

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
