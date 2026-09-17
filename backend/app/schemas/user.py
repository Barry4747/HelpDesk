import uuid

from pydantic import BaseModel, ConfigDict

from app.models.user import UserRole


class UserResponse(BaseModel):
    id: uuid.UUID
    login: str
    first_name: str
    last_name: str
    role: UserRole
    department_id: uuid.UUID | None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
