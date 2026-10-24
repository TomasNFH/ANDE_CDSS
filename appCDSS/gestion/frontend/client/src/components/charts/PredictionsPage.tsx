import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useSidebar } from "@/contexts/SidebarContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Database,
  Upload,
  X,
  FileText,
  CheckCircle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FeatureImportanceChart from "@/components/charts/FeatureImportanceChart";
import ConfusionMatrix from "@/components/charts/ConfusionMatrix";
import ROCCurve from "@/components/charts/ROCCurve";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import DecisionTreeText from "@/components/DecisionTreeText";

const modelDescriptions: Record<string, string> = {
  RandomForestClassifier:
    "Random forest classification is an ensemble machine learning algorithm that uses multiple decision trees to classify data. By aggregating the predictions from various decision trees, it reduces overfitting and improves accuracy.",
  LogisticRegression:
    "Logistic regression is a statistical model used for binary classification problems. It estimates the probability that a given input belongs to a particular category.",
  KNeighborsClassifier:
    "K-Nearest Neighbors is a simple, non-parametric classification algorithm that assigns a class to a sample based on the majority class among its k nearest neighbors.",
  SupportVectorClassification:
    "Support Vector Classification uses support vector machines to find the optimal boundary that separates classes in the feature space.",
  GradientBoostingClassifier:
    "Gradient Boosting Classifier builds an ensemble of weak learners (typically decision trees) in a sequential manner, optimizing for accuracy by correcting previous errors.",
  GaussianNB:
    "Gaussian Naive Bayes is a probabilistic classifier based on Bayes' theorem, assuming features follow a normal distribution and are independent.",
  LinearRegression:
    "Linear regression models the relationship between a dependent variable and one or more independent variables using a straight line.",
  SupportVectorMachines:
    "Support Vector Machines are supervised learning models that analyze data for classification and regression by finding the optimal separating hyperplane.",
  RandomForestRegressor:
    "Random Forest Regressor is an ensemble method that uses multiple decision trees to predict continuous outcomes, improving robustness and accuracy.",
  QuantileRegressor:
    "Quantile Regression estimates the conditional quantiles of a response variable, providing a more complete view of possible outcomes.",
  GradientBoostingRegressor:
    "Gradient Boosting Regressor builds an ensemble of weak prediction models, typically decision trees, to improve prediction accuracy for regression tasks.",
  PassiveAggressiveRegressor:
    "Passive Aggressive Regressor is an online learning algorithm suitable for large-scale regression problems, updating its model only when errors occur.",
  LassoLars:
    "LassoLars is a regression algorithm that combines Lasso (L1 regularization) with Least Angle Regression for efficient feature selection.",
  KNeighborsRegressor:
    "K-Nearest Neighbors Regressor predicts the value of a sample based on the average of its k nearest neighbors in the feature space.",
};

