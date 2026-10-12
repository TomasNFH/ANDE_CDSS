import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatearNumero,
  percentilDe,
  ubicarValor,
  type Distribucion,
  type VariableClinica,
} from "./variables";

interface DistribucionVariableProps {
  variable: VariableClinica;
  distribucion: Distribucion;
  /** Valor del paciente, o null si el campo está vacío o es inválido. */
  valor: number | null;
}

// El eje se extiende para mostrar valores fuera de la cohorte, pero como mucho este
// múltiplo del rango; más allá el punto queda fijo en el borde con una flecha.
const EXTENSION_MAXIMA = 0.6;

const COLOR_PUNTO = {
  habitual: "bg-sky-600",
  atipico: "bg-amber-500",
  fuera: "bg-rose-600",
};

const DistribucionVariable = ({ variable: v, distribucion: d, valor }: DistribucionVariableProps) => {
  const { x, densidad } = d.kde;
  const base: [number, number] = [x[0], x[x.length - 1]];
  const rango = base[1] - base[0];

  let desde = base[0];
  let hasta = base[1];
  let fijado: "izquierda" | "derecha" | null = null;
  if (valor !== null) {
    if (valor < desde) {
      desde = Math.max(valor, base[0] - EXTENSION_MAXIMA * rango);
      if (valor < desde) fijado = "izquierda";
    }
    if (valor > hasta) {
      hasta = Math.min(valor, base[1] + EXTENSION_MAXIMA * rango);
      if (valor > hasta) fijado = "derecha";
    }
  }
  // Margen para que el punto no quede cortado en los extremos.
  const margen = (hasta - desde) * 0.03;
  desde -= margen;
  hasta += margen;

  const pos = (valorEje: number) => ((valorEje - desde) / (hasta - desde)) * 100;
  const posPunto = valor === null ? null : pos(Math.min(Math.max(valor, desde), hasta));

  // Violín horizontal: silueta superior y luego la inferior en espejo (viewBox 100 × 100).
  const superior = x.map((xi, i) => `${pos(xi)},${50 - densidad[i] * 44}`);
  const inferior = x.map((xi, i) => `${pos(xi)},${50 + densidad[i] * 44}`).reverse();
  const silueta = `M${superior.join("L")}L${inferior.join("L")}Z`;

  const ric = d.q3 - d.q1;
  const bigoteInf = Math.max(d.min, d.q1 - 1.5 * ric);
  const bigoteSup = Math.min(d.max, d.q3 + 1.5 * ric);

  const ubicacion = valor === null ? null : ubicarValor(d, valor);
  const percentil = valor === null ? null : Math.round(percentilDe(d, valor));
  const unidad = v.unidad;

  return (
    <div className="space-y-1">
      <div
        className="relative h-14"
        role="img"
        aria-label={`Distribución de ${v.etiqueta} en la cohorte: mediana ${formatearNumero(
          d.mediana
        )} ${unidad}, rango intercuartílico ${formatearNumero(d.q1)} a ${formatearNumero(d.q3)} ${unidad}`}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          <path d={silueta} className="fill-sky-100 stroke-sky-300" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <line
            x1={pos(bigoteInf)}
            x2={pos(bigoteSup)}
            y1={50}
            y2={50}
            className="stroke-slate-400"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <rect
            x={pos(d.q1)}
            width={pos(d.q3) - pos(d.q1)}
            y={38}
            height={24}
            className="fill-white stroke-slate-500"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={pos(d.mediana)}
            x2={pos(d.mediana)}
            y1={38}
            y2={62}
            className="stroke-slate-700"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {posPunto !== null && ubicacion && (
          <div
            className="absolute top-1/2 transition-[left] duration-300 ease-out"
            style={{ left: `${posPunto}%` }}
          >
            {fijado === "izquierda" && (
              <ChevronLeft className="absolute -left-5 -top-2 h-4 w-4 text-rose-600" />
            )}
            <span
              className={cn(
                "block h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow ring-2 ring-white",
                COLOR_PUNTO[ubicacion]
              )}
            />
            {fijado === "derecha" && (
              <ChevronRight className="absolute left-1 -top-2 h-4 w-4 text-rose-600" />
            )}
          </div>
        )}
      </div>

      {/* Eje: mínimo, mediana y máximo de la cohorte */}
      <div className="relative h-4 text-[11px] tabular-nums text-slate-400">
        <span className="absolute -translate-x-1/2" style={{ left: `${pos(d.min)}%` }}>
          {formatearNumero(d.min)}
        </span>
        <span className="absolute -translate-x-1/2 text-slate-600" style={{ left: `${pos(d.mediana)}%` }}>
          {formatearNumero(d.mediana)}
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: `${pos(d.max)}%` }}>
          {formatearNumero(d.max)}
        </span>
      </div>

      <p className="min-h-[1rem] text-xs">
        {ubicacion === null ? (
          <span className="text-slate-500">
            Cohorte (n = {d.n}): mediana {formatearNumero(d.mediana)} {unidad} · RIC{" "}
            {formatearNumero(d.q1)}–{formatearNumero(d.q3)} {unidad}
          </span>
        ) : ubicacion === "habitual" ? (
          <span className="text-slate-600">
            Percentil {percentil} de la cohorte · dentro del rango habitual
          </span>
        ) : ubicacion === "atipico" ? (
          <span className="flex items-start gap-1 text-amber-700">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
            Percentil {percentil} · valor atípico respecto de la cohorte
          </span>
        ) : (
          <span className="flex items-start gap-1 text-rose-700">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
            Fuera de lo observado en la cohorte ({formatearNumero(d.min)}–{formatearNumero(d.max)}{" "}
            {unidad}): la estimación es menos confiable.
          </span>
        )}
      </p>
    </div>
  );
};

export default DistribucionVariable;
