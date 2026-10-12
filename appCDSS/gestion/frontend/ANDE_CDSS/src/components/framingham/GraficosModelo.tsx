import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatearDecimales,
  formatearNumero,
  formatearPorcentaje,
  variablePorId,
  type MetricasClinicas,
} from "./variables";

const COLOR = "#0369a1"; // sky-700
const MARCAS_0_A_1 = [0, 0.2, 0.4, 0.6, 0.8, 1];

const estiloTooltip = {
  backgroundColor: "white",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  fontSize: 14,
};

// ---- Importancia de variables ----

export const ImportanciaVariables = ({
  nombres,
  valores,
}: {
  nombres: string[];
  valores: number[];
}) => {
  const datos = nombres
    .map((id, i) => ({
      nombre: variablePorId(id)?.etiqueta ?? id,
      valor: valores[i],
    }))
    .sort((a, b) => b.valor - a.valor);

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">
        Importancia relativa de cada variable según el método de selección usado en el entrenamiento (1 = la más alta).
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 1]}
            ticks={MARCAS_0_A_1}
            tick={{ fontSize: 14, fill: "#64748b" }}
            tickFormatter={(v) => formatearNumero(v)}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            width={170}
            tick={{ fontSize: 14, fill: "#334155" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={estiloTooltip}
            formatter={(v) => [formatearDecimales(Number(v), 2), "Importancia relativa"]}
          />
          <Bar dataKey="valor" fill={COLOR} radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ---- Matriz de confusión ----

const Celda = ({ valor, sigla, correcto }: { valor: number; sigla: string; correcto: boolean }) => (
  <div
    className={`rounded-md border p-3 text-center ${
      correcto ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
    }`}
  >
    <div
      className={`text-2xl font-semibold tabular-nums ${
        correcto ? "text-emerald-800" : "text-rose-800"
      }`}
    >
      {valor}
    </div>
    <div className="text-sm text-slate-500">{sigla}</div>
  </div>
);

const Metrica = ({ nombre, valor, detalle }: { nombre: string; valor: number; detalle: string }) => (
  <div className="rounded-md bg-slate-50 p-3">
    <div className="text-sm text-slate-500">{nombre}</div>
    <div className="text-2xl font-semibold tabular-nums text-slate-900">
      {formatearPorcentaje(valor)}
    </div>
    <div className="text-sm text-slate-500">{detalle}</div>
  </div>
);

export const MatrizConfusion = ({
  metricas: m,
  positivo,
  negativo,
}: {
  metricas: MetricasClinicas;
  positivo: string;
  negativo: string;
}) => (
  <div className="space-y-4">
    <p className="text-sm text-slate-600">
      Desempeño sobre {m.total} pacientes del conjunto de prueba (prevalencia de CHD:{" "}
      {formatearPorcentaje(m.prevalencia)}).
    </p>
    <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 text-sm">
      <div />
      <div className="text-center text-sm font-medium text-slate-500">Predicción: {positivo}</div>
      <div className="text-center text-sm font-medium text-slate-500">Predicción: {negativo}</div>
      <div className="pr-2 text-right text-sm font-medium text-slate-500">Real: {positivo}</div>
      <Celda valor={m.vp} sigla="Verdaderos positivos" correcto />
      <Celda valor={m.fn} sigla="Falsos negativos" correcto={false} />
      <div className="pr-2 text-right text-sm font-medium text-slate-500">Real: {negativo}</div>
      <Celda valor={m.fp} sigla="Falsos positivos" correcto={false} />
      <Celda valor={m.vn} sigla="Verdaderos negativos" correcto />
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Metrica nombre="Sensibilidad" valor={m.sensibilidad} detalle="VP / (VP + FN)" />
      <Metrica nombre="Especificidad" valor={m.especificidad} detalle="VN / (VN + FP)" />
      <Metrica nombre="VPP" valor={m.vpp} detalle="VP / (VP + FP)" />
      <Metrica nombre="VPN" valor={m.vpn} detalle="VN / (VN + FN)" />
    </div>
  </div>
);

// ---- Curva ROC ----

export const CurvaROC = ({ puntos, auc }: { puntos: [number, number][]; auc: number }) => {
  const datos = puntos.map(([fpr, tpr]) => ({ fpr, tpr }));

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">
        Área bajo la curva (AUC):{" "}
        <span className="font-semibold text-slate-900">{formatearDecimales(auc, 2)}</span>.
        La diagonal representa un clasificador al azar (AUC 0,5).
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={datos} margin={{ top: 8, right: 16, left: 8, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="fpr"
            type="number"
            domain={[0, 1]}
            ticks={MARCAS_0_A_1}
            tick={{ fontSize: 14, fill: "#64748b" }}
            tickFormatter={(v) => formatearNumero(v)}
            label={{ value: "1 − Especificidad", position: "bottom", offset: 4, fontSize: 14, fill: "#475569" }}
          />
          <YAxis
            type="number"
            domain={[0, 1]}
            ticks={MARCAS_0_A_1}
            tick={{ fontSize: 14, fill: "#64748b" }}
            tickFormatter={(v) => formatearNumero(v)}
            label={{ value: "Sensibilidad", angle: -90, position: "insideLeft", fontSize: 14, fill: "#475569" }}
          />
          <Tooltip
            contentStyle={estiloTooltip}
            labelFormatter={(v) => `1 − Especificidad: ${formatearDecimales(Number(v), 2)}`}
            formatter={(v) => [formatearDecimales(Number(v), 2), "Sensibilidad"]}
          />
          <Line
            data={[{ fpr: 0, tpr: 0 }, { fpr: 1, tpr: 1 }]}
            dataKey="tpr"
            stroke="#cbd5e1"
            strokeDasharray="4 4"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
          <Line dataKey="tpr" type="linear" stroke={COLOR} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
