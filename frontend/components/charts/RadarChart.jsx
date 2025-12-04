import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function RadarChart({ prediction, width = 180, height = 120 }) {
  const chartRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartRef.current || !prediction) return;
    
    setLoading(true);
    const loadTimer = setTimeout(() => setLoading(false), 1200);

    const categories = ['Cost Risk', 'Schedule Risk', 'Technical Risk', 'Resource Risk', 'Quality Risk'];
    const values = [
      Math.min(prediction.cost_overrun_percent, 100),
      Math.min(prediction.schedule_delay_days / 2, 100),
      65,
      55,
      45
    ];
    
    const data = [{
      type: 'scatterpolar',
      r: values,
      theta: categories,
      fill: 'toself',
      name: 'Current Project',
      fillcolor: 'rgba(59, 130, 246, 0.3)',
      line: { color: '#3b82f6', width: 3 },
      marker: { color: '#3b82f6', size: 8, symbol: 'circle' },
      hovertemplate: '<b>%{theta}</b><br>Risk Level: %{r:.1f}%<extra></extra>'
    }];

    const layout = {
      width,
      height,
      title: { 
        text: 'Multi-Metric Risk Analysis', 
        font: { size: 16, weight: 'bold', family: 'Arial, sans-serif' },
        x: 0.5,
        xanchor: 'center'
      },
      polar: {
        radialaxis: {
          visible: true,
          range: [0, 100],
          tickfont: { size: 10, family: 'Arial, sans-serif' },
          gridcolor: 'rgba(128,128,128,0.3)'
        },
        angularaxis: {
          tickfont: { size: 10, family: 'Arial, sans-serif' },
          gridcolor: 'rgba(128,128,128,0.3)'
        },
        bgcolor: 'rgba(250,250,250,0.3)'
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      font: { size: 11, color: '#333', family: 'Arial, sans-serif' },
      margin: { t: 85, r: 100, b: 80, l: 100 },
      showlegend: false,
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
        <div className="absolute inset-0 flex items-center justify-center p-4 animate-pulse">
          <div className="relative w-64 h-64">
            <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto mb-4"></div>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-gray-200"
                style={{
                  width: '2px',
                  height: '50%',
                  left: '50%',
                  top: '50%',
                  transformOrigin: 'top',
                  transform: `rotate(${i * 72}deg)`
                }}
              ></div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 border-4 border-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      )}
      <div ref={chartRef} className={`w-full h-full transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`} />
    </div>
  );
}
