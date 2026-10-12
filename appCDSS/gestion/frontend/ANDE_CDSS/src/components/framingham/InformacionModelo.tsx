import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurvaROC, ImportanciaVariables, MatrizConfusion } from "./GraficosModelo";
import {
  VARIABLES,
  formatearPorcentaje,
  nombreAlgoritmo,
  type MetricasClinicas,
  type ResumenModelo,
} from "./variables";

const Dato = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <div>
    <dt className="text-sm text-slate-500">{titulo}</dt>
    <dd className="text-sm text-slate-900">{children}</dd>
  </div>
);

interface InformacionModeloProps {
  modelo: ResumenModelo;
  metricas: MetricasClinicas;
}

const InformacionModelo = ({ modelo, metricas }: InformacionModeloProps) => {
  const [positivo, negativo] = modelo.bool_labels;
  const importancias = modelo.feat.length === 2 ? modelo.feat[1] : null;
  const roc = modelo.roc_curves[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-slate-700">
          Estima la probabilidad de desarrollar enfermedad coronaria (CHD) en los
          próximos 10 años a partir de cinco variables clínicas. Se entrenó con
          datos del Framingham Heart Study, una cohorte poblacional de adultos de
          Framingham, Massachusetts (EE. UU.).
        </p>

        <dl className="grid grid-cols-2 gap-4">
          <Dato titulo="Algoritmo">{nombreAlgoritmo(modelo.model_name)}</Dato>
          <Dato titulo="Desenlace">CHD a 10 años</Dato>
          <Dato titulo="Variables">{VARIABLES.map((v) => v.abreviatura ?? v.etiqueta).join(", ")}</Dato>
          <Dato titulo="Conjunto de prueba">{metricas.total} pacientes</Dato>
        </dl>

        <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="leading-relaxed">
            La probabilidad mostrada no es un riesgo absoluto: el modelo se entrenó con
            clases balanceadas y tiende a sobreestimarlo frente a la prevalencia real
            ({formatearPorcentaje(metricas.prevalencia)} en el conjunto de prueba). Con el
            umbral de 50%, un resultado negativo es confiable (VPN{" "}
            {formatearPorcentaje(metricas.vpn)}), pero un resultado positivo debe confirmarse
            (VPP {formatearPorcentaje(metricas.vpp)}).
          </p>
        </div>
      </div>

      <Tabs defaultValue="matriz" className="min-w-0">
        <TabsList className="mb-3">
          <TabsTrigger value="matriz">Desempeño</TabsTrigger>
          {roc && <TabsTrigger value="roc">Curva ROC</TabsTrigger>}
          {importancias && <TabsTrigger value="importancia">Variables</TabsTrigger>}
        </TabsList>
        <TabsContent value="matriz">
          <MatrizConfusion metricas={metricas} positivo={positivo} negativo={negativo} />
        </TabsContent>
        {roc && (
          <TabsContent value="roc">
            <CurvaROC puntos={roc} auc={modelo.auc} />
          </TabsContent>
        )}
        {importancias && (
          <TabsContent value="importancia">
            <ImportanciaVariables nombres={modelo.feat[0]} valores={importancias} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default InformacionModelo;
