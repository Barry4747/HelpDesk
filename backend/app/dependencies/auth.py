from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token
from app.exceptions.auth import InvalidTokenError
from app.models.user import User
from app.repositories.user import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)


def get_current_user(request: Request, user_repo: UserRepository = Depends()) -> User:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Brak uwierzytelnienia",
        )

    try:
        payload = decode_access_token(token)
        if not payload:
            raise InvalidTokenError()
        user_id = payload.get("sub")
        if not user_id:
            raise InvalidTokenError()
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy lub wygasły token",
        ) from e

    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Użytkownik nie istnieje",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Konto zostało zdezaktywowane",
        )

    if user.is_temporary_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hasło zostało zresetowane",
        )

    return user


def require_role(*allowed_roles: str):
    """Zwraca dependency sprawdzającą czy current_user.role jest w allowed_roles."""

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Brak uprawnień do tej operacji",
            )
        return current_user

    return dependency
