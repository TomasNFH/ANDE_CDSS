import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurvaROC, ImportanciaVariables, MatrizConfusion } from "./GraficosModelo";
import {
  VARIABLES,
  formatearDecimales,
  formatearPorcentaje,
  nombreAlgoritmo,
  type MetricasClinicas,
  type ResumenModelo,
} from "./variables";

const Dato = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <div>
    <dt className="text-sm text-muted-foreground">{titulo}</dt>
    <dd className="text-sm text-foreground">{children}</dd>
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
  const umbral = modelo.umbral ?? 0.5;
  const cal = modelo.calibracion;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-foreground-secondary">
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
          <Dato titulo="Umbral de clasificación">{formatearPorcentaje(umbral)}</Dato>
          {cal && (
            <Dato titulo="Brier score">
              {formatearDecimales(cal.brier, 3)}{" "}
              <span className="text-muted-foreground">
                (sin modelo: {formatearDecimales(cal.brier_referencia, 3)})
              </span>
            </Dato>
          )}
        </dl>

        <p className="text-sm leading-relaxed text-foreground-secondary">
          {cal && (
            <>
              La probabilidad mostrada es un riesgo absoluto: en el conjunto de prueba el
              riesgo predicho promedio fue {formatearPorcentaje(cal.media_predicha)} y la
              prevalencia observada, {formatearPorcentaje(cal.prevalencia_observada)}.{" "}
            </>
          )}
          El modelo clasifica como positivo a partir de {formatearPorcentaje(umbral)}, la
          prevalencia de CHD en la cohorte de entrenamiento. Un resultado negativo es
          confiable (VPN {formatearPorcentaje(metricas.vpn)}); uno positivo indica riesgo
          mayor al promedio y debe confirmarse (VPP {formatearPorcentaje(metricas.vpp)}).
        </p>
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
