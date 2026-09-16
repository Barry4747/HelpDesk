import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.exceptions.ticket import TicketNotFoundError
from app.schemas.ticket import (
    TicketCreate,
    TicketResponse,
    TicketStatusUpdate,
    TicketUpdate,
)
from app.services.ticket import TicketService

router = APIRouter(prefix="/api/v1/tickets", tags=["tickets"])


@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(data: TicketCreate, service: TicketService = Depends()):
    return service.create_ticket(data)


@router.get("", response_model=list[TicketResponse], status_code=status.HTTP_200_OK)
def list_tickets(service: TicketService = Depends()):
    return service.list_tickets()


@router.get(
    "/{ticket_id}", response_model=TicketResponse, status_code=status.HTTP_200_OK
)
def get_ticket(ticket_id: uuid.UUID, service: TicketService = Depends()):
    try:
        return service.get_ticket(ticket_id)
    except TicketNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Zgłoszenie nie istnieje"
        )


@router.patch(
    "/{ticket_id}", response_model=TicketResponse, status_code=status.HTTP_200_OK
)
def update_ticket(
    ticket_id: uuid.UUID,
    data: TicketUpdate,
    service: TicketService = Depends(),
):
    try:
        return service.update_ticket(ticket_id, data)
    except TicketNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Zgłoszenie nie istnieje"
        )


@router.patch(
    "/{ticket_id}/status",
    response_model=TicketResponse,
    status_code=status.HTTP_200_OK,
)
def change_ticket_status(
    ticket_id: uuid.UUID,
    data: TicketStatusUpdate,
    service: TicketService = Depends(),
):
    try:
        return service.change_status(ticket_id, data)
    except TicketNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Zgłoszenie nie istnieje"
        )


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: uuid.UUID, service: TicketService = Depends()):
    try:
        service.delete_ticket(ticket_id)
    except TicketNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Zgłoszenie nie istnieje"
        )
