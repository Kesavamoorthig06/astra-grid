import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function BarChart({ prediction, width = 180, height = 120 }) {
  const chartRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartRef.current || !prediction) return;
    
    setLoading(true);
    const loadTimer = setTimeout(() => setLoading(false), 900);

    const riskAnalysis = prediction.risk_analysis || {};
    const hotspotAnalysis = prediction.hotspot_analysis || {};
    
    const categories = [
      'Qualitative Risk',
      'Vendor Risk',
      'Historical Delay',
      'Cost Overrun',
      'Schedule Delay'
    ];
    
    const values = [
      riskAnalysis.qualitative_risk_score || 0,
      riskAnalysis.vendor_risk_score || 0,
      (riskAnalysis.historical_delay_index || 0) / 10,
      (prediction.cost_overrun_percent || 0) / 3,
      (prediction.schedule_delay_days || 0) / 15
    ];

    const colors = values.map(val => {
      if (val <= 3) return '#10b981';
      if (val <= 6) return '#f59e0b';
      return '#ef4444';
    });

    const data = [{
      x: categories,
      y: values,
      type: 'bar',
      marker: {
        color: colors,
        line: { color: '#333', width: 1.5 }
      },
      text: values.map(v => v.toFixed(1)),
      textposition: 'outside',
      hovertemplate: '%{x}<br>Score: %{y:.2f}<extra></extra>'
    }];

    const layout = {
      width,
      height,
      title: { 
        text: 'Risk Factor Comparison', 
        font: { size: 16, weight: 'bold', family: 'Arial, sans-serif' },
        x: 0.5,
        xanchor: 'center'
      },
      xaxis: { 
        title: '', 
        tickangle: -45, 
        gridcolor: 'rgba(128,128,128,0.2)', 
        tickfont: { size: 10, family: 'Arial, sans-serif' },
        automargin: true
      },
      yaxis: { 
        title: { text: 'Risk Score (0-10)', font: { size: 12, family: 'Arial, sans-serif' } }, 
        range: [0, 11], 
        gridcolor: 'rgba(128,128,128,0.2)',
        tickfont: { size: 11, family: 'Arial, sans-serif' },
        automargin: true
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(250,250,250,0.5)',
      font: { size: 11, color: '#333', family: 'Arial, sans-serif' },
      margin: { t: 80, r: 50, b: 105, l: 80 },
      autosize: true,
      shapes: [
        { type: 'line', x0: -0.5, x1: 4.5, y0: 3, y1: 3, line: { color: '#f59e0b', width: 2, dash: 'dash' } },
        { type: 'line', x0: -0.5, x1: 4.5, y0: 6, y1: 6, line: { color: '#ef4444', width: 2, dash: 'dash' } }
      ],
      annotations: [
        { x: 4.2, y: 3.3, text: 'Moderate', showarrow: false, font: { size: 9, color: '#f59e0b', family: 'Arial, sans-serif' } },
        { x: 4.2, y: 6.3, text: 'High Risk', showarrow: false, font: { size: 9, color: '#ef4444', family: 'Arial, sans-serif' } }
      ]
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
          <div className="flex-1 flex items-end justify-around gap-2">
            {[60, 80, 45, 70, 55, 90].map((height, i) => (
              <div key={i} className="bg-gray-200 rounded-t" style={{ height: `${height}%`, width: '14%' }}></div>
            ))}
          </div>
        </div>
      )}
      <div ref={chartRef} className={`w-full h-full transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`} />
    </div>
  );
}
