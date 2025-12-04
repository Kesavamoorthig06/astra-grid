import React from 'react';

import RiskBadge from './RiskBadge';

export default function RiskAnalysisSection({ riskAnalysis }) {
  if (!riskAnalysis) return null;
  return (
    <div className="rounded-xl border bg-gray-50 p-5">
      <h3 className="mb-4 text-base font-semibold text-gray-800">Risk Analysis</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-3 shadow-sm border">
          <p className="text-xs font-medium text-gray-500 mb-1">Qualitative Risk</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-800">{riskAnalysis.qualitative_risk_score}</span>
            <RiskBadge risk={riskAnalysis.qualitative_risk_level} />
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
            <div className={`h-1.5 rounded-full transition-all duration-1000 ${
              riskAnalysis.qualitative_risk_level === 'Low' ? 'bg-green-500' :
              riskAnalysis.qualitative_risk_level === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
            }`} style={{ width: `${Math.min(riskAnalysis.qualitative_risk_score * 10, 100)}%` }} />
          </div>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm border">
          <p className="text-xs font-medium text-gray-500 mb-1">Vendor Risk</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-800">{riskAnalysis.vendor_risk_score}</span>
            <RiskBadge risk={riskAnalysis.vendor_risk_level} />
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
            <div className={`h-1.5 rounded-full transition-all duration-1000 ${
              riskAnalysis.vendor_risk_level === 'Low' ? 'bg-green-500' :
              riskAnalysis.vendor_risk_level === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
            }`} style={{ width: `${Math.min(riskAnalysis.vendor_risk_score * 20, 100)}%` }} />
          </div>
        </div>
        <div className="rounded-lg bg-white p-3 shadow-sm border">
          <p className="text-xs font-medium text-gray-500 mb-1">Historical Delay Index</p>
          <span className="text-2xl font-bold text-gray-800">{riskAnalysis.historical_delay_index}</span>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
            <div className="h-1.5 rounded-full bg-indigo-500 transition-all duration-1000" style={{ width: `${Math.min(riskAnalysis.historical_delay_index * 10, 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
