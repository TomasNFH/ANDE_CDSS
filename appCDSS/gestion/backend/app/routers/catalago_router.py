from fastapi import APIRouter

from app.services.catalogo_service import (
    obtener_bioactivos,
    obtener_autores,
)

router = APIRouter(
    tags=["Catálogo"]
)


@router.get("/api/bioactivos")
async def api_bioactivos():
    return obtener_bioactivos()


@router.get("/api/autores")
async def api_autores():
    return obtener_autores()
