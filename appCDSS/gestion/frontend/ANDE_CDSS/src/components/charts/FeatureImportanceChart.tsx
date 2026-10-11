import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface FeatureImportanceData {
  name: string;
  value: number;
}

interface FeatureImportanceChartProps {
  data: FeatureImportanceData[];
  title?: string;
  color?: string;
}

const FeatureImportanceChart = ({ 
  data, 
  title = "Feature Importance", 
  color = "#000000" 
}: FeatureImportanceChartProps) => {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <RechartsBarChart
          data={data}
          barSize={12}
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#666" }}
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
          />

          <YAxis
            dataKey="value"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#666" }}
            domain={[0, "dataMax"]}
            tickFormatter={(value) => value.toFixed(4)}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              border: "1px solid #e5e7eb",
            }}
            itemStyle={{ color: color }}
            formatter={(value: number) => [value.toFixed(6), "Importance"]}
            labelStyle={{ fontWeight: "bold" }}
          />

          <Bar
            dataKey="value"
            fill={color}
            radius={[4, 4, 0, 0]}
            stroke={color}
            strokeWidth={1}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FeatureImportanceChart; 