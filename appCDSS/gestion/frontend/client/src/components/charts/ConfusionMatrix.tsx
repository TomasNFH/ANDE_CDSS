import React from "react";

interface ConfusionMatrixProps {
  data: number[];
  title: string;
  className?: string;
  positiveLabel?: string;
  negativeLabel?: string;
  classLabels?: string[];
}

const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({
  data,
  title,
  className = "",
  positiveLabel = "Positive",
  negativeLabel = "Negative",
  classLabels = [],
}) => {
  console.log("ConfusionMatrix data input:", data); // <-- Log data input
  // Determine if this is a 2-class or 3-class problem
  const isThreeClass = data.length === 9; // 3x3 matrix = 9 elements
  const isTwoClass = data.length === 4; // 2x2 matrix = 4 elements

  if (!isTwoClass && !isThreeClass) {
    return (
      <div className={`bg-white rounded-lg p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
          {title}
        </h3>
        <div className="text-center text-gray-600">
          Invalid confusion matrix data
        </div>
      </div>
    );
  }

  if (isTwoClass) {
    // Handle 2-class problem (original logic)
    const [TP, FN, FP, TN] = data;

    const total = TP + FN + FP + TN;
    const accuracy = total > 0 ? (((TP + TN) / total) * 100).toFixed(1) : "0.0";
    const precision = TP + FP > 0 ? ((TP / (TP + FP)) * 100).toFixed(1) : "0.0";
    const recall = TP + FN > 0 ? ((TP / (TP + FN)) * 100).toFixed(1) : "0.0";

    return (
      <div className={`bg-white rounded-lg p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
          {title}
        </h3>
        {/* Confusion Matrix Grid */}
        <div className="grid grid-cols-3 gap-1 mb-4">
          {/* Header row */}
          <div className="text-center text-sm font-medium text-gray-600"></div>
          <div className="text-center text-sm font-medium text-gray-600">
            Predicted
          </div>
          <div className="text-center text-sm font-medium text-gray-600"></div>

          {/* Actual vs Predicted labels */}
          <div className="text-center text-sm font-medium text-gray-600">
            Actual
          </div>
          <div className="text-center text-sm font-medium text-gray-600">
            {positiveLabel}
          </div>
          <div className="text-center text-sm font-medium text-gray-600">
            {negativeLabel}
          </div>

          {/* Positive row */}
          <div className="text-center text-sm font-medium text-gray-600">
            {positiveLabel}
          </div>
          <div className="bg-green-100 border border-green-300 rounded p-2 text-center">
            <div className="text-lg font-bold text-green-800">{TP}</div>
            <div className="text-xs text-green-600">TP</div>
          </div>
          <div className="bg-red-100 border border-red-300 rounded p-2 text-center">
            <div className="text-lg font-bold text-red-800">{FN}</div>
            <div className="text-xs text-red-600">FN</div>
          </div>

          {/* Negative row */}
          <div className="text-center text-sm font-medium text-gray-600">
            {negativeLabel}
          </div>
          <div className="bg-red-100 border border-red-300 rounded p-2 text-center">
            <div className="text-lg font-bold text-red-800">{FP}</div>
            <div className="text-xs text-red-600">FP</div>
          </div>
          <div className="bg-green-100 border border-green-300 rounded p-2 text-center">
            <div className="text-lg font-bold text-green-800">{TN}</div>
            <div className="text-xs text-green-600">TN</div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 rounded p-2">
            <div className="text-sm font-medium text-blue-800">Accuracy</div>
            <div className="text-lg font-bold text-blue-900">{accuracy}%</div>
          </div>
          <div className="bg-purple-50 rounded p-2">
            <div className="text-sm font-medium text-purple-800">Precision</div>
            <div className="text-lg font-bold text-purple-900">
              {precision}%
            </div>
          </div>
          <div className="bg-orange-50 rounded p-2">
            <div className="text-sm font-medium text-orange-800">Recall</div>
            <div className="text-lg font-bold text-orange-900">{recall}%</div>
          </div>
        </div>
      </div>
    );
  }

  // Handle 3-class problem
  const matrix = [
    [data[0], data[1], data[2]], // Row 1: Class 1 predictions
    [data[3], data[4], data[5]], // Row 2: Class 2 predictions
    [data[6], data[7], data[8]], // Row 3: Class 3 predictions
  ];

  // Calculate metrics for 3-class problem
  const total = data.reduce((sum, val) => sum + val, 0);
  const accuracy =
    total > 0
      ? (((data[0] + data[4] + data[8]) / total) * 100).toFixed(1)
      : "0.0";

  // Calculate per-class precision and recall
  const class1Precision =
    data[0] + data[3] + data[6] > 0
      ? ((data[0] / (data[0] + data[3] + data[6])) * 100).toFixed(1)
      : "0.0";
  const class2Precision =
    data[1] + data[4] + data[7] > 0
      ? ((data[4] / (data[1] + data[4] + data[7])) * 100).toFixed(1)
      : "0.0";
  const class3Precision =
    data[2] + data[5] + data[8] > 0
      ? ((data[8] / (data[2] + data[5] + data[8])) * 100).toFixed(1)
      : "0.0";

  const class1Recall =
    data[0] + data[1] + data[2] > 0
      ? ((data[0] / (data[0] + data[1] + data[2])) * 100).toFixed(1)
      : "0.0";
  const class2Recall =
    data[3] + data[4] + data[5] > 0
      ? ((data[4] / (data[3] + data[4] + data[5])) * 100).toFixed(1)
      : "0.0";
  const class3Recall =
    data[6] + data[7] + data[8] > 0
      ? ((data[8] / (data[6] + data[7] + data[8])) * 100).toFixed(1)
      : "0.0";

  // Use provided labels or default to Class 1, Class 2, Class 3
  const labels =
    classLabels.length >= 3
      ? classLabels.slice(0, 3)
      : ["Class 1", "Class 2", "Class 3"];

  return (
    <div className={`bg-white rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
        {title}
      </h3>

      {/* 3x3 Confusion Matrix Grid */}
      <div className="grid grid-cols-5 gap-1 mb-4">
        {/* Header row */}
        <div className="text-center text-sm font-medium text-gray-600"></div>
        <div className="text-center text-sm font-medium text-gray-600"></div>
        <div className="text-center text-sm font-medium text-gray-600"></div>
        <div className="text-center text-sm font-medium text-gray-600">
          Predicted
        </div>
        <div className="text-center text-sm font-medium text-gray-600"></div>

        {/* Actual vs Predicted labels */}
        <div className="flex items-center justify-center">
          <span className="text-center text-sm font-medium text-gray-600"></span>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-center text-sm font-medium text-gray-600"></span>
        </div>
        <div className="text-center text-sm font-medium text-gray-600">
          {labels[0]}
        </div>
        <div className="text-center text-sm font-medium text-gray-600">
          {labels[1]}
        </div>
        <div className="text-center text-sm font-medium text-gray-600">
          {labels[2]}
        </div>

        {/* Matrix rows */}
        {matrix.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            <span className="flex items-center justify-center text-center text-sm font-medium text-gray-600">
              {rowIndex === 1 ? (
                <span
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    display: "inline-block",
                    marginRight: "-60px",
                  }}
                >
                  Actual
                </span>
              ) : (
                ""
              )}
            </span>
            <div className="flex items-center justify-center text-center text-sm font-medium text-gray-600">
              {labels[rowIndex]}
            </div>
            {row.map((cell, colIndex) => {
              const isDiagonal = rowIndex === colIndex;
              const bgColor = isDiagonal
                ? "bg-green-100 border-green-300"
                : "bg-red-100 border-red-300";
              const textColor = isDiagonal ? "text-green-800" : "text-red-800";
              const labelColor = isDiagonal ? "text-green-600" : "text-red-600";

              return (
                <div
                  key={colIndex}
                  className={`${bgColor} border rounded p-2 text-center`}
                >
                  <div className={`text-lg font-bold ${textColor}`}>{cell}</div>
                  {/* <div className={`text-xs ${labelColor}`}> */}
                  {/* {isDiagonal ? "TP" : "FP/FN"} */}
                  {/* </div> */}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Metrics for 3-class problem */}
      <div className="grid grid-cols-5 mt-2 mb-1">
        <div></div>
        <div></div>
        <div></div>
        <div className="flex justify-center">
          <div className="bg-blue-50 rounded p-2" style={{ maxWidth: "200px" }}>
            <div className="text-sm font-medium text-blue-800">Accuracy</div>
            <div className="text-lg font-bold text-blue-900">{accuracy}%</div>
          </div>
        </div>
        <div></div>
      </div>
    </div>
  );
};

export default ConfusionMatrix;
