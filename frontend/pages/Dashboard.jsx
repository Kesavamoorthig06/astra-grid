import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardHeading } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Pagination, PaginationContent, PaginationItem } from '../components/ui/pagination';
import { ChevronLeft, ChevronRight, Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import IndiaTownMap from '../components/IndiaTownMap';
import ChatBot from '../components/ChatBot';
import ComprehensivePowerGridDashboard from '../components/ComprehensivePowerGridDashboard';

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [substations, setSubstations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [voltagePage, setVoltagePage] = useState(1);
  const [regionPage, setRegionPage] = useState(1);
  const [projectTypePage, setProjectTypePage] = useState(1);
  const [languageKey, setLanguageKey] = useState(i18n.language);
  const itemsPerPage = 10;
  const voltageItemsPerPage = 6;
  const regionItemsPerPage = 5;
  const projectTypeItemsPerPage = 4;

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguageKey(i18n.language);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  useEffect(() => {
    const processDashboardData = async () => {
      try {
        // Fetch main dataset
        const response = await fetch('/Final_dataset.csv');
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const obj = {};
          const currentLine = lines[i].split(',');
          for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentLine[j];
          }
          data.push(obj);
        }

        // Calculate comprehensive metrics
        const totalProjects = new Set(data.map(d => d.Project_ID)).size;
        const totalBudget = data.reduce((sum, d) => sum + (parseFloat(d.Target_Cost_INR) || 0), 0);
        const actualCost = data.reduce((sum, d) => sum + (parseFloat(d.Actual_Cost_INR) || 0), 0);
        const avgCostOverrun = data.reduce((sum, d) => sum + (parseFloat(d.Cost_Overrun_Percent) || 0), 0) / data.length;
        const avgTimelineOverrun = data.reduce((sum, d) => sum + (parseFloat(d.Timeline_Overrun_Days) || 0), 0) / data.length;
        
        const projectTypes = {};
        const regions = {};
        const voltageDistribution = {};
        
        data.forEach(d => {
          const type = d.Project_Type || 'Unknown';
          projectTypes[type] = (projectTypes[type] || 0) + 1;
          
          const region = d.Regulatory_Hotspot_Region || 'Unknown';
          regions[region] = (regions[region] || 0) + 1;

          const voltage = d.Voltage_Level_kV || 'Unknown';
          voltageDistribution[voltage] = (voltageDistribution[voltage] || 0) + 1;
        });

        const riskAnalysis = {
          highRisk: data.filter(d => parseFloat(d.Qualitative_Risk_Score) >= 8).length,
          mediumRisk: data.filter(d => parseFloat(d.Qualitative_Risk_Score) >= 5 && parseFloat(d.Qualitative_Risk_Score) < 8).length,
          lowRisk: data.filter(d => parseFloat(d.Qualitative_Risk_Score) < 5).length,
        };

        const completedProjects = data.filter(d => parseFloat(d.Timeline_Overrun_Days) <= 0).length;
        const delayedProjects = data.filter(d => parseFloat(d.Timeline_Overrun_Days) > 0).length;
        const totalLineLength = data.reduce((sum, d) => sum + (parseFloat(d.Line_Length_km) || 0), 0);
        const totalForestLand = data.reduce((sum, d) => sum + (parseFloat(d.Forest_Land_Required_Ha) || 0), 0);
        const avgPermitLag = data.reduce((sum, d) => sum + (parseFloat(d.Average_Permit_Lag_Days) || 0), 0) / data.length;
        const avgVendorRating = data.reduce((sum, d) => sum + (parseFloat(d.Vendor_Performance_Rating) || 0), 0) / data.length;
        const materialIssues = data.filter(d => d.Material_Availability_Issue === '1' || d.Material_Availability_Issue === 'Yes').length;

        setDashboardData({
          totalProjects,
          totalBudget: Math.round(totalBudget / 10000000),
          actualCost: Math.round(actualCost / 10000000),
          avgCostOverrun: avgCostOverrun.toFixed(2),
          avgTimelineOverrun: avgTimelineOverrun.toFixed(1),
          riskAnalysis,
          projectTypes,
          regions,
          voltageDistribution,
          completedProjects,
          delayedProjects,
          totalLineLength: totalLineLength.toFixed(0),
          totalForestLand: totalForestLand.toFixed(0),
          avgPermitLag: avgPermitLag.toFixed(1),
          avgVendorRating: avgVendorRating.toFixed(2),
          materialIssues
        });

        // Fetch substations data
        const substationResponse = await fetch('/substations_geocoded_v2.csv');
        const substationText = await substationResponse.text();
        const substationLines = substationText.trim().split('\n');
        const substationHeaders = substationLines[0].split(',');
        
        const substationData = [];
        for (let i = 1; i < substationLines.length; i++) {
          const obj = {};
          const currentLine = substationLines[i].split(',');
          for (let j = 0; j < substationHeaders.length; j++) {
            obj[substationHeaders[j]] = currentLine[j];
          }
          // Only include substations with complete data
          if (obj.Region && obj.State && obj.Substation && obj.Type && obj['Voltage Level'] && obj.latitude && obj.longitude) {
            substationData.push(obj);
          }
        }
        setSubstations(substationData);

      } catch (error) {
        console.error('Error processing dataset:', error);
        setDashboardData({
          totalProjects: 7,
          totalBudget: 16730,
          actualCost: 18200,
          avgCostOverrun: 8.5,
          avgTimelineOverrun: 45.2,
          riskAnalysis: { highRisk: 120, mediumRisk: 250, lowRisk: 400 },
          projectTypes: { 'Transmission': 120, 'Substation': 45 },
          regions: { 'North': 120, 'South': 150, 'East': 95, 'West': 185 },
          voltageDistribution: { '220': 80, '400': 65, '765': 25 },
          completedProjects: 350,
          delayedProjects: 200,
          totalLineLength: 15000,
          totalForestLand: 2500,
          avgPermitLag: 45.3,
          avgVendorRating: 7.8,
          materialIssues: 120
        });
        setSubstations([]);
      }
    };

    processDashboardData();
  }, []);

  const carouselItems = [
    {
      title: "India's Largest Grid",
      description: "India operates one of the world's largest synchronized power grids, serving over 1.4 billion people across 28 states and 8 union territories.",
      icon: '⚡'
    },
    {
      title: "765 kV Ultra High Voltage",
      description: "765 kV transmission lines are the backbone of India's grid, transmitting power over distances exceeding 2,500 km with minimal losses.",
      icon: '🔌'
    },
    {
      title: "Green Energy Target",
      description: "India aims to achieve 500 GW of renewable energy capacity by 2030, requiring massive grid expansion and modernization projects.",
      icon: '🌱'
    },
    {
      title: "Cost Overrun Challenges",
      description: "Average project cost overrun across transmission projects is 23%, primarily due to material costs and environmental compliance requirements.",
      icon: '💰'
    },
    {
      title: "Timeline Delays",
      description: "Average timeline delays span 8 months, with terrain complexity and regulatory approvals being major contributing factors.",
      icon: '⏱️'
    },
    {
      title: "Terrain Complexity Impact",
      description: "Mountain terrain can increase project costs by 2.8x and timeline by 35-40% compared to plains transmission projects.",
      icon: '🏔️'
    },
    {
      title: "Environmental Conservation",
      description: "Transmission projects on average require 220 hectares of forest land assessment, emphasizing the importance of environmental impact mitigation.",
      icon: '🌳'
    },
    {
      title: "Permit Processing",
      description: "Average permit approval lag is 187 days, with some regions experiencing delays exceeding 300 days due to regulatory complexity.",
      icon: '📋'
    },
    {
      title: "Grid Synchronization",
      description: "'One Nation, One Grid, One Frequency' - India maintains a synchronized frequency of 50 Hz across its entire national grid system.",
      icon: '🔄'
    },
    {
      title: "Voltage Levels",
      description: "India's transmission system includes 765 kV, 400 kV, 220 kV, and 132 kV lines, each serving specific regional and local distribution requirements.",
      icon: '⚙️'
    },
    {
      title: "Right of Way Challenges",
      description: "Securing right of way across populated areas adds 20-30% to project timelines, requiring coordination with multiple stakeholders.",
      icon: '🛣️'
    },
    {
      title: "Material Supply Issues",
      description: "Material availability problems affect 15-20% of projects, causing delays in critical equipment delivery and installation.",
      icon: '📦'
    },
    {
      title: "Skilled Workforce",
      description: "Large transmission projects require 2,000-3,000 skilled workers, creating challenges in resource allocation and project management.",
      icon: '👷'
    },
    {
      title: "Vendor Performance",
      description: "Average vendor performance rating is 6.5/10, with vendor changes occurring in 15-20% of projects, impacting timelines and costs.",
      icon: '⭐'
    },
    {
      title: "Weather Impact",
      description: "Extreme weather events average 10-15 days per year on project sites, causing work stoppages and equipment damage.",
      icon: '⛈️'
    },
    {
      title: "Project Success Rate",
      description: "Only 35% of transmission projects complete on time and within budget, highlighting the complexity of grid infrastructure development.",
      icon: '📊'
    },
    {
      title: "Commodity Price Volatility",
      description: "Steel and copper price fluctuations impact project budgets, with average escalation reaching 15-25% during multi-year projects.",
      icon: '📈'
    },
    {
      title: "Substation Density",
      description: "India has over 350 substations managing power distribution across all states, with an average of 8-12 bays per station.",
      icon: '🏢'
    },
    {
      title: "Power Loss Reduction",
      description: "India's transmission network achieves 3.5-4% technical loss rate, one of the best globally, through continuous modernization.",
      icon: '💡'
    },
    {
      title: "POWERGRID Operations",
      description: "POWERGRID manages 99.93% grid availability with 24/7 monitoring of 180,000+ circuit km of transmission lines across India.",
      icon: '📡'
    },
    {
      title: "Renewable Integration",
      description: "Integrating variable renewable energy requires smart grid technology and real-time forecasting systems to maintain grid stability.",
      icon: '🌞'
    },
    {
      title: "Regional Interconnections",
      description: "Five regional grids (North, South, East, West, Northeast) are interconnected through HVDC links for power balancing.",
      icon: '🌐'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const MetricCard = ({ title, value, unit, subtitle }) => (
    <Card className="border-border/40 shadow-xs hover:shadow-sm transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{value}</span>
            {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );

  // Pagination logic
  const totalPages = Math.ceil(substations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSubstations = substations.slice(startIndex, startIndex + itemsPerPage);

  // Voltage distribution pagination
  const voltageEntries = dashboardData ? Object.entries(dashboardData.voltageDistribution) : [];
  const voltageTotalPages = Math.ceil(voltageEntries.length / voltageItemsPerPage);
  const voltageStartIndex = (voltagePage - 1) * voltageItemsPerPage;
  const currentVoltageItems = voltageEntries.slice(voltageStartIndex, voltageStartIndex + voltageItemsPerPage);

  // Regional performance pagination
  const regionEntries = dashboardData ? Object.entries(dashboardData.regions) : [];
  const regionTotalPages = Math.ceil(regionEntries.length / regionItemsPerPage);
  const regionStartIndex = (regionPage - 1) * regionItemsPerPage;
  const currentRegionItems = regionEntries.slice(regionStartIndex, regionStartIndex + regionItemsPerPage);

  // Project type pagination
  const projectTypeEntries = dashboardData ? Object.entries(dashboardData.projectTypes) : [];
  const projectTypeTotalPages = Math.ceil(projectTypeEntries.length / projectTypeItemsPerPage);
  const projectTypeStartIndex = (projectTypePage - 1) * projectTypeItemsPerPage;
  const currentProjectTypeItems = projectTypeEntries.slice(projectTypeStartIndex, projectTypeStartIndex + projectTypeItemsPerPage);

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Additional Details Section */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground text-base">{t('dashboard.subtitle')}</p>
          </div>

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard title={t('dashboard.totalBudget')} value={dashboardData.totalBudget} unit="Cr" subtitle={t('dashboard.cumulative')} />
          <MetricCard title={t('dashboard.avgCostOverrun')} value={dashboardData.avgCostOverrun} unit="%" subtitle={t('dashboard.overall')} />
          <MetricCard title={t('dashboard.avgTimelineDelay')} value={dashboardData.avgTimelineOverrun} unit={t('results.days')} subtitle={t('dashboard.overall')} />
          <MetricCard title={t('dashboard.completedProjects')} value={dashboardData.completedProjects} subtitle={t('dashboard.onTime')} />
          <MetricCard title={t('dashboard.delayedProjects')} value={dashboardData.delayedProjects} subtitle={t('dashboard.behindSchedule')} />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title={t('dashboard.totalLineLength')} value={dashboardData.totalLineLength} unit="km" subtitle={t('dashboard.allProjects')} />
          <MetricCard title={t('dashboard.forestLandRequired')} value={dashboardData.totalForestLand} unit="Ha" subtitle={t('dashboard.environmentalImpact')} />
          <MetricCard title={t('dashboard.avgPermitLag')} value={dashboardData.avgPermitLag} unit="days" subtitle={t('dashboard.regulatoryDelay')} />
          <MetricCard title={t('dashboard.avgVendorRating')} value={dashboardData.avgVendorRating} unit="/10" subtitle={t('dashboard.performanceScore')} />
        </div>

        {/* Risk Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="powerGridCharts">
          <MetricCard title={t('dashboard.highRisk')} value={dashboardData.riskAnalysis.highRisk} subtitle={t('dashboard.requiresAttention')} />
          <MetricCard title={t('dashboard.mediumRisk')} value={dashboardData.riskAnalysis.mediumRisk} subtitle={t('dashboard.monitorProgress')} />
          <MetricCard title={t('dashboard.lowRisk')} value={dashboardData.riskAnalysis.lowRisk} subtitle={t('dashboard.onTrack')} />
          <MetricCard title={t('dashboard.materialIssues')} value={dashboardData.materialIssues} subtitle={t('dashboard.supplyChainRisk')} />
        </div>

        {/* Map Section */}
        <Card className="border-border/40 shadow-xs" id="gridMap">
          <CardHeader>
            <CardHeading className="text-lg flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              {t('dashboard.transmissionNetworkMap')}
            </CardHeading>
          </CardHeader>
          <CardContent>
            <IndiaTownMap height="h-[700px]" />
          </CardContent>
        </Card>

        {/* Substation Details with Pagination */}
        <Card className="border-border/40 shadow-xs" id="substationDetails">
          <CardHeader>
            <CardHeading className="text-lg">{t('dashboard.substationDetails')}</CardHeading>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">{t('dashboard.regionLabel')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">{t('dashboard.stateLabel')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">{t('dashboard.substationLabel')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">{t('dashboard.typeLabel')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">{t('dashboard.voltageLevelLabel')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">{t('dashboard.latitudeLabel')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">{t('dashboard.longitudeLabel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSubstations.map((substation, idx) => (
                    <tr key={idx} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-foreground">{substation.Region}</td>
                      <td className="py-3 px-4 text-foreground">{substation.State}</td>
                      <td className="py-3 px-4 text-foreground font-medium">{substation.Substation}</td>
                      <td className="text-center py-3 px-4"><Badge variant="light">{substation.Type}</Badge></td>
                      <td className="text-center py-3 px-4"><Badge variant="outline">{substation['Voltage Level']}</Badge></td>
                      <td className="text-center py-3 px-4 text-muted-foreground">{parseFloat(substation.latitude).toFixed(4)}</td>
                      <td className="text-center py-3 px-4 text-muted-foreground">{parseFloat(substation.longitude).toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-end mt-6 pt-4 border-t border-border/40">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {t('dashboard.previous')}
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-sm text-muted-foreground px-3">
                      {currentPage} / {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      {t('dashboard.next')}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>

        {/* Voltage Distribution */}
        <Card className="border-border/40 shadow-xs" id="voltageDistribution">
          <CardHeader>
            <CardHeading className="text-lg">{t('dashboard.voltageDistribution')}</CardHeading>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {currentVoltageItems.map(([voltage, count], idx) => (
                <div key={idx} className="p-4 border border-border/40 rounded-lg hover:shadow-sm transition-shadow bg-card">
                  <p className="text-sm font-semibold text-foreground mb-1">{voltage} kV</p>
                  <p className="text-2xl font-bold text-primary">{count}</p>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {voltageTotalPages > 1 && (
              <div className="flex items-center justify-end mt-6 pt-4 border-t border-border/40">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVoltagePage(prev => Math.max(1, prev - 1))}
                        disabled={voltagePage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        {t('dashboard.previous')}
                      </Button>
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-sm text-muted-foreground px-3">
                        {voltagePage} / {voltageTotalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVoltagePage(prev => Math.min(voltageTotalPages, prev + 1))}
                        disabled={voltagePage === voltageTotalPages}
                      >
                        {t('dashboard.next')}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Regional Performance */}
        <Card className="border-border/40 shadow-xs" id="regionalPerformance">
          <CardHeader>
            <CardHeading className="text-lg">{t('dashboard.regionalPerformance')}</CardHeading>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">{t('dashboard.regionLabel')}</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">{t('dashboard.projects')}</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">{t('dashboard.avgCostOverrun')}</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">{t('dashboard.avgDelay')}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRegionItems.map(([region, count], idx) => (
                    <tr key={idx} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-foreground">{region}</td>
                      <td className="text-center py-3 px-4 text-foreground font-semibold">{count}</td>
                      <td className="text-center py-3 px-4"><Badge variant="light">{dashboardData.avgCostOverrun}%</Badge></td>
                      <td className="text-center py-3 px-4"><Badge variant="outline">{dashboardData.avgTimelineOverrun}d</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {regionTotalPages > 1 && (
              <div className="flex items-center justify-end mt-6 pt-4 border-t border-border/40">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRegionPage(prev => Math.max(1, prev - 1))}
                        disabled={regionPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        {t('dashboard.previous')}
                      </Button>
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-sm text-muted-foreground px-3">
                        {regionPage} / {regionTotalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRegionPage(prev => Math.min(regionTotalPages, prev + 1))}
                        disabled={regionPage === regionTotalPages}
                      >
                        {t('dashboard.next')}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Type Summary */}
        <Card className="border-border/40 shadow-xs" id="projectTypeSummary">
          <CardHeader>
            <CardHeading className="text-lg">{t('dashboard.projectTypeSummary')} ({projectTypeEntries.length} {t('dashboard.types')})</CardHeading>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentProjectTypeItems.map(([type, count], idx) => (
                <div key={idx} className="p-4 border border-border/40 rounded-lg hover:shadow-sm transition-shadow bg-card">
                  <p className="text-sm font-semibold text-foreground mb-1">{type}</p>
                  <p className="text-2xl font-bold text-primary">{count}</p>
                  <p className="text-xs text-muted-foreground mt-1">{((count / dashboardData.totalProjects) * 100).toFixed(1)}% {t('dashboard.ofTotal')}</p>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {projectTypeTotalPages > 1 && (
              <div className="flex items-center justify-end mt-6 pt-4 border-t border-border/40">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProjectTypePage(prev => Math.max(1, prev - 1))}
                        disabled={projectTypePage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        {t('dashboard.previous')}
                      </Button>
                    </PaginationItem>
                    <PaginationItem>
                        <span className="text-sm text-muted-foreground px-3">
                          {projectTypePage} / {projectTypeTotalPages}
                        </span>
                    </PaginationItem>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProjectTypePage(prev => Math.min(projectTypeTotalPages, prev + 1))}
                        disabled={projectTypePage === projectTypeTotalPages}
                      >
                        {t('dashboard.next')}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
      
      {/* Comprehensive Charts Dashboard */}
      <ComprehensivePowerGridDashboard />

      {/* Did You Know - Carousel */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        <Card className="shadow-md border-0 overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
          <CardHeader style={{ backgroundColor: '#f8f9fa', padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
            <CardHeading className="text-lg flex items-center gap-3" style={{ color: '#1a2744', margin: 0 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0066cc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>i</div>
              {t('dashboard.didYouKnow')}
            </CardHeading>
          </CardHeader>
          <CardContent style={{ padding: '24px' }}>
            <div className="relative">
              <div className="rounded-lg p-6 min-h-32 bg-linear-to-r from-blue-50 to-blue-100 border border-blue-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-base font-semibold mb-2" style={{ color: '#1a2744' }}>{carouselItems[currentSlide].title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#3d4a60' }}>{carouselItems[currentSlide].description}</p>
                  </div>
                  <span className="text-3xl shrink-0">{carouselItems[currentSlide].icon}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={prevSlide}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '6px',
                    backgroundColor: '#f0f4f8',
                    border: '1px solid #d4e4f0',
                    cursor: 'pointer',
                    color: '#0066cc',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#0066cc';
                    e.target.style.color = '#fff';
                    e.target.style.borderColor = '#0066cc';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f0f4f8';
                    e.target.style.color = '#0066cc';
                    e.target.style.borderColor = '#d4e4f0';
                  }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-2">
                  {carouselItems.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className="rounded-full transition-all"
                      style={{
                        width: idx === currentSlide ? '24px' : '8px',
                        height: '8px',
                        backgroundColor: idx === currentSlide ? '#0066cc' : '#c5d8e8',
                        cursor: 'pointer',
                        border: 'none',
                        padding: 0
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={nextSlide}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '6px',
                    backgroundColor: '#f0f4f8',
                    border: '1px solid #d4e4f0',
                    cursor: 'pointer',
                    color: '#0066cc',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#0066cc';
                    e.target.style.color = '#fff';
                    e.target.style.borderColor = '#0066cc';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f0f4f8';
                    e.target.style.color = '#0066cc';
                    e.target.style.borderColor = '#d4e4f0';
                  }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
      
      {/* ChatBot Fixed Overlay */}
      <ChatBot />
    </div>
  );
};

export default Dashboard;
