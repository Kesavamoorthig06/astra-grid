import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardHeading } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Pagination, PaginationContent, PaginationItem } from '../components/ui/pagination';
import { ChevronLeft, ChevronRight, Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import IndiaTownMap from '../components/IndiaTownMap';

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
      title: t('carousel.fact1Title'),
      description: t('carousel.fact1Desc'),
      icon: '⚡'
    },
    {
      title: t('carousel.fact2Title'),
      description: t('carousel.fact2Desc'),
      icon: '🏗️'
    },
    {
      title: t('carousel.fact3Title'),
      description: t('carousel.fact3Desc'),
      icon: '📡'
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
    <div className="min-h-screen bg-background p-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title={t('dashboard.highRisk')} value={dashboardData.riskAnalysis.highRisk} subtitle={t('dashboard.requiresAttention')} />
          <MetricCard title={t('dashboard.mediumRisk')} value={dashboardData.riskAnalysis.mediumRisk} subtitle={t('dashboard.monitorProgress')} />
          <MetricCard title={t('dashboard.lowRisk')} value={dashboardData.riskAnalysis.lowRisk} subtitle={t('dashboard.onTrack')} />
          <MetricCard title={t('dashboard.materialIssues')} value={dashboardData.materialIssues} subtitle={t('dashboard.supplyChainRisk')} />
        </div>

        {/* Map Holder */}
        <Card className="border-border/40 shadow-xs">
          <CardHeader>
            <CardHeading className="text-lg flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              {t('dashboard.transmissionNetworkMap')}
            </CardHeading>
          </CardHeader>
          <CardContent>
            <IndiaTownMap height="h-[600px]" />
          </CardContent>
        </Card>

        {/* Substation Details with Pagination */}
        <Card className="border-border/40 shadow-xs">
          <CardHeader>
            <CardHeading className="text-lg">{t('dashboard.substationDetails')} ({substations.length} Total)</CardHeading>
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
                      {t('dashboard.page')} {currentPage} {t('dashboard.of')} {totalPages}
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
        <Card className="border-border/40 shadow-xs">
          <CardHeader>
            <CardHeading className="text-lg">{t('dashboard.voltageDistribution')}</CardHeading>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {currentVoltageItems.map(([voltage, count], idx) => (
                <div key={idx} className="p-4 border border-border/40 rounded-lg hover:shadow-sm transition-shadow bg-card">
                  <p className="text-sm font-semibold text-foreground mb-1">{voltage} kV</p>
                  <p className="text-2xl font-bold text-primary">{count}</p>
                  <p className="text-xs text-muted-foreground mt-1">{((count / dashboardData.totalProjects) * 100).toFixed(1)}% {t('dashboard.ofTotal')}</p>
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
                        {t('dashboard.page')} {voltagePage} {t('dashboard.of')} {voltageTotalPages}
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
        <Card className="border-border/40 shadow-xs">
          <CardHeader>
            <CardHeading className="text-lg">{t('dashboard.regionalPerformance')} ({regionEntries.length} {t('dashboard.regions')})</CardHeading>
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
                        {t('dashboard.page')} {regionPage} {t('dashboard.of')} {regionTotalPages}
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
        <Card className="border-border/40 shadow-xs">
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
                        {t('dashboard.page')} {projectTypePage} {t('dashboard.of')} {projectTypeTotalPages}
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

        {/* Did You Know - Carousel */}
        <Card className="shadow-xs border-primary/20 bg-primary/5">
          <CardHeader>
            <CardHeading className="text-lg flex items-center gap-2">
              <span className="text-2xl">ℹ️</span>
              {t('dashboard.didYouKnow')}
            </CardHeading>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="bg-card rounded-lg p-8 min-h-32 border border-border/40">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-foreground mb-2">{carouselItems[currentSlide].title}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">{carouselItems[currentSlide].description}</p>
                  </div>
                  <span className="text-4xl ml-4">{carouselItems[currentSlide].icon}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevSlide}
                  className="rounded-full"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                <div className="flex gap-2">
                  {carouselItems.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentSlide ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextSlide}
                  className="rounded-full"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
