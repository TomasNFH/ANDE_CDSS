BEGIN;

-- Carga de usuarios semilla desde CSV (montado en /semillas, ver docker-compose.yml).
-- usuarios.csv no se versiona: en un clone nuevo, copiar usuarios.example.csv a usuarios.csv.
CREATE TEMP TABLE _usuario_tmp (
    username      TEXT,
    email         TEXT,
    user_password TEXT,
    rol           TEXT
);

COPY _usuario_tmp (username, email, user_password, rol)
FROM '/semillas/usuarios.csv'
WITH (FORMAT csv, HEADER true);

INSERT INTO usuario (username, email, user_password, rol, activo)
SELECT
    trim(t.username),
    trim(t.email),
    trim(t.user_password),
    trim(t.rol)::clase_usuario,
    TRUE
FROM _usuario_tmp t
ON CONFLICT DO NOTHING;   -- salta duplicados por username o email

DROP TABLE _usuario_tmp;

COMMIT;