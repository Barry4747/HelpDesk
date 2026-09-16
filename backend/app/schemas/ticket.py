import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.ticket import TicketPriority, TicketStatus


class TicketCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    reporter_id: uuid.UUID


class TicketUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    description: str | None = Field(default=None, min_length=1)
    category_id: uuid.UUID | None = None
    priority: TicketPriority | None = None


class TicketStatusUpdate(BaseModel):
    status: TicketStatus


class TicketResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    status: TicketStatus
    reporter_id: uuid.UUID
    assigned_to_id: uuid.UUID | None = None
    category_id: uuid.UUID | None = None
    priority: TicketPriority | None = None
    suggested_category_id: uuid.UUID | None = None
    suggested_priority: TicketPriority | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
