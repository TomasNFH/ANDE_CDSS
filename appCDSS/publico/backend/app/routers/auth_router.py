from fastapi import APIRouter, Request
from app.models.auth_models import LoginRequest
from app.services.auth_service import iniciar_sesion

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/login")
def login(datos: LoginRequest, request: Request):
    return iniciar_sesion(datos, request)
