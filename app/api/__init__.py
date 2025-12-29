from fastapi import APIRouter
from app.api import auth, shows

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(shows.router, prefix="/shows", tags=["Shows"])

