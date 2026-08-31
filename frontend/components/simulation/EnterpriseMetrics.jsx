import { useMemo } from 'react'
import './EnterpriseMetrics.css'
import {
  calculateCriticalPath,
  calculateCostBreakdown,
  generateCashFlowForecast,
  calculateEVM
} from '../../utils/simulation/enterpriseEngine'

function EnterpriseMetrics({ projectPlan, startDate, simulatedDaysElapsed }) {
  const criticalPath = useMemo(
    () => calculateCriticalPath(projectPlan.tasks),
    [projectPlan.tasks]
  )

  const costBreakdown = useMemo(
    () => calculateCostBreakdown(projectPlan.totalCost),
    [projectPlan.totalCost]
  )

  const cashFlow = useMemo(
    () => generateCashFlowForecast(projectPlan, new Date(startDate)),
    [projectPlan, startDate]
  )

  const evmMetrics = useMemo(
    () => calculateEVM(projectPlan, simulatedDaysElapsed),
    [projectPlan, simulatedDaysElapsed]
  )

  const criticalTasks = criticalPath.filter((t) => t.isCritical)
  const criticalPathDuration = Math.max(...criticalPath.map((t) => t.earlyFinish))

  return (
    <div className="enterprise-metrics">
      <h2 className="section-title">Enterprise Analytics  </h2>

      {/* Critical Path Analysis - P6 Style */}
      <div className="metrics-grid">
        <div className="metric-card critical-path-card">
          <h3 className="metric-title">Critical Path Method (CPM)</h3>
          <div className="metric-stats">
            <div className="stat-item">
              <span className="stat-label">Critical Activities:</span>
              <span className="stat-value critical">{criticalTasks.length}/{criticalPath.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Critical Path Duration:</span>
              <span className="stat-value">{criticalPathDuration} days</span>
            </div>
          </div>
          <div className="critical-tasks-list">
            {criticalTasks.map((task, idx) => (
              <div key={task.id} className="critical-task-item">
                <span className="task-badge">#{idx + 1}</span>
                <span className="task-name">{task.name}</span>
                <span className="task-float">Float: {task.totalFloat}d</span>
              </div>
            ))}
          </div>
        </div>

        {/* Earned Value Management - Industry Standard */}
        <div className="metric-card evm-card">
          <h3 className="metric-title">Earned Value Management (EVM)</h3>
          <div className="evm-metrics">
            <div className="evm-row">
              <div className="evm-item">
                <span className="evm-label">Planned Value (PV):</span>
                <span className="evm-value">₹{evmMetrics.plannedValue.toFixed(2)} Cr</span>
              </div>
              <div className="evm-item">
                <span className="evm-label">Earned Value (EV):</span>
                <span className="evm-value">₹{evmMetrics.earnedValue.toFixed(2)} Cr</span>
              </div>
              <div className="evm-item">
                <span className="evm-label">Actual Cost (AC):</span>
                <span className="evm-value">₹{evmMetrics.actualCost.toFixed(2)} Cr</span>
              </div>
            </div>
            <div className="evm-row">
              <div className={`evm-indicator ${evmMetrics.scheduleVariance >= 0 ? 'positive' : 'negative'}`}>
                <span className="indicator-label">Schedule Variance (SV):</span>
                <span className="indicator-value">
                  {evmMetrics.scheduleVariance >= 0 ? '+' : ''}₹{evmMetrics.scheduleVariance.toFixed(2)} Cr
                </span>
              </div>
              <div className={`evm-indicator ${evmMetrics.costVariance >= 0 ? 'positive' : 'negative'}`}>
                <span className="indicator-label">Cost Variance (CV):</span>
                <span className="indicator-value">
                  {evmMetrics.costVariance >= 0 ? '+' : ''}₹{evmMetrics.costVariance.toFixed(2)} Cr
                </span>
              </div>
            </div>
            <div className="evm-row">
              <div className={`performance-index ${evmMetrics.schedulePerformanceIndex >= 1 ? 'good' : 'poor'}`}>
                <span className="index-label">SPI:</span>
                <span className="index-value">{evmMetrics.schedulePerformanceIndex.toFixed(3)}</span>
                <span className="index-meaning">
                  {evmMetrics.schedulePerformanceIndex >= 1 ? '✓ On Schedule' : '⚠ Behind Schedule'}
                </span>
              </div>
              <div className={`performance-index ${evmMetrics.costPerformanceIndex >= 1 ? 'good' : 'poor'}`}>
                <span className="index-label">CPI:</span>
                <span className="index-value">{evmMetrics.costPerformanceIndex.toFixed(3)}</span>
                <span className="index-meaning">
                  {evmMetrics.costPerformanceIndex >= 1 ? '✓ Under Budget' : '⚠ Over Budget'}
                </span>
              </div>
            </div>
            <div className="evm-forecast">
              <div className="forecast-item">
                <span className="forecast-label">Estimate at Completion (EAC):</span>
                <span className="forecast-value">₹{evmMetrics.estimateAtCompletion.toFixed(2)} Cr</span>
              </div>
              <div className="forecast-item">
                <span className="forecast-label">Variance at Completion (VAC):</span>
                <span className={`forecast-value ${evmMetrics.varianceAtCompletion >= 0 ? 'positive' : 'negative'}`}>
                  {evmMetrics.varianceAtCompletion >= 0 ? '+' : ''}₹{evmMetrics.varianceAtCompletion.toFixed(2)} Cr
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown Structure - Unifier Style */}
      <div className="metric-card cost-breakdown-card">
        <h3 className="metric-title">Cost Breakdown Structure (CBS)</h3>
        <div className="cost-breakdown">
          <div className="cost-section">
            <h4 className="cost-section-title">Direct Costs (75%)</h4>
            <div className="cost-items">
              <div className="cost-item">
                <span className="cost-label">Labor:</span>
                <span className="cost-value">₹{costBreakdown.directCosts.labor.toFixed(2)} Cr</span>
                <div className="cost-bar" style={{ width: `${(costBreakdown.directCosts.labor / costBreakdown.totalCost) * 100}%` }}></div>
              </div>
              <div className="cost-item">
                <span className="cost-label">Materials:</span>
                <span className="cost-value">₹{costBreakdown.directCosts.materials.toFixed(2)} Cr</span>
                <div className="cost-bar" style={{ width: `${(costBreakdown.directCosts.materials / costBreakdown.totalCost) * 100}%` }}></div>
              </div>
              <div className="cost-item">
                <span className="cost-label">Equipment:</span>
                <span className="cost-value">₹{costBreakdown.directCosts.equipment.toFixed(2)} Cr</span>
                <div className="cost-bar" style={{ width: `${(costBreakdown.directCosts.equipment / costBreakdown.totalCost) * 100}%` }}></div>
              </div>
              <div className="cost-item">
                <span className="cost-label">Subcontracts:</span>
                <span className="cost-value">₹{costBreakdown.directCosts.subcontracts.toFixed(2)} Cr</span>
                <div className="cost-bar" style={{ width: `${(costBreakdown.directCosts.subcontracts / costBreakdown.totalCost) * 100}%` }}></div>
              </div>
            </div>
          </div>
          <div className="cost-section">
            <h4 className="cost-section-title">Indirect Costs (25%)</h4>
            <div className="cost-items">
              <div className="cost-item">
                <span className="cost-label">Overhead:</span>
                <span className="cost-value">₹{costBreakdown.indirectCosts.overhead.toFixed(2)} Cr</span>
                <div className="cost-bar indirect" style={{ width: `${(costBreakdown.indirectCosts.overhead / costBreakdown.totalCost) * 100}%` }}></div>
              </div>
              <div className="cost-item">
                <span className="cost-label">Administration:</span>
                <span className="cost-value">₹{costBreakdown.indirectCosts.administration.toFixed(2)} Cr</span>
                <div className="cost-bar indirect" style={{ width: `${(costBreakdown.indirectCosts.administration / costBreakdown.totalCost) * 100}%` }}></div>
              </div>
              <div className="cost-item">
                <span className="cost-label">Contingency:</span>
                <span className="cost-value">₹{costBreakdown.indirectCosts.contingency.toFixed(2)} Cr</span>
                <div className="cost-bar indirect" style={{ width: `${(costBreakdown.indirectCosts.contingency / costBreakdown.totalCost) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Forecast - Unifier Style S-Curve */}
      <div className="metric-card cashflow-card">
        <h3 className="metric-title">Cash Flow Forecast (S-Curve)</h3>
        <div className="cashflow-table">
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Planned Spend</th>
                <th>Actual Spend</th>
                <th>Variance</th>
                <th>Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {cashFlow.slice(0, 6).map((cf, idx) => (
                <tr key={idx}>
                  <td className="period-cell">{cf.period}</td>
                  <td className="amount-cell">₹{cf.plannedSpend.toFixed(2)}</td>
                  <td className="amount-cell">₹{cf.actualSpend.toFixed(2)}</td>
                  <td className={`variance-cell ${cf.variance >= 0 ? 'positive' : 'negative'}`}>
                    {cf.variance >= 0 ? '+' : ''}₹{cf.variance.toFixed(2)}
                  </td>
                  <td className="cumulative-cell">
                    ₹{cf.cumulativePlanned.toFixed(2)} / ₹{cf.cumulativeActual.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default EnterpriseMetrics
