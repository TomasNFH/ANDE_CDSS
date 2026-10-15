import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  ClipboardList,
  Info,
  Stethoscope,
  Table2,
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CampoClinico from "@/components/framingham/CampoClinico";
import DistribucionVariable, {
  LeyendaDesenlace,
} from "@/components/framingham/DistribucionVariable";
import CasosEjemplo from "@/components/framingham/CasosEjemplo";
import InformacionModelo from "@/components/framingham/InformacionModelo";
import PanelResultado from "@/components/framingham/PanelResultado";
import SeccionDesplegable from "@/components/framingham/SeccionDesplegable";
import {
  VARIABLES,
  calcularMetricas,
  formatearDecimales,
  formatearPorcentaje,
  nombreAlgoritmo,
  validarValor,
  type Prediccion,
  type ResumenModelo,
} from "@/components/framingham/variables";

// Modelo abierto que muestra esta página (ver OPEN_MODELS en el backend).
const MODEL_ID = "framingham";

const VALORES_VACIOS = Object.fromEntries(VARIABLES.map((v) => [v.id, ""]));

// Mensaje de error de la API: FastAPI devuelve { detail } (texto o lista de errores de validación).
const errorDeRespuesta = async (response: Response) => {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) return "Revisá los valores ingresados: tienen que ser numéricos.";
  } catch {
    // respuesta sin JSON
  }
  return `Error del servidor (${response.status}).`;
};

