from slowapi import Limiter
from slowapi.util import get_remote_address

# Single shared rate limiter instance — imported by main.py and routers.
limiter = Limiter(key_func=get_remote_address)
