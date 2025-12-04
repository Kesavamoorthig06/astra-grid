import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function ChoroplethMap({ prediction }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !prediction) return;

    // Indian states risk distribution
    const data = [{
      type: 'choropleth',
      locationmode: 'country names',
      locations: ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan'],
      z: [75, 60, 85, 50, 45],
      text: ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan'],
      colorscale: 'Reds',
      colorbar: { title: 'Risk Level', len: 0.5 }
    }];

    const layout = {
      title: 'Regional Risk Distribution',
      geo: {
        scope: 'asia',
        center: { lon: 78, lat: 22 },
        projection: { type: 'mercator' },
        showland: true,
        landcolor: 'rgb(243, 243, 243)',
        coastlinecolor: 'rgb(204, 204, 204)'
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { size: 10 },
      margin: { t: 40, r: 80, b: 20, l: 20 }
    };

    Plotly.newPlot(chartRef.current, data, layout, { responsive: true, displayModeBar: false });
  }, [prediction]);

  return <div ref={chartRef} className="w-full h-full" />;
}
