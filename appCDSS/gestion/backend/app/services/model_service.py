import os
import pickle
import re
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pandas as pd
import skops.io as sio

# Carpeta con los modelos abiertos exportados (backend/openModels). Se puede sobreescribir por entorno.
OPEN_MODELS_DIR = Path(
    os.environ.get("OPEN_MODELS_DIR", Path(__file__).resolve().parents[2] / "openModels")
)

# Modelos abiertos disponibles: nombre de la API -> carpeta del export, etiquetas legibles
# de cada clase del target (el export solo trae los valores codificados) y, para targets
# booleanos, el umbral de probabilidad a partir del cual se clasifica como positivo.
OPEN_MODELS = {
    "framingham": {
        "carpeta": "framingham_EXPORT",
        "etiquetas": {0: "Sin CHD a 10 años", 1: "CHD a 10 años"},
        # Prevalencia de CHD en el set de entrenamiento (511/3292). El modelo se entrenó con
        # class_weight="balanced" y se le corrigió el intercepto (+ logit(prevalencia)) para que
        # las probabilidades sean reales; con este umbral clasifica igual que el original con 0,5.
        "umbral": 511 / 3292,
    },
}

NORMALIZATION_METHODS = ["No", "Min-Max", "Z-score"]

# Filas del set de test que se devuelven como ejemplo de predicción.
N_EJEMPLOS = 10


@dataclass
class LoadedModel:
    nombre: str
    clf: object
    model_name: str
    target_column: str
    target_type: str
    features: list[str]
    norm_method: str
    scalers: dict
    all_features: list[str]
    etiquetas: dict
    umbral: float | None = None
    resumen: dict = field(default_factory=dict)


# Modelos cargados en memoria. Se llena una vez al arrancar la app (lifespan en main.py)
# y después solo se lee: todos los requests comparten la misma instancia.
MODELS: dict[str, LoadedModel] = {}


def _parsear_lista(texto: str) -> list[str]:
    """"['age', 'glucose']" -> ['age', 'glucose']"""
    return [f.strip().strip("'\"") for f in texto.strip()[1:-1].split(",") if f.strip()]


def _parsear_numeros(texto: str) -> list[float]:
    """Arrays de numpy guardados como texto ("[0.1 0.2\\n 0.3]") -> lista de floats."""
    return [float(n) for n in re.findall(r"[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", texto)]


def normalizar(m: LoadedModel, X: pd.DataFrame) -> pd.DataFrame:
    """Aplica la normalización con la que se entrenó el modelo.

    Los scalers se ajustaron sobre todas las columnas de X_test, así que se usan
    los parámetros de cada feature por su índice en vez de transformar la fila completa.
    """
    if m.norm_method == "No":
        return X

    idx = [m.all_features.index(f) for f in X.columns]
    if m.norm_method == "Min-Max":
        s = m.scalers["minmax"]
        return X * s.scale_[idx] + s.min_[idx]
    if m.norm_method == "Z-score":
        s = m.scalers["std"]
        mean = s.mean_[idx] if s.with_mean else 0
        scale = s.scale_[idx] if s.with_std else 1
        return (X - mean) / scale
    raise ValueError(f"Método de normalización desconocido: {m.norm_method}")


def etiqueta(m: LoadedModel, clase) -> str:
    return m.etiquetas.get(int(clase), str(clase))


def predecir_df(m: LoadedModel, X: pd.DataFrame) -> tuple[list[str], list[float], np.ndarray]:
    """Predice sobre un DataFrame con las features del modelo (en cualquier orden).

    Devuelve las etiquetas predichas, la confianza (probabilidad de la clase predicha)
    y la matriz completa de probabilidades (filas x clases, en el orden de clf.classes_).
    Con umbral, la clase positiva (la última) se predice si su probabilidad lo alcanza;
    si no, se predice la clase más probable.
    """
    Xn = normalizar(m, X[m.features].astype(float))
    proba = m.clf.predict_proba(Xn.to_numpy())
    if m.umbral is not None:
        pred_idx = (proba[:, -1] >= m.umbral).astype(int)
    else:
        pred_idx = proba.argmax(axis=1)
    clases = m.clf.classes_[pred_idx]
    confianza = proba[np.arange(len(proba)), pred_idx]
    return [etiqueta(m, c) for c in clases], confianza.tolist(), proba


