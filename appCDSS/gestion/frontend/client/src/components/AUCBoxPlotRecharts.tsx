import React from "react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ComposedChart,
  Customized
} from "recharts";

// Helper to compute box plot stats
function getBoxPlotStats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q2 = sorted[Math.floor(sorted.length * 0.5)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return { min, q1, q2, q3, max };
}

const modelNames = [
  "GaussianNB",
  "GradientBoostingClassifier",
  "KNeighborsClassifier",
  "LogisticRegression",
  "RandomForestClassifier",
  "SupportVectorClassification"
];

const aucData = [
  [0.8545, 0.8545, 0.5, 0.5, 0.5, 0.5], // GaussianNB
  [0.6545, 0.6909, 0.6727, 0.6727, 0.5, 0.5], // GradientBoostingClassifier
  [0.3909, 0.3909, 0.5, 0.5, 0.4818, 0.4818], // KNeighborsClassifier
  [0.8545, 0.8545, 0.7272, 0.7272, 0.7272, 0.7272], // LogisticRegression
  [0.7090, 0.7090, 0.3272, 0.3272, 0.3272, 0.3272], // RandomForestClassifier
  [0.3818, 0.3818, 0.7818, 0.7818, 0.7636, 0.7636] // SupportVectorClassification
];

// Prepare data for Recharts
const data = modelNames.map((name, i) => ({
  name,
  ...getBoxPlotStats(aucData[i]),
  values: aucData[i]
}));

// Custom renderer for all box plots
const renderBoxPlots = (props: any) => {
  const { xAxisMap, yAxisMap, data } = props;
  // Check for empty data
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('AUCBoxPlotRecharts: No data provided to box plot renderer.');
    return null;
  }
  // Check parent container size (if possible)
  if (typeof window !== 'undefined') {
    const chartRoot = document.querySelector('.recharts-wrapper');
    if (chartRoot) {
      const rect = chartRoot.getBoundingClientRect();
      if (rect.height === 0) {
        console.warn('AUCBoxPlotRecharts: Chart container has zero height.');
      }
    }
  }
  if (!xAxisMap || !yAxisMap) return null;
  const xAxis = Object.values(xAxisMap)[0] as any;
  const yAxis = Object.values(yAxisMap)[0] as any;
  if (!xAxis || !yAxis || !xAxis.scale || !yAxis.scale) {
    console.warn('Missing axis or scale', { xAxis, yAxis });
    return null;
  }
  const xScale = xAxis.scale;
  const yScale = yAxis.scale;
  let bandWidth = 40;
  // More robust fallback for bandWidth
  if (typeof yScale.bandwidth === 'function') {
    bandWidth = yScale.bandwidth();
    if (!bandWidth || bandWidth <= 0) {
      // Try to estimate based on chart height and number of categories
      const chartHeight = (typeof window !== 'undefined') ? (document.querySelector('.recharts-wrapper')?.getBoundingClientRect().height || 400) : 400;
      bandWidth = Math.max(20, Math.floor(chartHeight / data.length) - 10);
      console.warn('yScale.bandwidth() returned', bandWidth, '(fallback estimate based on chart height)');
    }
  } else {
    // Try to estimate based on chart height and number of categories
    const chartHeight = (typeof window !== 'undefined') ? (document.querySelector('.recharts-wrapper')?.getBoundingClientRect().height || 400) : 400;
    bandWidth = Math.max(20, Math.floor(chartHeight / data.length) - 10);
    console.warn('yScale.bandwidth is not a function', yScale, '(fallback estimate based on chart height)');
  }

  // Make boxes slimmer: use 60% of bandWidth and center them
  const boxHeightRatio = 0.6;
  const boxHeight = bandWidth * boxHeightRatio;
  const boxYOffset = (bandWidth - boxHeight) / 2;

  return (
    <g>
      {data.map((entry: any, idx: number) => {
        if (!entry) return null;
        const yVal = yScale(entry.name);
        if (typeof yVal !== 'number') {
          console.warn('Invalid yScale for', entry.name, yVal);
          return null;
        }
        // Center the box in the band
        const boxY = yVal + boxYOffset;
        const centerY = yVal + bandWidth / 2;
        const xMin = xScale(entry.min);
        const xQ1 = xScale(entry.q1);
        const xQ2 = xScale(entry.q2);
        const xQ3 = xScale(entry.q3);
        const xMax = xScale(entry.max);
        console.log('BoxPlot', entry.name, {
          data: { min: entry.min, q1: entry.q1, q2: entry.q2, q3: entry.q3, max: entry.max },
          pixels: { xMin, xQ1, xQ2, xQ3, xMax },
          centerY, boxY, boxHeight
        });
        let boxPixelWidth = xQ3 - xQ1;
        if (boxPixelWidth < 2) boxPixelWidth = 2; // Minimum visible width
        if ([xMin, xQ1, xQ2, xQ3, xMax].some(v => typeof v !== 'number' || isNaN(v))) {
          console.warn('Invalid xScale for', entry.name, { xMin, xQ1, xQ2, xQ3, xMax });
          return null;
        }
        return (
          <g key={entry.name}>
            {/* Whiskers */}
            <line x1={xMin} x2={xQ1} y1={centerY} y2={centerY} stroke="black" />
            <line x1={xQ3} x2={xMax} y1={centerY} y2={centerY} stroke="black" />
            {/* Whisker caps */}
            <line x1={xMin} x2={xMin} y1={centerY - boxHeight / 4} y2={centerY + boxHeight / 4} stroke="black" />
            <line x1={xMax} x2={xMax} y1={centerY - boxHeight / 4} y2={centerY + boxHeight / 4} stroke="black" />
            {/* Box */}
            <rect
              x={xQ1}
              y={boxY}
              width={boxPixelWidth}
              height={boxHeight}
              fill="#888"
              opacity={0.7}
              stroke="black"
              strokeWidth={2}
            />
            {/* Median */}
            <line x1={xQ2} x2={xQ2} y1={boxY} y2={boxY + boxHeight} stroke="black" strokeWidth={2} />
          </g>
        );
      })}
    </g>
  );
};

const AUCBoxPlotRecharts: React.FC = () => (
  <ResponsiveContainer width="100%" height={400}>
    <ComposedChart
      layout="vertical"
      data={data}
      margin={{ top: 20, right: 10, left: 100, bottom: 20 }}
    >
      <XAxis
        type="number"
        domain={[0, 1]}
        label={{ value: "AUC", position: "insideBottom", offset: -10 }}
      />
      <YAxis
        type="category"
        dataKey="name"
        label={{ value: "", angle: -90, position: "insideLeft" }}
        padding={{ top: 1, bottom: 70 }}
      />
      <Tooltip
        formatter={(value: any, name: any, props: any) => value.toFixed ? value.toFixed(3) : value}
        labelFormatter={(label) => `Model: ${label}`}
      />
      <Customized component={renderBoxPlots} />
    </ComposedChart>
  </ResponsiveContainer>
);

export default AUCBoxPlotRecharts; 