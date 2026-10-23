import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.routers.auth_router import router as auth_router
from app.routers.catalago_router import router as catalogo_router
from app.routers.model_router import router as model_router
from app.services.auth_service import SESSION_MAX_AGE
from app.services.model_service import cargar_modelos_abiertos


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Los modelos abiertos se cargan una sola vez y quedan en memoria para todos los requests.
    # Si falta un archivo o no coinciden las versiones de sklearn, falla acá y no en una consulta.
    cargar_modelos_abiertos()
    yield


app = FastAPI(
    title = 'CDSS backend: clinico',
    version = '1.0.0',
    lifespan = lifespan,
)

# Sesión: cookie firmada (HMAC). La crea el backend público en el login; para poder leerla,
# SESSION_SECRET tiene que ser el MISMO en los dos backends.
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
app.include_router(catalogo_router)
app.include_router(model_router)
