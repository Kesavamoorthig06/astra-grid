import React, { useEffect } from "react";
import Plotly from "plotly.js-dist-min";

const sampleData = {
  x: ["Metric 1", "Metric 2", "Metric 3"],
  y: [10, 15, 7],
  type: "bar",
  marker: { color: ["#636efa", "#ef553b", "#00cc96"] },
};

const layout = {
  title: "Sample Metrics",
  plot_bgcolor: "#f8fafc",
  paper_bgcolor: "#f8fafc",
  font: { family: "inherit", color: "#22223b" },
};

export default function MetricDashboard() {
  useEffect(() => {
    Plotly.newPlot("metric-plot", [sampleData], layout, {responsive: true});
  }, []);

  return (
    <div style={{ padding: 32, background: "#f8fafc", minHeight: "100vh" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", padding: 16, borderRadius: 12, boxShadow: "0 2px 8px #e0e0e0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo192.png" alt="Logo" style={{ height: 32 }} />
          <span style={{ fontWeight: 700, fontSize: 20 }}>ASTRA GRID</span>
        </div>
        <button style={{ background: "#ef553b", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, cursor: "pointer" }}>Logout</button>
      </nav>
      <div style={{ marginTop: 40 }}>
        <div id="metric-plot" style={{ width: "100%", height: 500 }} />
      </div>
    </div>
  );
}
