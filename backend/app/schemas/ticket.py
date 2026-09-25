import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.ticket import TicketPriority, TicketStatus


class TicketCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=5000)

    model_config = ConfigDict(extra="forbid")


class TicketUpdateSupport(BaseModel):
    category_id: uuid.UUID | None = None
    priority: TicketPriority | None = None
    assigned_to_id: uuid.UUID | None = None

    model_config = ConfigDict(extra="forbid")


class TicketUpdateAdmin(BaseModel):
    category_id: uuid.UUID | None = None
    priority: TicketPriority | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, min_length=1, max_length=5000)
    assigned_to_id: uuid.UUID | None = None

    model_config = ConfigDict(extra="forbid")


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


class TicketFilterParams(BaseModel):
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    category_id: uuid.UUID | None = None
    assigned_to_me: bool = False
    search: str | None = None
    sort_by: Literal["created_at", "updated_at", "priority", "status"] = "created_at"
    sort_order: Literal["asc", "desc"] = "desc"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginatedTicketsResponse(BaseModel):
    items: list[TicketResponse]
    total: int
    page: int
    page_size: int
