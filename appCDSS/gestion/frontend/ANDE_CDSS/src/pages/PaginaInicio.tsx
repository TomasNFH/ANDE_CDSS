import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, Sparkles, Binoculars } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";

const PaginaInicio = () => {
  const navigate = useNavigate();
  const [showCDSSOptions, setShowCDSSOptions] = useState(true);
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex-1">
        <DashboardHeader />
        <main className="p-6">
          <h1 className="text-5xl font-extrabold mb-6 text-center">
            Te damos la bienvenida a DynamicDSS
          </h1>
          <p className="text-gray-700 mb-12 text-center">
            Este trabajo presenta el desarrollo de un sistema dinámico de
            apoyo a la decisión clínica (CDSS) que incorpora la selección
            dinámica de modelos de aprendizaje automático adaptados a datos
            médicos, con una aplicación específica a datos de diálisis en
            nefrología.
          </p>
          <div className="flex justify-center gap-16 mt-16">
            <div className="flex flex-col items-center">
              <button
                type="button"
                className={`w-40 h-40 flex items-center justify-center rounded-2xl transition-all mb-2 shadow-lg ${
                  showCustomOptions
                    ? "bg-blue-300"
                    : "bg-blue-100 hover:bg-blue-200"
                }`}
                aria-label="Modelos propios"
                onClick={() => {
                  setShowCustomOptions((prev) => !prev);
                  setShowCDSSOptions(false);
                  setShowMiniPlayer(false);
                }}
              >
                <BrainCircuit size={64} />
              </button>
              <span className="text-base font-semibold text-gray-700 mt-2">
                Modelos propios
              </span>
            </div>
            <div className="flex flex-col items-center">
              <button
                type="button"
                className={`w-40 h-40 flex items-center justify-center rounded-2xl transition-all mb-2 shadow-lg ${
                  showCDSSOptions
                    ? "bg-blue-300"
                    : "bg-blue-100 hover:bg-blue-200"
                }`}
                aria-label="Modelos abiertos"
                onClick={() => {
                  setShowCDSSOptions((prev) => !prev);
                  setShowCustomOptions(false);
                  setShowMiniPlayer(false);
                }}
              >
                <Sparkles size={64} />
              </button>
              <span className="text-base font-semibold text-gray-700 mt-2">
                Modelos abiertos
              </span>
            </div>
            <div className="flex flex-col items-center">
              <button
                type="button"
                className="w-40 h-40 flex items-center justify-center rounded-2xl bg-blue-100 hover:bg-blue-200 transition-all mb-2 shadow-lg"
                aria-label="Cómo usar"
                onClick={() => {
                  setShowCDSSOptions(false);
                  setShowCustomOptions(false);
                  setShowMiniPlayer(true);
                }}
              >
                <Binoculars size={64} />
              </button>
              <span className="text-base font-semibold text-gray-700 mt-2">
                Cómo usar
              </span>
            </div>
          </div>
          {showCDSSOptions && (
            <Card className="mt-10 shadow-lg flex justify-center items-center max-w-6xl w-full mx-auto">
              <CardContent className="w-full flex flex-col items-center justify-center">
                <div className="flex flex-row justify-center items-center gap-12 mt-8">
                  <div className="flex-1 flex items-center justify-end pr-8">
                    <span className="text-2xl font-semibold text-gray-800 max-w-xs text-left">
                      Usá modelos entrenados con datasets abiertos.
                    </span>
                  </div>
                  <div className="flex flex-row gap-8">
                    <div className="flex flex-col items-center">
                      <button
                        className="w-80 h-56 cursor-pointer border-2 border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white p-0 hover:scale-105 hover:z-10 relative"
                        onClick={() => navigate("/cardiology")}
                        style={{ padding: 0 }}
                      >
                        <img
                          src="/CardioCard4.jpg"
                          alt="Cardiología"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute inset-0 flex items-end justify-center pb-4">
                          <span className="bg-black bg-opacity-85 px-6 py-2 rounded text-white text-3xl font-bold drop-shadow-lg">
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
          {showCustomOptions && (
            <Card className="mt-10 shadow-lg flex justify-center items-center max-w-6xl w-full mx-auto">
              <CardContent className="w-full flex items-center justify-center py-16">
                <span className="text-2xl font-semibold text-gray-500">
                  No hay modelos disponibles.
                </span>
              </CardContent>
            </Card>
          )}
        </main>
        {showMiniPlayer && (
          <div
            className="fixed bottom-6 right-6 z-50"
            style={{ width: "600px", height: "340px" }}
          >
            <div className="w-full h-full bg-white rounded-lg shadow-lg border border-gray-300 flex flex-col">
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
