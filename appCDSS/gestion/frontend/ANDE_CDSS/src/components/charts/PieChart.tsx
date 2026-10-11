import React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface PieChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
}

const PieChart = ({ 
  data, 
  colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"]
}: PieChartProps) => {
  return (
    <ResponsiveContainer
      width="100%"
      height={200}
      data-id="pie-chart-container"
      data-path="src/components/charts/PieChart.tsx"
    >
      <RechartsPieChart
        data-id="pie-chart"
        data-path="src/components/charts/PieChart.tsx"
      >
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          data-id="pie-slice"
          data-path="src/components/charts/PieChart.tsx"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]}
              data-id={`cell-${index}`}
              data-path="src/components/charts/PieChart.tsx"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: "none",
          }}
          formatter={(value: number, name: string) => [
            value, 
            name
          ]}
          data-id="pie-tooltip"
          data-path="src/components/charts/PieChart.tsx"
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          data-id="pie-legend"
          data-path="src/components/charts/PieChart.tsx"
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

export default PieChart; 