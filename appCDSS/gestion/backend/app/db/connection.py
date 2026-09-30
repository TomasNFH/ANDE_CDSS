import os
import psycopg
import json

def conectar_base_datos():
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        # psycopg no entiende el prefijo de dialecto de SQLAlchemy "+psycopg"
        database_url = database_url.replace("postgresql+psycopg://", "postgresql://")
        return psycopg.connect(database_url)

    # Fallback a valores por defecto si no hay DATABASE_URL
    return psycopg.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        user=os.environ.get("DB_USER", "andeCDSS_user"),
        password=os.environ.get("DB_PASSWORD", "andeCDSS1234"),
        dbname=os.environ.get("DB_NAME", "dbAndeCDSS"),
        port=os.environ.get("DB_PORT", "5435"),
    )