import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.routers.auth_router import router as auth_router
from app.services.auth_service import SESSION_MAX_AGE

app = FastAPI(
    title = 'CDSS backend: publico',
    version = '1.0.0'
)

# Sesión: cookie firmada (HMAC) con el usuario logueado. El backend de gestión usa el MISMO
# SESSION_SECRET para poder leer la cookie que se crea acá en el login.
SESSION_SECRET = os.environ.get("SESSION_SECRET", "dev-secret-cambiar-en-desa")
SESSION_HTTPS_ONLY = os.environ.get("SESSION_HTTPS_ONLY", "false").lower() == "true"

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    same_site="lax",
    https_only=SESSION_HTTPS_ONLY,
    max_age=SESSION_MAX_AGE,
)

# CORS: orígenes explícitos por entorno (coma-separados). Con credenciales no se puede usar "*".
CORS_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "CORS_ORIGINS", "http://localhost:8090,http://localhost:8091"
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Registrar routers
app.include_router(auth_router)