const CDSSpredictions = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [showModelContent, setShowModelContent] = useState(false);

  // File upload states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [testDfInfo, setTestDfInfo] = useState<{
    shape: [number, number] | null;
    columns: string[] | null;
  } | null>(null);

  const { collapsed } = useSidebar();
  const [firstTree, setFirstTree] = useState<any>(null);
  const [lastTree, setLastTree] = useState<any>(null);
  // New state variables for model data
  const [modelData, setModelData] = useState<{
    feat: string[][];
    CM: number[][];
    roc_curves: number[][][];
  } | null>(null);

  const [examplePrediction, setExamplePrediction] = useState<string[][] | null>(
    null
  );
  const [latestInputPrediction, setLatestInputPrediction] = useState<
    (string | number)[][] | null
  >(null);

  const [boolLabels, setBoolLabels] = useState<[string, string] | null>(null);
  const [targetType, setTargetType] = useState<string>("");

  // Two identical slides
  const slides = [1, 2];

  useEffect(() => {
    if (showModelContent) {
      const fetchPredictionModel = async () => {
        try {
          setLoading(true);
          const response = await fetch(
            "http://localhost:5000/PredictionModel",
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

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
          // Store model data for charts
          setModelData({
            feat: data.feat || [],
            CM: data.CM || [],
            roc_curves: data.roc_curves || [],
          });
          // Add FirstTree and LastTree from backend
          setFirstTree(data.FirstTree || null);
          // Console plot of FirstTree
          if (data.FirstTree) {
            console.log("FirstTree structure:", data.FirstTree);
          }
          setLastTree(data.LastTree || null);
          if (data.example_prediction) {
            setExamplePrediction(data.example_prediction);
          } else {
            console.log("No example prediction data received from backend");
            setExamplePrediction(null);
          }
          if (
            data.bool_labels &&
            Array.isArray(data.bool_labels) &&
            data.bool_labels.length >= 2
          ) {
            setBoolLabels([data.bool_labels[0], data.bool_labels[1]]);
          } else {
            setBoolLabels(null);
          }
          if (data.target_type) {
            setTargetType(data.target_type);
            console.log("Received target_type from backend:", data.target_type);
          } else {
            setTargetType("");
            console.log("No target_type received from backend");
          }
        } catch (err) {
          console.error("Error fetching default model:", err);
          setError(
            err instanceof Error ? err.message : "Failed to fetch default model"
          );
        } finally {
          setLoading(false);
        }
      };

      fetchPredictionModel();
    }
  }, [showModelContent]);

  const handleLoadModel = () => {
    setShowUploadDialog(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(files);
    setUploadError("");
    setUploadSuccess(false);
  };

  const handleFileUpload = async () => {
    if (uploadedFiles.length === 0) {
      setUploadError("Please select at least one file");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("http://localhost:5000/upload_model", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setUploadSuccess(true);
        // Store test DataFrame information
        if (data.test_df_shape && data.test_df_columns) {
          setTestDfInfo({
            shape: data.test_df_shape,
            columns: data.test_df_columns,
          });
        }
        // Close dialog and load the model
        setTimeout(() => {
          setShowUploadDialog(false);
          setShowModelContent(true);
          setUploadedFiles([]);
          setUploadProgress(0);
          setUploadSuccess(false);
        }, 1500);
      } else {
        setUploadError(data.error || "Upload failed");
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Error uploading files:", err);
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload files"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDialogClose = () => {
    setShowUploadDialog(false);
    setUploadedFiles([]);
    setUploadProgress(0);
    setUploadError("");
    setUploadSuccess(false);
    setTestDfInfo(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles((prev) => [...prev, ...files]);
    setUploadError("");
    setUploadSuccess(false);
  };

  const handleSelectTrainedModel = () => {
    // Do nothing as requested
    console.log("Select trained model button pressed - no action taken");
  };

  const handleFeatureChange = (feature: string, value: string) => {
    setFeatureValues((prev) => ({
      ...prev,
      [feature]: value,
    }));
  };

  const handlePredict = async () => {
    setPredictionLoading(true);
    setPrediction("");

    try {
      const response = await fetch("http://localhost:5000/predictGENERAL", {
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

      const data = await response.json(); // 👈 Tenés que hacer esto antes de acceder a data.input_prediction

      if (data && data.input_prediction) {
        // Save InputPrediction 2D array to state
        setLatestInputPrediction(data.input_prediction);
        console.log("InputPrediction:", data.input_prediction); // 👈 Este log ahora sí funciona
      }

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

  // Selection page content
  if (!showModelContent) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div
          className={`flex-1 transition-all duration-300 ${
            collapsed ? "ml-20" : "ml-64"
          }`}
        >
          <DashboardHeader />
          <main className="p-6">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Decision Support System
                </h1>
                <p className="text-gray-600 mb-8">
                  Choose how you want to proceed with the model.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                  <Card
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    onClick={handleLoadModel}
                  >
                    <CardContent className="p-8 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <Upload className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Load Model
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Upload and load trained model files for nephrology
                          clinical decision support.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    onClick={handleSelectTrainedModel}
                  >
                    <CardContent className="p-8 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <Database className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Select Trained Model
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Choose from available trained models in the system.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* File Upload Dialog */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-600" />
                    Upload Model Files
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* File Selection Area */}
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".skops,.pkl,.joblib,.csv,.json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          Drop files here or click to browse
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Supported formats: .skops, .pkl, .joblib, .csv, .json
                        </p>
                      </div>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="mt-4"
                      >
                        Select Files
                      </Button>
                    </div>
                  </div>

                  {/* Selected Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">
                        Selected Files:
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {file.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Uploading files...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {uploadSuccess && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">
                          Upload Successful!
                        </p>
                        <p className="text-sm text-green-700">
                          Model files have been uploaded and processed.
                          {testDfInfo && testDfInfo.shape && (
                            <span className="block mt-1">
                              Test data loaded: {testDfInfo.shape[0]} rows ×{" "}
                              {testDfInfo.shape[1]} columns
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {uploadError && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <X className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-900">Upload Error</p>
                        <p className="text-sm text-red-700">{uploadError}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={handleDialogClose}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleFileUpload}
                      disabled={uploadedFiles.length === 0 || isUploading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isUploading ? "Uploading..." : "Upload Files"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div
        className={`flex-1 transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Background overlay */}
        {isDockHovered && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40 transition-all duration-300"></div>
        )}
        <DashboardHeader />
        <main className="p-6 pb-40">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Decision Support System
            </h1>
          </div>

          <div className="grid gap-6">
            <Collapsible
              open={isModelInfoOpen}
              onOpenChange={setIsModelInfoOpen}
            >
              <Card>
                <CardHeader>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between w-full cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors">
                      <CardTitle className="flex items-center gap-2">
                        <span>Model Information & Description</span>
                        {targetType && (
                          <Badge
                            variant="secondary"
                            className="text-sm px-2 py-1"
                          >
                            {targetType === "boolean" ||
                            targetType === "classes"
                              ? "Clasificassion Problem"
                              : targetType === "regression"
                              ? "Regresion Problem"
                              : `Target type: ${targetType}`}
                          </Badge>
                        )}
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
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-800">
                              Model Description
                            </h3>
                            <p className="text-sm text-gray-600">
                              {modelDescriptions[modelName] ||
                                "Error: Model description not available."}
                            </p>
                            {/* {firstTree && <DecisionTreeText tree={firstTree} />} */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-3 rounded">
                                <span className="font-medium text-gray-700">
                                  Domain:
                                </span>
                                <span className="ml-2 text-gray-600">
                                  Agriculture
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
                                <span className="ml-2 text-green-600">
                                  Ready
                                </span>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <span className="font-medium text-gray-700">
                                  Version:
                                </span>
                                <span className="ml-2 text-gray-600">1.0</span>
                              </div>
                              {/* {firstTree && (
                                <DecisionTreeText tree={firstTree} />
                              )} */}
                              {/* <div className="bg-gray-50 p-3 rounded"> */}
                              {/* <span className="font-medium text-gray-700">Target Type:</span> */}
                              {/* <span className="ml-2 text-gray-600">{targetType || 'Not specified'}</span> */}
                              {/* </div> */}
                            </div>

                            {/* Test DataFrame Information */}
                            {testDfInfo && (
                              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="font-semibold text-blue-900 mb-3">
                                  Uploaded Test Data
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="font-medium text-blue-800">
                                      DataFrame Shape:
                                    </span>
                                    <span className="text-blue-700">
                                      {testDfInfo.shape
                                        ? `${testDfInfo.shape[0]} rows × ${testDfInfo.shape[1]} columns`
                                        : "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium text-blue-800">
                                      Columns:
                                    </span>
                                    <span className="text-blue-700">
                                      {testDfInfo.columns
                                        ? testDfInfo.columns.length
                                        : 0}
                                    </span>
                                  </div>
                                  {testDfInfo.columns && (
                                    <div className="mt-2">
                                      <span className="font-medium text-blue-800">
                                        Column Names:
                                      </span>
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {testDfInfo.columns.map(
                                          (col, index) => (
                                            <Badge
                                              key={index}
                                              variant="outline"
                                              className="text-xs bg-blue-100 text-blue-800"
                                            >
                                              {col}
                                            </Badge>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Model Results Section */}
                          {modelData && (
                            <div className="space-y-2 h-[600px] flex flex-col">
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
                                  {(targetType === "boolean" ||
                                    targetType === "classes") && (
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
                                  )}
                                  {targetType === "boolean" && (
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
                                  )}
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

                                  {(targetType === "boolean" ||
                                    targetType === "classes") && (
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
                                            positiveLabel={
                                              boolLabels &&
                                              boolLabels.length >= 2
                                                ? boolLabels[0]
                                                : "Positive"
                                            }
                                            negativeLabel={
                                              boolLabels &&
                                              boolLabels.length >= 2
                                                ? boolLabels[1]
                                                : "Negative"
                                            }
                                            classLabels={
                                              boolLabels &&
                                              boolLabels.length >= 6
                                                ? boolLabels.slice(0, 3)
                                                : []
                                            }
                                          />
                                        </div>
                                      </div>
                                    </TabsContent>
                                  )}

                                  {targetType === "boolean" && (
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
                                  )}
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
                                        {examplePrediction[0].map(
                                          (header, i) => (
                                            <th
                                              key={i}
                                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                              {header}
                                            </th>
                                          )
                                        )}
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
                                                          .includes(
                                                            "prediction"
                                                          )
                                                    );
                                                  const completionIdx =
                                                    examplePrediction[0].findIndex(
                                                      (h) =>
                                                        h
                                                          .toLowerCase()
                                                          .includes(
                                                            "confidence"
                                                          )
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
                                            colSpan={
                                              examplePrediction[0].length
                                            }
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

          {/* Floating Clinical Variables Input Dock */}
          {features.length > 0 && (
            <div
              className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#2D3748] border border-gray-600 shadow-2xl rounded-[2.5rem] transition-all duration-500 ease-in-out group hover:shadow-3xl"
              onMouseEnter={() => setIsDockHovered(true)}
              onMouseLeave={() => setIsDockHovered(false)}
              style={{
                width: isDockHovered ? "calc(100vw - 2rem)" : "auto",
                maxWidth: isDockHovered ? "none" : "16.5rem",
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
                      {targetType && (
                        <p className="text-xs text-blue-300 mt-1">
                          Target Type: {targetType}
                        </p>
                      )}
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
                  <div className="grid grid-cols-5 gap-4">
                    {features
                      .filter((feature) =>
                        [
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
                  </div>

                  {/* Remaining features in responsive grid */}
                  <div
                    className={
                      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2"
                    }
                  >
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
                  </div>
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
        </main>
      </div>
    </div>
  );
};

export default CDSSpredictions;
