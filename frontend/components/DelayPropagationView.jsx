/**
 * DELAY PROPAGATION VISUALIZATION
 * Shows how delays cascade through the project dependency chain
 * 
 * Visual Example:
 * Engineering (5 days delayed)
 *   ↓ × 1.5 multiplier
 * Supply of Material (7.5 days delayed)
 *   ↓ × 2.0 multiplier  
 * Foundation (15 days delayed)
 *   ↓ × 1.8 multiplier
 * Equipment Erection (27 days delayed)
 * 
 * Total Project Delay: 27 days
 */

import React, { useState } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, ChevronRight, Info } from 'lucide-react';

const DelayPropagationView = ({ delayAnalysis }) => {
  const [expandedTask, setExpandedTask] = useState(null);

  if (!delayAnalysis || delayAnalysis.delayedTaskCount === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">No Delays Detected</h3>
        </div>
        <p className="text-sm text-green-700 mt-2">
          All tasks are on schedule. No cascading delays present.
        </p>
      </div>
    );
  }

  const { criticalPath, totalProjectDelay, delayedTaskCount } = delayAnalysis;

  // Calculate severity
  const getSeverity = (delayDays) => {
    if (delayDays >= 30) return { color: 'red', label: 'Critical', bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900' };
    if (delayDays >= 15) return { color: 'orange', label: 'High', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900' };
    if (delayDays >= 5) return { color: 'yellow', label: 'Medium', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900' };
    return { color: 'blue', label: 'Low', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900' };
  };

  const overallSeverity = getSeverity(totalProjectDelay);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className={`${overallSeverity.bg} ${overallSeverity.border} border-2 rounded-lg p-6`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`w-6 h-6 ${overallSeverity.text}`} />
              <h3 className={`text-xl font-bold ${overallSeverity.text}`}>
                Delay Impact Analysis
              </h3>
            </div>
            <p className={`text-sm ${overallSeverity.text} mb-4`}>
              Cascading delays detected across {delayedTaskCount} tasks
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${overallSeverity.text}`}>
              {totalProjectDelay} days
            </div>
            <div className={`text-xs ${overallSeverity.text} opacity-75`}>
              Total Project Delay
            </div>
          </div>
        </div>

        {/* Severity Badge */}
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full">
          <div className={`w-3 h-3 rounded-full bg-${overallSeverity.color}-500`}></div>
          <span className="text-sm font-semibold">{overallSeverity.label} Severity</span>
        </div>
      </div>

      {/* Critical Path Visualization */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-gray-700" />
          <h4 className="font-semibold text-gray-900">Delay Propagation Chain</h4>
        </div>

        <div className="space-y-3">
          {criticalPath.map((task, index) => {
            const severity = getSeverity(task.totalDelay);
            const isExpanded = expandedTask === task.taskName;

            return (
              <div key={task.taskName} className="relative">
                {/* Connection Line */}
                {index < criticalPath.length - 1 && (
                  <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-gray-300 z-0"></div>
                )}

                {/* Task Card */}
                <div
                  className={`relative ${severity.bg} ${severity.border} border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow z-10`}
                  onClick={() => setExpandedTask(isExpanded ? null : task.taskName)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full ${severity.bg} ${severity.border} border-2 flex items-center justify-center font-bold ${severity.text}`}>
                          {index + 1}
                        </div>
                        <h5 className={`font-semibold ${severity.text}`}>{task.taskName}</h5>
                      </div>

                      {/* Delay Breakdown */}
                      <div className="ml-10 mt-2 space-y-1">
                        {task.baseDelay > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Base Delay:</span>
                            <span className="font-semibold">{task.baseDelay} days</span>
                          </div>
                        )}
                        {task.propagatedDelay > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Cascading Impact:</span>
                            <span className="font-semibold text-red-600">+{task.propagatedDelay} days</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm font-bold pt-1 border-t border-gray-300">
                          <span className="text-gray-600">Total Delay:</span>
                          <span className={severity.text}>{task.totalDelay} days</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && task.upstreamImpacts && task.upstreamImpacts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-700">Upstream Dependencies:</span>
                      </div>
                      <div className="space-y-2">
                        {task.upstreamImpacts.map((impact) => (
                          <div key={impact.from} className="bg-white rounded p-3 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900">{impact.from}</span>
                              <span className="text-xs text-gray-500">× {impact.multiplier} multiplier</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span>{impact.originalDelay} days delayed</span>
                              <ChevronRight className="w-3 h-3" />
                              <span className="font-semibold text-red-600">
                                {impact.propagatedDelay} days impact
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {task.reason && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-900">
                          <strong>Why this multiplier?</strong> {task.reason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Impact Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Impact Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Delayed Tasks:</span>
            <span className="ml-2 font-semibold">{delayedTaskCount}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Delay:</span>
            <span className={`ml-2 font-semibold ${overallSeverity.text}`}>
              {totalProjectDelay} days
            </span>
          </div>
          <div>
            <span className="text-gray-600">Longest Chain:</span>
            <span className="ml-2 font-semibold">
              {criticalPath[0]?.taskName || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Avg Multiplier:</span>
            <span className="ml-2 font-semibold">
              {(
                criticalPath.reduce((sum, t) => {
                  const impacts = t.upstreamImpacts || [];
                  const avgMult = impacts.length > 0
                    ? impacts.reduce((s, i) => s + i.multiplier, 0) / impacts.length
                    : 1.0;
                  return sum + avgMult;
                }, 0) / criticalPath.length
              ).toFixed(2)}×
            </span>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">How Delay Propagation Works:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>When a task is delayed, all dependent tasks are impacted</li>
              <li>Delay multipliers represent how delays amplify (e.g., 2.0× means 5 days becomes 10 days)</li>
              <li>Factors: resource constraints, weather windows, permit dependencies, seasonal impacts</li>
              <li>Total project delay = maximum delay across all task chains</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DelayPropagationView;
