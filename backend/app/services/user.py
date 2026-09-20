import uuid
from collections.abc import Sequence

from fastapi import Depends

from app.core.security import hash_password
from app.exceptions.user import LoginAlreadyExistsError, UserNotFoundError
from app.models.user import User
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.user import UserRepository
from app.schemas.user import PaginatedUsersResponse, UserCreate, UserFilterParams, UserUpdate


class UserService:
    def __init__(
        self,
        user_repo: UserRepository = Depends(),
        refresh_token_repo: RefreshTokenRepository = Depends(),
    ):
        self.user_repo = user_repo
        self.refresh_token_repo = refresh_token_repo

    def create_user(self, data: UserCreate) -> User:
        if self.user_repo.get_by_login(data.login):
            raise LoginAlreadyExistsError()

        user = User(
            login=data.login,
            password_hash=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            role=data.role,
            department_id=data.department_id,
            is_temporary_password=True,
            is_active=True,
        )
        return self.user_repo.create(user)

    def get_user(self, user_id: uuid.UUID) -> User:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()
        return user

    def list_users(self, filters: UserFilterParams) -> PaginatedUsersResponse:
        items, total = self.user_repo.get_filtered(filters)
        return PaginatedUsersResponse(
            items=items,
            total=total,
            page=filters.page,
            page_size=filters.page_size,
        )

    def update_user(self, user_id: uuid.UUID, data: UserUpdate) -> User:
        user = self.get_user(user_id)
        update_data = data.model_dump(exclude_unset=True)

        if update_data.get("password"):
            user.password_hash = hash_password(update_data["password"])
            user.is_temporary_password = True
            del update_data["password"]

        if "login" in update_data and update_data["login"] != user.login:
            if self.user_repo.get_by_login(update_data["login"]):
                raise LoginAlreadyExistsError()

        for key, value in update_data.items():
            setattr(user, key, value)

        updated_user = self.user_repo.update(user)
        self.refresh_token_repo.revoke_all_for_user(user.id)
        return updated_user

    def deactivate_user(self, user_id: uuid.UUID) -> User:
        user = self.get_user(user_id)
        user.is_active = False
        updated_user = self.user_repo.update(user)
        self.refresh_token_repo.revoke_all_for_user(user.id)
        return updated_user