# CSV fijos con las distribuciones de cada variable, generados aparte a partir del dataset completo.
ARCHIVOS_DISTRIBUCIONES = (
    "distribuciones_resumen.csv",
    "distribuciones_curvas.csv",
    "distribuciones_percentiles.csv",
)


def _leer_distribuciones(m: LoadedModel, carpeta: Path) -> dict:
    """Arma, para cada feature, lo que necesita el violín a partir de los CSV fijos del export.

    grupo es "todos" o el valor del target; cada grupo de desenlace trae su curva de densidad
    (columna densidad_<grupo>) sobre la grilla x común de la variable.
    """
    faltan = [a for a in ARCHIVOS_DISTRIBUCIONES if not (carpeta / a).exists()]
    if faltan:
        raise FileNotFoundError(f"{m.nombre}: faltan {', '.join(faltan)} en {carpeta}")
    resumen = pd.read_csv(carpeta / "distribuciones_resumen.csv", dtype={"grupo": str})
    curvas = pd.read_csv(carpeta / "distribuciones_curvas.csv")
    percentiles = pd.read_csv(carpeta / "distribuciones_percentiles.csv").sort_values("percentil")

    clase_positiva = str(int(m.clf.classes_[-1]))
    distribuciones = {}
    for f in m.features:
        filas = resumen[resumen["variable"] == f].set_index("grupo")
        curva = curvas[curvas["variable"] == f]
        if "todos" not in filas.index or curva.empty or f not in percentiles.columns:
            raise ValueError(f"{m.nombre}: los CSV de distribuciones no tienen la variable '{f}'")

        todos = filas.loc["todos"]
        por_desenlace = []
        if m.target_type == "boolean":
            for grupo, fila in filas.drop(index="todos").iterrows():
                por_desenlace.append({
                    "etiqueta": etiqueta(m, int(grupo)),
                    "positivo": grupo == clase_positiva,
                    "n": int(fila["n"]),
                    "q1": float(fila["q1"]),
                    "mediana": float(fila["mediana"]),
                    "q3": float(fila["q3"]),
                    "densidad": curva[f"densidad_{grupo}"].tolist(),
                })

        distribuciones[f] = {
            "n": int(todos["n"]),
            **{k: float(todos[k]) for k in ("min", "max", "q1", "mediana", "q3", "media", "de")},
            "percentiles": percentiles[f].tolist(),
            "kde": {"x": curva["x"].tolist(), "densidad": curva["densidad_todos"].tolist()},
            "por_desenlace": por_desenlace,
        }
    return distribuciones


