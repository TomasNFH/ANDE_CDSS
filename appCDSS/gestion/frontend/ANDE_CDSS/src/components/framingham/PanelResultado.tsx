import { Activity, AlertCircle, HeartPulse, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  VARIABLES,
  formatearNumero,
  formatearPorcentaje,
  type Prediccion,
} from "./variables";

interface PanelResultadoProps {
  resultado: Prediccion | null;
  /** El modelo clasifica como positivo a partir de esta probabilidad. */
  umbral: number;
  calculando: boolean;
  error: string;
  historial: Prediccion[];
  onRecuperar: (p: Prediccion) => void;
}

const BarraProbabilidad = ({
  probabilidad,
  positivo,
  umbral,
}: {
  probabilidad: number;
  positivo: boolean;
  umbral: number;
}) => (
  <div className="space-y-1">
    <div className="relative h-3 w-full rounded-full bg-muted">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          positivo ? "bg-danger" : "bg-primary-100"
        )}
        style={{ width: `${probabilidad * 100}%` }}
      />
      <div
        className="absolute -top-1 h-5 w-0.5 bg-foreground"
        style={{ left: `${umbral * 100}%` }}
        aria-hidden
      />
    </div>
    <div className="relative h-5 text-sm text-muted-foreground">
      <span className="absolute left-0">0%</span>
      <span className="absolute -translate-x-1/2" style={{ left: `${umbral * 100}%` }}>
        Umbral {formatearPorcentaje(umbral)}
      </span>
      <span className="absolute right-0">100%</span>
    </div>
  </div>
);

const PanelResultado = ({
  resultado,
  umbral,
  calculando,
  error,
  historial,
  onRecuperar,
}: PanelResultadoProps) => {
  const anteriores = historial.filter((p) => p.id !== resultado?.id);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-foreground">
          <Activity className="h-4 w-4 text-foreground" />
          Resultado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6" aria-live="polite">
        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-danger-border bg-danger-muted p-3 text-sm text-danger-text">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : calculando ? (
          <div className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
            Calculando…
          </div>
        ) : resultado ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-foreground-secondary">
                Probabilidad estimada de enfermedad coronaria a 10 años
              </p>
              <p
                className={cn(
                  "mt-1 text-5xl font-semibold tabular-nums tracking-tight",
                  resultado.positivo ? "text-danger-text" : "text-success-text"
                )}
              >
                {formatearPorcentaje(resultado.probabilidad)}
              </p>
            </div>

            <BarraProbabilidad
              probabilidad={resultado.probabilidad}
              positivo={resultado.positivo}
              umbral={umbral}
            />

            <div
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                resultado.positivo
                  ? "bg-danger-muted text-danger-text"
                  : "bg-success-muted text-success-text"
              )}
            >
              <HeartPulse className="h-4 w-4" />
              Clasificación del modelo: {resultado.etiqueta}
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {VARIABLES.map((v) => (
                <div key={v.id} className="contents">
                  <dt className="text-muted-foreground">{v.abreviatura ?? v.etiqueta}</dt>
                  <dd className="text-right tabular-nums text-foreground">
                    {formatearNumero(resultado.valores[v.id])} {v.unidad}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Completá los datos del paciente y presioná{" "}
            <span className="font-medium text-foreground-secondary">Calcular riesgo</span>.
          </div>
        )}

        {anteriores.length > 0 && (
          <div className="border-t border-border pt-4">
            <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Cálculos anteriores de esta sesión
            </h3>
            <ul className="divide-y divide-border">
              {anteriores.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-12 shrink-0 tabular-nums text-muted-foreground">
                    {p.fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground-secondary">
                    {VARIABLES.map((v) => formatearNumero(p.valores[v.id])).join(" · ")}
                  </span>
                  <span
                    className={cn(
                      "w-12 shrink-0 text-right font-medium tabular-nums",
                      p.positivo ? "text-danger-text" : "text-success-text"
                    )}
                  >
                    {formatearPorcentaje(p.probabilidad)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground"
                    onClick={() => onRecuperar(p)}
                    title="Volver a cargar estos valores"
                    aria-label="Volver a cargar estos valores"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PanelResultado;
