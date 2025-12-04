import React from 'react';

import { Badge } from '@/components/ui/base-badge';
import RiskBadge from './RiskBadge';

const factorVariant = (factor = '') => {
  const key = factor.toLowerCase();
  if (key.includes('regulatory') || key.includes('compliance')) return 'info';
  if (key.includes('weather') || key.includes('storm')) return 'warning';
  if (key.includes('vendor') || key.includes('material')) return 'destructive';
  if (key.includes('manpower') || key.includes('labour')) return 'secondary';
  return 'primary';
};

export default function HotspotAnalysisSection({ hotspotAnalysis }) {
  if (!hotspotAnalysis) return null;
  return (
    <div className="rounded-xl border bg-gray-50 p-5">
      <h3 className="mb-4 text-base font-semibold text-gray-800">Hotspot Analysis</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow-sm border">
          <p className="text-xs font-medium text-gray-500 mb-2">Region Classification</p>
          <p className="text-lg font-semibold text-gray-800">{hotspotAnalysis.region}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Escalation Likelihood:</span>
            <RiskBadge risk={hotspotAnalysis.escalation_likelihood} />
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm border">
          <p className="text-xs font-medium text-gray-500 mb-2">Identified Risk Factors</p>
          <div className="flex flex-wrap gap-2">
            {hotspotAnalysis.risk_factors.map((factor, idx) => (
              <Badge
                key={idx}
                variant={factorVariant(factor)}
                appearance="ghost"
                size="sm"
                className="border border-current/30 px-2.5"
              >
                {factor}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
