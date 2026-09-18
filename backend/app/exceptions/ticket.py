class TicketNotFoundError(Exception):
    pass


class TicketAccessDeniedError(Exception):
    pass


class TicketDeleteNotAllowedError(Exception):
    pass


class InvalidAssigneeError(Exception):
    pass
