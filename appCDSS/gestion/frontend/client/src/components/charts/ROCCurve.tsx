import React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  Label,
} from "recharts";

interface ROCDataPoint {
  fpr: number;
  tpr: number;
}

interface ROCCurveProps {
  data: ROCDataPoint[];
  title?: string;
  color?: string;
  auc?: number;
  className?: string;
}

const ROCCurve: React.FC<ROCCurveProps> = ({ 
  data, 
  title = "ROC Curve", 
  color = "#3b82f6",
  auc,
  className = ""
}) => {
  // Log the ROC data points to console
  console.log("ROC Curve Data Points:", data);
  
  // Check for data type issues
  console.log("Data types check:", data.slice(0, 4).map(point => ({
    fpr: typeof point.fpr,
    tpr: typeof point.tpr,
    fprValue: point.fpr,
    tprValue: point.tpr
  })));
  
  return (
    <div className={`bg-white rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {auc && (
          <div className="bg-blue-50 rounded px-3 py-1">
            <span className="text-sm font-medium text-blue-800">
              AUC: {auc.toFixed(3)}
            </span>
          </div>
        )}
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          {/* <XAxis dataKey="fpr" type="number"/> */}
          <XAxis
            dataKey="fpr"
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#666" }}
            domain={[0, 1]}
            tickFormatter={(value) => value.toFixed(1)}
            label={{ value: "False Positive Rate", position: "bottom", offset: 0 }}
          />

          <YAxis
            dataKey="tpr"
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#666" }}
            domain={[0, 1]}
            tickFormatter={(value) => value.toFixed(1)}
          >
            <Label value="True Positive rate" angle= {-90} offset={110} position="insideBottom" />
          </YAxis>

          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              border: "1px solid #e5e7eb",
            }}
            itemStyle={{ color: color }}
            formatter={(value: number, name: string) => [
              value.toFixed(3), 
              name === "tpr" ? "True Positive Rate" : "False Positive Rate"
            ]}
            labelFormatter={(label) => `False Positive Rate: ${label}`}
          />

          {/* Reference line (random classifier) */}
          <ReferenceLine 
            y={0} 
            stroke="#d1d5db" 
            strokeDasharray="3 3" 
            strokeWidth={1}
            ifOverflow="extendDomain"
          />
          <Line
            type="linear"
            dataKey="fpr"
            stroke="#d1d5db"
            strokeDasharray="3 3"
            strokeWidth={1}
            dot={false}
            data={[
              { fpr: 0, tpr: 0 },
              { fpr: 1, tpr: 1 }
            ]}
          />

          <Line
            type="monotone"
            dataKey="tpr"
            stroke={color}
            strokeWidth={2}
            dot={{ stroke: color, strokeWidth: 2, r: 3, fill: "white" }}
            activeDot={{ r: 5, stroke: color, strokeWidth: 2, fill: color }}
            connectNulls={true}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ROCCurve; 