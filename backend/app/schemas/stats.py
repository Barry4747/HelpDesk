import uuid
from datetime import datetime

from pydantic import BaseModel


class StatusCount(BaseModel):
    status: str
    count: int


class PriorityCount(BaseModel):
    priority: str
    count: int


class CategoryCount(BaseModel):
    category_id: uuid.UUID | None
    category_name: str
    count: int


class StatsOverviewResponse(BaseModel):
    by_status: list[StatusCount]
    by_priority: list[PriorityCount]
    by_category: list[CategoryCount]


class WorkloadItem(BaseModel):
    user_id: uuid.UUID
    first_name: str
    last_name: str
    active_ticket_count: int


class StatsWorkloadResponse(BaseModel):
    items: list[WorkloadItem]


class StatsOverviewFilterParams(BaseModel):
    department_ids: str | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None


class StatsWorkloadFilterParams(BaseModel):
    date_from: datetime | None = None
    date_to: datetime | None = None
    workload_statuses: str | None = None
