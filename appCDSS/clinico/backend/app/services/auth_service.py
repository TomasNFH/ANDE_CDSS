import os
from datetime import timedelta

from app.db.connection import conectar_base_datos

# Vida de la sesion en segundos. Es ABSOLUTA: se cuenta desde el login y no se renueva con el uso.
# Tiene que ser el mismo valor que en el backend público, que es quien crea la sesión.
SESSION_MAX_AGE = int(os.environ.get("SESSION_MAX_AGE", 12 * 60 * 60))
VIDA_SESION = timedelta(seconds=SESSION_MAX_AGE)


def sesion_sigue_abierta(id_sesion):
    """True si la sesión existe, fue un login exitoso, no se cerró y no venció.
    Es lo que hace revocable a la cookie: sin esto una copia serviría hasta que venza,
    aunque el usuario haya cerrado sesión. Ante un error de base devuelve False."""
    conn = None
    try:
        conn = conectar_base_datos()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT 1 FROM sesiones_usuario
             WHERE id_sesion = %s
               AND resultado_login
               AND fecha_logout IS NULL
               AND fecha_login > CURRENT_TIMESTAMP - %s
            """,
            (id_sesion, VIDA_SESION),
        )
        abierta = cur.fetchone() is not None
        cur.close()
        return abierta
    except Exception:
        return False
    finally:
        if conn:
            conn.close()


def cerrar_sesion(id_sesion):
    """Cierra solo la sesión indicada."""
    conn = None
    try:
        conn = conectar_base_datos()
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE sesiones_usuario
               SET fecha_logout = CURRENT_TIMESTAMP
             WHERE id_sesion = %s AND fecha_logout IS NULL
            """,
            (id_sesion,),
        )
        conn.commit()
        cur.close()
    except Exception:
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()
