import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies.auth import get_current_user, require_role
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate, CategoryFilterParams, PaginatedCategoriesResponse
from app.services.category import CategoryService

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryCreate,
    service: CategoryService = Depends(),
    _admin: User = Depends(require_role("admin")),
):
    return service.create_category(data)


@router.get("", response_model=PaginatedCategoriesResponse)
def list_categories(
    filters: CategoryFilterParams = Depends(),
    service: CategoryService = Depends(),
    _user: User = Depends(get_current_user),
):
    return service.list_categories(filters)


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    service: CategoryService = Depends(),
    _admin: User = Depends(require_role("admin")),
):
    return service.update_category(category_id, data)
