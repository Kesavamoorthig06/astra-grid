import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function Heatmap({ prediction, width = 180, height = 120 }) {
  const chartRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartRef.current || !prediction) return;
    
    setLoading(true);
    const loadTimer = setTimeout(() => setLoading(false), 1100);

    const zValues = [
      [1, 2, 3, 4, 5],
      [2, 4, 6, 8, 10],
      [3, 6, 9, 12, 15],
      [4, 8, 12, 16, 20],
      [5, 10, 15, 20, 25]
    ];

    const data = [{
      z: zValues,
      x: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
      y: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
      type: 'heatmap',
      colorscale: 'RdYlGn',
      reversescale: true,
      showscale: true,
      colorbar: { 
        title: { text: 'Risk<br>Score', side: 'right' },
        len: 0.6,
        thickness: 15,
        tickfont: { size: 10, family: 'Arial, sans-serif' },
        titlefont: { size: 11, family: 'Arial, sans-serif' }
      },
      hovertemplate: '<b>Impact: %{x}</b><br>Likelihood: %{y}<br>Risk Score: %{z}<extra></extra>',
      text: zValues,
      texttemplate: '%{z}',
      textfont: { size: 10, family: 'Arial, sans-serif' }
    }];

    const layout = {
      width,
      height,
      title: { 
        text: 'Risk Impact Matrix', 
        font: { size: 16, weight: 'bold', family: 'Arial, sans-serif' },
        x: 0.5,
        xanchor: 'center'
      },
      xaxis: { 
        title: { text: 'Impact', font: { size: 12, family: 'Arial, sans-serif' } }, 
        side: 'bottom', 
        tickangle: -45, 
        tickfont: { size: 9, family: 'Arial, sans-serif' },
        automargin: true
      },
      yaxis: { 
        title: { text: 'Likelihood', font: { size: 12, family: 'Arial, sans-serif' } }, 
        tickfont: { size: 9, family: 'Arial, sans-serif' },
        automargin: true
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(250,250,250,0.5)',
      font: { size: 11, color: '#333', family: 'Arial, sans-serif' },
      margin: { t: 80, r: 120, b: 100, l: 100 },
      autosize: true
    };

    const config = { 
      responsive: true, 
      displayModeBar: false,
      doubleClick: false,
      scrollZoom: false
    };

    Plotly.purge(chartRef.current);
    Plotly.newPlot(chartRef.current, data, layout, config);

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    resizeObserverRef.current = new ResizeObserver(() => {
      if (chartRef.current && chartRef.current.layout) {
        Plotly.Plots.resize(chartRef.current);
      }
    });

    resizeObserverRef.current.observe(chartRef.current);

    return () => {
      clearTimeout(loadTimer);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [prediction]);

  return (
    <div className="relative w-full h-full" style={{ width, height, minHeight: height }}>
      {loading && (
        <div className="absolute inset-0 flex flex-col gap-3 p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto"></div>
          <div className="flex-1 grid grid-cols-5 gap-2">
            {[...Array(25)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      )}
      <div ref={chartRef} className={`w-full h-full transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`} />
    </div>
  );
}
