import uuid

from fastapi import APIRouter, Depends, status

from app.dependencies.auth import get_current_user, require_role
from app.models.user import User
from app.schemas.department import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)
from app.services.department import DepartmentService

router = APIRouter(prefix="/api/v1/departments", tags=["departments"])


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    data: DepartmentCreate,
    service: DepartmentService = Depends(),
    _admin: User = Depends(require_role("admin")),
):
    return service.create_department(data)


@router.get("", response_model=list[DepartmentResponse])
def list_departments(
    service: DepartmentService = Depends(),
    _user: User = Depends(get_current_user),
):
    return service.list_departments()


@router.patch("/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: uuid.UUID,
    data: DepartmentUpdate,
    service: DepartmentService = Depends(),
    _admin: User = Depends(require_role("admin")),
):
    return service.update_department(department_id, data)
