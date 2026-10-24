import React, { useState, useEffect } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  BarChart3,
  Grid3X3,
  LineChart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FeatureImportanceChart from "@/components/charts/FeatureImportanceChart";
import ConfusionMatrix from "@/components/charts/ConfusionMatrix";
import ROCCurve from "@/components/charts/ROCCurve";

const CDSSnep = () => {
  const [modelName, setModelName] = useState<string>("");
  const [features, setFeatures] = useState<string[]>([]);
  const [featureValues, setFeatureValues] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [prediction, setPrediction] = useState<string>("");
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [isModelInfoOpen, setIsModelInfoOpen] = useState(false);
  const [isDockHovered, setIsDockHovered] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // New state variables for model data
  const [modelData, setModelData] = useState<{
    feat: string[][];
    CM: number[][];
    roc_curves: number[][][];
  } | null>(null);

  // Two identical slides
  const slides = [1, 2];

  useEffect(() => {
    const fetchDefaultModel = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/Hemodialisis", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setModelName(data.model_name);
        if (data.features) {
          setFeatures(data.features);
          // Initialize feature values with empty strings
          const initialValues: Record<string, string> = {};
          data.features.forEach((feature: string) => {
            initialValues[feature] = "";
          });
          setFeatureValues(initialValues);
        }

        if (data.example_prediction) {
          setExamplePrediction(data.example_prediction);
        } else {
          console.log("No example prediction data received from backend");
          setExamplePrediction(null);
        }

        // Store model data for charts
        setModelData({
          feat: data.feat || [],
          CM: data.CM || [],
          roc_curves: data.roc_curves || [],
        });
      } catch (err) {
        console.error("Error fetching default model:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch default model"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDefaultModel();
  }, []);

  const handleFeatureChange = (feature: string, value: string) => {
    setFeatureValues((prev) => ({
      ...prev,
      [feature]: value,
    }));
  };

  const [examplePrediction, setExamplePrediction] = useState<string[][] | null>(
    null
  );

  const handlePredict = async () => {
    setPredictionLoading(true);
    setPrediction("");

    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          features: featureValues,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPrediction(data.prediction);
    } catch (err) {
      console.error("Error making prediction:", err);
      setError(
        err instanceof Error ? err.message : "Failed to make prediction"
      );
    } finally {
      setPredictionLoading(false);
    }
  };

  const isFormValid = () => {
    return features.every(
      (feature) =>
        featureValues[feature] && featureValues[feature].trim() !== ""
    );
  };

  // Helper functions for chart data
  const getFeatureChartData = () => {
    if (
      !modelData?.feat ||
      !Array.isArray(modelData.feat) ||
      modelData.feat.length < 2
    )
      return [];

    const featureNames = modelData.feat[0];
    const featureValues = modelData.feat[1];

    if (!Array.isArray(featureNames) || !Array.isArray(featureValues))
      return [];

    return featureNames.map((name, index) => ({
      name: name,
      value:
        typeof featureValues[index] === "string"
          ? parseFloat(featureValues[index])
          : Number(featureValues[index]) || 0,
    }));
  };

  const getConfusionMatrixData = () => {
    if (!modelData?.CM || !modelData.CM[0]) return [0, 0, 0, 0];
    return modelData.CM[0];
  };

  const getROCCurveData = () => {
    if (
      !modelData?.roc_curves ||
      !Array.isArray(modelData.roc_curves) ||
      !modelData.roc_curves[0]
    ) {
      return [];
    }
    return modelData.roc_curves[0].map(([fpr, tpr]) => ({
      fpr,
      tpr,
    }));
  };

  const calculateAUC = () => {
    const rocData = getROCCurveData();
    if (rocData.length < 2) return 0;

    let auc = 0;
    for (let i = 1; i < rocData.length; i++) {
      const prevPoint = rocData[i - 1];
      const currPoint = rocData[i];

      // Trapezoidal rule for AUC calculation
      const width = currPoint.fpr - prevPoint.fpr;
      const height = (currPoint.tpr + prevPoint.tpr) / 2;
      auc += width * height;
    }

    return auc;
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Background overlay */}
      {isDockHovered && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 transition-all duration-300"></div>
      )}
      <DashboardHeader />
      <main className="p-6 pb-40">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Clinical Decision Support System - Nephrology
          </h1>
          <p className="text-gray-600 mt-2">
            Access the default trained model for nephrology clinical decision
            support.
          </p>
        </div>

        <div className="grid gap-6">
          <Collapsible open={isModelInfoOpen} onOpenChange={setIsModelInfoOpen}>
            <Card>
              <CardHeader>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between w-full cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors">
                    <CardTitle className="flex items-center gap-2">
                      <span>Model Information & Description</span>
                      <Badge variant="secondary">Nephrology</Badge>
                    </CardTitle>
                    {isModelInfoOpen ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </CollapsibleTrigger>
                {loading && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">
                      Loading model information...
                    </span>
                  </div>
                )}
                {!loading && !error && !isModelInfoOpen && (
                  <div className="py-2 relative overflow-visible">
                    <div className="flex items-center gap-3">
                      {/* <span className="font-semibold text-gray-700">Model Name:</span> */}
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {modelName}
                      </Badge>
                    </div>
                    <div className="absolute -bottom-8 -right-2 bg-blue-50 p-2 rounded-lg shadow-md border border-blue-200">
                      <p className="text-blue-800 text-xs">
                        <strong>Status:</strong> Model loaded successfully and
                        ready for clinical decision support.
                      </p>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="py-2 relative overflow-visible">
                    <div className="absolute -bottom-8 -right-2 bg-red-50 p-2 rounded-lg shadow-md border border-red-200">
                      <p className="text-red-600 text-xs">
                        <strong>Error:</strong> {error}
                      </p>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  {/* Expanded state - show full content */}
                  {isModelInfoOpen && (
                    <div className="space-y-6">
                      {/* Model Information Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          {/* <span className="font-semibold text-gray-700">Model Name:</span> */}
                          <Badge
                            variant="outline"
                            className="text-lg px-3 py-1"
                          >
                            {modelName}
                          </Badge>
                        </div>
                      </div>

                      {/* Model Description and Results Side by Side */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Model Description Section */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Model Description
                          </h3>
                          <p className="text-sm text-gray-600">
                            This is the default trained model for nephrology
                            clinical decision support. The model has been
                            trained on nephrology data and is optimized for
                            clinical applications.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="font-medium text-gray-700">
                                Domain:
                              </span>
                              <span className="ml-2 text-gray-600">
                                Nephrology
                              </span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="font-medium text-gray-700">
                                Model Type:
                              </span>
                              <span className="ml-2 text-gray-600">
                                Machine Learning
                              </span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="font-medium text-gray-700">
                                Status:
                              </span>
                              <span className="ml-2 text-green-600">Ready</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded">
                              <span className="font-medium text-gray-700">
                                Version:
                              </span>
                              <span className="ml-2 text-gray-600">1.0</span>
                            </div>
                          </div>
                        </div>

                        {/* Model Results Section */}
                        {modelData && (
                          <div className="space-y-4 h-[600px] flex flex-col">
                            <h3 className="text-lg font-semibold text-gray-800">
                              Model Results
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Visualize the model's feature importance,
                              confusion matrix, and ROC curve performance.
                            </p>

                            <Tabs
                              defaultValue="features"
                              className="w-full flex-1 flex flex-col"
                            >
                              <TabsList className="mb-2 flex justify-center w-full flex-shrink-0 bg-transparent">
                                <TabsTrigger
                                  value="features"
                                  className="flex flex-col items-center mx-2"
                                >
                                  <BarChart3
                                    size={32}
                                    className="mb-1 text-black-600"
                                  />
                                  <span className="text-xs font-medium">
                                    Features
                                  </span>
                                </TabsTrigger>
                                <TabsTrigger
                                  value="matrices"
                                  className="flex flex-col items-center mx-2"
                                >
                                  <Grid3X3
                                    size={32}
                                    className="mb-1 text-black-600"
                                  />
                                  <span className="text-xs font-medium">
                                    Matrices
                                  </span>
                                </TabsTrigger>
                                <TabsTrigger
                                  value="roc"
                                  className="flex flex-col items-center mx-2"
                                >
                                  <LineChart
                                    size={32}
                                    className="mb-1 text-black-600"
                                  />
                                  <span className="text-xs font-medium">
                                    ROC Curves
                                  </span>
                                </TabsTrigger>
                              </TabsList>

                              <div className="flex-1 min-h-0">
                                <TabsContent
                                  value="features"
                                  className="h-full"
                                >
                                  <div className="flex justify-center items-center h-full">
                                    <div className="w-full max-w-4xl h-full flex items-center justify-center">
                                      <FeatureImportanceChart
                                        data={getFeatureChartData()}
                                        title={`Feature Importance - ${modelName}`}
                                        color="#3b82f6"
                                      />
                                    </div>
                                  </div>
                                </TabsContent>

                                <TabsContent
                                  value="matrices"
                                  className="h-full"
                                >
                                  <div className="flex justify-center items-center h-full">
                                    <div className="w-full max-w-4xl h-full flex items-center justify-center">
                                      <ConfusionMatrix
                                        data={getConfusionMatrixData()}
                                        title={`Confusion Matrix - ${modelName}`}
                                        className="hover:shadow-lg transition-all duration-200"
                                      />
                                    </div>
                                  </div>
                                </TabsContent>

                                <TabsContent value="roc" className="h-full">
                                  <div className="flex justify-center items-center h-full">
                                    <div className="w-full max-w-4xl h-full flex items-center justify-center">
                                      <ROCCurve
                                        data={getROCCurveData()}
                                        title={`ROC Curve - ${modelName}`}
                                        color="#8b5cf6"
                                        auc={calculateAUC()}
                                        className="hover:shadow-lg transition-all duration-200"
                                      />
                                    </div>
                                  </div>
                                </TabsContent>
                              </div>
                            </Tabs>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Example of prediction card - Rolling Gallery */}
          <Card className="min-h-[600px] relative overflow-hidden">
            <div className="relative h-full">
              {/* Slides */}
              <div className="relative h-full">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                      index === currentSlide
                        ? "opacity-100 translate-x-0"
                        : index < currentSlide
                        ? "opacity-0 -translate-x-full"
                        : "opacity-0 translate-x-full"
                    }`}
                  >
                    <div className="h-full flex flex-col justify-center items-center p-6">
                      <div className="w-full max-w-6xl mx-auto">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                          {index === 0
                            ? "Example of prediction"
                            : "Prediction History"}
                        </h3>
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              {examplePrediction &&
                              examplePrediction.length > 1 ? (
                                <>
                                  <thead className="bg-gray-50">
                                    <tr>
                                      {examplePrediction[0].map((header, i) => (
                                        <th
                                          key={i}
                                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                          {header}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {index === 0 ? (
                                      examplePrediction
                                        .slice(1)
                                        .map((row, rowIdx) => {
                                          // Find the index of the confidence/completion column (case-insensitive match)
                                          const completionIdx =
                                            examplePrediction[0].findIndex(
                                              (h) =>
                                                h
                                                  .toLowerCase()
                                                  .includes("confidence")
                                            );
                                          return (
                                            <tr
                                              key={rowIdx}
                                              className="hover:bg-gray-50"
                                            >
                                              {row.map((cell, cellIdx) => {
                                                // Color logic for STATUS and PREDICTION columns
                                                const statusIdx =
                                                  examplePrediction[0].findIndex(
                                                    (h) =>
                                                      h
                                                        .toLowerCase()
                                                        .includes("status")
                                                  );
                                                const predictionIdx =
                                                  examplePrediction[0].findIndex(
                                                    (h) =>
                                                      h
                                                        .toLowerCase()
                                                        .includes("prediction")
                                                  );
                                                const completionIdx =
                                                  examplePrediction[0].findIndex(
                                                    (h) =>
                                                      h
                                                        .toLowerCase()
                                                        .includes("confidence")
                                                  );

                                                if (
                                                  cellIdx === statusIdx ||
                                                  cellIdx === predictionIdx
                                                ) {
                                                  let colorClass = "";
                                                  if (cell === "Respuesta") {
                                                    colorClass =
                                                      "bg-green-100 text-green-800";
                                                  } else if (
                                                    cell === "Progresión"
                                                  ) {
                                                    colorClass =
                                                      "bg-red-100 text-red-800";
                                                  } else {
                                                    colorClass =
                                                      "bg-gray-100 text-gray-800";
                                                  }
                                                  return (
                                                    <td
                                                      key={cellIdx}
                                                      className="px-4 py-3 whitespace-nowrap text-sm"
                                                    >
                                                      <span
                                                        className={`inline-flex px-2 py-1 rounded-full font-semibold ${colorClass}`}
                                                      >
                                                        {cell}
                                                      </span>
                                                    </td>
                                                  );
                                                } else if (
                                                  cellIdx === completionIdx
                                                ) {
                                                  // Try to parse the value as a float between 0 and 1, fallback to original
                                                  let percent =
                                                    parseFloat(cell);
                                                  if (!isNaN(percent)) {
                                                    if (percent <= 1)
                                                      percent = percent * 100;
                                                    percent =
                                                      Math.round(percent);
                                                  } else {
                                                    percent = 0;
                                                  }
                                                  return (
                                                    <td
                                                      key={cellIdx}
                                                      className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 min-w-[120px]"
                                                    >
                                                      <div className="flex items-center gap-2">
                                                        <Progress
                                                          value={percent}
                                                          className="w-16"
                                                        />
                                                        <span className="text-sm text-gray-600">{`${percent}%`}</span>
                                                      </div>
                                                    </td>
                                                  );
                                                } else {
                                                  return (
                                                    <td
                                                      key={cellIdx}
                                                      className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                                                    >
                                                      {cell}
                                                    </td>
                                                  );
                                                }
                                              })}
                                            </tr>
                                          );
                                        })
                                    ) : (
                                      <tr>
                                        <td
                                          colSpan={examplePrediction[0].length}
                                          className="px-4 py-8 text-center text-gray-500"
                                        >
                                          No older predictions available
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </>
                              ) : (
                                <tbody>
                                  <tr>
                                    <td
                                      colSpan={10}
                                      className="px-4 py-8 text-center text-gray-500"
                                    >
                                      Loading example predictions...
                                    </td>
                                  </tr>
                                </tbody>
                              )}
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              >
                <ChevronLeft className="h-6 w-6 text-gray-700" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              >
                <ChevronRight className="h-6 w-6 text-gray-700" />
              </button>

              {/* Dots indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentSlide
                        ? "bg-blue-600 scale-125"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Floating Clinical Variables Input Dock */}
      {features.length > 0 && (
        <div
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#2D3748] border border-gray-600 shadow-2xl rounded-[2.5rem] transition-all duration-500 ease-in-out group hover:shadow-3xl max-w-screen-lg"
          onMouseEnter={() => setIsDockHovered(true)}
          onMouseLeave={() => setIsDockHovered(false)}
          style={{
            width: "auto",
            maxWidth: isDockHovered ? "2000px" : "16.5rem",
            background: isDockHovered
              ? "#2D3748"
              : `
                  linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.1) 50%, transparent 70%),
                  linear-gradient(-45deg, transparent 30%, rgba(139, 92, 246, 0.1) 50%, transparent 70%),
                  #2D3748
                `,
            backgroundSize: isDockHovered ? "auto" : "200% 200%",
            animation: isDockHovered
              ? "none"
              : "starBorder 6s ease-in-out infinite",
            animationPlayState: isDockHovered ? "paused" : "running",
          }}
        >
          {/* Star Border Overlay */}
          <div
            className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
            style={{
              background: isDockHovered
                ? "transparent"
                : `
                    radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, rgba(34, 197, 94, 0.3) 0%, transparent 50%)
                  `,
              animation: isDockHovered
                ? "none"
                : "starGlow 8s ease-in-out infinite alternate",
              animationPlayState: isDockHovered ? "paused" : "running",
            }}
          />
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @keyframes starBorder {
                  0%, 100% {
                    background-position: 0% 0%;
                  }
                  25% {
                    background-position: 100% 0%;
                  }
                  50% {
                    background-position: 100% 100%;
                  }
                  75% {
                    background-position: 0% 100%;
                  }
                }
                
                @keyframes starGlow {
                  0% {
                    opacity: 0.3;
                    transform: scale(1);
                  }
                  100% {
                    opacity: 0.7;
                    transform: scale(1.05);
                  }
                }
              `,
            }}
          />
          <div
            className={`mx-auto transition-all duration-500 ease-in-out ${
              isDockHovered ? "max-w-7xl p-6" : "p-4"
            }`}
          >
            {/* Compact Header - Always Visible */}
            <div
              className={`flex items-center justify-between transition-all duration-300 ${
                isDockHovered ? "mb-6" : "mb-0"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img
                    src="/miniICON4.png"
                    alt="System Icon"
                    className="h-14 w-14 object-contain"
                  />
                </div>
                <div
                  className={`transition-all duration-300 ${
                    isDockHovered ? "block" : "hidden"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-white">
                    Clinical Variables
                  </h3>
                  <p className="text-xs text-gray-300">
                    Enter values to make a prediction
                  </p>
                </div>
                {/* Sky blue dot and Make prediction text only in compact mode */}
                {!isDockHovered && (
                  <>
                    {/* <div className="w-2 h-2 bg-blue-400 rounded-full opacity-50"></div> */}
                    <span className="text-white text-base font-medium">
                      Make prediction
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={handlePredict}
                  disabled={!isFormValid() || predictionLoading}
                  className={`rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm transition-all duration-300 flex items-center justify-center w-12 h-12`}
                >
                  {predictionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <ChevronUp className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>

            {/* Input Fields - Hidden by default, shown on hover */}
            <div
              className={`space-y-4 overflow-hidden transition-all duration-500 ease-in-out ${
                isDockHovered
                  ? "max-h-[800px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              {/* Special row for specific features */}
              <div className="flex flex-row gap-x-2 overflow-x-auto">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="flex flex-col gap-1 min-w-[8rem]"
                  >
                    <label className="text-sm font-medium text-gray-300">
                      {feature}:
                    </label>
                    <Input
                      type="text"
                      value={featureValues[feature] || ""}
                      onChange={(e) =>
                        handleFeatureChange(feature, e.target.value)
                      }
                      className="w-32 rounded-lg border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>

              {/* Remaining features in responsive grid
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {features
                  .filter(
                    (feature) =>
                      ![
                        "HEPARINASOD",
                        "PADPOST",
                        "V38",
                        "HDCATGEMELAR",
                        "HDFAVNATIVA",
                      ].includes(feature)
                  )
                  .map((feature) => (
                    <div key={feature} className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-300">
                        {feature}:
                      </label>
                      <Input
                        type="text"
                        placeholder={`Enter ${feature} value`}
                        value={featureValues[feature] || ""}
                        onChange={(e) =>
                          handleFeatureChange(feature, e.target.value)
                        }
                        className="w-full rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  ))}
              </div> */}
            </div>

            {/* Prediction Result */}
            {prediction && (
              <div
                className={`mt-6 p-4 bg-gray-700 rounded-xl border border-gray-600 shadow-sm overflow-hidden transition-all duration-500 ease-in-out ${
                  isDockHovered
                    ? "max-h-[200px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <h4 className="font-semibold text-white mb-2">
                  Prediction Result:
                </h4>
                <div className="text-xl font-bold text-blue-400">
                  {prediction}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CDSSnep;