def _armar_resumen(
    m: LoadedModel, info: pd.Series, X_test: pd.DataFrame, y_test: pd.Series, distribuciones: dict
) -> dict:
    """Lo que consume FraminhamPage: métricas, gráficas y ejemplos. Se calcula una vez al cargar."""
    importances = np.array(_parsear_numeros(info["importances"]))
    if len(importances) == len(m.features) and importances.max() > 0:
        feat = [m.features, (importances / importances.max()).tolist()]
    else:
        feat = [m.features]

    clases = list(m.clf.classes_)
    cm = [int(n) for n in re.findall(r"\d+", info["Confusion matrix"])]
    roc_curves, auc, calibracion = [], [], None
    if m.target_type == "boolean":
        # sklearn guarda [[TN, FP], [FN, TP]]; ConfusionMatrix espera [TP, FN, FP, TN]
        # con la clase 1 como positiva.
        tn, fp, fn, tp = cm[:4] if len(cm) >= 4 else [0, 0, 0, 0]
        cm = [tp, fn, fp, tn]
        bool_labels = [etiqueta(m, 1), etiqueta(m, 0)]

        auc = float(info["AUC"])
        tpr = _parsear_numeros(info["True Positive Rate"])
        fpr = _parsear_numeros(info["False Positive Rate"])
        if tpr and len(tpr) == len(fpr):
            roc_curves = [list(zip(fpr, tpr))]

        # Calibración del modelo tal como se sirve, sobre todo el set de test.
        _, _, proba = predecir_df(m, X_test)
        p = proba[:, -1]
        y = (y_test == m.clf.classes_[-1]).to_numpy()
        calibracion = {
            "brier": float(np.mean((p - y) ** 2)),
            "brier_referencia": float(np.mean((y.mean() - y) ** 2)),
            "media_predicha": float(p.mean()),
            "prevalencia_observada": float(y.mean()),
        }
    else:
        bool_labels = [etiqueta(m, c) for c in clases]

    ejemplo = X_test[m.features].head(N_EJEMPLOS).copy()
    pred, conf, _ = predecir_df(m, ejemplo)
    ejemplo[m.target_column] = [etiqueta(m, c) for c in y_test.head(N_EJEMPLOS)]
    ejemplo["PREDICTION"] = pred
    ejemplo["CONFIDENCE"] = conf
    example_prediction = [ejemplo.columns.tolist()] + ejemplo.values.tolist()

    first_tree, last_tree = [], []
    if hasattr(m.clf, "estimators_") and m.model_name == "RandomForestClassifier":
        from sklearn.tree import export_text
        first_tree = export_text(m.clf.estimators_[0], feature_names=m.features)
        last_tree = export_text(m.clf.estimators_[-1], feature_names=m.features)

    return {
        "model_name": m.model_name,
        "features": m.features,
        "feat": feat,
        "CM": [cm],
        "roc_curves": roc_curves,
        "auc": auc,
        "umbral": m.umbral,
        "calibracion": calibracion,
        "example_prediction": example_prediction,
        "bool_labels": bool_labels,
        "target_column": m.target_column,
        "target_type": m.target_type,
        "distribuciones": distribuciones,
        "NumbClasses": len(clases),
        "FirstTree": first_tree,
        "LastTree": last_tree,
    }


def cargar_modelo(nombre: str) -> LoadedModel:
    """Lee un export de openModels (model.skops + info.csv + scalers + set de test + distribuciones)."""
    config = OPEN_MODELS[nombre]
    carpeta = OPEN_MODELS_DIR / config["carpeta"]

    # skops solo carga tipos de confianza: si el archivo trae alguno desconocido, falla.
    clf = sio.load(carpeta / "model.skops")
    info = pd.read_csv(carpeta / "info.csv", index_col=0).iloc[0]
    # Pickles propios, generados junto con el modelo.
    with open(carpeta / "minmax.pkl", "rb") as f:
        minmax = pickle.load(f)
    with open(carpeta / "std.pkl", "rb") as f:
        std = pickle.load(f)
    X_test = pd.read_csv(carpeta / "X_test.csv")
    y_test = pd.read_csv(carpeta / "y_test.csv").iloc[:, 0]

    m = LoadedModel(
        nombre=nombre,
        clf=clf,
        model_name=info["Model name"],
        target_column=info["Target column"],
        target_type=info["Target type"],
        features=_parsear_lista(info["Features used"]),
        norm_method=info["Normalization method"],
        scalers={"minmax": minmax, "std": std},
        all_features=X_test.columns.tolist(),
        etiquetas=config["etiquetas"],
        umbral=config.get("umbral"),
    )
    if m.norm_method not in NORMALIZATION_METHODS:
        raise ValueError(f"{nombre}: método de normalización desconocido '{m.norm_method}'")
    if m.umbral is not None and (m.target_type != "boolean" or len(clf.classes_) != 2):
        raise ValueError(f"{nombre}: el umbral solo aplica a targets booleanos")
    if clf.n_features_in_ != len(m.features):
        raise ValueError(
            f"{nombre}: el modelo espera {clf.n_features_in_} features y info.csv lista {len(m.features)}"
        )

    m.resumen = _armar_resumen(m, info, X_test, y_test, _leer_distribuciones(m, carpeta))
    return m


def cargar_modelos_abiertos():
    for nombre in OPEN_MODELS:
        MODELS[nombre] = cargar_modelo(nombre)


def obtener_modelo(nombre: str) -> LoadedModel:
    """KeyError si el modelo no existe o no está cargado."""
    return MODELS[nombre]


def obtener_resumen(nombre: str) -> dict:
    return obtener_modelo(nombre).resumen
