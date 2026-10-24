import React, { useRef, useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useSidebar } from "@/contexts/SidebarContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PieChart from "@/components/charts/PieChart";
import LineChart from "@/components/charts/LineChart";
import ChartCard from "@/components/ChartCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Waypoints,
  Glasses,
  Target,
  BarChart3,
  ArrowDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface ImportedData {
  id: string;
  name: string;
  variables: number;
  entries: number;
  completion: number;
  status: "active" | "paused" | "loaded" | "default";
}

interface LoadedData {
  id: string;
  name: string;
  variables: number;
  entries: number;
  completion: number;
  status: "active" | "paused" | "loaded" | "default";
}

const TablesPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { collapsed } = useSidebar();
  const [tableData, setTableData] = useState<string[][] | null>(null);
  const [variables, setVariables] = useState<string[]>([]);
  const [selectedVariable, setSelectedVariable] = useState<string>("");
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(
    null
  );
  const [confirmedTargetVariable, setConfirmedTargetVariable] = useState<
    string | null
  >(null);
  // Add this state to store the target_type
  const [confirmedTargetType, setConfirmedTargetType] = useState<string | null>(
    null
  );

  // Add this state to store the SCEWED_TARGET_COL data
  const [targetColData, setTargetColData] = useState<
    { Value: string; Count: number }[]
  >([]);

  // Add this state to store the dominant values
  const [dominantValues, setDominantValues] = useState<string[]>([]);

  // Add state to store message1 and message2 from backend
  const [message1, setMessage1] = useState<string | null>(null);
  const [message2, setMessage2] = useState<string | null>(null);

  const [bounce, setBounce] = useState(true);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file name:", file.name);

      const formData = new FormData();
      formData.append("file", file);

      fetch("http://localhost:5000/upload_csv", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.data) {
            setTableData(data.data);
          } else {
            setTableData(null);
          }
        })
        .catch((error) => {
          console.error("Error uploading file:", error);
        });
    }
  };

  // Fetch info of dataset (for importsData) and name od variables after tableData is set
  const [importsData, setImportsData] = useState<ImportedData[]>([]);

  useEffect(() => {
    if (tableData) {
      fetch("http://localhost:5000/imported_table_metadata_upload")
        .then((res) => res.json())
        .then((data) => {
          // setVariables(data.variables || []);
          // console.log("Variables:", data.variables);
          // Add new dataset to importsData
          setImportsData((prev) => [
            ...prev,
            {
              id: (prev.length + 1).toString(),
              name: data.NAME_DATASET,
              variables: data.N_VARIABLE,
              entries: data.N_ENTRIES,
              completion: data.COMP,
              status: "loaded",
            },
          ]);
        });
    }
  }, [tableData]);

  // On mount, load from localStorage
  useEffect(() => {
    const savedImports = localStorage.getItem("importsData");
    if (savedImports) setImportsData(JSON.parse(savedImports));
  }, []);

  // On change, save to localStorage
  useEffect(() => {
    localStorage.setItem("importsData", JSON.stringify(importsData));
  }, [importsData]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "import_datasets" | "loaded_datasets"
  >("import_datasets");

  const loadsData: LoadedData[] = [
    {
      id: "1",
      name: "Heart Attack",
      variables: 14,
      entries: 303,
      completion: 100,
      status: "default",
    },
    {
      id: "2",
      name: "Iris",
      variables: 6,
      entries: 150,
      completion: 100,
      status: "default",
    },
    {
      id: "3",
      name: "Boston House Pricing",
      variables: 1,
      entries: 505,
      completion: 100,
      status: "default",
    },
    {
      id: "4",
      name: "Titanic Dataset",
      variables: 28,
      entries: 1309,
      completion: 99.99,
      status: "default",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      paused: "bg-yellow-100 text-yellow-800",
      loaded: "bg-yellow-100 text-yellow-800",
      default: "bg-blue-100 text-blue-800",
      online: "bg-green-100 text-green-800",
      offline: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredImports = importsData.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLoads = loadsData.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [showTargetPopup, setShowTargetPopup] = useState(false);
  const handleTargetsClick = async (id: string) => {
    setSelectedDatasetId(id);
    try {
      const res = await fetch("http://localhost:5000/get_variables_of_selected_dataset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_dataset_id: id, active_tab: activeTab }),
      });
      const data = await res.json();
      console.log("Variables from select_dataset:", data?.variables);
      if (Array.isArray(data?.variables)) {
        setVariables(data.variables as string[]);
      } else {
        setVariables([]);
      }
    } catch (e) {
      console.error("Failed to notify backend selected dataset:", e);
      setVariables([]);
    }
    setShowTargetPopup(true);
  };
  const closeTargetPopup = () => {
    setShowTargetPopup(false);
    setSelectedDatasetId(null);
    setSelectedVariable("");
  };

  const [showScewedPopup, setShowScewedPopup] = useState(false);
  // const handleScewedClick = (id: string) => {
  //   setSelectedDatasetId(id);
  //   setShowScewedPopup(true);
  // };
  const closeScewedPopup = () => {
    setShowScewedPopup(false);
    setSelectedDatasetId(null);
    setSelectedVariable("");
  };

  // Add this effect to log when confirmedTargetType changes
  useEffect(() => {
    console.log("confirmed with use effect :", confirmedTargetType);
  }, [confirmedTargetType]);

  // Add this effect to log when confirmedTargetVariable changes
  useEffect(() => {
    console.log("confirmed with use effect :", confirmedTargetVariable);
  }, [confirmedTargetVariable]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div
        className={`flex-1 transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <DashboardHeader />

        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Dataset load/ import
            </h1>
            <p className="text-gray-600">
              Comprehensive data management and visualization
            </p>
          </div>
          <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={
                  activeTab === "import_datasets" ? "default" : "outline"
                }
                onClick={() => setActiveTab("import_datasets")}
              >
                Import
              </Button>
              <Button
                variant={
                  activeTab === "loaded_datasets" ? "default" : "outline"
                }
                onClick={() => setActiveTab("loaded_datasets")}
              >
                Loaded
              </Button>
            </div>
          </div>
          {/* Import Dataset */}
          {activeTab === "import_datasets" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Imported Datasets</CardTitle>
                <Button
                  onClick={() => {
                    setBounce(false);
                    handleButtonClick();
                  }}
                  size="sm"
                  className={bounce ? "bounce-animate" : ""}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dataset</TableHead>
                      <TableHead>Variables</TableHead>
                      <TableHead>Entries</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredImports.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">
                          {project.name}
                        </TableCell>
                        <TableCell className="font-medium">
                          {project.variables}
                        </TableCell>
                        <TableCell className="font-medium">
                          {project.entries}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={project.completion}
                              className="w-16"
                            />
                            <span className="text-sm text-gray-600">
                              {project.completion}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(project.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="font-semibold flex items-center gap-2"
                                >
                                  More <ArrowDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    localStorage.setItem(
                                      "fullTableData",
                                      JSON.stringify(tableData)
                                    );
                                    window.open("/full-table", "_blank");
                                  }}
                                >
                                  <Glasses className="h-4 w-4 mr-2" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="bg-green-700 hover:bg-green-800 text-white hover:text-white font-semibold"
                              onClick={() => handleTargetsClick(project.id)}
                            >
                              Target selection
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          {activeTab === "import_datasets" &&
            confirmedTargetVariable &&
            (() => {
              console.log("entramos en lo de la grafica");
              return (
                <div className="w-full flex justify-center mb-6 mt-8">
                  <ChartCard
                    className="w-full max-w-4xl"
                    title={``}
                    subtitle={``}
                    footer={
                      <div className="flex items-center text-gray-500 text-xs">
                        <span className="mr-1">{/* ...svg... */}</span>
                        active dataset
                      </div>
                    }
                  >
                    <div className="flex flex-row items-center gap-6">
                      <div className="flex flex-col gap-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 w-[400px] text-left font-semibold text-red-900 shadow-sm">
                          Data Cleaning Results: 
                          <br />
                          {message1} 
                          <br />
                          {message2}
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 min-w-[180px] text-left font-semibold text-green-900 shadow-sm">
                          Target variable: {confirmedTargetVariable}
                          <br />
                          Variable type: {confirmedTargetType}
                        </div>
                      </div>
                      <PieChart
                        data={
                          Array.isArray(targetColData) &&
                          targetColData.length > 1
                            ? targetColData.slice(1).map((row) => ({
                                name: row[1], // 'Value'
                                value: row[2], // 'Count'
                              }))
                            : []
                        }
                      />
                    </div>
                  </ChartCard>
                </div>
              );
            })()}
          {/* Authors Table */}
          {activeTab === "loaded_datasets" && (
            <Card>
              <CardHeader>
                <CardTitle>Authors Table</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dataset</TableHead>
                      <TableHead>Variables</TableHead>
                      <TableHead>Entries</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoads.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">
                          {project.name}
                        </TableCell>
                        <TableCell className="font-medium">
                          {project.variables}
                        </TableCell>
                        <TableCell className="font-medium">
                          {project.entries}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={project.completion}
                              className="w-16"
                            />
                            <span className="text-sm text-gray-600">
                              {project.completion}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(project.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {activeTab === "loaded_datasets" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="font-semibold flex items-center gap-2"
                                onClick={() => {
                                  localStorage.setItem(
                                    "fullTableData",
                                    JSON.stringify(tableData)
                                  );
                                  window.open("/full-table", "_blank");
                                }}
                              >
                                <Glasses className="h-4 w-4 mr-2" /> View
                              </Button>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="font-semibold flex items-center gap-2"
                                  >
                                    More <ArrowDown className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Glasses className="h-4 w-4 mr-2" /> View
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="bg-green-700 hover:bg-green-800 text-white hover:text-white font-semibold"
                              onClick={() => handleTargetsClick(project.id)}
                            >
                              Target selection
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {showTargetPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg relative">
            {/* Close button in upper right inside the popup */}
            <button
              className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-600 hover:bg-red-700 border-none outline-none"
              onClick={closeTargetPopup}
              aria-label="Close"
              type="button"
            />
            <p className="mb-4">Select target variable:</p>
            <div className="flex items-center gap-2 mb-4">
              <select
                className="border rounded px-3 py-2 w-full"
                value={selectedVariable}
                onChange={(e) => setSelectedVariable(e.target.value)}
              >
                <option value="">-- Select variable --</option>
                {variables.map((variable) => (
                  <option key={variable} value={variable}>
                    {variable}
                  </option>
                ))}
              </select>
              <Button
                className="ml-2 bg-green-700 hover:bg-green-700 text-white"
                onClick={async () => {
                  if (selectedVariable && selectedDatasetId) {
                    console.log("selectedD:", selectedDatasetId);
                    const response = await fetch(
                      "http://localhost:5000/var_acquisition_backend",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          target_variable: selectedVariable,
                          selected_dataset_id: selectedDatasetId,
                        }),
                      }
                    );
                    const result = await response.json();
                    console.log("var_acquisition_backend output:", result);
                    if (result.status === "Scewed_target_column") {
                      console.log("Scewed_target_column print");
                      console.log(showScewedPopup);
                      // Extract the dominant values (>=10% occurrences)
                      if (result.SCEWED_TARGET_COL) {
                        const scewedData = result.SCEWED_TARGET_COL;
                        const dominantVals = scewedData
                          .slice(1) // Skip header row
                          .filter((row: any[]) => row[3] >= 10) // Filter by Occurences (%) >= 10
                          .map((row: any[]) => row[1]); // Get the Value column
                        setDominantValues(dominantVals);
                      }
                      // Save SCEWED_TARGET_COL data if present
                      if (result.SCEWED_TARGET_COL) {
                        setTargetColData(result.SCEWED_TARGET_COL);
                      }
                      setShowScewedPopup(true);
                      console.log(showScewedPopup);
                    }
                    if (result.status === "OK") {
                      setConfirmedTargetVariable(selectedVariable);
                      // Save SCEWED_TARGET_COL data if present
                      if (result.SCEWED_TARGET_COL) {
                        setTargetColData(result.SCEWED_TARGET_COL);
                      }
                      // Save target_type if present
                      if (result.target_type) {
                        setConfirmedTargetType(result.target_type);
                      }
                      // Store message1 and message2 if present
                      if (result.message1) {
                        setMessage1(result.message1);
                      }
                      if (result.message2) {
                        setMessage2(result.message2);
                      }
                      // change status of selected dataset to "active"
                      setImportsData((prev) =>
                        prev.map((dataset) =>
                          dataset.id === selectedDatasetId &&
                          dataset.status === "loaded"
                            ? { ...dataset, status: "active" }
                            : dataset
                        )
                      );
                    }
                  }
                  closeTargetPopup();
                }}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
      {showScewedPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg relative">
            {/* Close button in upper right inside the popup */}
            <button
              className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-600 hover:bg-red-700 border-none outline-none"
              onClick={closeScewedPopup}
              aria-label="Close"
              type="button"
            />
            <p className="mb-4">
              The predicted column concentrate in only two values{" "}
              {dominantValues[0]} and {dominantValues[1]}, do you want to only
              use this?
            </p>
            {targetColData && targetColData.length > 0 && (
              <div className="mb-4 max-h-48 overflow-auto border rounded p-2 bg-gray-50 text-xs">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      {targetColData[0].map((header: string, idx: number) => (
                        <th key={idx} className="px-2 py-1 border-b">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {targetColData.slice(1).map((row: any[], i: number) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} className="px-2 py-1 border-b">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-center gap-4">
              <Button
                className="bg-green-700 hover:bg-green-600 text-white"
                onClick={async () => {
                  console.log("Scewed button: yes");

                  const response = await fetch(
                    "http://localhost:5000/var_acquisition_scewed_yes",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        target_variable: selectedVariable,
                      }),
                    }
                  );
                  const result = await response.json();
                  console.log("YES BUTTON OUTPUT:", result);

                  if (result.status === "OK") {
                    console.log("Scewed_target_column YES print OKKKKKKKKK");
                    console.log(
                      "confirmed target variable:",
                      confirmedTargetVariable
                    );
                    setConfirmedTargetVariable(result.target_variable);
                    // Save SCEWED_TARGET_COL data if present
                    if (result.SCEWED_TARGET_COL) {
                      setTargetColData(result.SCEWED_TARGET_COL);
                    }
                    // Save target_type if present
                    if (result.target_type) {
                      setConfirmedTargetType(result.target_type);
                    }
                    // Store message1 and message2 if present
                    if (result.message1) {
                      setMessage1(result.message1);
                    }
                    if (result.message2) {
                      setMessage2(result.message2);
                    }
                    // change status of selected dataset to "active"
                    setImportsData((prev) =>
                      prev.map((dataset) =>
                        dataset.id === selectedDatasetId &&
                        dataset.status === "loaded"
                          ? { ...dataset, status: "active" }
                          : dataset
                      )
                    );
                    console.log("confirmed type:", confirmedTargetType);
                  }
                  console.log("confirmed type 3:", confirmedTargetType);
                  closeScewedPopup();
                }}
              >
                Yes
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-400 text-white"
                onClick={async () => {
                  console.log("Scewed_target_column NOOO");

                  const response = await fetch(
                    "http://localhost:5000/var_acquisition_scewed_no",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        target_variable: selectedVariable,
                      }),
                    }
                  );
                  const result = await response.json();
                  console.log("NO BUTTON OUTPUT:", result);

                  if (result.status === "OK") {
                    console.log("Scewed_target_column YES print OKKKKKKKKK");
                    console.log(
                      "confirmed target variable:",
                      confirmedTargetVariable
                    );
                    setConfirmedTargetVariable(result.target_variable);
                    // Save SCEWED_TARGET_COL data if present
                    if (result.SCEWED_TARGET_COL) {
                      setTargetColData(result.SCEWED_TARGET_COL);
                    }
                    // Save target_type if present
                    if (result.target_type) {
                      setConfirmedTargetType(result.target_type);
                    }
                    // Store message1 and message2 if present
                    if (result.message1) {
                      setMessage1(result.message1);
                    }
                    if (result.message2) {
                      setMessage2(result.message2);
                    }
                    // change status of selected dataset to "active"
                    setImportsData((prev) =>
                      prev.map((dataset) =>
                        dataset.id === selectedDatasetId &&
                        dataset.status === "loaded"
                          ? { ...dataset, status: "active" }
                          : dataset
                      )
                    );
                    console.log("confirmed type:", confirmedTargetType);
                  }

                  closeScewedPopup();
                }}
              >
                No
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Bounce animation style */}
      <style>
        {`
          .bounce-animate {
            animation: bounce 1s 5;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
        `}
      </style>
      {/* Pulse animation style */}
      <style>
        {`
          .pulse-animate {
            animation: pulse 3s infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.5); }
          }
        `}
      </style>
    </div>
  );
};

export default TablesPage;

// Clear importsData from localStorage on every reload
if (typeof window !== "undefined") {
  localStorage.removeItem("importsData");
}
