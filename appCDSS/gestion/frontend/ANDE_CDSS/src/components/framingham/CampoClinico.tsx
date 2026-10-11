import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatearNumero,
  fueraDeCohorte,
  type VariableClinica,
} from "./variables";

interface CampoClinicoProps {
  variable: VariableClinica;
  valor: string;
  onChange: (valor: string) => void;
  onBlur?: () => void;
  /** Error de validación a mostrar (solo cuando el campo ya se tocó o se intentó calcular). */
  error?: string | null;
  /** Espacio a la derecha del campo para información de contexto (p. ej. la distribución en la cohorte). */
  contexto?: ReactNode;
}

const CampoClinico = ({
  variable: v,
  valor,
  onChange,
  onBlur,
  error,
  contexto,
}: CampoClinicoProps) => {
  const inputId = `campo-${v.id}`;
  const ayudaId = `${inputId}-ayuda`;
  const advertencia = !error && fueraDeCohorte(v, valor);

  return (
    <div
      className={cn(
        "grid gap-x-6 gap-y-2",
        contexto && "md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]"
      )}
    >
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-900">
          {v.etiqueta}
          {v.abreviatura && (
            <span className="ml-1 font-normal text-slate-500">({v.abreviatura})</span>
          )}
        </label>
        <div className="relative">
          <Input
            id={inputId}
            type="number"
            inputMode="decimal"
            min={v.min}
            max={v.max}
            step={v.paso}
            placeholder={`Ej.: ${formatearNumero(v.ejemplo)}`}
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            aria-invalid={!!error}
            aria-describedby={ayudaId}
            className={cn(
              "h-10 pr-16 text-base tabular-nums placeholder:text-slate-400",
              error && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">
            {v.unidad}
          </span>
        </div>
        <div id={ayudaId} className="min-h-[1.25rem] text-xs">
          {error ? (
            <span className="text-red-600">{error}</span>
          ) : advertencia ? (
            <span className="flex items-start gap-1 text-amber-700">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
              Fuera del rango de la cohorte ({formatearNumero(v.rangoCohorte[0])}–
              {formatearNumero(v.rangoCohorte[1])} {v.unidad}): la estimación es menos confiable.
            </span>
          ) : (
            <span className="text-slate-500">
              {v.descripcion} Valores admitidos: {v.min}–{v.max} {v.unidad}.
            </span>
          )}
        </div>
      </div>

      {contexto && <div className="min-w-0">{contexto}</div>}
    </div>
  );
};

export default CampoClinico;
