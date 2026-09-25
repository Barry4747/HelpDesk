from fastapi import HTTPException, status


class TicketNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="Zgłoszenie nie istnieje")


class TicketAccessDeniedError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail="Brak dostępu do zgłoszenia")


class TicketDeleteNotAllowedError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień do usunięcia tego zgłoszenia")


class InvalidAssigneeError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail="Nieprawidłowy przypisany pracownik")


class TicketMissingDataError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zgłoszenie musi mieć przypisaną kategorię i priorytet przed przypisaniem pracownika.",
        )
