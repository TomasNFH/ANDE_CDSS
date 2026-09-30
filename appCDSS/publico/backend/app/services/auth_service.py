import psycopg
import psycopg.rows

from fastapi import HTTPException
from app.db.connection import conectar_base_datos

def iniciar_sesion(datos):

    conn = None
    try:
        conn = conectar_base_datos()

        cur = conn.cursor(
            row_factory=psycopg.rows.dict_row
        )

        cur.execute(
            """
            SELECT *
            FROM usuario
            WHERE UserName = %s
            """,
            (datos.nombre_usuario,)
        )

        usuario = cur.fetchone()

        cur.close()

        if not usuario:
            raise HTTPException(
                status_code=401,
                detail="Usuario o contraseña incorrectos"
            )

        if datos.contraseña != usuario["user_password"]:
            raise HTTPException(
                status_code=401,
                detail="Usuario o contraseña incorrectos"
            )

        return {
            "success": True,
            "message": "Inicio de sesión exitoso",
            "user": {
                "username": usuario["username"],
                "email": usuario["email"],
                "user_class": usuario["rol"],
                "created_at": str(usuario["created_at"]) if usuario["created_at"] else None
            }
        }


    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        if conn:
            conn.close()