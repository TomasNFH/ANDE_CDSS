from fastapi import Depends, HTTPException, Request
from pydantic import BaseModel
from app.services.auth_service import sesion_sigue_abierta


class UsuarioSesion(BaseModel):
    id_usuario: int
    username: str
    rol: str
    email: str = ""


def get_usuario_actual(request: Request) -> UsuarioSesion:
    """Usuario de la sesión firmada (cookie creada por el backend público), verificada contra
    la base. 401 si no hay sesión o si ya se cerró."""
    id_usuario = request.session.get("id_usuario")
    id_sesion = request.session.get("id_sesion")
    if not id_usuario or not id_sesion:
        raise HTTPException(status_code=401, detail="No autenticado")

    if not sesion_sigue_abierta(id_sesion):
        # Que el navegador se deshaga de una cookie que ya no sirve.
        request.session.clear()
        raise HTTPException(status_code=401, detail="La sesión fue cerrada")

    return UsuarioSesion(
        id_usuario=id_usuario,
        username=request.session.get("username", ""),
        rol=request.session.get("rol", ""),
        email=request.session.get("email", ""),
    )


def requiere_rol(*roles: str):
    """Dependencia factory: exige sesión y que el rol esté entre los permitidos (403 si no)."""
    def dep(usuario: UsuarioSesion = Depends(get_usuario_actual)) -> UsuarioSesion:
        if usuario.rol not in roles:
            raise HTTPException(status_code=403, detail="No tenés permisos para esta acción")
        return usuario
    return dep
