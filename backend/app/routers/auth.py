from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.exceptions.auth import (
    AccountInactiveError,
    InvalidCredentialsError,
    InvalidTokenError,
)
from app.schemas.auth import ChangePasswordRequest, LoginRequest
from app.services.auth import AuthService, clear_auth_cookies, set_auth_cookies

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login")
def login(
    data: LoginRequest,
    response: Response,
    auth_service: AuthService = Depends(),
):
    try:
        result = auth_service.login(data.login, data.password)
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy login lub hasło",
        )
    except AccountInactiveError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Konto użytkownika jest nieaktywne",
        )

    if result.password_change_token:
        response.set_cookie(
            key="password_change_token",
            value=result.password_change_token,
            httponly=True,
            secure=True,
            samesite="strict",
        )
        return {"message": "Wymagana zmiana hasła"}

    if result.access_token and result.refresh_token:
        set_auth_cookies(response, result.access_token, result.refresh_token)
        return {"message": "Zalogowano pomyślnie"}


@router.post("/refresh")
def refresh(
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy lub wygasły token",
        )

    set_auth_cookies(response, result.access_token, result.refresh_token)
    return {"message": "Sesja odświeżona"}


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(),
):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        auth_service.logout(refresh_token)

    clear_auth_cookies(response)
    response.delete_cookie(
        key="password_change_token", httponly=True, secure=True, samesite="strict"
    )
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
        result = auth_service.change_password(token, data.new_password)
    except InvalidTokenError:
        response.delete_cookie(
            key="password_change_token", httponly=True, secure=True, samesite="strict"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy lub wygasły token zmiany hasła",
        )

    response.delete_cookie(
        key="password_change_token", httponly=True, secure=True, samesite="strict"
    )
    if result.access_token and result.refresh_token:
        set_auth_cookies(response, result.access_token, result.refresh_token)

    return {"message": "Hasło zmienione pomyślnie"}
