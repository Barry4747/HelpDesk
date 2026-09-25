from fastapi import APIRouter, Depends

from app.dependencies.auth import require_role
from app.schemas.stats import (
    StatsOverviewFilterParams,
    StatsOverviewResponse,
    StatsWorkloadFilterParams,
    StatsWorkloadResponse,
)
from app.services.stats import StatsService

router = APIRouter(prefix="/api/v1/stats", tags=["stats"])


@router.get("/overview", response_model=StatsOverviewResponse)
def get_overview(
    filters: StatsOverviewFilterParams = Depends(),
    current_user=Depends(require_role("admin")),
    service: StatsService = Depends(),
) -> StatsOverviewResponse:
    return service.get_overview(filters)


@router.get("/workload", response_model=StatsWorkloadResponse)
def get_workload(
    filters: StatsWorkloadFilterParams = Depends(),
    current_user=Depends(require_role("admin")),
    service: StatsService = Depends(),
) -> StatsWorkloadResponse:
    return service.get_workload(filters)
