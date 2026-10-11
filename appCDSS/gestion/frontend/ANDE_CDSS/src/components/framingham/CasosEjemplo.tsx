import { ArrowUpToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  VARIABLES,
  formatearNumero,
  formatearPorcentaje,
  type ResumenModelo,
} from "./variables";

interface CasosEjemploProps {
  modelo: ResumenModelo;
  onCargar: (valores: Record<string, number>) => void;
}

const Etiqueta = ({ texto, positivo }: { texto: string; positivo: boolean }) => (
  <span
    className={cn(
      "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
      positivo ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"
    )}
  >
    {texto}
  </span>
);

const CasosEjemplo = ({ modelo, onCargar }: CasosEjemploProps) => {
  const [encabezados, ...filas] = modelo.example_prediction;
  const positivo = modelo.bool_labels[0];
  const col = (nombre: string) => encabezados.indexOf(nombre);
  const iReal = col(modelo.target_column);
  const iPred = col("PREDICTION");
  const iConf = col("CONFIDENCE");

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Pacientes del conjunto de prueba (no usados en el entrenamiento) con su
        desenlace real y lo que estimó el modelo. Podés cargar cualquiera en el formulario.
      </p>
      <div className="relative overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              {VARIABLES.map((v) => (
                <th key={v.id} className="whitespace-nowrap px-3 py-2 font-medium">
                  {v.abreviatura ?? v.etiqueta}
                  <span className="block font-normal text-slate-400">{v.unidad}</span>
                </th>
              ))}
              <th className="px-3 py-2 font-medium">Desenlace real</th>
              <th className="px-3 py-2 font-medium">Predicción</th>
              <th className="whitespace-nowrap px-3 py-2 text-right font-medium">Prob. CHD</th>
              <th className="px-3 py-2">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.map((fila, i) => {
              const valores = Object.fromEntries(
                VARIABLES.map((v) => [v.id, Number(fila[col(v.id)])])
              );
              const prediccion = String(fila[iPred]);
              const confianza = Number(fila[iConf]);
              // CONFIDENCE es la probabilidad de la clase predicha; se muestra la de CHD.
              const probCHD = prediccion === positivo ? confianza : 1 - confianza;

              return (
                <tr key={i} className="hover:bg-slate-50">
                  {VARIABLES.map((v) => (
                    <td key={v.id} className="px-3 py-2 tabular-nums text-slate-900">
                      {formatearNumero(valores[v.id])}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <Etiqueta texto={String(fila[iReal])} positivo={fila[iReal] === positivo} />
                  </td>
                  <td className="px-3 py-2">
                    <Etiqueta texto={prediccion} positivo={prediccion === positivo} />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-900">
                    {formatearPorcentaje(probCHD)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-sky-700"
                      onClick={() => onCargar(valores)}
                    >
                      <ArrowUpToLine />
                      Cargar
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CasosEjemplo;
