import uuid
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.exceptions.auth import AccountInactiveError, InvalidCredentialsError, InvalidTokenError
from app.models.user import UserRole
from app.services.auth import AuthService


def _make_service(user_repo=None, rt_repo=None) -> AuthService:
    svc = AuthService.__new__(AuthService)
    svc.user_repo = user_repo or MagicMock()
    svc.refresh_token_repo = rt_repo or MagicMock()
    return svc


def _user(
    *,
    is_active: bool = True,
    is_temporary_password: bool = False,
    role: UserRole = UserRole.support,
) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid.uuid4(),
        login="testuser",
        password_hash="$2b$12$placeholder",
        role=role,
        is_active=is_active,
        is_temporary_password=is_temporary_password,
    )


def _rt_record(
    *,
    revoked: bool = False,
    expired: bool = False,
    user_id: uuid.UUID | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid.uuid4(),
        user_id=user_id or uuid.uuid4(),
        token_hash="fakehash",
        revoked=revoked,
        expires_at=(
            datetime.now(UTC) - timedelta(hours=1) if expired else datetime.now(UTC) + timedelta(days=7)
        ),
    )


class TestLogin:
    def test_wrong_password_raises_invalid_credentials(self):
        user_repo = MagicMock()
        user_repo.get_by_login.return_value = None
        svc = _make_service(user_repo=user_repo)
        with pytest.raises(InvalidCredentialsError):
            svc.login("unknown", "wrongpass")

    def test_bad_password_same_error_as_unknown_login(self):
        """Brute-force mitigation: both cases raise the same error type."""
        user_repo = MagicMock()
        user_repo.get_by_login.return_value = None
        svc = _make_service(user_repo=user_repo)

        with pytest.raises(InvalidCredentialsError) as exc_unknown:
            svc.login("unknown", "wrong")

        with pytest.raises(InvalidCredentialsError) as exc_bad_pw:
            svc.login("unknown2", "wrongpass2")

        assert type(exc_unknown.value) is type(exc_bad_pw.value)
        assert exc_unknown.value.status_code == exc_bad_pw.value.status_code

    def test_inactive_user_raises_account_inactive(self):
        from app.core.security import hash_password

        pw = "TestPass123!"
        user = _user(is_active=False)
        user.password_hash = hash_password(pw)
        user_repo = MagicMock()
        user_repo.get_by_login.return_value = user

        svc = _make_service(user_repo=user_repo)
        with pytest.raises(AccountInactiveError):
            svc.login(user.login, pw)

    def test_temporary_password_returns_only_password_change_token(self):
        from app.core.security import hash_password

        pw = "TestPass123!"
        user = _user(is_temporary_password=True)
        user.password_hash = hash_password(pw)
        user_repo = MagicMock()
        user_repo.get_by_login.return_value = user
        rt_repo = MagicMock()

        svc = _make_service(user_repo=user_repo, rt_repo=rt_repo)
        result = svc.login(user.login, pw)

        assert result.password_change_token is not None
        assert result.access_token is None
        assert result.refresh_token is None
        rt_repo.create.assert_not_called()


class TestRefresh:
    def test_nonexistent_token_raises(self):
        rt_repo = MagicMock()
        rt_repo.get_by_token_hash.return_value = None
        svc = _make_service(rt_repo=rt_repo)
        with pytest.raises(InvalidTokenError):
            svc.refresh("nonexistent_raw_token")

    def test_revoked_token_raises(self):
        rt_repo = MagicMock()
        rt_repo.get_by_token_hash.return_value = _rt_record(revoked=True)
        svc = _make_service(rt_repo=rt_repo)
        with pytest.raises(InvalidTokenError):
            svc.refresh("some_raw_token")

    def test_expired_token_raises(self):
        rt_repo = MagicMock()
        rt_repo.get_by_token_hash.return_value = _rt_record(expired=True)
        svc = _make_service(rt_repo=rt_repo)
        with pytest.raises(InvalidTokenError):
            svc.refresh("some_raw_token")

    def test_happy_path_revokes_old_and_creates_new(self):
        user_id = uuid.uuid4()
        old_rt = _rt_record(user_id=user_id)

        user = _user()
        user.id = user_id

        rt_repo = MagicMock()
        rt_repo.get_by_token_hash.return_value = old_rt
        user_repo = MagicMock()
        user_repo.get_by_id.return_value = user

        svc = _make_service(user_repo=user_repo, rt_repo=rt_repo)
        result = svc.refresh("any_raw_token")

        rt_repo.revoke.assert_called_once_with(old_rt)
        rt_repo.create.assert_called_once()
        assert result.access_token is not None
        assert result.refresh_token is not None
