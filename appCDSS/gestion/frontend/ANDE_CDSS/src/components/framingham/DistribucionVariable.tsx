import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatearNumero,
  percentilDe,
  ubicarValor,
  type Distribucion,
  type GrupoDesenlace,
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
  habitual: "bg-foreground",
  atipico: "bg-warning",
  fuera: "bg-danger",
};

// Mitad superior: sin el desenlace; mitad inferior: con el desenlace (CHD).
const ESTILO_GRUPO = {
  negativo: { violin: "fill-primary-300 stroke-primary-600", caja: "stroke-primary-800" },
  positivo: { violin: "fill-danger-border stroke-danger", caja: "stroke-danger-text" },
};

const nombreCorto = (g: GrupoDesenlace) => (g.positivo ? "con CHD" : "sin CHD");

/** Leyenda compartida por todos los violines divididos por desenlace. */
export const LeyendaDesenlace = ({ grupos }: { grupos: GrupoDesenlace[] }) => (
  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-foreground-secondary">
    {grupos.map((g) => (
      <span key={g.etiqueta} className="inline-flex items-center gap-1.5">
        <span
          className={cn(
            "h-2.5 w-4 border",
            g.positivo
              ? "rounded-b-full border-danger bg-danger-border"
              : "rounded-t-full border-primary-600 bg-primary-300"
          )}
        />
        {g.etiqueta}
      </span>
    ))}
    <span className="inline-flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-full bg-foreground ring-2 ring-card" />
      Paciente
    </span>
  </div>
);

