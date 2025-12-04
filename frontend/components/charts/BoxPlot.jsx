import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function BoxPlot({ prediction, width = 180, height = 120 }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !prediction) return;

    // Cost distribution for different project phases
    const data = [
      {
        y: [12, 15, 18, 22, 25, 28, 30, 35, 40],
        name: 'Planning',
        type: 'box',
        marker: { color: '#3b82f6' }
      },
      {
        y: [25, 30, 35, 42, 48, 55, 60, 68, 75],
        name: 'Execution',
        type: 'box',
        marker: { color: '#8b5cf6' }
      },
      {
        y: [8, 10, 12, 15, 18, 20, 22, 25, 28],
        name: 'Testing',
        type: 'box',
        marker: { color: '#ec4899' }
      }
    ];

    const layout = {
      width,
      height,
      title: 'Cost Distribution by Phase',
      yaxis: { title: 'Cost (Million ₹)' },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { size: 10 },
      margin: { t: 40, r: 20, b: 40, l: 50 },
      showlegend: false
    };

    Plotly.newPlot(chartRef.current, data, layout, { responsive: true, displayModeBar: false });
  }, [prediction]);

  return <div ref={chartRef} className="w-full h-full" style={{ width, height, minHeight: height }} />;
}
