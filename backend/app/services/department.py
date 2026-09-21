import uuid

from fastapi import Depends

from app.exceptions.department import (
    DepartmentNameAlreadyExistsError,
    DepartmentNotFoundError,
)
from app.models.department import Department
from app.repositories.department import DepartmentRepository
from app.schemas.department import (
    DepartmentCreate,
    DepartmentFilterParams,
    DepartmentUpdate,
    PaginatedDepartmentsResponse,
)


class DepartmentService:
    def __init__(self, repository: DepartmentRepository = Depends()):
        self.repository = repository

    def create_department(self, data: DepartmentCreate) -> Department:
        if self.repository.get_by_name(data.name):
            raise DepartmentNameAlreadyExistsError()

        department = Department(
            name=data.name,
            is_active=True,
        )
        return self.repository.create(department)

    def list_departments(self, filters: DepartmentFilterParams) -> PaginatedDepartmentsResponse:
        items, total = self.repository.get_filtered(filters)
        return PaginatedDepartmentsResponse(
            items=items,  # type: ignore[arg-type]
            total=total,
            page=filters.page,
            page_size=filters.page_size,
        )

    def update_department(self, department_id: uuid.UUID, data: DepartmentUpdate) -> Department:
        department = self.repository.get_by_id(department_id)
        if not department:
            raise DepartmentNotFoundError()

        update_data = data.model_dump(exclude_unset=True)

        if "name" in update_data and update_data["name"] != department.name:
            if self.repository.get_by_name(update_data["name"]):
                raise DepartmentNameAlreadyExistsError()

        for key, value in update_data.items():
            setattr(department, key, value)

        return self.repository.update(department)
