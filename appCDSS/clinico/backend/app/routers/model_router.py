from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, FiniteFloat

from app.dependencies.auth import get_usuario_actual

from app.services.model_service import obtener_resumen
from app.services.predict_service import predecir

# Los modelos abiertos requieren sesión iniciada.
router = APIRouter(
    prefix="/api/models",
    tags=["Modelos"],
    dependencies=[Depends(get_usuario_actual)],
)


class PrediccionRequest(BaseModel):
    features: dict[str, FiniteFloat]


@router.get("/{nombre}")
async def api_modelo(nombre: str):
    try:
        return obtener_resumen(nombre)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Modelo '{nombre}' no encontrado")


@router.post("/{nombre}/predict")
async def api_predecir(nombre: str, body: PrediccionRequest):
    try:
        return predecir(nombre, body.features)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Modelo '{nombre}' no encontrado")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
