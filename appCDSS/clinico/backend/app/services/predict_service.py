import pandas as pd

from app.services.model_service import etiqueta, obtener_modelo, predecir_df


def predecir(nombre: str, valores: dict[str, float]) -> dict:
    """Predice con un modelo abierto ya cargado a partir de los valores de sus features.

    KeyError si el modelo no existe; ValueError si faltan o sobran features.
    """
    m = obtener_modelo(nombre)

    faltan = [f for f in m.features if f not in valores]
    sobran = [f for f in valores if f not in m.features]
    if faltan or sobran:
        partes = []
        if faltan:
            partes.append(f"faltan: {', '.join(faltan)}")
        if sobran:
            partes.append(f"no corresponden al modelo: {', '.join(sobran)}")
        raise ValueError("Features inválidas (" + "; ".join(partes) + ")")

    X = pd.DataFrame([{f: valores[f] for f in m.features}])
    pred, conf, proba = predecir_df(m, X)

    return {
        "prediction": pred[0],
        "confidence": conf[0],
        "probabilities": {
            etiqueta(m, c): float(p) for c, p in zip(m.clf.classes_, proba[0])
        },
        "input_prediction": [
            m.features + ["PREDICTION", "CONFIDENCE"],
            [valores[f] for f in m.features] + [pred[0], conf[0]],
        ],
    }
