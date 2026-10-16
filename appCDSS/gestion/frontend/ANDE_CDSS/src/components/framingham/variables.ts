// Variables clínicas del modelo Framingham y utilidades compartidas por la página.

export interface VariableClinica {
  /** Nombre de la feature en el modelo (lo que espera el backend). */
  id: string;
  etiqueta: string;
  abreviatura?: string;
  unidad: string;
  descripcion: string;
  /** Valor de ejemplo (mediana del dataset completo), solo como placeholder. */
  ejemplo: number;
  /** Límites de plausibilidad fisiológica: fuera de esto el valor se rechaza. */
  min: number;
  max: number;
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
    decimales: 0,
    paso: 1,
  },
  {
    id: "glucose",
    etiqueta: "Glucemia",
    unidad: "mg/dL",
    descripcion: "Nivel de glucosa en sangre.",
    ejemplo: 78,
    min: 20,
    max: 600,
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
    decimales: 0,
    paso: 1,
  },
  {
    id: "BMI",
    etiqueta: "Índice de masa corporal",
    abreviatura: "IMC",
    unidad: "kg/m²",
    descripcion: "Peso (kg) dividido por la talla al cuadrado (m²).",
    ejemplo: 25.4,
    min: 10,
    max: 80,
    decimales: 1,
    paso: 0.1,
  },
  {
    id: "sysBP",
    etiqueta: "Presión arterial sistólica",
    abreviatura: "PAS",
    unidad: "mmHg",
    descripcion: "Presión arterial sistólica en reposo.",
    ejemplo: 128,
    min: 60,
    max: 300,
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

// ---- Ubicación de un valor en la distribución de la cohorte ----

export interface Distribucion {
  n: number;
  min: number;
  max: number;
  q1: number;
  mediana: number;
  q3: number;
  media: number;
  de: number;
  /** Percentiles 0..100 de la cohorte. */
  percentiles: number[];
  /** Densidad (KDE) normalizada a máximo 1, evaluada en x. */
  kde: { x: number[]; densidad: number[] };
  /** Distribución por desenlace real, sobre la misma grilla kde.x (cada una normalizada a máximo 1). */
  por_desenlace: GrupoDesenlace[];
}

export interface GrupoDesenlace {
  etiqueta: string;
  positivo: boolean;
  n: number;
  q1: number;
  mediana: number;
  q3: number;
  densidad: number[];
}

/** habitual: dentro de los bigotes de Tukey; atipico: fuera de Q1 − 1,5·RIC / Q3 + 1,5·RIC
 *  pero dentro de lo observado; fuera: más allá del mínimo o máximo de la cohorte. */
export type Ubicacion = "habitual" | "atipico" | "fuera";

export const ubicarValor = (d: Distribucion, valor: number): Ubicacion => {
  if (valor < d.min || valor > d.max) return "fuera";
  const ric = d.q3 - d.q1;
  if (valor < d.q1 - 1.5 * ric || valor > d.q3 + 1.5 * ric) return "atipico";
  return "habitual";
};

/** Percentil (0–100) de un valor, interpolando entre los percentiles de la cohorte. */
export const percentilDe = (d: Distribucion, valor: number) => {
  const p = d.percentiles;
  if (valor <= p[0]) return 0;
  if (valor >= p[100]) return 100;
  let i = 0;
  while (p[i + 1] < valor) i++;
  // Valores repetidos (p. ej. edades enteras): tomar el centro del tramo plano.
  let j = i + 1;
  while (j < 100 && p[j + 1] === p[j] && p[j] === valor) j++;
  if (p[i + 1] === valor) return (i + 1 + j) / 2;
  return i + (valor - p[i]) / (p[i + 1] - p[i]);
};

// ---- Tipos de la API (/api/models/framingham) ----

export interface ResumenModelo {
  model_name: string;
  features: string[];
  feat: [string[], number[]] | [string[]];
  CM: number[][];
  roc_curves: [number, number][][];
  auc: number;
  /** Probabilidad de CHD a partir de la cual el modelo clasifica como positivo (null: clase más probable). */
  umbral: number | null;
  example_prediction: (string | number)[][];
  bool_labels: string[];
  target_column: string;
  target_type: string;
  distribuciones: Record<string, Distribucion>;
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
