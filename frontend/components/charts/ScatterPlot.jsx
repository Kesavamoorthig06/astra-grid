import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function ScatterPlot({ prediction }) {
  const chartRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartRef.current || !prediction) return;
    
    setLoading(true);
    const loadTimer = setTimeout(() => setLoading(false), 850);

    const delayDays = prediction.schedule_delay_days || 0;
    
    const tasks = [
      { task: 'Planning & Design', start: 0, duration: 60, delayed: Math.min(delayDays * 0.1, 15) },
      { task: 'Permit & Approvals', start: 40, duration: 120, delayed: Math.min(delayDays * 0.3, 45) },
      { task: 'Land Acquisition', start: 80, duration: 90, delayed: Math.min(delayDays * 0.2, 30) },
      { task: 'Material Procurement', start: 120, duration: 75, delayed: Math.min(delayDays * 0.15, 20) },
      { task: 'Construction', start: 170, duration: 180, delayed: Math.min(delayDays * 0.25, 60) }
    ];

    const plannedTrace = {
      x: tasks.map(t => t.duration),
      y: tasks.map(t => t.task),
      name: 'Planned Duration',
      orientation: 'h',
      marker: { 
        color: '#10b981', 
        line: { color: '#059669', width: 1.5 } 
      },
      type: 'bar',
      text: tasks.map(t => `${t.duration}d`),
      textposition: 'inside',
      insidetextanchor: 'middle',
      textfont: { color: 'white', size: 10, family: 'Arial, sans-serif' },
      hovertemplate: '<b>%{y}</b><br>Planned: %{x} days<extra></extra>'
    };

    const delayedTrace = {
      x: tasks.map(t => t.delayed),
      y: tasks.map(t => t.task),
      name: 'Delay Period',
      orientation: 'h',
      marker: { 
        color: '#ef4444',
        pattern: { shape: '/', bgcolor: '#fee2e2', fgcolor: '#ef4444', size: 6, solidity: 0.5 },
        line: { color: '#dc2626', width: 1.5 } 
      },
      type: 'bar',
      text: tasks.map(t => t.delayed > 0 ? `+${t.delayed.toFixed(0)}d` : ''),
      textposition: 'inside',
      insidetextanchor: 'middle',
      textfont: { color: 'white', size: 10, family: 'Arial, sans-serif' },
      hovertemplate: '<b>%{y}</b><br>Delay: %{x} days<extra></extra>'
    };

    const data = [plannedTrace, delayedTrace];

    const layout = {
      title: { 
        text: 'Project Schedule Timeline', 
        font: { size: 16, weight: 'bold', family: 'Arial, sans-serif' },
        x: 0.5,
        xanchor: 'center'
      },
      xaxis: { 
        title: { text: 'Timeline (days from start)', font: { size: 12, family: 'Arial, sans-serif' } }, 
        gridcolor: 'rgba(128,128,128,0.2)',
        tickfont: { size: 11, family: 'Arial, sans-serif' },
        automargin: true,
        fixedrange: false
      },
      yaxis: { 
        title: '', 
        autorange: 'reversed', 
        tickfont: { size: 10, family: 'Arial, sans-serif' },
        automargin: true,
        fixedrange: false,
        tickmode: 'linear'
      },
      barmode: 'stack',
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(250,250,250,0.5)',
      font: { size: 11, color: '#333', family: 'Arial, sans-serif' },
      margin: { t: 80, r: 50, b: 50, l: 180 },
      showlegend: true,
      legend: { 
        x: 1.02, 
        y: 0.5, 
        xanchor: 'left',
        yanchor: 'middle',
        orientation: 'v', 
        bgcolor: 'rgba(255,255,255,0.95)', 
        bordercolor: '#ccc', 
        borderwidth: 1,
        font: { size: 9, family: 'Arial, sans-serif' }
      },
      autosize: true,
      hovermode: 'closest',
      bargap: 0.3
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
    <div className="relative w-full h-full" style={{ minHeight: '300px' }}>
      {loading && (
        <div className="absolute inset-0 flex flex-col gap-3 p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto"></div>
          <div className="flex-1 flex flex-col gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div ref={chartRef} className={`w-full h-full transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`} />
    </div>
  );
}
