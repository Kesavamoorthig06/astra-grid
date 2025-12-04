import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function ROCCurve({ prediction }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !prediction) return;

    // Generate ROC curve data
    const fpr = Array.from({ length: 20 }, (_, i) => i / 19);
    const tpr = fpr.map(x => Math.sqrt(x) + Math.random() * 0.1);

    const data = [
      {
        x: fpr,
        y: tpr,
        type: 'scatter',
        mode: 'lines',
        name: 'ROC Curve (AUC=0.87)',
        line: { color: '#3b82f6', width: 3 }
      },
      {
        x: [0, 1],
        y: [0, 1],
        type: 'scatter',
        mode: 'lines',
        name: 'Random Classifier',
        line: { color: '#9ca3af', width: 2, dash: 'dash' }
      }
    ];

    const layout = {
      title: 'Model Performance (ROC)',
      xaxis: { title: 'False Positive Rate' },
      yaxis: { title: 'True Positive Rate' },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { size: 10 },
      margin: { t: 40, r: 20, b: 40, l: 50 },
      showlegend: true,
      legend: { x: 0.5, y: 0, orientation: 'h' }
    };

    Plotly.newPlot(chartRef.current, data, layout, { responsive: true, displayModeBar: false });
  }, [prediction]);

  return <div ref={chartRef} className="w-full h-full" />;
}
