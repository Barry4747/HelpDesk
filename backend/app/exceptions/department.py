from fastapi import HTTPException, status


class DepartmentNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono działu")


class DepartmentNameAlreadyExistsError(HTTPException):
    def __init__(self):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail="Dział o tej nazwie już istnieje")
