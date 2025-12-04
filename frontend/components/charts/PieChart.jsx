import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function PieChart({ prediction, width = 180, height = 120 }) {
  const chartRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartRef.current || !prediction) return;
    
    setLoading(true);
    const loadTimer = setTimeout(() => setLoading(false), 1000);

    const baseCost = 100;
    const overrun = prediction.cost_overrun_percent || 0;
    const materialEscalation = overrun * 0.4;
    const regulatoryDelay = overrun * 0.25;
    const manpowerCost = overrun * 0.2;
    const weatherImpact = overrun * 0.15;

    const data = [{
      type: 'waterfall',
      orientation: 'v',
      x: ['Base<br>Budget', 'Material<br>Cost', 'Regulatory', 'Manpower', 'Weather', 'Final<br>Cost'],
      y: [baseCost, materialEscalation, regulatoryDelay, manpowerCost, weatherImpact, null],
      measure: ['absolute', 'relative', 'relative', 'relative', 'relative', 'total'],
      text: [
        `₹${baseCost}Cr`,
        `+₹${materialEscalation.toFixed(1)}Cr`,
        `+₹${regulatoryDelay.toFixed(1)}Cr`,
        `+₹${manpowerCost.toFixed(1)}Cr`,
        `+₹${weatherImpact.toFixed(1)}Cr`,
        `₹${(baseCost + overrun).toFixed(1)}Cr`
      ],
      textposition: 'auto',
      textfont: { size: 10, family: 'Arial, sans-serif' },
      connector: { line: { color: '#666', width: 2, dash: 'dot' } },
      decreasing: { marker: { color: '#ef4444', line: { color: '#dc2626', width: 1 } } },
      increasing: { marker: { color: '#f59e0b', line: { color: '#d97706', width: 1 } } },
      totals: { marker: { color: '#8b5cf6', line: { color: '#7c3aed', width: 1 } } },
      hovertemplate: '<b>%{x}</b><br>%{text}<extra></extra>'
    }];

    const layout = {
      width,
      height,
      title: { 
        text: 'Cost Escalation Breakdown', 
        font: { size: 16, weight: 'bold', family: 'Arial, sans-serif' },
        x: 0.5,
        xanchor: 'center'
      },
      xaxis: { 
        title: '', 
        tickangle: 0,
        tickfont: { size: 10, family: 'Arial, sans-serif' },
        automargin: true,
        fixedrange: false
      },
      yaxis: { 
        title: { text: 'Cost (Crores ₹)', font: { size: 12, family: 'Arial, sans-serif' } }, 
        gridcolor: 'rgba(128,128,128,0.2)',
        tickfont: { size: 11, family: 'Arial, sans-serif' },
        automargin: true,
        fixedrange: false,
        range: [0, (baseCost + overrun) * 1.15]
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(250,250,250,0.5)',
      font: { size: 11, color: '#333', family: 'Arial, sans-serif' },
      margin: { t: 100, r: 50, b: 80, l: 80 },
      showlegend: false,
      autosize: true,
      hovermode: 'closest'
    };

    const config = { 
      responsive: true, 
      displayModeBar: false,
      doubleClick: false,
      scrollZoom: false
    };

    // Clean up any existing chart
    Plotly.purge(chartRef.current);
    
    // Create new plot
    Plotly.newPlot(chartRef.current, data, layout, config);

    // Setup resize observer
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
          <div className="flex-1 flex items-end gap-1">
            {[40, 55, -10, 20, 15, 70].map((height, i) => (
              <div key={i} className="bg-gray-200 rounded-t" style={{ height: `${Math.abs(height)}%`, width: '16%' }}></div>
            ))}
          </div>
        </div>
      )}
      <div ref={chartRef} className={`w-full h-full transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`} />
    </div>
  );
}
