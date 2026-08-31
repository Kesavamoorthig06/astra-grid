import './CostBreakdown.css'

function CostBreakdown({ projectPlan }) {
  const costBreakdown = projectPlan.costBreakdown
  const totalPlannedCost = costBreakdown.materialCost
  const totalCurrentCost = costBreakdown.totalCost
  const timeOverrunCost = costBreakdown.establishmentCost + costBreakdown.interestCost + costBreakdown.storageCost
  const overrunPercentage = (timeOverrunCost / totalPlannedCost) * 100

  return (
    <div className="card cost-breakdown">
      <h3 className="card-title">💰 Real Cost Analysis (Dynamic Simulation)</h3>

      <div className="cost-summary">
        <div className="cost-card">
          <div className="cost-label">Base Material Cost</div>
          <div className="cost-value">₹{costBreakdown.materialCost.toFixed(2)} Cr</div>
          <div className="cost-sublabel">Original budget for materials</div>
        </div>
        
        <div className="cost-card overrun">
          <div className="cost-label">Time Overrun Costs</div>
          <div className="cost-value">
            +₹{timeOverrunCost.toFixed(2)} Cr
          </div>
          <div className="cost-sublabel">+{overrunPercentage.toFixed(1)}% above material cost</div>
        </div>
        
        <div className={`cost-card total ${timeOverrunCost > 0 ? 'warning' : ''}`}>
          <div className="cost-label">Total Estimated Cost</div>
          <div className="cost-value">₹{totalCurrentCost.toFixed(2)} Cr</div>
        </div>
      </div>

      <h4 className="breakdown-title">📊 Detailed Cost Breakdown</h4>
      
      <div className="cost-detail-grid">
        <div className="cost-detail-item">
          <div className="cost-detail-label">
            <span className="cost-icon">📦</span>
            Material Cost
          </div>
          <div className="cost-detail-value">₹{costBreakdown.materialCost.toFixed(2)} Cr</div>
          <div className="cost-detail-bar">
            <div 
              className="cost-detail-fill material"
              style={{ width: `${(costBreakdown.materialCost / totalCurrentCost) * 100}%` }}
            />
          </div>
        </div>

        <div className="cost-detail-item">
          <div className="cost-detail-label">
            <span className="cost-icon">🏢</span>
            Establishment Cost
            <small>({projectPlan.totalDurationMonths} months × ₹{projectPlan.costParams.establishmentCostPerMonth} Cr)</small>
          </div>
          <div className="cost-detail-value">₹{costBreakdown.establishmentCost.toFixed(2)} Cr</div>
          <div className="cost-detail-bar">
            <div 
              className="cost-detail-fill establishment"
              style={{ width: `${(costBreakdown.establishmentCost / totalCurrentCost) * 100}%` }}
            />
          </div>
        </div>

        <div className="cost-detail-item">
          <div className="cost-detail-label">
            <span className="cost-icon">📈</span>
            Interest During Construction (IDC)
            <small>({projectPlan.costParams.annualInterestRate}% annual rate)</small>
          </div>
          <div className="cost-detail-value">₹{costBreakdown.interestCost.toFixed(2)} Cr</div>
          <div className="cost-detail-bar">
            <div 
              className="cost-detail-fill interest"
              style={{ width: `${(costBreakdown.interestCost / totalCurrentCost) * 100}%` }}
            />
          </div>
        </div>

        {costBreakdown.storageCost > 0 && (
          <div className="cost-detail-item">
            <div className="cost-detail-label">
              <span className="cost-icon">📦</span>
              Storage Cost
              <small>(Materials arrived before site ready)</small>
            </div>
            <div className="cost-detail-value">₹{costBreakdown.storageCost.toFixed(2)} Cr</div>
            <div className="cost-detail-bar">
              <div 
                className="cost-detail-fill storage"
                style={{ width: `${(costBreakdown.storageCost / totalCurrentCost) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="cost-insights">
        <h5 className="insights-title">💡 Cost Insights</h5>
        <ul className="insights-list">
          <li>
            <strong>Time-Dependent Costs:</strong> Every month of delay adds ₹{projectPlan.costParams.establishmentCostPerMonth} Cr in establishment costs
          </li>
          <li>
            <strong>Interest Impact:</strong> Compound interest is calculated on cumulative spend throughout project duration
          </li>
          {costBreakdown.storageCost > 0 && (
            <li className="warning-insight">
              <strong>⚠️ Storage Penalty:</strong> Materials are sitting in storage, costing ₹{projectPlan.costParams.storageCostPerMonth} Cr/month. Align supply with construction readiness!
            </li>
          )}
          <li>
            <strong>Terrain Factor:</strong> Project terrain type ({projectPlan.terrain}) affects productivity and overall duration
          </li>
        </ul>
      </div>

      <h4 className="breakdown-title">Phase-wise Cost Distribution</h4>
      
      <div className="cost-breakdown-chart">
        {projectPlan.tasks.map((task) => {
          const taskCurrentCost = task.materialCost

          return (
            <div key={task.id} className="cost-bar-item">
              <div className="cost-bar-label">
                <span className="phase-name">{task.name}</span>
                <span className="phase-cost">₹{taskCurrentCost.toFixed(2)} Cr</span>
              </div>
              <div className="cost-bar-container">
                <div 
                  className="cost-bar-fill"
                  style={{ 
                    width: `${task.costAllocation}%`,
                    background: task.isCompleted 
                      ? '#10b981' 
                      : task.status === 'delayed' 
                        ? '#ef4444' 
                        : '#667eea'
                  }}
                >
                  <span className="cost-percentage">{task.costAllocation}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="cost-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#10b981' }}></span>
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#667eea' }}></span>
          <span>Planned</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#ef4444' }}></span>
          <span>Delayed</span>
        </div>
      </div>
    </div>
  )
}

export default CostBreakdown
