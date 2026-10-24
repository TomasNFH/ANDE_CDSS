import React, { useEffect, useState } from "react";
import {
  Loader2,
  Send,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const iconStyle = { verticalAlign: "middle", marginRight: 6 };

const ModelPredictor = () => {
  const [features, setFeatures] = useState<string[]>([]);
  const [examples, setExamples] = useState<any[]>([]);
  const [inputData, setInputData] = useState<{ [key: string]: string }>({});
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch default model's features and example predictions on mount
  useEffect(() => {
    fetch("/DefaultModel/examples")
      .then(res => res.json())
      .then(data => {
        setExamples(data.examples || []);
        setFeatures(data.features || []);
      })
      .catch(() => setError("Failed to load default model examples"));
  }, []);

  // Handle input change
  const handleInputChange = (feature: string, value: string) => {
    setInputData(prev => ({ ...prev, [feature]: value }));
  };

  // Submit for prediction
  const handleSubmit = () => {
    setLoading(true);
    setError(null);
    fetch(`/DefaultModel/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: inputData }),
    })
      .then(res => res.json())
      .then(setPrediction)
      .catch(() => setError("Prediction failed"))
      .finally(() => setLoading(false));
  };

  return (
    <div style={{
      maxWidth: 900,
      margin: "0 auto",
      padding: 24,
      fontFamily: "Inter, sans-serif"
    }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Send size={24} style={iconStyle} />
        Model Prediction (Default Model)
      </h2>

      {/* Error Message */}
      {error && (
        <div style={{
          color: "#b91c1c",
          background: "#fee2e2",
          padding: 10,
          borderRadius: 6,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <AlertCircle size={18} style={iconStyle} />
          {error}
        </div>
      )}

      {/* Example Table */}
      {examples.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <TableIcon size={18} style={iconStyle} />
            Example of inputs:
          </h4>
          <div style={{
            overflowX: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#fafafa"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {Object.keys(examples[0] || {}).map(key => (
                    <th
                      key={key}
                      style={{
                        padding: "6px 10px",
                        borderBottom: "1px solid #e5e7eb",
                        background: "#f3f4f6",
                        fontWeight: 600,
                        fontSize: 14,
                        textAlign: "left"
                      }}
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {examples.map((row, idx) => (
                  <tr key={idx}>
                    {Object.keys(row).map(key => (
                      <td
                        key={key}
                        style={{
                          padding: "6px 10px",
                          borderBottom: "1px solid #f1f5f9",
                          fontSize: 14
                        }}
                      >
                        {String(row[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Input Form */}
      {features.length > 0 && (
        <div style={{
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          padding: 18,
          marginBottom: 24,
          background: "#f9fafb"
        }}>
          <h4 style={{ marginBottom: 10 }}>Enter input to predict:</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {features.map((feature: string) => (
              <input
                key={feature}
                placeholder={feature}
                value={inputData[feature] || ""}
                onChange={e => handleInputChange(feature, e.target.value)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 15,
                  minWidth: 120
                }}
              />
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              marginTop: 16,
              padding: "8px 18px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            {loading ? <Loader2 size={18} className="spin" style={iconStyle} /> : <Send size={18} style={iconStyle} />}
            Submit
          </button>
        </div>
      )}

      {/* Prediction Output */}
      {prediction && (
        <div style={{
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          padding: 18,
          background: "#f0fdf4",
          color: "#166534",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
          <CheckCircle2 size={22} style={iconStyle} />
          <div>
            <div>
              <b>Prediction:</b> {String(prediction.value)}
            </div>
            <div>
              <b>Probability:</b> {prediction.probability}
            </div>
          </div>
        </div>
      )}
      <style>
        {`
          .spin {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ModelPredictor; 