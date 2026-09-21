from fastapi import HTTPException, status


class UserNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono użytkownika")


class LoginAlreadyExistsError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail="Login jest już zajęty")
