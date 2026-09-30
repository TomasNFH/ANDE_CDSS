import os

import psycopg
import psycopg.rows

from fastapi import HTTPException
from app.db.connection import conectar_base_datos

# Vida de la sesion en segundos. Es ABSOLUTA: se cuenta desde el login y no se renueva con el uso.
# Tiene que ser el mismo valor en el backend de gestión, que es quien valida la sesión.
SESSION_MAX_AGE = int(os.environ.get("SESSION_MAX_AGE", 12 * 60 * 60))


def iniciar_sesion(datos, request):
    usuario = _buscar_usuario(datos.nombre_usuario.strip())

    if not usuario:
        _registrar_login(None, request, False, "Usuario no encontrado")
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    if datos.contraseña != usuario["user_password"]:
        _registrar_login(usuario["id_usuario"], request, False, "Contraseña incorrecta")
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    if not usuario["activo"]:
        _registrar_login(usuario["id_usuario"], request, False, "Usuario inactivo")
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    id_sesion = _registrar_login(usuario["id_usuario"], request, True, None)

    # Guardar la sesión en la cookie firmada (SessionMiddleware). La lee el backend de gestión.
    request.session["id_sesion"] = id_sesion
    request.session["id_usuario"] = usuario["id_usuario"]
    request.session["username"] = usuario["username"]
    request.session["rol"] = usuario["rol"]
    request.session["email"] = usuario["email"]

    return {
        "success": True,
        "message": "Inicio de sesión exitoso",
        "user": {
            "id_usuario": usuario["id_usuario"],
            "username": usuario["username"],
            "email": usuario["email"],
            "rol": usuario["rol"],
            "created_at": str(usuario["created_at"]) if usuario["created_at"] else None,
        },
    }


def _buscar_usuario(nombre_usuario):
    """Busca el usuario por username. Devuelve None si no existe."""
    conn = None
    try:
        conn = conectar_base_datos()
        cur = conn.cursor(row_factory=psycopg.rows.dict_row)
        cur.execute(
            """
            SELECT id_usuario, username, email, user_password, rol, activo, created_at
            FROM usuario
            WHERE username = %s
            """,
            (nombre_usuario,),
        )
        usuario = cur.fetchone()
        cur.close()
        return usuario

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()


def _ip_del_cliente(request):
    """IP del usuario. Detrás de un proxy la original viene primera en X-Forwarded-For.
    Sirve para auditoría, no como control de seguridad (el header se puede falsear)."""
    reenviada = request.headers.get("x-forwarded-for")
    if reenviada:
        return reenviada.split(",")[0].strip()
    return request.client.host if request.client else None


def _registrar_login(id_usuario, request, resultado, motivo_error):
    """Registra el intento de login (exitoso o no) en sesiones_usuario y devuelve su id_sesion."""
    conn = None
    try:
        conn = conectar_base_datos()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO sesiones_usuario (id_usuario, ip, user_agent, resultado_login, motivo_error)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id_sesion
            """,
            (
                id_usuario,
                _ip_del_cliente(request),
                request.headers.get("user-agent"),
                resultado,
                motivo_error,
            ),
        )
        id_sesion = cur.fetchone()[0]
        conn.commit()
        cur.close()
        return id_sesion
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail="No se pudo registrar la sesión") from e
    finally:
        if conn:
            conn.close()
