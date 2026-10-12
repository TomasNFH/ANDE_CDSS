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

// El modelo clasifica como positivo por encima de este umbral (predict_proba > 0.5).
const UMBRAL = 0.5;

interface PanelResultadoProps {
  resultado: Prediccion | null;
  calculando: boolean;
  error: string;
  historial: Prediccion[];
  onRecuperar: (p: Prediccion) => void;
}

const BarraProbabilidad = ({ probabilidad, positivo }: { probabilidad: number; positivo: boolean }) => (
  <div className="space-y-1">
    <div className="relative h-3 w-full rounded-full bg-slate-100">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          positivo ? "bg-rose-500" : "bg-emerald-500"
        )}
        style={{ width: `${probabilidad * 100}%` }}
      />
      <div
        className="absolute -top-1 h-5 w-0.5 bg-slate-700"
        style={{ left: `${UMBRAL * 100}%` }}
        aria-hidden
      />
    </div>
    <div className="relative h-5 text-sm text-slate-500">
      <span className="absolute left-0">0%</span>
      <span className="absolute -translate-x-1/2" style={{ left: `${UMBRAL * 100}%` }}>
        Umbral {formatearPorcentaje(UMBRAL)}
      </span>
      <span className="absolute right-0">100%</span>
    </div>
  </div>
);

const PanelResultado = ({
  resultado,
  calculando,
  error,
  historial,
  onRecuperar,
}: PanelResultadoProps) => {
  const anteriores = historial.filter((p) => p.id !== resultado?.id);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-slate-900">
          <Activity className="h-4 w-4 text-sky-700" />
          Resultado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6" aria-live="polite">
        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : calculando ? (
          <div className="flex items-center gap-3 py-8 text-sm text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-700" />
            Calculando…
          </div>
        ) : resultado ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">
                Probabilidad estimada de enfermedad coronaria a 10 años
              </p>
              <p
                className={cn(
                  "mt-1 text-5xl font-semibold tabular-nums tracking-tight",
                  resultado.positivo ? "text-rose-700" : "text-emerald-700"
                )}
              >
                {formatearPorcentaje(resultado.probabilidad)}
              </p>
            </div>

            <BarraProbabilidad
              probabilidad={resultado.probabilidad}
              positivo={resultado.positivo}
            />

            <div
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                resultado.positivo
                  ? "bg-rose-50 text-rose-800"
                  : "bg-emerald-50 text-emerald-800"
              )}
            >
              <HeartPulse className="h-4 w-4" />
              Clasificación del modelo: {resultado.etiqueta}
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {VARIABLES.map((v) => (
                <div key={v.id} className="contents">
                  <dt className="text-slate-500">{v.abreviatura ?? v.etiqueta}</dt>
                  <dd className="text-right tabular-nums text-slate-900">
                    {formatearNumero(resultado.valores[v.id])} {v.unidad}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="text-sm leading-relaxed text-slate-500">
              La probabilidad no está calibrada a la prevalencia real y tiende a
              sobreestimar el riesgo absoluto: interpretala como un indicador relativo.
              Ver «Información del modelo».
            </p>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-slate-500">
            Completá los datos del paciente y presioná{" "}
            <span className="font-medium text-slate-700">Calcular riesgo</span>.
          </div>
        )}

        {anteriores.length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500">
              Cálculos anteriores de esta sesión
            </h3>
            <ul className="divide-y divide-slate-100">
              {anteriores.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-12 shrink-0 tabular-nums text-slate-400">
                    {p.fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-slate-600">
                    {VARIABLES.map((v) => formatearNumero(p.valores[v.id])).join(" · ")}
                  </span>
                  <span
                    className={cn(
                      "w-12 shrink-0 text-right font-medium tabular-nums",
                      p.positivo ? "text-rose-700" : "text-emerald-700"
                    )}
                  >
                    {formatearPorcentaje(p.probabilidad)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-slate-500"
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
