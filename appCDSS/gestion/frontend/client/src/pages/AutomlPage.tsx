import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useSidebar } from "@/contexts/SidebarContext";
import FeatureImportanceChart from "@/components/charts/FeatureImportanceChart";
import ConfusionMatrix from "@/components/charts/ConfusionMatrix";
import ROCCurve from "@/components/charts/ROCCurve";
import {
  Turtle,
  Rabbit,
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  Target,
  Brain,
  Grid3X3,
  LineChart,
} from "lucide-react";
// import { CardContent } from "@/components/ui/card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import AUCBoxPlot from "../components/AUCBoxPlot";
import AUCBoxPlotRecharts from "../components/AUCBoxPlotRecharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface ModelData {
  model_names: string[];
  feat0: string[][];
  feat1: string[][];
  feat2: string[][];
  feat3: string[][];
  feat4: string[][];
  feat5: string[][];
  CM: number[][];
  roc_curves: number[][][]; // Each model: array of [fpr, tpr] pairs
  AUC: string[][];
  target_type?: string;
}

const AutomlPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const [showExportPopup, setShowExportPopup] = useState(false);

  const handleExportClick = (id: string) => {
    setSelectedModelId(id);
    setShowExportPopup(true);
  };

  const closeExportPopup = () => {
    setShowExportPopup(false);
    setSelectedModelId(null);
    setSelectedModel("");
  };

  const [featureMethods, setFeatureMethods] = useState<string[]>([]);
  const [modelData, setModelData] = useState<ModelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { collapsed } = useSidebar();

  const [numbClasses, setNumbClasses] = useState<number | null>(null);

  // Helper to get target type
  const getTargetType = () => modelData?.target_type || "";

  const handleButtonClick = async (mode: "slow" | "fast") => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/modeling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch model data");
      }

      const data = await response.json();
      setModelData(data);

      // Save NumbClasses from backend if present
      if (data.NumbClasses !== undefined) {
        setNumbClasses(data.NumbClasses);
        console.log("NumbClasses from backend:", data.NumbClasses);
      }
      console.log("Backend response:", data);

      // Set the list of feature selection methods if it exists
      if (data.FeatueMethod) {
        setFeatureMethods(data.FeatueMethod);
        console.log("Feature Selection Methods:", data.FeatueMethod);
      }

      // Optionally log roc_curves for debugging
      if (data.roc_curves) {
        console.log("ROC Curves Data:", data.roc_curves);
        console.log("ROC Curves Data Type:", typeof data.roc_curves);
        console.log("ROC Curves Data Length:", data.roc_curves.length);
      }
    } catch (error) {
      console.error("Error sending flag:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get model names
  const getModelNames = () => {
    if (!modelData?.model_names) return [];
    console.log("Model Names from getModelNames:", modelData.model_names);
    return modelData.model_names; // Return the array directly
  };

  // Transform feature data for bar chart - generic function for any feature
  const getFeatureChartData = (
    featureKey: keyof Omit<ModelData, "model_names">
  ) => {
    if (
      !modelData?.[featureKey] ||
      !Array.isArray(modelData[featureKey]) ||
      modelData[featureKey].length < 2
    )
      return [];

    const featureNames = modelData[featureKey][0];
    const featureValues = modelData[featureKey][1];

    if (!Array.isArray(featureNames) || !Array.isArray(featureValues))
      return [];

    return featureNames.map((name, index) => ({
      name: name,
      value:
        typeof featureValues[index] === "string"
          ? parseFloat(featureValues[index])
          : Number(featureValues[index]) || 0,
    })); // Removed sorting to maintain original column order
  };

  // Transform feat0 data for bar chart (keeping for backward compatibility)
  const getFeat0ChartData = () => {
    return getFeatureChartData("feat0");
  };

  // Get icon for each model
  const getModelIcon = (index: number) => {
    const icons = [BarChart3, TrendingUp, Activity, Zap, Target, Brain];
    return icons[index] || BarChart3;
  };

  // Get confusion matrix data for a specific model
  const getConfusionMatrixData = (modelIndex: number) => {
    if (!modelData?.CM || !modelData.CM[0]) return [0, 0, 0, 0];

    // Use NumbClasses*2 instead of hardcoded 4
    const numValues = Math.pow(numbClasses ?? 2, 2);
    const startIndex = modelIndex * numValues;
    const endIndex = startIndex + numValues;
    return modelData.CM[0].slice(startIndex, endIndex);
  };

  // Parse ROC data and get ROC curve data for a specific model
  const getROCCurveData = (modelIndex: number) => {
    if (
      !modelData?.roc_curves ||
      !Array.isArray(modelData.roc_curves) ||
      !modelData.roc_curves[modelIndex]
    ) {
      return [];
    }
    // Each element is [fpr, tpr]
    return modelData.roc_curves[modelIndex].map(([fpr, tpr]) => ({
      fpr,
      tpr,
    }));
  };

  // Calculate AUC for a model
  const calculateAUC = (modelIndex: number) => {
    const rocData = getROCCurveData(modelIndex);
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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <DashboardHeader />
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-7xl px-4">
            <main className="flex flex-1 flex-col items-center justify-center text-center min-h-[70vh]">
              {!modelData ? (
                <div className="flex flex-1 flex-col items-center justify-center w-full h-full">
                  <h1 className="text-5xl font-extrabold mb-6">
                    Start modeling
                  </h1>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleButtonClick("slow")}
                      disabled={isLoading}
                      className="w-16 h-16 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                      <Turtle size={50} />
                    </button>
                    <button
                      onClick={() => handleButtonClick("fast")}
                      disabled={isLoading}
                      className="w-16 h-16 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                      <Rabbit size={50} />
                    </button>
                  </div>
                  {isLoading && (
                    <div className="mt-4">
                      <p className="text-lg">Processing models...</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-extrabold mb-6">
                    Model Results
                  </h1>
                  <div className="w-full flex flex-col items-center">
                    {getTargetType() === "boolean" && (
                      <Tabs defaultValue="features" className="w-full">
                        <TabsList className="mb-6 flex justify-center w-full bg-transparent">
                          <TabsTrigger
                            value="features"
                            className="flex flex-col items-center mx-2"
                          >
                            <BarChart3
                              size={32}
                              className="mb-1 text-blue-600"
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
                              className="mb-1 text-green-600"
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
                              className="mb-1 text-purple-600"
                            />
                            <span className="text-xs font-medium">
                              ROC Curves
                            </span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="auc"
                            className="flex flex-col items-center mx-2"
                          >
                            <BarChart3
                              size={32}
                              className="mb-1 text-yellow-600"
                            />
                            <span className="text-xs font-medium">
                              AUC Box Plot
                            </span>
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="features">
                          <div className="grid grid-cols-3 gap-0 w-full">
                            {getModelNames().map((modelName, index) => {
                              const IconComponent = getModelIcon(index);
                              const featureKey = `feat${index}` as keyof Omit<
                                ModelData,
                                "model_names"
                              >;
                              const chartData = getFeatureChartData(featureKey);
                              return (
                                <div
                                  key={index}
                                  className="flex flex-col items-center"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <IconComponent
                                      size={20}
                                      className="text-blue-600"
                                    />
                                    <h3 className="text-sm font-medium text-gray-700">
                                      {modelName}
                                    </h3>
                                  </div>
                                  <FeatureImportanceChart
                                    data={chartData}
                                    title=""
                                    color="#3b82f6"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </TabsContent>
                        <TabsContent value="matrices">
                          <div className="grid grid-cols-3 gap- w-full">
                            {getModelNames().map((modelName, index) => {
                              const cmData = getConfusionMatrixData(index);
                              return (
                                <ConfusionMatrix
                                  key={`cm-${index}`}
                                  data={cmData}
                                  title={modelName}
                                  className="hover:shadow-lg transition-all duration-200"
                                />
                              );
                            })}
                          </div>
                        </TabsContent>
                        <TabsContent value="roc">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                            {[0, 1, 2, 3, 4, 5].map((index) => {
                              const modelName =
                                getModelNames()[index] || `Model ${index + 1}`;
                              const rocData = getROCCurveData(index);
                              const auc = calculateAUC(index);
                              const colors = [
                                "#3b82f6",
                                "#ef4444",
                                "#10b981",
                                "#f59e0b",
                                "#8b5cf6",
                                "#06b6d4",
                              ];
                              return (
                                <ROCCurve
                                  key={`roc-${index}`}
                                  data={rocData}
                                  title={modelName}
                                  color={colors[index % colors.length]}
                                  auc={auc}
                                  className="hover:shadow-lg transition-all duration-200"
                                />
                              );
                            })}
                          </div>
                        </TabsContent>
                        <TabsContent value="auc">
                          <div className="flex flex-wrap justify-center gap-6">
                            <AUCBoxPlotRecharts />
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                    {getTargetType() === "classes" && (
                      <Tabs defaultValue="features" className="w-full">
                        <TabsList className="mb-6 flex justify-center w-full bg-transparent">
                          <TabsTrigger
                            value="features"
                            className="flex flex-col items-center mx-2"
                          >
                            <BarChart3
                              size={32}
                              className="mb-1 text-blue-600"
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
                              className="mb-1 text-green-600"
                            />
                            <span className="text-xs font-medium">
                              Matrices
                            </span>
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="features">
                          <div className="grid grid-cols-3 gap-0 w-full">
                            {getModelNames().map((modelName, index) => {
                              const IconComponent = getModelIcon(index);
                              const featureKey = `feat${index}` as keyof Omit<
                                ModelData,
                                "model_names"
                              >;
                              const chartData = getFeatureChartData(featureKey);
                              return (
                                <div
                                  key={index}
                                  className="flex flex-col items-center"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    {/* <IconComponent
                                      size={20}
                                      className="text-blue-600"
                                    /> */}
                                    <h3 className="text-sm font-medium text-gray-700">
                                      {modelName}
                                    </h3>
                                    {/* <h3 className="text-sm font-medium text-gray-700"> */}
                                    {/* {featureMethods[index] || "N/A"} */}
                                    {/* </h3> */}
                                    <div className="flex justify-center">
                                      <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-lg shadow">
                                        {featureMethods[index] || "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                  <FeatureImportanceChart
                                    data={chartData}
                                    title=""
                                    color="#3b82f6"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </TabsContent>
                        <TabsContent value="matrices">
                          <div className="grid grid-cols-3 gap- w-full">
                            {getModelNames().map((modelName, index) => {
                              const cmData = getConfusionMatrixData(index);
                              return (
                                <ConfusionMatrix
                                  key={`cm-${index}`}
                                  data={cmData}
                                  title={modelName}
                                  className="hover:shadow-lg transition-all duration-200"
                                />
                              );
                            })}
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                    {getTargetType() === "continuous" && (
                      <Tabs defaultValue="features" className="w-full">
                        <TabsList className="mb-6 flex justify-center w-full bg-transparent">
                          <TabsTrigger
                            value="features"
                            className="flex flex-col items-center mx-2"
                          >
                            <BarChart3
                              size={32}
                              className="mb-1 text-blue-600"
                            />
                            <span className="text-xs font-medium">
                              Features
                            </span>
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="features">
                          <div className="grid grid-cols-3 gap-0 w-full">
                            {getModelNames().map((modelName, index) => {
                              const IconComponent = getModelIcon(index);
                              const featureKey = `feat${index}` as keyof Omit<
                                ModelData,
                                "model_names"
                              >;
                              const chartData = getFeatureChartData(featureKey);
                              return (
                                <div
                                  key={index}
                                  className="flex flex-col items-center"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <IconComponent
                                      size={20}
                                      className="text-blue-600"
                                    />
                                    <h3 className="text-sm font-medium text-gray-700">
                                      {modelName}
                                    </h3>
                                  </div>
                                  <FeatureImportanceChart
                                    data={chartData}
                                    title=""
                                    color="#3b82f6"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                  </div>
                </>
              )}
              {/* Export Model button */}
              {modelData && (
                <div className="mt-8 flex justify-center w-full">
                  <button
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                    onClick={() => handleExportClick("placeholder-id")}
                  >
                    Export Model
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {showExportPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg relative">
            {/* Close button */}
            <button
              className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-600 hover:bg-red-700 border-none outline-none"
              onClick={closeExportPopup}
              aria-label="Close"
              type="button"
            />
            <p className="mb-4">Select model to export:</p>
            <div className="flex items-center gap-2 mb-4">
              <select
                className="border rounded px-3 py-2 w-full"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="">-- Select model --</option>
                {modelData?.model_names.map((name, index) => (
                  <option key={index} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <Button
                className="ml-2 bg-green-700 hover:bg-green-700 text-white"
                onClick={async () => {
                  if (selectedModel) {
                    const response = await fetch(
                      "http://localhost:5000/export_model",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ model_selected: selectedModel }),
                      }
                    );

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `${selectedModel}_export.zip`; // or .pkl, etc.
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                  }

                  closeExportPopup();
                }}
              >
                Export
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomlPage;