const DistribucionVariable = ({ variable: v, distribucion: d, valor }: DistribucionVariableProps) => {
  const { x } = d.kde;
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

  // Media silueta entre la línea central (y = 50) y el borde; signo −1 hacia arriba, +1 hacia abajo.
  const mitad = (densidad: number[], signo: 1 | -1) =>
    `M${pos(x[0])},50L${x.map((xi, i) => `${pos(xi)},${50 + signo * densidad[i] * 46}`).join("L")}L${pos(
      x[x.length - 1]
    )},50Z`;

  const negativo = d.por_desenlace?.find((g) => !g.positivo);
  const positivo = d.por_desenlace?.find((g) => g.positivo);
  const grupos = negativo && positivo ? { negativo, positivo } : null;

  const ubicacion = valor === null ? null : ubicarValor(d, valor);
  const percentil = valor === null ? null : Math.round(percentilDe(d, valor));
  const unidad = v.unidad;

  // Caja Q1–Q3 y mediana de un grupo, dentro de su mitad del violín.
  const cajaGrupo = (g: GrupoDesenlace, signo: 1 | -1) => {
    const estilo = ESTILO_GRUPO[g.positivo ? "positivo" : "negativo"];
    const y = signo === -1 ? 36 : 50;
    return (
      <g key={g.etiqueta}>
        <rect
          x={pos(g.q1)}
          width={pos(g.q3) - pos(g.q1)}
          y={y}
          height={14}
          className={cn("fill-card", estilo.caja)}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={pos(g.mediana)}
          x2={pos(g.mediana)}
          y1={y}
          y2={y + 14}
          className={estilo.caja}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </g>
    );
  };

  return (
    <div className="group space-y-1">
      <div
        className={cn("relative h-14", grupos && "mt-5")}
        role="img"
        aria-label={
          grupos
            ? `Distribución de ${v.etiqueta}: mediana ${formatearNumero(
                grupos.negativo.mediana
              )} ${unidad} sin CHD y ${formatearNumero(grupos.positivo.mediana)} ${unidad} con CHD (n = ${d.n})`
            : `Distribución de ${v.etiqueta} en la cohorte: mediana ${formatearNumero(d.mediana)} ${unidad} (n = ${d.n})`
        }
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          {grupos ? (
            <>
              <path
                d={mitad(grupos.negativo.densidad, -1)}
                className={ESTILO_GRUPO.negativo.violin}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={mitad(grupos.positivo.densidad, 1)}
                className={ESTILO_GRUPO.positivo.violin}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={pos(x[0])}
                x2={pos(x[x.length - 1])}
                y1={50}
                y2={50}
                className="stroke-border"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              {cajaGrupo(grupos.negativo, -1)}
              {cajaGrupo(grupos.positivo, 1)}
            </>
          ) : (
            <>
              <path
                d={`${mitad(d.kde.densidad, -1)}${mitad(d.kde.densidad, 1)}`}
                className="fill-primary-100 stroke-primary-300"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <rect
                x={pos(d.q1)}
                width={pos(d.q3) - pos(d.q1)}
                y={38}
                height={24}
                className="fill-card stroke-muted-foreground"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={pos(d.mediana)}
                x2={pos(d.mediana)}
                y1={38}
                y2={62}
                className="stroke-foreground-secondary"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}
        </svg>

        {/* Mediana sin CHD, rotulada sobre su línea (la de con CHD va en la fila del eje). */}
        {grupos && (
          <span
            aria-hidden
            className="absolute bottom-full mb-0.5 -translate-x-1/2 text-xs font-medium tabular-nums text-primary-800"
            style={{ left: `${pos(grupos.negativo.mediana)}%` }}
          >
            {formatearNumero(grupos.negativo.mediana)}
          </span>
        )}

        {/* Tamaño de la cohorte: pop-up flotante al pasar el mouse sobre el gráfico (no ocupa espacio). */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 z-10 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-xs tabular-nums text-foreground-secondary opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100"
        >
          n = {d.n}
          {grupos && (
            <>
              {" "}
              ({grupos.negativo.n} {nombreCorto(grupos.negativo)}, {grupos.positivo.n}{" "}
              {nombreCorto(grupos.positivo)})
            </>
          )}
        </div>

        {posPunto !== null && ubicacion && (
          <div
            className="absolute top-1/2 transition-[left] duration-300 ease-out"
            style={{ left: `${posPunto}%` }}
          >
            {fijado === "izquierda" && (
              <ChevronLeft className="absolute -left-5 -top-2 h-4 w-4 text-danger" />
            )}
            <span
              className={cn(
                "block h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow ring-2 ring-card",
                COLOR_PUNTO[ubicacion]
              )}
            />
            {fijado === "derecha" && (
              <ChevronRight className="absolute left-1 -top-2 h-4 w-4 text-danger" />
            )}
          </div>
        )}
      </div>

      {/* Eje: mínimo y máximo observados en la cohorte, y mediana con CHD bajo su línea. */}
      <div className="relative h-5 text-sm tabular-nums text-muted-foreground">
        <span className="absolute -translate-x-1/2" style={{ left: `${pos(d.min)}%` }}>
          {formatearNumero(d.min)}
        </span>
        {grupos && (
          <span
            aria-hidden
            className="absolute -translate-x-1/2 text-xs font-medium leading-5 text-danger-text"
            style={{ left: `${pos(grupos.positivo.mediana)}%` }}
          >
            {formatearNumero(grupos.positivo.mediana)}
          </span>
        )}
        <span className="absolute -translate-x-1/2" style={{ left: `${pos(d.max)}%` }}>
          {formatearNumero(d.max)}
        </span>
      </div>

      <div className="space-y-0.5 text-sm">
        {ubicacion === "habitual" ? (
          <p className="text-foreground-secondary">Percentil {percentil} de la cohorte · dentro del rango habitual</p>
        ) : ubicacion === "atipico" ? (
          <p className="flex items-start gap-1 text-warning-text">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
            Percentil {percentil} · valor atípico respecto de la cohorte
          </p>
        ) : ubicacion === "fuera" ? (
          <p className="flex items-start gap-1 text-danger-text">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
            Fuera de lo observado en la cohorte ({formatearNumero(d.min)}–{formatearNumero(d.max)}{" "}
            {unidad}): la estimación es menos confiable.
          </p>
        ) : null}
        {!grupos && (
          <p className="text-muted-foreground">
            Mediana {formatearNumero(d.mediana)} {unidad} · RIC {formatearNumero(d.q1)}–
            {formatearNumero(d.q3)} {unidad}
          </p>
        )}
      </div>
    </div>
  );
};

export default DistribucionVariable;
