import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function LineChart({ prediction, width = 180, height = 120 }) {
  const chartRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartRef.current || !prediction) return;
    
    setLoading(true);
    const loadTimer = setTimeout(() => setLoading(false), 800);

    const phases = ['Planning', 'Approval', 'Procurement', 'Construction', 'Testing', 'Commissioning'];
    const baselineCost = [5, 15, 30, 65, 85, 100];
    const actualCost = baselineCost.map((val, idx) => 
      val * (1 + (prediction.cost_overrun_percent / 100) * (idx + 1) / 6)
    );

    const data = [
      {
        x: phases,
        y: baselineCost,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Baseline Budget',
        line: { color: '#10b981', width: 3, shape: 'spline' },
        marker: { size: 8, symbol: 'circle', line: { color: '#059669', width: 2 } },
        fill: 'tozeroy',
        fillcolor: 'rgba(16, 185, 129, 0.1)',
        hovertemplate: '<b>%{x}</b><br>Baseline: %{y}%<extra></extra>'
      },
      {
        x: phases,
        y: actualCost,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Projected Actual',
        line: { color: '#ef4444', width: 3, dash: 'dot', shape: 'spline' },
        marker: { size: 8, symbol: 'circle', line: { color: '#dc2626', width: 2 } },
        fill: 'tonexty',
        fillcolor: 'rgba(239, 68, 68, 0.15)',
        hovertemplate: '<b>%{x}</b><br>Projected: %{y:.1f}%<extra></extra>'
      }
    ];

    const layout = {
      width,
      height,
      title: { 
        text: 'Cost Trend Analysis', 
        font: { size: 16, weight: 'bold', family: 'Arial, sans-serif' },
        x: 0.5,
        xanchor: 'center'
      },
      xaxis: { 
        title: { text: 'Project Phase', font: { size: 12, family: 'Arial, sans-serif' } }, 
        gridcolor: 'rgba(128,128,128,0.2)', 
        tickangle: -45,
        tickfont: { size: 10, family: 'Arial, sans-serif' },
        automargin: true
      },
      yaxis: { 
        title: { text: 'Cumulative Cost (%)', font: { size: 12, family: 'Arial, sans-serif' } }, 
        gridcolor: 'rgba(128,128,128,0.2)',
        tickfont: { size: 11, family: 'Arial, sans-serif' },
        automargin: true
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(250,250,250,0.5)',
      font: { size: 11, color: '#333', family: 'Arial, sans-serif' },
      margin: { t: 80, r: 50, b: 100, l: 80 },
      showlegend: true,
      legend: { 
        x: 0.5, 
        y: 1.15, 
        xanchor: 'center',
        orientation: 'h', 
        bgcolor: 'rgba(255,255,255,0.95)', 
        bordercolor: '#ccc', 
        borderwidth: 1,
        font: { size: 10, family: 'Arial, sans-serif' }
      },
      hovermode: 'x unified',
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
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-full bg-gradient-to-t from-gray-200 via-gray-100 to-transparent rounded"></div>
            <div className="flex justify-between">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-3 bg-gray-200 rounded w-12"></div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div ref={chartRef} className={`w-full h-full transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`} />
    </div>
  );
}
