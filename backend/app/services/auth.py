from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fastapi import Depends, Response

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_password_change_token,
    decode_password_change_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.exceptions.auth import (
    AccountInactiveError,
    InvalidCredentialsError,
    InvalidTokenError,
)
from app.models.refresh_token import RefreshToken
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.user import UserRepository


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="strict",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        key="access_token", httponly=True, secure=True, samesite="strict"
    )
    response.delete_cookie(
        key="refresh_token", httponly=True, secure=True, samesite="strict"
    )


@dataclass
class LoginResult:
    access_token: str | None = None
    refresh_token: str | None = None
    password_change_token: str | None = None


@dataclass
class RefreshResult:
    access_token: str
    refresh_token: str


class AuthService:
    def __init__(
        self,
        user_repo: UserRepository = Depends(),
        refresh_token_repo: RefreshTokenRepository = Depends(),
    ):
        self.user_repo = user_repo
        self.refresh_token_repo = refresh_token_repo

    def _create_full_session(self, user_id: str, role: str) -> LoginResult:
        access_token = create_access_token(user_id=user_id, role=role)
        raw_refresh_token = generate_refresh_token()
        hashed_token = hash_refresh_token(raw_refresh_token)

        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
        )

        rt_record = RefreshToken(
            user_id=user_id,
            token_hash=hashed_token,
            expires_at=expires_at,
            revoked=False,
        )
        self.refresh_token_repo.create(rt_record)

        return LoginResult(
            access_token=access_token,
            refresh_token=raw_refresh_token,
            password_change_token=None,
        )

    def login(self, login: str, password: str) -> LoginResult:
        user_record = self.user_repo.get_by_login(login)
        if not user_record or not verify_password(password, user_record.password_hash):
            raise InvalidCredentialsError()

        if not user_record.is_active:
            raise AccountInactiveError()

        if user_record.is_temporary_password:
            pct = create_password_change_token(user_record.id)
            return LoginResult(password_change_token=pct)

        return self._create_full_session(user_record.id, user_record.role.value)

    def refresh(self, raw_refresh_token: str) -> RefreshResult:
        hashed_token = hash_refresh_token(raw_refresh_token)
        rt_record = self.refresh_token_repo.get_by_token_hash(hashed_token)

        if (
            not rt_record
            or rt_record.revoked
            or rt_record.expires_at < datetime.now(timezone.utc)
        ):
            raise InvalidTokenError()

        self.refresh_token_repo.revoke(rt_record)

        user_record = self.user_repo.get_by_id(rt_record.user_id)
        if not user_record or not user_record.is_active:
            raise InvalidTokenError()

        session = self._create_full_session(user_record.id, user_record.role.value)

        return RefreshResult(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
        )

    def logout(self, raw_refresh_token: str) -> None:
        hashed_token = hash_refresh_token(raw_refresh_token)
        rt_record = self.refresh_token_repo.get_by_token_hash(hashed_token)
        if rt_record:
            self.refresh_token_repo.revoke(rt_record)

    def change_password(
        self, password_change_token: str, new_password: str
    ) -> LoginResult:
        payload = decode_password_change_token(password_change_token)
        if not payload:
            raise InvalidTokenError()

        user_id = payload.get("sub")
        if not user_id:
            raise InvalidTokenError()

        user_record = self.user_repo.get_by_id(user_id)
        if not user_record or not user_record.is_active:
            raise InvalidTokenError()

        user_record.password_hash = hash_password(new_password)
        user_record.is_temporary_password = False
        self.user_repo.update(user_record)

        return self._create_full_session(user_record.id, user_record.role.value)
