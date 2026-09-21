import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies.auth import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, UserUpdate, UserFilterParams, PaginatedUsersResponse
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


@router.get("", response_model=PaginatedUsersResponse)
def list_users(
    filters: UserFilterParams = Depends(),
    service: UserService = Depends(),
    _admin: User = Depends(require_role("admin"))
):
    return service.list_users(filters)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: uuid.UUID,
    service: UserService = Depends(),
    current_user: User = Depends(get_current_user),
):
    # BUG-4: Role-based access control on user data.
    # - Reporter: may only fetch support/admin users (to see who is assigned to their tickets).
    # - Support: may fetch any user (to see reporters on tickets they handle).
    # - Admin: may fetch any user.
    user = service.get_user(user_id)

    if current_user.role == UserRole.reporter:
        if user.role == UserRole.reporter and user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Brak dostępu do danych tego użytkownika",
            )

    return user


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

