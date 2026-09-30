from pydantic import BaseModel

class LoginRequest(BaseModel):
    nombre_usuario: str
    contraseña: str