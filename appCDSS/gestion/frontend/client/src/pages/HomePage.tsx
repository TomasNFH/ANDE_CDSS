import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "@/contexts/SidebarContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { BrainCircuit, Sparkles, Binoculars, CreditCard } from "lucide-react";

const HomePage = () => {
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const navigate = useNavigate();
  const [showCDSSOptions, setShowCDSSOptions] = useState(true);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [bounceAcquisition, setBounceAcquisition] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const { collapsed } = useSidebar();

  const plans = [
    {
      id: "starter",
      name: "Model Training",
      price: 59,
      features: ["Start modeling your dataset for obtaining the best model"],
    },
    {
      id: "pro",
      name: "Clinical Decision Support",
      price: 89,
      features: [
        "Use a CDSS with default models (or import your owns) used for neprhology and oncology",
      ],
    },
    {
      id: "enterprise",
      name: "How to",
      price: 99,
      features: [
        "Watch a Youtube tutorial video on how to use the system and all its features",
      ],
    },
  ];

  const getCardIcon = (type: string) => {
    const baseClasses =
      "h-8 w-12 rounded flex items-center justify-center text-white text-xs font-bold";
    switch (type) {
      case "visa":
        return <div className={`${baseClasses} bg-blue-600`}>VISA</div>;
      case "mastercard":
        return <div className={`${baseClasses} bg-red-600`}>MC</div>;
      case "amex":
        return <div className={`${baseClasses} bg-green-600`}>AMEX</div>;
      default:
        return <CreditCard className="h-8 w-8 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  React.useEffect(() => {
    const handler = () => setBounceAcquisition(false);
    window.addEventListener("resetBounceAcquisition", handler);
    return () => window.removeEventListener("resetBounceAcquisition", handler);
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 1800); // 1.8s intro
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="flex min-h-screen bg-gray-100"
      data-id="lp5fndtgr"
      data-path="src/pages/HomePage.tsx"
    >
      {showIntro ? (
        <div
          className="fixed inset-0 flex items-center justify-center bg-gray-100 z-50 transition-all duration-700"
          style={{ animation: "fadeIn 0.7s, fadeOut 0.7s 1.1s forwards" }}
        >
          <h1 className="text-6xl font-extrabold text-blue-700 drop-shadow-lg animate-fadeIn">
            Welcome to DynamicDSS
          </h1>
          <style>
            {`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95);}
              to { opacity: 1; transform: scale(1);}
            }
            @keyframes fadeOut {
              from { opacity: 1; }
              to { opacity: 0; pointer-events: none;}
            }
          `}
          </style>
        </div>
      ) : (
        <>
          <Sidebar
            data-id="yll2vylo2"
            data-path="src/pages/HomePage.tsx"
            bounceAcquisition={bounceAcquisition}
          />
          <div
            className={`flex-1 transition-all duration-300 ${
              collapsed ? "ml-20" : "ml-64"
            }`}
            data-id="be7igm5ru"
            data-path="src/pages/HomePage.tsx"
          >
            <DashboardHeader
              data-id="f90a24qvh"
              data-path="src/pages/HomePage.tsx"
            />
            <main
              className="p-6"
              data-id="k3e3cbeoz"
              data-path="src/pages/HomePage.tsx"
            >
              <h1 className="text-5xl font-extrabold mb-6 text-center">
                Welcome to DynamicDSS
              </h1>
              <p className="text-gray-700 mb-12 text-center">
                This work presents the development of a dynamic clinical
                decision support system (CDSS) that incorporates dynamic
                selection of machine learning models tailored to medical data,
                with a specific application to dialysis data in nephrology.
              </p>
              <div className="flex justify-center gap-16 mt-16 relative">
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{ top: "-1.1rem", width: "8rem" }}
                >
                  <div className="flex justify-center">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-lg shadow">
                      Start Predicting
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    className="w-40 h-40 flex items-center justify-center rounded-2xl bg-blue-100 hover:bg-blue-200 transition-all mb-2 shadow-lg"
                    aria-label="Model Training"
                    onClick={() => {
                      setShowCDSSOptions(false);
                      setShowMiniPlayer(false);
                      navigate("/acquisition");
                    }}
                    onMouseEnter={() => {
                      setBounceAcquisition(true);
                    }}
                  >
                    <BrainCircuit size={64} />
                  </button>
                  <span className="text-base font-semibold text-gray-700 mt-2">
                    Model Training
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
                    aria-label="Clinical Decision Support"
                    onClick={() => {
                      setShowCDSSOptions((prev) => !prev);
                      setShowMiniPlayer(false);
                    }}
                  >
                    <Sparkles size={64} />
                  </button>
                  <span className="text-base font-semibold text-gray-700 mt-2">
                    Clinical Decision Support
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    className="w-40 h-40 flex items-center justify-center rounded-2xl bg-blue-100 hover:bg-blue-200 transition-all mb-2 shadow-lg"
                    aria-label="How to"
                    onClick={() => {
                      setShowCDSSOptions(false);
                      setShowMiniPlayer(true);
                    }}
                  >
                    <Binoculars size={64} />
                  </button>
                  <span className="text-base font-semibold text-gray-700 mt-2">
                    How to
                  </span>
                </div>
              </div>
              {showCDSSOptions && (
                <Card
                  className={`mt-10 shadow-lg flex justify-center  items-center max-w-6xl w-full mx-auto${
                    bounceAcquisition ? " bounce" : ""
                  }`}
                >
                  <CardContent className="w-full flex flex-col items-center justify-center">
                    <div className="flex flex-row justify-center items-center gap-12 mt-8">
                      <div className="flex-1 flex items-center justify-end pr-8">
                        <span className="text-2xl font-semibold text-gray-800 max-w-xs text-left">
                          Clinica Decision Support System with best custom
                          trained models (or upload your own)
                        </span>
                      </div>
                      <div className="flex flex-row gap-8">
                        <div className="flex flex-col items-center">
                          <button
                            className="w-80 h-56 cursor-pointer border-2 border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white p-0 hover:scale-105 hover:z-10 relative"
                            onClick={() => window.open("/cdssnep", "_blank")}
                            style={{ padding: 0 }}
                          >
                            <img
                              src="/nephrology2.jpg"
                              alt="Nephrology"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-black bg-opacity-85 px-6 py-2 rounded text-white text-3xl font-bold drop-shadow-lg">
                                Nephrology
                              </span>
                            </span>
                          </button>
                        </div>
                        <div className="flex flex-col items-center">
                          <button
                            className="w-80 h-56 cursor-pointer border-2 border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white p-0 hover:scale-105 hover:z-10 relative"
                            onClick={() =>
                              window.open("/cdssoncology", "_blank")
                            }
                            style={{ padding: 0 }}
                          >
                            <img
                              src="/oncology2.jpg"
                              alt="Oncology"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-black bg-opacity-85 px-6 py-2 rounded text-white text-3xl font-bold drop-shadow-lg">
                                Oncology
                              </span>
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
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
                    title="How To Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="rounded-lg"
                  ></iframe>
                </div>
              </div>
            )}
            {bounceAcquisition && null}
          </div>
        </>
      )}
    </div>
  );
};

export default HomePage;