const FraminhamPage = () => {
  const navigate = useNavigate();

  const [modelo, setModelo] = useState<ResumenModelo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  const [valores, setValores] = useState<Record<string, string>>(VALORES_VACIOS);
  const [tocados, setTocados] = useState<Record<string, boolean>>({});
  const [intentoCalcular, setIntentoCalcular] = useState(false);

  const [resultado, setResultado] = useState<Prediccion | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [errorPrediccion, setErrorPrediccion] = useState("");
  const [historial, setHistorial] = useState<Prediccion[]>([]);

  // Se incrementa con «Reintentar» para volver a pedir el modelo.
  const [intentoCarga, setIntentoCarga] = useState(0);

  useEffect(() => {
    let vigente = true;
    fetch(`/api/models/${MODEL_ID}`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await errorDeRespuesta(response));
        return response.json();
      })
      .then((data: ResumenModelo) => {
        if (vigente) setModelo(data);
      })
      .catch((err) => {
        if (vigente)
          setErrorCarga(err instanceof Error ? err.message : "No se pudo cargar el modelo.");
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [intentoCarga]);

  const reintentarCarga = () => {
    setCargando(true);
    setErrorCarga("");
    setIntentoCarga((n) => n + 1);
  };

  const metricas = useMemo(
    () => (modelo?.CM?.[0]?.length === 4 ? calcularMetricas(modelo.CM[0]) : null),
    [modelo]
  );

  const errores = Object.fromEntries(
    VARIABLES.map((v) => [v.id, validarValor(v, valores[v.id])])
  );
  const formularioValido = VARIABLES.every((v) => errores[v.id] === null);

  // El resultado mostrado ya no corresponde a lo que hay en el formulario.
  const desactualizado =
    resultado !== null &&
    VARIABLES.some((v) => Number(valores[v.id]) !== resultado.valores[v.id]);

  const cargarValores = (nuevos: Record<string, number>) => {
    setValores(Object.fromEntries(VARIABLES.map((v) => [v.id, String(nuevos[v.id])])));
    setTocados({});
    setIntentoCalcular(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const limpiar = () => {
    setValores(VALORES_VACIOS);
    setTocados({});
    setIntentoCalcular(false);
    setResultado(null);
    setErrorPrediccion("");
  };

  const calcular = async (e: FormEvent) => {
    e.preventDefault();
    setIntentoCalcular(true);
    if (!formularioValido || !modelo) {
      const primero = VARIABLES.find((v) => errores[v.id] !== null);
      if (primero) document.getElementById(`campo-${primero.id}`)?.focus();
      return;
    }

    const numeros = Object.fromEntries(VARIABLES.map((v) => [v.id, Number(valores[v.id])]));
    setCalculando(true);
    setErrorPrediccion("");
    try {
      const response = await fetch(`/api/models/${MODEL_ID}/predict`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: numeros }),
      });
      if (!response.ok) throw new Error(await errorDeRespuesta(response));

      const data = await response.json();
      const positivo = modelo.bool_labels[0];
      const prediccion: Prediccion = {
        id: Date.now(),
        fecha: new Date(),
        valores: numeros,
        etiqueta: data.prediction,
        probabilidad: data.probabilities[positivo],
        positivo: data.prediction === positivo,
      };
      setResultado(prediccion);
      setHistorial((prev) => [prediccion, ...prev]);
    } catch (err) {
      setErrorPrediccion(
        err instanceof Error ? err.message : "No se pudo calcular el riesgo."
      );
    } finally {
      setCalculando(false);
    }
  };

  return (
    <div className="min-h-screen bg-page">
      <DashboardHeader />

      <main className="mx-auto max-w-6xl space-y-6 px-4 pb-16 sm:px-6">
        <header className="space-y-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Riesgo de enfermedad coronaria a 10 años
            </h1>
            <p className="text-sm font-medium text-foreground">
              Framingham Heart Study
              {modelo && <> · {nombreAlgoritmo(modelo.model_name)}</>}
              {modelo?.auc ? <> · AUC {formatearDecimales(modelo.auc, 2)}</> : null}
            </p>
          </div>
        </header>

        {cargando ? (
          <Card className="border-border">
            <CardContent className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
              Cargando el modelo…
            </CardContent>
          </Card>
        ) : errorCarga || !modelo ? (
          <Card className="border-danger-border">
            <CardContent className="flex flex-wrap items-center gap-3 py-6 text-sm text-danger-text">
              <AlertCircle className="h-5 w-5" />
              <span className="flex-1">No se pudo cargar el modelo: {errorCarga}</span>
              <Button variant="outline" size="sm" onClick={reintentarCarga}>
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-foreground">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    Datos del paciente
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Cada variable se muestra sobre su distribución en la cohorte de referencia,
                    separada según desenlace.
                  </p>
                  {modelo.distribuciones?.[VARIABLES[0].id]?.por_desenlace?.length === 2 && (
                    // Misma grilla que CampoClinico, para que la leyenda quede centrada sobre los gráficos.
                    <div className="grid gap-x-6 pt-2 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
                      <div className="hidden md:block" />
                      <LeyendaDesenlace
                        grupos={modelo.distribuciones[VARIABLES[0].id].por_desenlace}
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <form onSubmit={calcular} noValidate className="space-y-6">
                    <div className="divide-y divide-border">
                      {VARIABLES.map((v) => (
                        <div key={v.id} className="py-3 first:pt-0">
                          <CampoClinico
                            variable={v}
                            valor={valores[v.id]}
                            onChange={(valor) =>
                              setValores((prev) => ({ ...prev, [v.id]: valor }))
                            }
                            onBlur={() => setTocados((prev) => ({ ...prev, [v.id]: true }))}
                            error={
                              (tocados[v.id] && valores[v.id] !== "") || intentoCalcular
                                ? errores[v.id]
                                : null
                            }
                            contexto={
                              modelo.distribuciones?.[v.id] && (
                                <DistribucionVariable
                                  variable={v}
                                  distribucion={modelo.distribuciones[v.id]}
                                  valor={errores[v.id] === null ? Number(valores[v.id]) : null}
                                />
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
                      <Button
                        type="submit"
                        disabled={calculando}
                        className="h-10 bg-primary px-5 text-primary-foreground hover:bg-primary-800"
                      >
                        <Calculator />
                        {calculando ? "Calculando…" : "Calcular riesgo"}
                      </Button>
                      <Button type="button" variant="outline" className="h-10" onClick={limpiar}>
                        Limpiar
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        className="h-10 px-0 text-foreground-secondary"
                        onClick={() =>
                          cargarValores(Object.fromEntries(VARIABLES.map((v) => [v.id, v.ejemplo])))
                        }
                      >
                        Completar con valores de ejemplo
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-2 lg:sticky lg:top-6">
                {desactualizado && !calculando && (
                  <p className="rounded-md bg-warning-muted px-3 py-2 text-sm text-warning-text">
                    Los datos cambiaron desde el último cálculo. Presioná «Calcular riesgo»
                    para actualizar el resultado.
                  </p>
                )}
                <PanelResultado
                  resultado={resultado}
                  calculando={calculando}
                  error={errorPrediccion}
                  historial={historial}
                  onRecuperar={(p) => cargarValores(p.valores)}
                />
              </div>
            </div>

            <SeccionDesplegable
              titulo="Información del modelo"
              icono={<ClipboardList className="h-5 w-5" />}
              resumen={
                metricas
                  ? `${nombreAlgoritmo(modelo.model_name)} · AUC ${formatearDecimales(modelo.auc, 2)} · Sensibilidad ${formatearPorcentaje(
                      metricas.sensibilidad
                    )} · Especificidad ${formatearPorcentaje(metricas.especificidad)}`
                  : nombreAlgoritmo(modelo.model_name)
              }
            >
              {metricas && <InformacionModelo modelo={modelo} metricas={metricas} />}
            </SeccionDesplegable>

            <SeccionDesplegable
              titulo="Casos de ejemplo"
              icono={<Table2 className="h-5 w-5" />}
              resumen={`${modelo.example_prediction.length - 1} pacientes del conjunto de prueba con su desenlace real`}
            >
              <CasosEjemplo modelo={modelo} onCargar={cargarValores} />
            </SeccionDesplegable>
          </>
        )}

        <footer className="border-t border-border pt-4">
          <p className="mx-auto flex max-w-2xl items-start justify-center gap-2 text-center text-sm text-muted-foreground">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" />
            Herramienta de apoyo a la decisión clínica en fase de investigación. No
            reemplaza el juicio clínico ni constituye una indicación diagnóstica o terapéutica.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default FraminhamPage;
