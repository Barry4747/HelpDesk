from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.core.config import settings
from app.core.limiter import limiter
from app.exceptions.auth import InvalidTokenError
from app.schemas.auth import ChangePasswordRequest, LoginRequest
from app.services.auth import AuthService, clear_auth_cookies, set_auth_cookies

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/login")
@limiter.limit("10/minute")
def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(),
):
    result = auth_service.login(data.login, data.password)

    if result.password_change_token:
        response.set_cookie(
            key="password_change_token",
            value=result.password_change_token,
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=settings.JWT_PASSWORD_CHANGE_TOKEN_EXPIRE_MINUTES * 60,
        )
        return {"message": "Wymagana zmiana hasła"}

    if result.access_token and result.refresh_token:
        set_auth_cookies(response, result.access_token, result.refresh_token)
        return {"message": "Zalogowano pomyślnie"}


@router.post("/refresh")
def refresh_token(
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(),
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Brak tokena odświeżania"
        )

    try:
        result = auth_service.refresh(refresh_token)
    except InvalidTokenError:
        clear_auth_cookies(response)
        raise

    set_auth_cookies(response, result.access_token, result.refresh_token)
    return {"message": "Sesja odświeżona"}


@router.post("/logout")
def logout_user(
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(),
):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        auth_service.logout(refresh_token)

    clear_auth_cookies(response)
    return {"message": "Wylogowano pomyślnie"}


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(),
):
    token = request.cookies.get("password_change_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Brak tokena zmiany hasła",
        )

    try:
        auth_service.change_password(token, data.new_password)
    except InvalidTokenError:
        response.delete_cookie(
            key="password_change_token", httponly=True, secure=True, samesite="strict"
        )
        raise

    response.delete_cookie(
        key="password_change_token", httponly=True, secure=True, samesite="strict"
    )
    clear_auth_cookies(response)
    return {"message": "Hasło zmienione pomyślnie. Zaloguj się ponownie."}
