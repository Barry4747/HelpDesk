import uuid

from fastapi import APIRouter, Depends, status

from app.dependencies.auth import get_current_user, require_role
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user import UserService

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    data: UserCreate,
    service: UserService = Depends(),
    _admin: User = Depends(require_role("admin")),
):
    return service.create_user(data)


@router.get("", response_model=list[UserResponse])
def list_users(
    service: UserService = Depends(), _admin: User = Depends(require_role("admin"))
):
    return service.list_users()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: uuid.UUID,
    service: UserService = Depends(),
    _user: User = Depends(get_current_user),
):
    return service.get_user(user_id)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    service: UserService = Depends(),
    _admin: User = Depends(require_role("admin")),
):
    return service.update_user(user_id, data)


@router.delete("/{user_id}", response_model=UserResponse)
def deactivate_user(
    user_id: uuid.UUID,
    service: UserService = Depends(),
    _admin: User = Depends(require_role("admin")),
):
    return service.deactivate_user(user_id)

