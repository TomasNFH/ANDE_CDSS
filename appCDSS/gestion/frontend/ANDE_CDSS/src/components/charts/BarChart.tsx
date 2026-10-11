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

interface BarChartProps {
  data: { name: string; value: number }[];
  color?: string;
  horizontal?: boolean;
}

const BarChart = ({ data, color = "#3b82f6", horizontal = false }: BarChartProps) => {
  return (
    <ResponsiveContainer
      width="100%"
      height={horizontal ? 300 : 400}
      data-id="a3ld01ajn"
      data-path="src/components/charts/BarChart.tsx"
    >
      <RechartsBarChart
        data={data}
        barSize={horizontal ? 20 : 8}
        layout={horizontal ? "horizontal" : "vertical"}
        data-id="o3mqqrvl8"
        data-path="src/components/charts/BarChart.tsx"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={!horizontal}
          horizontal={horizontal}
          stroke="#f0f0f0"
          data-id="75qfb6vvg"
          data-path="src/components/charts/BarChart.tsx"
        />
        <XAxis
          dataKey={horizontal ? "value" : "name"}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          angle={horizontal ? 0 : -45}
          textAnchor="end"
          height={horizontal ? 30 : 80}
          data-id="rup9coffe"
          data-path="src/components/charts/BarChart.tsx"
        />

        <YAxis
          dataKey={horizontal ? "name" : "value"}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10 }}
          domain={horizontal ? [0, "dataMax + 0.1"] : [0, "dataMax + 0.01"]}
          data-id="e8zjyn974"
          data-path="src/components/charts/BarChart.tsx"
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: "none",
          }}
          itemStyle={{ color: color }}
          data-id="bjxmyzcq9"
          data-path="src/components/charts/BarChart.tsx"
        />

        <Bar
          dataKey={horizontal ? "value" : "value"}
          fill={color}
          radius={[4, 4, 0, 0]}
          data-id="xguucdv61"
          data-path="src/components/charts/BarChart.tsx"
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;
