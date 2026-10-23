import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, PackageOpen, Wrench, Binoculars, Info, Table2, ChartLine } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const PaginaInicio = () => {
  const navigate = useNavigate();
  const [showCDSSOptions, setShowCDSSOptions] = useState(true);
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [showModeladoDinamico, setShowModeladoDinamico] = useState(false);
  const { usuario } = useAuth();
  const esAdministrador = usuario?.rol === "ADMINISTRADOR";

  return (
    <div className="flex min-h-screen bg-page">
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 px-6 pt-12 pb-10">
          <h1 className="text-5xl font-extrabold mb-3 text-center">
            Te damos la bienvenida a MedIAssist
          </h1>
          <p className="text-lg text-foreground-secondary mb-10 text-center max-w-3xl mx-auto">
            Elegí un tipo de modelo para apoyar tu decisión clínica.
          </p>
          <div className="flex justify-center gap-12">
            <div className="flex flex-col items-center">
              <button
                type="button"
                className={`w-40 h-40 flex items-center justify-center rounded-2xl transition-all mb-2 shadow-lg ${
                  showCustomOptions
                    ? "bg-primary-300"
                    : "bg-primary-100 hover:bg-primary-200"
                }`}
                aria-label="Modelos propios"
                onClick={() => {
                  setShowCustomOptions((prev) => !prev);
                  setShowCDSSOptions(false);
                  setShowMiniPlayer(false);
                  setShowModeladoDinamico(false);
                }}
              >
                <Wrench size={64} />
              </button>
              <span className="text-base font-semibold text-foreground-secondary mt-2">
                Modelos personalizados
              </span>
            </div>
            <div className="flex flex-col items-center">
              <button
                type="button"
                className={`w-40 h-40 flex items-center justify-center rounded-2xl transition-all mb-2 shadow-lg ${
                  showCDSSOptions
                    ? "bg-primary-300"
                    : "bg-primary-100 hover:bg-primary-200"
                }`}
                aria-label="Modelos abiertos"
                onClick={() => {
                  setShowCDSSOptions((prev) => !prev);
                  setShowCustomOptions(false);
                  setShowMiniPlayer(false);
                  setShowModeladoDinamico(false);
                }}
              >
                <PackageOpen size={64} />
              </button>
              <span className="text-base font-semibold text-foreground-secondary mt-2">
                Modelos abiertos
              </span>
            </div>
            {esAdministrador ? (
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  className={`w-40 h-40 flex items-center justify-center rounded-2xl transition-all mb-2 shadow-lg ${
                    showModeladoDinamico
                      ? "bg-danger text-danger-foreground"
                      : "bg-danger-muted text-danger-text hover:bg-danger-border"
                  }`}
                  aria-label="Modelado dinámico"
                  onClick={() => {
                    setShowModeladoDinamico((prev) => !prev);
                    setShowCDSSOptions(false);
                    setShowCustomOptions(false);
                    setShowMiniPlayer(false);
                  }}
                >
                  <BrainCircuit size={64} />
                </button>
                <span className="text-base font-semibold text-danger-text mt-2">
                  Modelado dinámico
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  className="w-40 h-40 flex items-center justify-center rounded-2xl bg-primary-100 hover:bg-primary-200 transition-all mb-2 shadow-lg"
                  aria-label="Cómo usar"
                  onClick={() => {
                    setShowCDSSOptions(false);
                    setShowCustomOptions(false);
                    setShowMiniPlayer(true);
                  }}
                >
                  <Binoculars size={64} />
                </button>
                <span className="text-base font-semibold text-foreground-secondary mt-2">
                  Cómo usar
                </span>
              </div>
            )}
          </div>
          {showCDSSOptions && (
            <Card className="mt-8 shadow-lg flex justify-center items-center max-w-6xl w-full mx-auto">
              <CardContent className="w-full flex flex-col items-center justify-center">
                <div className="flex flex-row justify-center items-center gap-12 mt-8">
                  <div className="flex-1 flex items-center justify-end pr-8">
                    <span className="text-2xl font-semibold text-foreground max-w-xs text-left">
                      Modelos entrenados con conjuntos de datos médicos
                      abiertos (open source), listos para usar.
                    </span>
                  </div>
                  <div className="flex flex-row gap-8">
                    <div className="flex flex-col items-center">
                      <button
                        className="w-80 h-56 cursor-pointer border-2 border-border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-card p-0 hover:scale-105 hover:z-10 relative"
                        onClick={() => navigate("/cardiology")}
                        style={{ padding: 0 }}
                      >
                        <img
                          src="/CardioCard.jpg"
                          alt="Cardiología"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute inset-0 flex items-end justify-center pb-4">
                          <span className="bg-black bg-opacity-85 px-6 py-2 rounded text-white text-2xl font-bold drop-shadow-lg">
                            Cardiología
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {showModeladoDinamico && (
            <Card className="mt-8 shadow-lg flex justify-center items-center max-w-6xl w-full mx-auto">
              <CardContent className="w-full flex flex-col items-center justify-center">
                <div className="flex flex-row justify-center items-center gap-12 mt-8">
                  <div className="flex-1 flex items-center justify-end pr-8">
                    <span className="text-2xl font-semibold text-foreground max-w-xs text-left">
                      Flujo de entrenamiento de modelos de aprendizaje
                      automático para el conjunto de datos cargado.
                    </span>
                  </div>
                  <div className="flex flex-row gap-8">
                    {[
                      {
                        titulo: "Modelado instancial",
                        descripcion: "Cada fila es una observación independiente.",
                        Icono: Table2,
                      },
                      {
                        titulo: "Modelado temporal",
                        descripcion: "Mediciones repetidas de cada paciente en el tiempo.",
                        Icono: ChartLine,
                      },
                    ].map(({ titulo, descripcion, Icono }) => (
                      <button
                        key={titulo}
                        type="button"
                        className="w-64 h-56 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-danger-border bg-danger-muted px-6 text-center transition-all hover:scale-105 hover:shadow-lg"
                      >
                        <Icono className="h-12 w-12 text-danger-text" />
                        <span className="text-xl font-bold text-danger-text">
                          {titulo}
                        </span>
                        <span className="text-sm text-foreground-secondary">
                          {descripcion}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {showCustomOptions && (
            <Card className="mt-8 shadow-lg flex justify-center items-center max-w-6xl w-full mx-auto">
              <CardContent className="w-full flex flex-col items-center justify-center gap-4 py-16 text-center">
                <span className="text-2xl font-semibold text-foreground max-w-2xl">
                  Modelos desarrollados a pedido de tu institución, entrenados
                  con sus propios datos clínicos.
                </span>
                <span className="text-muted-foreground">
                  Todavía no hay modelos personalizados disponibles.
                </span>
              </CardContent>
            </Card>
          )}
        </main>
        <footer className="border-t border-border px-6 py-4">
          <p className="flex items-start justify-center gap-2 text-sm text-muted-foreground text-center">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Herramienta de apoyo a la decisión clínica en fase de
            investigación. No reemplaza el juicio clínico ni constituye una
            indicación diagnóstica o terapéutica.
          </p>
        </footer>
        {showMiniPlayer && (
          <div
            className="fixed bottom-6 right-6 z-50"
            style={{ width: "600px", height: "340px" }}
          >
            <div className="w-full h-full bg-card rounded-lg shadow-lg border border-border flex flex-col">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/KQv7X_dT1gw?autoplay=1"
                title="Video tutorial"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="rounded-lg"
              ></iframe>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaginaInicio;
