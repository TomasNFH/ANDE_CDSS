from fastapi import APIRouter, Depends

from app.dependencies.auth import get_usuario_actual

from app.services.catalogo_service import (
    obtener_bioactivos,
    obtener_autores,
)

# Todo el catálogo requiere sesión iniciada.
router = APIRouter(
    tags=["Catálogo"],
    dependencies=[Depends(get_usuario_actual)],
)


@router.get("/api/bioactivos")
async def api_bioactivos():
    return obtener_bioactivos()


@router.get("/api/autores")
async def api_autores():
    return obtener_autores()
