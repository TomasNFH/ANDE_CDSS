// Variables clínicas del modelo Framingham y utilidades compartidas por la página.

export interface VariableClinica {
  /** Nombre de la feature en el modelo (lo que espera el backend). */
  id: string;
  etiqueta: string;
  abreviatura?: string;
  unidad: string;
  descripcion: string;
  /** Valor de ejemplo (mediana de la cohorte de test), solo como placeholder. */
  ejemplo: number;
  /** Límites de plausibilidad fisiológica: fuera de esto el valor se rechaza. */
  min: number;
  max: number;
  /** Rango observado en la cohorte de test: fuera de esto se advierte, pero se permite. */
  rangoCohorte: [number, number];
  decimales: number;
  paso: number;
}

export const VARIABLES: VariableClinica[] = [
  {
    id: "age",
    etiqueta: "Edad",
    unidad: "años",
    descripcion: "Edad del paciente al momento de la evaluación.",
    ejemplo: 49,
    min: 1,
    max: 120,
    rangoCohorte: [34, 68],
    decimales: 0,
    paso: 1,
  },
  {
    id: "glucose",
    etiqueta: "Glucemia",
    unidad: "mg/dL",
    descripcion: "Nivel de glucosa en sangre.",
    ejemplo: 77,
    min: 20,
    max: 600,
    rangoCohorte: [44, 292],
    decimales: 0,
    paso: 1,
  },
  {
    id: "totChol",
    etiqueta: "Colesterol total",
    unidad: "mg/dL",
    descripcion: "Colesterol total sérico.",
    ejemplo: 234,
    min: 50,
    max: 700,
    rangoCohorte: [135, 390],
    decimales: 0,
    paso: 1,
  },
  {
    id: "BMI",
    etiqueta: "Índice de masa corporal",
    abreviatura: "IMC",
    unidad: "kg/m²",
    descripcion: "Peso (kg) dividido por la talla al cuadrado (m²).",
    ejemplo: 25.1,
    min: 10,
    max: 80,
    rangoCohorte: [16.6, 44.7],
    decimales: 1,
    paso: 0.1,
  },
  {
    id: "sysBP",
    etiqueta: "Presión arterial sistólica",
    abreviatura: "PAS",
    unidad: "mmHg",
    descripcion: "Presión arterial sistólica en reposo.",
    ejemplo: 127.5,
    min: 60,
    max: 300,
    rangoCohorte: [92.5, 243],
    decimales: 1,
    paso: 0.5,
  },
];

export const variablePorId = (id: string) => VARIABLES.find((v) => v.id === id);

/** Error de validación del valor ingresado, o null si es válido. */
export const validarValor = (v: VariableClinica, texto: string): string | null => {
  if (texto.trim() === "") return "Campo obligatorio.";
  const valor = Number(texto);
  if (!Number.isFinite(valor)) return "Ingresá un número.";
  if (v.decimales === 0 && !Number.isInteger(valor))
    return "Ingresá un número entero.";
  if (valor < v.min || valor > v.max)
    return `Ingresá un valor entre ${v.min} y ${v.max} ${v.unidad}.`;
  return null;
};

export const fueraDeCohorte = (v: VariableClinica, texto: string) => {
  const valor = Number(texto);
  return (
    texto.trim() !== "" &&
    Number.isFinite(valor) &&
    (valor < v.rangoCohorte[0] || valor > v.rangoCohorte[1])
  );
};

const formato = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

export const formatearNumero = (valor: number | string) => {
  const n = Number(valor);
  return Number.isFinite(n) ? formato.format(n) : String(valor);
};

export const formatearDecimales = (valor: number, decimales: number) =>
  valor.toLocaleString("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });

export const formatearPorcentaje = (proporcion: number) =>
  `${formato.format(proporcion * 100)}%`;

const NOMBRES_ALGORITMO: Record<string, string> = {
  LogisticRegression: "Regresión logística",
  RandomForestClassifier: "Random forest",
  GradientBoostingClassifier: "Gradient boosting",
  KNeighborsClassifier: "K vecinos más cercanos",
  GaussianNB: "Naive Bayes gaussiano",
};

export const nombreAlgoritmo = (nombre: string) => NOMBRES_ALGORITMO[nombre] ?? nombre;

// ---- Métricas a partir de la matriz [VP, FN, FP, VN] (clase positiva: CHD) ----

export interface MetricasClinicas {
  vp: number;
  fn: number;
  fp: number;
  vn: number;
  total: number;
  sensibilidad: number;
  especificidad: number;
  vpp: number;
  vpn: number;
  exactitud: number;
  prevalencia: number;
}

const cociente = (a: number, b: number) => (b > 0 ? a / b : 0);

export const calcularMetricas = ([vp, fn, fp, vn]: number[]): MetricasClinicas => {
  const total = vp + fn + fp + vn;
  return {
    vp,
    fn,
    fp,
    vn,
    total,
    sensibilidad: cociente(vp, vp + fn),
    especificidad: cociente(vn, vn + fp),
    vpp: cociente(vp, vp + fp),
    vpn: cociente(vn, vn + fn),
    exactitud: cociente(vp + vn, total),
    prevalencia: cociente(vp + fn, total),
  };
};

// ---- Tipos de la API (/api/models/framingham) ----

export interface ResumenModelo {
  model_name: string;
  features: string[];
  feat: [string[], number[]] | [string[]];
  CM: number[][];
  roc_curves: [number, number][][];
  auc: number;
  example_prediction: (string | number)[][];
  bool_labels: string[];
  target_column: string;
  target_type: string;
}

export interface Prediccion {
  id: number;
  fecha: Date;
  valores: Record<string, number>;
  etiqueta: string;
  /** Probabilidad de la clase positiva (CHD a 10 años). */
  probabilidad: number;
  positivo: boolean;
}
