from fastapi import APIRouter, Depends, Request
from app.dependencies.auth import UsuarioSesion, get_usuario_actual
from app.services.auth_service import cerrar_sesion

# El login vive en el backend público; acá solo se consulta y se cierra la sesión.
router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.get("/me")
def me(usuario: UsuarioSesion = Depends(get_usuario_actual)):
    """Usuario de la sesión actual (o 401). Lo usa el front para saber si hay sesión real."""
    return usuario


@router.post("/logout")
def logout(request: Request):
    id_sesion = request.session.get("id_sesion")
    request.session.clear()
    if id_sesion:
        cerrar_sesion(id_sesion)
    return {"success": True}
