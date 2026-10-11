import React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface DataPoint {
  name: string;
  value: number;
}

interface LineChartProps {
  color?: string;
  data?: DataPoint[];
  strokeWidth?: number;
}

const LineChart = ({
  color = "#22c55e",
  strokeWidth = 3,
  data = months.map((month) => ({
    name: month,
    value: Math.floor(Math.random() * 200) + 150,
  })),
}: LineChartProps) => {
  return (
    <ResponsiveContainer
      width="100%"
      height={200}
      data-id="56ilcvcui"
      data-path="src/components/charts/LineChart.tsx"
    >
      <RechartsLineChart
        data={data}
        data-id="s57ln1ueu"
        data-path="src/components/charts/LineChart.tsx"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#f0f0f0"
          data-id="w4ey66kev"
          data-path="src/components/charts/LineChart.tsx"
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          data-id="v48q2tjbm"
          data-path="src/components/charts/LineChart.tsx"
        />

        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          domain={[0, "dataMax + 50"]}
          data-id="tjdbcarnj"
          data-path="src/components/charts/LineChart.tsx"
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: "none",
          }}
          itemStyle={{ color: color }}
          data-id="6eoj0qsyx"
          data-path="src/components/charts/LineChart.tsx"
        />

        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={strokeWidth}
          dot={{ stroke: color, strokeWidth: 2, r: 4, fill: "white" }}
          activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: "white" }}
          data-id="i2ig67ird"
          data-path="src/components/charts/LineChart.tsx"
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};

export default LineChart;
