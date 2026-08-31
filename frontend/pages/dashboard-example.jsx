import React from 'react';
import ComprehensivePowerGridDashboard from '@/components/ComprehensivePowerGridDashboard';

/**
 * Dashboard Page
 * Displays the comprehensive power grid dashboard with all 12 charts
 * with pagination and real data from the ASTRA GRID dataset
 */
export default function DashboardPage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* You can add page-specific layout/header here if needed */}
      <ComprehensivePowerGridDashboard />
    </main>
  );
}

/**
 * Usage Notes:
 * 
 * 1. This component fetches data from: /api/dashboard/metrics
 * 2. All 12 charts are included:
 *    - Renewable Energy Growth (MW)
 *    - Transmission vs Distribution Losses (%)
 *    - 24-Hour Load Profile
 *    - Equipment Health Status
 *    - Energy Source Capacity Mix
 *    - Carbon Emissions by Source (G CO₂/KWH)
 *    - Financial Performance Trends
 *    - Average Grid Availability
 *    - Regional Performance Overview
 *    - Energy Source Performance Matrix
 *    - Substation Voltage Levels
 *    - 12-Month Grid Reliability Metrics
 * 
 * 3. Features:
 *    - Pagination with Previous/Next buttons
 *    - Clickable slide indicators (dots)
 *    - Real data from Final_dataset.csv
 *    - Responsive design (mobile/tablet/desktop)
 *    - Summary statistics cards below main dashboard
 *    - Automatic data caching (1 hour)
 * 
 * 4. Customization:
 *    - Modify colors in the component
 *    - Adjust chart dimensions
 *    - Change data sources in DashboardMetricsService
 *    - Add filters or date ranges
 * 
 * 5. Data Sources:
 *    - Dataset: Final_dataset.csv (14,500+ projects)
 *    - Processing: DashboardMetricsService
 *    - API: /api/dashboard routes
 */
