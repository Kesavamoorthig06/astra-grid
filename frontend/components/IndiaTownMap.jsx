import React, { useEffect, useRef } from 'react';

const IndiaTownMap = ({ height = 'h-96' }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    // The map HTML file is loaded as an iframe
    // This maintains the full interactive Leaflet functionality
    if (iframeRef.current) {
      iframeRef.current.src = '/india_substations_precise_only.html';
    }
  }, []);

  return (
    <iframe
      ref={iframeRef}
      className={`${height} rounded-lg border border-border/40 w-full`}
      style={{ 
        zIndex: 1,
        borderRadius: '0.5rem'
      }}
      title="India Transmission Network Map"
      frameBorder="0"
      scrolling="no"
    />
  );
};

export default IndiaTownMap;
