from fastapi import HTTPException, status


class CategoryNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono kategorii")


class CategoryNameAlreadyExistsError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail="Kategoria o tej nazwie już istnieje")
