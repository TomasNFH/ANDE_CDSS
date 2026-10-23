import psycopg
import psycopg.rows

from app.db.connection import conectar_base_datos


def obtener_bioactivos():
    """
    Lista los bioactivos VALIDADO junto con su publicación (nombre + DOI)
    y los autores de esa publicación.

    El filtrado por término de búsqueda se hace en el cliente (TablesPage),
    por eso este endpoint no recibe parámetros.
    """
    conn = conectar_base_datos()
    cursor = conn.cursor(row_factory=psycopg.rows.dict_row)

    try:
        cursor.execute("""
            SELECT
                b.id_bioactivo,
                b.nombre_bioactivo,
                b.Codigo_IUPAC AS codigo_iupac,
                p.Nombre_Publicacion AS nombre_publicacion,
                p.DOI AS doi,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'nombre_autor', a.nombre_autor,
                            'apellido_autor', a.apellido_autor
                        )
                    ) FILTER (WHERE a.id_autor IS NOT NULL),
                    '[]'
                ) AS autores
            FROM bioactivos b
            JOIN Publicacion_Bioactivo pb ON pb.id_bioactivo = b.id_bioactivo
            JOIN publicacion p            ON p.id_publicacion = pb.id_publicacion
            LEFT JOIN publicacion_autor pa ON pa.id_publicacion = p.id_publicacion
            LEFT JOIN autor a              ON a.id_autor = pa.id_autor
            WHERE b.estado_validacion = 'VALIDADO'
            GROUP BY b.id_bioactivo, b.nombre_bioactivo, b.Codigo_IUPAC, p.id_publicacion
            ORDER BY b.nombre_bioactivo
        """)

        registros = [dict(r) for r in cursor.fetchall()]
        return {"registros": registros}

    finally:
        conn.close()


def obtener_autores():
    """
    Lista todos los autores con la cantidad de publicaciones en las que participan
    (num_investigaciones). El filtrado por término se hace en el cliente.
    """
    conn = conectar_base_datos()
    cursor = conn.cursor(row_factory=psycopg.rows.dict_row)

    try:
        cursor.execute("""
            SELECT
                a.id_autor,
                a.nombre_autor,
                a.apellido_autor,
                a.email_autor,
                a.cargo,
                a.organizacion,
                COUNT(DISTINCT pa.id_publicacion) AS num_investigaciones
            FROM autor a
            LEFT JOIN publicacion_autor pa ON pa.id_autor = a.id_autor
            GROUP BY a.id_autor
            ORDER BY a.apellido_autor
        """)

        registros = [dict(r) for r in cursor.fetchall()]
        return {"registros": registros}

    finally:
        conn.close()
