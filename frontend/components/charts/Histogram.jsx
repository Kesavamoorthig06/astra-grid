import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function Histogram({ prediction }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !prediction) return;

    // Generate delay frequency distribution
    const delays = Array.from({ length: 100 }, () => 
      Math.random() * prediction.schedule_delay_days * 2
    );

    const data = [{
      x: delays,
      type: 'histogram',
      marker: {
        color: '#8b5cf6',
        line: { color: '#6d28d9', width: 1 }
      },
      nbinsx: 15
    }];

    const layout = {
      title: 'Schedule Delay Frequency',
      xaxis: { title: 'Delay (days)' },
      yaxis: { title: 'Frequency' },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { size: 10 },
      margin: { t: 40, r: 20, b: 40, l: 50 }
    };

    Plotly.newPlot(chartRef.current, data, layout, { responsive: true, displayModeBar: false });
  }, [prediction]);

  return <div ref={chartRef} className="w-full h-full" />;
}
