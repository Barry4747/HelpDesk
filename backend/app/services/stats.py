from fastapi import Depends

from app.repositories.stats import StatsRepository
from app.schemas.stats import (
    CategoryCount,
    PriorityCount,
    StatusCount,
    StatsOverviewResponse,
    StatsWorkloadResponse,
    WorkloadItem,
)


class StatsService:
    def __init__(self, repo: StatsRepository = Depends()):
        self.repo = repo

    def get_overview(self, filters: "StatsOverviewFilterParams") -> StatsOverviewResponse:
        by_status = [
            StatusCount(status=status, count=count)
            for status, count in self.repo.count_by_status(filters)
        ]
        by_priority = [
            PriorityCount(priority=priority, count=count)
            for priority, count in self.repo.count_by_priority(filters)
        ]
        by_category = [
            CategoryCount(
                category_id=category_id,
                category_name=category_name if category_name is not None else "Bez kategorii",
                count=count,
            )
            for category_id, category_name, count in self.repo.count_by_category(filters)
        ]
        return StatsOverviewResponse(
            by_status=by_status,
            by_priority=by_priority,
            by_category=by_category,
        )

    def get_workload(self, filters: "StatsWorkloadFilterParams") -> StatsWorkloadResponse:
        items = [
            WorkloadItem(
                user_id=user_id,
                first_name=first_name,
                last_name=last_name,
                active_ticket_count=active_ticket_count,
            )
            for user_id, first_name, last_name, active_ticket_count in self.repo.workload(filters)
        ]
        return StatsWorkloadResponse(items=items)
