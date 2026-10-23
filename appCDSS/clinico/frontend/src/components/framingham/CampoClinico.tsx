import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatearNumero, type VariableClinica } from "./variables";

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
  const [enfocado, setEnfocado] = useState(false);

  return (
    <div
      className={cn(
        "grid gap-x-6 gap-y-2",
        contexto && "md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]"
      )}
    >
      {/* Con gráfico al lado, el pt alinea el centro del input con la línea central del violín
          (2px + etiqueta 20px + 6px + mitad del input 20px = 48px = margen 20px + mitad del gráfico 28px). */}
      <div className={cn("space-y-1.5", contexto && "md:pt-0.5")}>
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          {v.etiqueta}
          {v.abreviatura && (
            <span className="ml-1 font-normal text-muted-foreground">({v.abreviatura})</span>
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
            onFocus={() => setEnfocado(true)}
            onBlur={() => {
              setEnfocado(false);
              onBlur?.();
            }}
            aria-invalid={!!error}
            aria-describedby={ayudaId}
            className={cn(
              "h-10 pr-16 text-base tabular-nums placeholder:text-muted-foreground",
              error && "border-danger focus-visible:ring-danger"
            )}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            {v.unidad}
          </span>
        </div>
        {/* La ayuda solo se muestra mientras se edita el campo; los errores, siempre. */}
        <div id={ayudaId} className="text-sm">
          {error ? (
            <span className="text-danger-text">{error}</span>
          ) : (
            <span className={cn("text-muted-foreground", !enfocado && "sr-only")}>
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
