import Plot from 'react-plotly.js';

const modelNames = [
  'GaussianNB',
  'GradientBoostingClassifier',
  'KNeighborsClassifier',
  'LogisticRegression',
  'RandomForestClassifier',
  'SupportVectorClassification'
];

const aucData = [
  [0.8545, 0.8545, 0.5, 0.5, 0.5, 0.5], // GaussianNB
  [0.6545, 0.6909, 0.6727, 0.6727, 0.5, 0.5], // GradientBoostingClassifier
  [0.3909, 0.3909, 0.5, 0.5, 0.4818, 0.4818], // KNeighborsClassifier
  [0.8545, 0.8545, 0.7272, 0.7272, 0.7272, 0.7272], // LogisticRegression
  [0.7090, 0.7090, 0.3272, 0.3272, 0.3272, 0.3272], // RandomForestClassifier
  [0.3818, 0.3818, 0.7818, 0.7818, 0.7636, 0.7636] // SupportVectorClassification
];

const traces = modelNames.map((name, i) => ({
  y: [name],
  x: aucData[i],
  name,
  type: 'box',
  orientation: 'h',
  boxpoints: 'outliers',
  marker: { color: 'gray' }
}));

export default function AUCBoxPlot() {
  return (
    <Plot
      data={traces}
      layout={{
        title: 'AUC Scores by Model',
        xaxis: { title: 'AUC', range: [0.3, 0.9] },
        yaxis: { title: 'Model name' },
        boxmode: 'group',
        height: 400,
        margin: { l: 180, r: 30, t: 40, b: 40 }
      }}
      style={{ width: '100%' }}
      config={{ responsive: true }}
    />
  );
} 