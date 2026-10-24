import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// TableRenderer component using UI Table
const TableRenderer: React.FC<{
  data: any[][];
  title: string;
  onDtale?: () => void;
  onDtaleCasted?: () => void;
}> = ({ data, title, onDtale, onDtaleCasted }) => {
  if (!data || data.length === 0) return null;
  const [headers, ...rows] = data;
  return (
    <Card className="mb-8">
      {(title || onDtale || onDtaleCasted) && (
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {(onDtale || onDtaleCasted) && (
            <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
              {onDtale && (
                <button
                  onClick={onDtale}
                  style={{
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "8px 20px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Dtale
                </button>
              )}
              {onDtaleCasted && (
                <button
                  onClick={onDtaleCasted}
                  style={{
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "8px 20px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Dtale Casted
                </button>
              )}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header: string, idx: number) => (
                <TableHead key={idx}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row: any[], rowIdx: number) => (
              <TableRow key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <TableCell key={cellIdx}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const EdaPage: React.FC = () => {
  const [manualEDA, setManualEDA] = useState<any[][]>([]);
  const [missing4rows, setMissing4rows] = useState<any[][]>([]);
  const [loading, setLoading] = useState(true);
  const [dtaleMsg, setDtaleMsg] = useState<string | null>(null);
  const { collapsed } = useSidebar();

  useEffect(() => {
    fetch("http://localhost:5000/eda")
      .then((response) => response.json())
      .then((data) => {
        setManualEDA(data.manualEDA);
        setMissing4rows(data.missing4rows);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching EDA data:", error);
        setLoading(false);
      });
  }, []);

  const handleDtale = () => {
    setDtaleMsg(null);
    fetch("http://localhost:5000/dtale", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        setDtaleMsg(data.message || "Dtale started!");
        // Optionally, open a new tab if backend returns a URL:
        if (data.url) {
          window.open(data.url, "_blank");
        }
      })
      .catch(() => setDtaleMsg("Failed to start Dtale."));
  };

  const handleDtaleCasted = () => {
    setDtaleMsg(null);
    fetch("http://localhost:5000/dtale_casted", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        setDtaleMsg(data.message || "Dtale Casted started!");
        // Optionally, open a new tab if backend returns a URL:
        if (data.url) {
          window.open(data.url, "_blank");
        }
      })
      .catch(() => setDtaleMsg("Failed to start Dtale Casted."));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <DashboardHeader />
        {dtaleMsg && <div style={{ marginBottom: 16 }}>{dtaleMsg}</div>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <TableRenderer
              data={manualEDA}
              title="Exploratory Data Analysis"
              onDtale={handleDtale}
              onDtaleCasted={handleDtaleCasted}
            />
            {/* <TableRenderer data={missing4rows} title="Missing 4 Rows" /> */}
          </>
        )}
      </div>
    </div>
  );
};

export default EdaPage;
