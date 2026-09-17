import uuid
from fastapi import APIRouter, Depends, status
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.category import CategoryService

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(data: CategoryCreate, service: CategoryService = Depends()):
    return service.create_category(data)


@router.get("", response_model=list[CategoryResponse])
def list_categories(service: CategoryService = Depends()):
    return service.list_categories()


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: uuid.UUID, data: CategoryUpdate, service: CategoryService = Depends()
):
    return service.update_category(category_id, data)
