import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import Plot from 'react-plotly.js';

const ComprehensivePowerGridDashboard = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentFact, setCurrentFact] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch and process data from backend
    const fetchDashboardData = async () => {
      try {
        console.log('Fetching dashboard data from API...');
        const response = await fetch('/api/dashboard/metrics', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('API Error:', response.status);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        
        if (result.status === 'success' && result.data) {
          console.log('✓ Dashboard data loaded from API');
          setDashboardData(result.data);
        } else {
          console.log('⚠ API returned success=false, using fallback data');
          setDashboardData(generateDummyData());
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        console.log('⚠ API not available, using fallback data');
        // Load dummy data as fallback
        setDashboardData(generateDummyData());
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Did You Know Facts
  const didYouKnowFacts = [
    "India operates the world's largest synchronized grid with 'One Nation, One Grid, One Frequency' at 50 Hz!",
    "POWERGRID manages over 1.8 million kilometers of transmission lines across India.",
    "765 kV transmission lines can carry electricity over 1,000 km with minimal losses.",
    "The average cost overrun in transmission projects is 23%, mainly due to RoW delays.",
    "Transmission projects in hilly terrain take 2.1x longer than in plain regions.",
    "India's renewable energy capacity has grown from 32 GW in 2014 to over 150 GW in 2024.",
    "Grid reliability in India reaches 99.93%, one of the best globally.",
    "HVDC transmission lines are 30% more expensive but handle ultra-long distances efficiently.",
    "Environmental clearances add 6-8 months to typical transmission project timelines.",
    "Transmission losses in India average 4-5%, among the lowest in the world.",
    "A single 765 kV line tower can weigh over 500 tons and reach 100+ meters height.",
    "India's grid experiences peak demand of 220+ GW during summer evenings.",
    "Submarine cables connecting islands operate at 400 kV and 220 kV levels.",
    "Cybersecurity monitoring of the grid is 24/7/365 to prevent blackouts.",
    "Smart grid technology is being deployed on 100 million smart meters across India.",
    "Renewable energy integration requires advanced forecasting to maintain grid stability.",
    "Transmission corridors pass through 8 different terrains: plains, hills, mountains, forests, deserts, plateaus, coasts, and marshlands.",
    "Project delays cost approximately ₹500 crores per month in unrealized revenue.",
    "Compensation for affected communities in transmission projects averages ₹2-5 crores per substation.",
    "Transmission lines operate at frequencies synchronized within ±0.05 Hz of 50 Hz standard.",
    "Battery energy storage systems are being deployed at 500+ substations for grid stabilization.",
    "Phasor Measurement Units (PMUs) at 4,000+ substations provide real-time grid health data.",
    "Electric Vehicle charging infrastructure requires 50+ MW additional substation capacity per city.",
    "Underground cables eliminate visual impact but cost 5-10x more than overhead lines.",
    "Fiber optic communication on transmission towers enables real-time monitoring and control.",
    "Grid operators respond to disturbances in milliseconds using automated systems.",
    "India's transmission network prevents 8,000+ potential blackouts annually.",
    "Solar and wind farms require 40-50 additional MW of transmission capacity per 100 MW of generation.",
    "Transmission tower foundations go 20-30 meters deep in weak soil conditions.",
    "India's grid synchronization allows trading of power between states in real-time."
  ];

  const nextFact = () => {
    setCurrentFact((prev) => (prev + 1) % didYouKnowFacts.length);
  };

  const prevFact = () => {
    setCurrentFact((prev) => (prev - 1 + didYouKnowFacts.length) % didYouKnowFacts.length);
  };

  // Data for all charts
  const generateDummyData = () => ({
    renewableGrowth: [
      { year: 2020, Biomass: 5, Hydro: 45, Wind: 28, Solar: 32 },
      { year: 2021, Biomass: 6, Hydro: 48, Wind: 35, Solar: 45 },
      { year: 2022, Biomass: 7, Hydro: 50, Wind: 42, Solar: 58 },
      { year: 2023, Biomass: 8, Hydro: 52, Wind: 48, Solar: 75 },
      { year: 2024, Biomass: 9, Hydro: 54, Wind: 55, Solar: 95 },
      { year: 2025, Biomass: 10, Hydro: 56, Wind: 62, Solar: 120 }
    ],
    transmissionVsDistribution: [
      { region: 'Andhra', Transmission: 4.2, Distribution: 8.5 },
      { region: 'Gujarat', Transmission: 3.8, Distribution: 7.2 },
      { region: 'Haryana', Transmission: 4.5, Distribution: 9.8 },
      { region: 'Karnataka', Transmission: 3.9, Distribution: 8.1 },
      { region: 'Maharashtra', Transmission: 5.1, Distribution: 11.2 },
      { region: 'Punjab', Transmission: 3.6, Distribution: 7.5 },
      { region: 'Rajasthan', Transmission: 4.1, Distribution: 8.9 },
      { region: 'Tamil Nadu', Transmission: 4.3, Distribution: 9.3 }
    ],
    loadProfile: [
      { time: '00:00', Weekday: 110, Weekend: 95, Industrial: 85 },
      { time: '03:00', Weekday: 100, Weekend: 88, Industrial: 75 },
      { time: '06:00', Weekday: 135, Weekend: 105, Industrial: 95 },
      { time: '09:00', Weekday: 185, Weekend: 140, Industrial: 165 },
      { time: '12:00', Weekday: 210, Weekend: 165, Industrial: 200 },
      { time: '15:00', Weekday: 195, Weekend: 155, Industrial: 185 },
      { time: '18:00', Weekday: 220, Weekend: 180, Industrial: 210 },
      { time: '21:00', Weekday: 170, Weekend: 145, Industrial: 155 },
      { time: '24:00', Weekday: 120, Weekend: 100, Industrial: 90 }
    ],
    equipmentHealth: [
      { name: 'Healthy', value: 94.4, fill: '#374151' },
      { name: 'Under Maintenance', value: 3.7, fill: '#9ca3af' },
      { name: 'Critical', value: 1.87, fill: '#1f2937' }
    ],
    capacityMix: [
      { source: 'Coal', capacity: 200 },
      { source: 'Hydro', capacity: 47 },
      { source: 'Solar', capacity: 72 },
      { source: 'Wind', capacity: 41 },
      { source: 'Nuclear', capacity: 8 },
      { source: 'Gas', capacity: 30 },
      { source: 'Biomass', capacity: 12 }
    ],
    carbonEmissions: [
      { source: 'Coal', emissions: 820 },
      { source: 'Thermal', emissions: 12 },
      { source: 'Gas', emissions: 8 },
      { source: 'Wind', emissions: 2 },
      { source: 'Biomass', emissions: 5 },
      { source: 'Nuclear', emissions: 0 },
      { source: 'Gas', emissions: 420 },
      { source: 'Biomass', emissions: 180 }
    ],
    financialTrends: [
      { quarter: 'Q1 2024', Revenue: 12000, Expenditure: 9500, 'Net Profit': 2500 },
      { quarter: 'Q2 2024', Revenue: 13200, Expenditure: 10200, 'Net Profit': 3000 },
      { quarter: 'Q3 2024', Revenue: 14500, Expenditure: 11000, 'Net Profit': 3500 },
      { quarter: 'Q4 2024', Revenue: 15800, Expenditure: 11800, 'Net Profit': 4000 },
      { quarter: 'Q1 2025', Revenue: 16500, Expenditure: 12500, 'Net Profit': 4000 }
    ],
    gridAvailability: [
      { value: 99.93, change: 0.08 }
    ],
    regionalPerformance: [
      { region: 'North', generation: 45200, consumption: 42100, surplus: 3100 },
      { region: 'South', generation: 38900, consumption: 36500, surplus: 2400 },
      { region: 'East', generation: 29500, consumption: 27800, surplus: 1700 },
      { region: 'West', generation: 42800, consumption: 40200, surplus: 2600 }
    ],
    energySourcePerformance: [
      { source: 'Coal', capacity: 205000, generation: 980000, efficiency: 38 },
      { source: 'Hydro', capacity: 46850, generation: 156000, efficiency: 85 },
      { source: 'Solar', capacity: 72000, generation: 90000, efficiency: 22 },
      { source: 'Wind', capacity: 41000, generation: 68000, efficiency: 35 }
    ],
    substationVoltage: [
      { station: 'Delhi', '400kV': 234, '220kV': 198 },
      { station: 'Mumbai', '400kV': 245, '220kV': 212 },
      { station: 'Bangalore', '400kV': 228, '220kV': 205 },
      { station: 'Chennai', '400kV': 240, '220kV': 215 },
      { station: 'Kolkata', '400kV': 232, '220kV': 200 },
      { station: 'Hyderabad', '400kV': 238, '220kV': 210 },
      { station: 'Pune', '400kV': 235, '220kV': 207 },
      { station: 'Ahmedabad', '400kV': 240, '220kV': 213 }
    ],
    gridReliability: [
      { month: 'May', 'Availability %': 99.8, Outages: 10 },
      { month: 'Jun', 'Availability %': 99.65, Outages: 12 },
      { month: 'Jul', 'Availability %': 99.4, Outages: 14 },
      { month: 'Aug', 'Availability %': 99.75, Outages: 11 },
      { month: 'Sep', 'Availability %': 99.45, Outages: 13 },
      { month: 'Oct', 'Availability %': 99.35, Outages: 15 },
      { month: 'Nov', 'Availability %': 99.65, Outages: 12 },
      { month: 'Dec', 'Availability %': 99.4, Outages: 14 },
      { month: 'Jan', 'Availability %': 99.8, Outages: 9 },
      { month: 'Feb', 'Availability %': 99.4, Outages: 15 },
      { month: 'Mar', 'Availability %': 99.2, Outages: 17 },
      { month: 'Apr', 'Availability %': 99.5, Outages: 11 }
    ]
  });

  // Chart slides
  const slides = [
    {
      title: "RENEWABLE ENERGY GROWTH (MW)",
      component: (data) => (
        <Plot
          data={[
            { x: data.renewableGrowth.map(d => d.year), y: data.renewableGrowth.map(d => d.Biomass), name: 'Biomass', type: 'bar', marker: { color: '#e5e7eb' } },
            { x: data.renewableGrowth.map(d => d.year), y: data.renewableGrowth.map(d => d.Hydro), name: 'Hydro', type: 'bar', marker: { color: '#9ca3af' } },
            { x: data.renewableGrowth.map(d => d.year), y: data.renewableGrowth.map(d => d.Wind), name: 'Wind', type: 'bar', marker: { color: '#4b5563' } },
            { x: data.renewableGrowth.map(d => d.year), y: data.renewableGrowth.map(d => d.Solar), name: 'Solar', type: 'bar', marker: { color: '#1f2937' } }
          ]}
          layout={{
            barmode: 'stack',
            plot_bgcolor: '#fafafa',
            paper_bgcolor: '#fafafa',
            font: { color: '#1a2744', family: 'Arial, sans-serif' },
            showlegend: true,
            height: 300,
            margin: { t: 20, b: 40, l: 50, r: 20 }
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: "TRANSMISSION VS DISTRIBUTION LOSSES (%)",
      component: (data) => (
        <Plot
          data={[
            { x: data.transmissionVsDistribution.map(d => d.region), y: data.transmissionVsDistribution.map(d => d.Transmission), name: 'Transmission', type: 'bar', marker: { color: '#374151' } },
            { x: data.transmissionVsDistribution.map(d => d.region), y: data.transmissionVsDistribution.map(d => d.Distribution), name: 'Distribution', type: 'bar', marker: { color: '#9ca3af' } }
          ]}
          layout={{
            barmode: 'group',
            plot_bgcolor: '#fafafa',
            paper_bgcolor: '#fafafa',
            font: { color: '#1a2744', family: 'Arial, sans-serif' },
            showlegend: true,
            height: 300,
            margin: { t: 20, b: 60, l: 50, r: 20 }
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: "24-HOUR LOAD PROFILE",
      component: (data) => (
        <Plot
          data={[
            { x: data.loadProfile.map(d => d.time), y: data.loadProfile.map(d => d.Weekday), name: 'Weekday', type: 'scatter', mode: 'lines+markers', line: { color: '#111827', width: 3 } },
            { x: data.loadProfile.map(d => d.time), y: data.loadProfile.map(d => d.Weekend), name: 'Weekend', type: 'scatter', mode: 'lines+markers', line: { color: '#6b7280', width: 3 } },
            { x: data.loadProfile.map(d => d.time), y: data.loadProfile.map(d => d.Industrial), name: 'Industrial', type: 'scatter', mode: 'lines', line: { color: '#d1d5db', width: 2, dash: 'dash' } }
          ]}
          layout={{
            plot_bgcolor: '#fafafa',
            paper_bgcolor: '#fafafa',
            font: { color: '#1a2744', family: 'Arial, sans-serif' },
            showlegend: true,
            height: 300,
            margin: { t: 20, b: 40, l: 50, r: 20 }
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: "EQUIPMENT HEALTH STATUS",
      component: (data) => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Plot
            data={[{
              labels: data.equipmentHealth.map(d => d.name),
              values: data.equipmentHealth.map(d => d.value),
              type: 'pie',
              hole: 0.4,
              marker: { colors: data.equipmentHealth.map(d => d.fill) }
            }]}
            layout={{
              plot_bgcolor: '#fafafa',
              paper_bgcolor: '#fafafa',
              font: { color: '#1a2744', family: 'Arial, sans-serif' },
              showlegend: true,
              height: 300,
              margin: { t: 0, b: 0, l: 0, r: 0 }
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '300px' }}
          />
          <div style={{ marginLeft: 40, textAlign: 'center' }}>
            <h3 style={{ fontSize: 32, fontWeight: 'bold', color: '#4ade80' }}>94.4%</h3>
            <p style={{ color: '#4ade80', marginTop: 8 }}>Healthy</p>
          </div>
        </div>
      )
    },
    {
      title: "ENERGY SOURCE CAPACITY MIX",
      component: (data) => (
        <Plot
          data={[{
            x: data.capacityMix.map(d => d.source),
            y: data.capacityMix.map(d => d.capacity),
            name: 'Capacity',
            type: 'scatter',
            mode: 'lines',
            fill: 'tozeroy',
            line: { color: '#f59e0b', width: 2 },
            fillcolor: 'rgba(251, 191, 36, 0.3)'
          }]}
          layout={{
            plot_bgcolor: '#fafafa',
            paper_bgcolor: '#fafafa',
            font: { color: '#1a2744', family: 'Arial, sans-serif' },
            showlegend: true,
            height: 300,
            margin: { t: 20, b: 40, l: 50, r: 20 }
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: "CARBON EMISSIONS BY SOURCE (G CO₂/KWH)",
      component: (data) => (
        <Plot
          data={[{
            x: data.carbonEmissions.map(d => d.source),
            y: data.carbonEmissions.map(d => d.emissions),
            name: 'Emissions',
            type: 'bar',
            marker: { color: '#ef4444' }
          }]}
          layout={{
            plot_bgcolor: '#fafafa',
            paper_bgcolor: '#fafafa',
            font: { color: '#1a2744', family: 'Arial, sans-serif' },
            showlegend: false,
            height: 300,
            margin: { t: 20, b: 60, l: 50, r: 20 }
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: "FINANCIAL PERFORMANCE TRENDS",
      component: (data) => (
        <Plot
          data={[
            { x: data.financialTrends.map(d => d.quarter), y: data.financialTrends.map(d => d.Revenue), name: 'Revenue', type: 'scatter', mode: 'lines+markers', line: { color: '#0066cc', width: 3 } },
            { x: data.financialTrends.map(d => d.quarter), y: data.financialTrends.map(d => d.Expenditure), name: 'Expenditure', type: 'scatter', mode: 'lines+markers', line: { color: '#f59e0b', width: 3 } },
            { x: data.financialTrends.map(d => d.quarter), y: data.financialTrends.map(d => d['Net Profit']), name: 'Net Profit', type: 'scatter', mode: 'lines+markers', line: { color: '#4ade80', width: 3 } }
          ]}
          layout={{
            plot_bgcolor: '#fafafa',
            paper_bgcolor: '#fafafa',
            font: { color: '#1a2744', family: 'Arial, sans-serif' },
            showlegend: true,
            height: 300,
            margin: { t: 20, b: 40, l: 50, r: 20 }
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: "AVERAGE GRID AVAILABILITY",
      component: (data) => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <svg width="300" height="300" viewBox="0 0 300 300">
            {/* Gauge chart */}
            <circle cx="150" cy="150" r="100" fill="none" stroke="#e5e7eb" strokeWidth="30" />
            <circle cx="150" cy="150" r="100" fill="none" stroke="#0066cc" strokeWidth="30" 
                    strokeDasharray={`${(99.93 / 100) * 628} 628`} 
                    strokeDashoffset="157" transform="rotate(-90 150 150)" />
            <circle cx="150" cy="150" r="60" fill="white" />
            <text x="150" y="140" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#1a2744">99.93</text>
            <text x="150" y="165" textAnchor="middle" fontSize="14" fill="#6b7280">% Availability</text>
            <text x="150" y="185" textAnchor="middle" fontSize="12" fill="#4ade80">↑ 0.08</text>
          </svg>
        </div>
      )
    },
    {
      title: "REGIONAL PERFORMANCE OVERVIEW",
      component: (data) => (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Region</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Generation (MW)</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Consumption (MW)</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Surplus/Deficit</th>
              </tr>
            </thead>
            <tbody>
              {data.regionalPerformance.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{row.region}</td>
                  <td style={{ padding: '12px' }}>{row.generation.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>{row.consumption.toLocaleString()}</td>
                  <td style={{ padding: '12px', color: '#4ade80', fontWeight: 'bold' }}>+{row.surplus.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
    {
      title: "ENERGY SOURCE PERFORMANCE MATRIX",
      component: (data) => (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Source</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Capacity (MW)</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Generation (MU/YR)</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Efficiency (%)</th>
              </tr>
            </thead>
            <tbody>
              {data.energySourcePerformance.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{row.source}</td>
                  <td style={{ padding: '12px' }}>{row.capacity.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>{row.generation.toLocaleString()}</td>
                  <td style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '4px', fontWeight: 'bold' }}>
                    {row.efficiency}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
    {
      title: "SUBSTATION VOLTAGE LEVELS",
      component: (data) => (
        <Plot
          data={[
            { x: data.substationVoltage.map(d => d.station), y: data.substationVoltage.map(d => d['400kV']), name: '400kV', type: 'bar', marker: { color: '#ef4444' } },
            { x: data.substationVoltage.map(d => d.station), y: data.substationVoltage.map(d => d['220kV']), name: '220kV', type: 'bar', marker: { color: '#0066cc' } }
          ]}
          layout={{
            barmode: 'group',
            plot_bgcolor: '#fafafa',
            paper_bgcolor: '#fafafa',
            font: { color: '#1a2744', family: 'Arial, sans-serif' },
            showlegend: true,
            height: 300,
            margin: { t: 20, b: 60, l: 50, r: 20 }
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: "12-MONTH GRID RELIABILITY METRICS",
      component: (data) => (
        <Plot
          data={[
            { x: data.gridReliability.map(d => d.month), y: data.gridReliability.map(d => d['Availability %']), name: 'Availability %', type: 'scatter', mode: 'lines+markers', line: { color: '#4ade80', width: 3 }, fill: 'tozeroy', fillcolor: 'rgba(74, 222, 128, 0.1)', yaxis: 'y1' },
            { x: data.gridReliability.map(d => d.month), y: data.gridReliability.map(d => d.Outages), name: 'Outages', type: 'bar', marker: { color: '#ef4444' }, yaxis: 'y2' }
          ]}
          layout={{
            plot_bgcolor: '#fafafa',
            paper_bgcolor: '#fafafa',
            font: { color: '#1a2744', family: 'Arial, sans-serif' },
            yaxis: { title: 'Availability %', side: 'left' },
            yaxis2: { title: 'Outages', side: 'right', overlaying: 'y' },
            showlegend: true,
            height: 300,
            margin: { t: 20, b: 40, l: 50, r: 50 }
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%' }}
        />
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (loading || !dashboardData) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>;
  }

  const currentChart = slides[currentSlide];
  
  // Ensure we have valid data
  if (!currentChart) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Error loading charts</div>;
  }

  return (
    <div>
      {/* Main Content */}
      <div style={{ padding: '40px' }}>
        {/* Charts Section */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1a2744' }}>
            Power Grid Analysis Charts
          </h2>
          
          {/* Main Dashboard Banner with Pagination */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            border: '1px solid #e5e7eb'
          }}>
            {/* Chart Title Bar */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '8px 12px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '15px', 
                fontWeight: '700', 
                color: '#1a2744',
                letterSpacing: '0.3px'
              }}>
                {currentChart.title}
              </h2>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {currentSlide + 1} / {slides.length}
              </div>
            </div>

            {/* Chart Content */}
            <div style={{ 
              padding: '16px 12px',
              minHeight: '250px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {dashboardData && currentChart.component ? (
                currentChart.component(dashboardData)
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280' }}>
                  <p>Loading chart data...</p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '8px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={prevSlide}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#0066cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = '#0052a3'; e.target.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = '#0066cc'; e.target.style.transform = 'translateY(0)'; }}
              >
                <ChevronLeft size={18} />
                Previous
              </button>

              {/* Slide Indicators */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: index === currentSlide ? '#0066cc' : '#d1d5db',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s'
                    }}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#0066cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0052a3'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#0066cc'}
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensivePowerGridDashboard;
