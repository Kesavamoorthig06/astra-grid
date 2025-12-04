import React, { useEffect, useState } from 'react';
import { CountingNumber } from '../ui/counting-number';
import {
  Dialog,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../ui/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../ui/accordion';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardHeading, CardToolbar } from '../ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import RadarChart from '../charts/RadarChart';
import LineChart from '../charts/LineChart';
import Heatmap from '../charts/Heatmap';
import ScatterPlot from '../charts/ScatterPlot';

function RiskBadge({ level }) {
  const variantMap = {
    Low: 'success',
    Medium: 'warning',
    High: 'destructive',
  };
  return (
    <Badge variant={variantMap[level] || 'warning'} appearance="outline" size="sm">
      {level}
    </Badge>
  );
}

function PriorityBadge({ priority }) {
  const variantMap = {
    High: 'destructive',
    Medium: 'warning',
    Low: 'info',
  };
  return (
    <Badge variant={variantMap[priority] || 'warning'} appearance="outline" size="sm">
      {priority}
    </Badge>
  );
}

function getRiskColor(value, type = 'cost') {
  if (type === 'cost') {
    if (value <= 5) return 'text-green-600';
    if (value <= 15) return 'text-yellow-600';
    return 'text-red-600';
  }
  // delay
  if (value <= 30) return 'text-green-600';
  if (value <= 90) return 'text-yellow-600';
  return 'text-red-600';
}

function MetricCard({ title, value, unit, subtitle, showNumbers, animationKey, type, details }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="bg-white border border-gray-200 overflow-hidden shadow-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between w-full">
            <CardHeading className="text-sm font-medium text-gray-700">{title}</CardHeading>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className={`text-4xl font-bold ${getRiskColor(value, type)}`}>
            {showNumbers ? (
              <>
                <CountingNumber
                  key={`${type}-${animationKey}`}
                  from={0}
                  to={value}
                  duration={1.5}
                  delay={type === 'delay' ? 200 : 0}
                  format={(v) => type === 'cost' ? v.toFixed(2) : v.toFixed(1)}
                />
                <span className={`text-2xl ml-1 ${getRiskColor(value, type)}`}>{unit}</span>
              </>
            ) : (
              <span className="text-gray-300">—</span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          
          <CollapsibleContent className="mt-3">
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
              {details?.map((detail, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{detail.label}</span>
                  <span className={`font-medium ${
                    detail.value === 'High' ? 'text-red-600' : 
                    detail.value === 'Medium' ? 'text-yellow-600' : 
                    detail.value === 'Low' ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

export default function PredictionResultsModal({ prediction, open, onClose }) {
  const [showNumbers, setShowNumbers] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [metricDetailsOpen, setMetricDetailsOpen] = useState(false);

  useEffect(() => {
    if (!prediction || !open) {
      setShowNumbers(false);
      return;
    }
    setShowNumbers(false);
    const timer = setTimeout(() => {
      setAnimationKey((prev) => prev + 1);
      setShowNumbers(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [prediction, open]);

  useEffect(() => {
    if (metricDetailsOpen) {
      // Scroll to top when metrics are opened
      const dialogContent = document.querySelector('[role="dialog"]');
      if (dialogContent) {
        dialogContent.scrollTop = 0;
      }
    }
  }, [metricDetailsOpen]);

  const riskAnalysis = prediction?.risk_analysis;
  const hotspotAnalysis = prediction?.hotspot_analysis;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className={metricDetailsOpen ? 'max-w-7xl' : 'max-w-3xl'}>
          <DialogHeader className="border-b pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-blue-500">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <DialogTitle>Risk Assessment Results</DialogTitle>
                  <DialogDescription>AI-powered prediction analysis for your project</DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {prediction && (
            <div className="flex flex-col min-h-[500px]">
              <div className="flex-1 space-y-6">
              {!metricDetailsOpen && (
                <>
              {/* Primary Metrics with Collapsible Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <MetricCard
                  title="Cost Overrun Risk"
                  value={prediction.cost_overrun_percent}
                  unit="%"
                  subtitle="Above estimated budget"
                  showNumbers={showNumbers}
                  animationKey={animationKey}
                  type="cost"
                  details={[
                    { label: 'Predicted Overrun', value: `${prediction.cost_overrun_percent.toFixed(2)}%` },
                    { label: 'Risk Level', value: prediction.cost_overrun_percent > 15 ? 'High' : prediction.cost_overrun_percent > 5 ? 'Medium' : 'Low' },
                  ]}
                />
                
                <MetricCard
                  title="Schedule Delay"
                  value={prediction.schedule_delay_days}
                  unit="days"
                  subtitle="Beyond planned timeline"
                  showNumbers={showNumbers}
                  animationKey={animationKey}
                  type="delay"
                  details={[
                    { label: 'Predicted Delay', value: `${prediction.schedule_delay_days.toFixed(1)} days` },
                    { label: 'Risk Level', value: prediction.schedule_delay_days > 90 ? 'High' : prediction.schedule_delay_days > 30 ? 'Medium' : 'Low' },
                  ]}
                />
              </div>

              {/* Risk Analysis */}
              {riskAnalysis && (
                <div className="rounded-xl border bg-gray-50 p-5">
                  <h3 className="mb-4 text-base font-semibold text-gray-800">
                    Risk Analysis
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-white p-3 shadow-sm border">
                      <p className="text-xs font-medium text-gray-500 mb-1">Qualitative Risk</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-800">{riskAnalysis.qualitative_risk_score}</span>
                        <RiskBadge level={riskAnalysis.qualitative_risk_level} />
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-1000 ${
                            riskAnalysis.qualitative_risk_level === 'Low' ? 'bg-green-500' :
                            riskAnalysis.qualitative_risk_level === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(riskAnalysis.qualitative_risk_score * 10, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="rounded-lg bg-white p-3 shadow-sm border">
                      <p className="text-xs font-medium text-gray-500 mb-1">Vendor Risk</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-800">{riskAnalysis.vendor_risk_score}</span>
                        <RiskBadge level={riskAnalysis.vendor_risk_level} />
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-1000 ${
                            riskAnalysis.vendor_risk_level === 'Low' ? 'bg-green-500' :
                            riskAnalysis.vendor_risk_level === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(riskAnalysis.vendor_risk_score * 20, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="rounded-lg bg-white p-3 shadow-sm border">
                      <p className="text-xs font-medium text-gray-500 mb-1">Historical Delay Index</p>
                      <span className="text-2xl font-bold text-gray-800">{riskAnalysis.historical_delay_index}</span>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                        <div 
                          className="h-1.5 rounded-full bg-indigo-500 transition-all duration-1000"
                          style={{ width: `${Math.min(riskAnalysis.historical_delay_index * 10, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Hotspot Analysis */}
              {hotspotAnalysis && (
                <div className="rounded-xl border bg-gray-50 p-5">
                  <h3 className="mb-4 text-base font-semibold text-gray-800">
                    Hotspot Analysis
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-white p-4 shadow-sm border">
                      <p className="text-xs font-medium text-gray-500 mb-2">Region Classification</p>
                      <p className="text-lg font-semibold text-gray-800">{hotspotAnalysis.region}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Escalation Likelihood:</span>
                        <RiskBadge level={hotspotAnalysis.escalation_likelihood} />
                      </div>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow-sm border">
                      <p className="text-xs font-medium text-gray-500 mb-2">Identified Risk Factors</p>
                      <div className="flex flex-wrap gap-2">
                        {hotspotAnalysis.risk_factors.map((factor, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-md bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700"
                          >
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations Header (outside section) */}
              {prediction.recommendations && prediction.recommendations.length > 0 && (
                <div className="border-b pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-blue-500">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <DialogTitle>ASTRA-GRID's Recommendations</DialogTitle>
                      <DialogDescription>AI-powered suggestions to mitigate risks and improve outcomes</DialogDescription>
                      <span className="text-xs font-normal text-gray-500">({prediction.recommendations.length} suggestions)</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Recommendations Section (just accordion) */}
              {prediction.recommendations && prediction.recommendations.length > 0 && (
                <div className="rounded-xl border bg-gray-50 p-5">
                  <Accordion type="single" collapsible indicator="plus" className="w-full">
                    {prediction.recommendations.map((rec, idx) => (
                      <AccordionItem key={rec.id} value={`rec-${idx}`}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-3 flex-1 pr-4">
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800">{rec.title}</span>
                                <PriorityBadge priority={rec.priority} />
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{rec.category}</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <p className="text-sm text-gray-700 bg-gray-100 p-3 rounded-lg">
                              {rec.summary}
                            </p>
                            
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                                Action Items
                              </p>
                              <ul className="space-y-2">
                                {rec.details.map((detail, detailIdx) => (
                                  <li key={detailIdx} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="text-gray-400">•</span>
                                    {detail}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="pt-2 border-t">
                              <span className="text-xs font-medium text-gray-700">
                                Expected Impact: {rec.impact}
                              </span>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

                </>
              )}

              {metricDetailsOpen && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Prediction Analytics & Visualizations</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Chart 1: Risk Score Comparison */}
                    <Card className="bg-white border border-gray-200 overflow-hidden shadow-sm">
                      <CardHeader className="p-4 pb-2">
                        <CardHeading className="text-sm font-medium text-gray-700">Risk Score Comparison</CardHeading>
                      </CardHeader>
                      <CardContent className="p-4 h-[350px] flex items-center justify-center">
                        <BarChart prediction={prediction} width={450} height={300} />
                      </CardContent>
                    </Card>

                    {/* Chart 2: Cost Escalation Analysis */}
                    <Card className="bg-white border border-gray-200 overflow-hidden shadow-sm">
                      <CardHeader className="p-4 pb-2">
                        <CardHeading className="text-sm font-medium text-gray-700">Cost Escalation Breakdown</CardHeading>
                      </CardHeader>
                      <CardContent className="p-4 h-[350px] flex items-center justify-center">
                        <PieChart prediction={prediction} width={450} height={300} />
                      </CardContent>
                    </Card>

                    {/* Chart 3: Multi-Metric Risk Radar */}
                    <Card className="bg-white border border-gray-200 overflow-hidden shadow-sm">
                      <CardHeader className="p-4 pb-2">
                        <CardHeading className="text-sm font-medium text-gray-700">Multi-Dimensional Risk Assessment</CardHeading>
                      </CardHeader>
                      <CardContent className="p-4 h-[350px] flex items-center justify-center">
                        <RadarChart prediction={prediction} width={450} height={300} />
                      </CardContent>
                    </Card>

                    {/* Chart 4: Cost Trend Analysis */}
                    <Card className="bg-white border border-gray-200 overflow-hidden shadow-sm">
                      <CardHeader className="p-4 pb-2">
                        <CardHeading className="text-sm font-medium text-gray-700">Project Cost Trend</CardHeading>
                      </CardHeader>
                      <CardContent className="p-4 h-[350px] flex items-center justify-center">
                        <LineChart prediction={prediction} width={450} height={300} />
                      </CardContent>
                    </Card>

                    {/* Chart 5: Risk Impact Matrix */}
                    <Card className="bg-white border border-gray-200 overflow-hidden shadow-sm">
                      <CardHeader className="p-4 pb-2">
                        <CardHeading className="text-sm font-medium text-gray-700">Risk Impact Heatmap</CardHeading>
                      </CardHeader>
                      <CardContent className="p-4 h-[350px] flex items-center justify-center">
                        <Heatmap prediction={prediction} width={450} height={300} />
                      </CardContent>
                    </Card>

                    {/* Chart 6: Schedule Timeline */}
                    <Card className="bg-white border border-gray-200 overflow-hidden shadow-sm">
                      <CardHeader className="p-4 pb-2">
                        <CardHeading className="text-sm font-medium text-gray-700">Project Timeline & Delays</CardHeading>
                      </CardHeader>
                      <CardContent className="p-4 h-[350px] flex items-center justify-center">
                        <ScatterPlot prediction={prediction} />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <button
                    onClick={() => setMetricDetailsOpen((prev) => !prev)}
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-black border-[3px] border-gray-300 dark:border-gray-700 text-black dark:text-white transition-all duration-200 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:shadow-md shadow-lg"
                    aria-label={metricDetailsOpen ? 'Show charts' : 'Show details'}
                  >
                    {metricDetailsOpen ? (
                      <ChevronRight className="h-4 w-4 rotate-180 transition-transform duration-300" />
                    ) : (
                      <ChevronRight className="h-4 w-4 transition-transform duration-300" />
                    )}
                  </button>
                  <div className="flex gap-2 items-center">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-white dark:bg-black border-[3px] border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-md font-semibold transition-all duration-200 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:shadow-md shadow-lg"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-white dark:bg-black border-[3px] border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-md font-semibold transition-all duration-200 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:shadow-md shadow-lg flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Export
                  </button>
                </div>
                </div>
            </div>
            </div>
          )}
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
