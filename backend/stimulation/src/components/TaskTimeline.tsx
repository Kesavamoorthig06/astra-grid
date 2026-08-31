import { useState, useEffect } from 'react'
import './TaskTimeline.css'
import { recalculateProjectMetrics, type ProjectPlan, type Task } from '../utils/projectGenerator'
import { projectDB } from '../utils/database'

interface TaskTimelineProps {
  projectPlan: ProjectPlan
  startDate: string
  onTaskUpdate: (updatedPlan: ProjectPlan) => void
  onSimulatedDaysChange?: (days: number) => void
  projectData?: any
}

function TaskTimeline({ projectPlan, startDate, onTaskUpdate, onSimulatedDaysChange, projectData }: TaskTimelineProps) {
  const [originalCost] = useState(projectPlan.totalCost)
  const [showSimulation, setShowSimulation] = useState(false)
  const [simulatedDaysElapsed, setSimulatedDaysElapsed] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [savingField, setSavingField] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState<string | null>(null) // taskId-itemName

  // Recalculate delays when simulation time changes
  useEffect(() => {
    if (simulatedDaysElapsed > 0) {
      const updatedPlan = recalculateProjectMetrics(
        projectPlan,
        originalCost,
        simulatedDaysElapsed
      )
      onTaskUpdate(updatedPlan)
      onSimulatedDaysChange?.(simulatedDaysElapsed)
    }
  }, [simulatedDaysElapsed])

  const handleTaskComplete = (taskId: string) => {
    const updatedTasks = projectPlan.tasks.map(task => 
      task.id === taskId 
        ? { ...task, isCompleted: !task.isCompleted, status: !task.isCompleted ? 'completed' as const : 'not-started' as const, completionPercentage: !task.isCompleted ? 100 : 0 }
        : task
    )

    const updatedPlan = recalculateProjectMetrics(
      { ...projectPlan, tasks: updatedTasks },
      originalCost,
      simulatedDaysElapsed
    )

    onTaskUpdate(updatedPlan)
  }

  const handleProgressChange = (taskId: string, progress: number) => {
    const updatedTasks = projectPlan.tasks.map(task => {
      if (task.id === taskId) {
        let newStatus: Task['status'] = 'in-progress'
        if (progress === 0) newStatus = 'not-started'
        if (progress === 100) newStatus = 'completed'
        
        return { 
          ...task, 
          completionPercentage: progress,
          status: newStatus,
          isCompleted: progress === 100
        }
      }
      return task
    })

    const updatedPlan = recalculateProjectMetrics(
      { ...projectPlan, tasks: updatedTasks },
      originalCost,
      simulatedDaysElapsed
    )

    onTaskUpdate(updatedPlan)
  }

  const handleSubActivityToggle = (taskId: string, subActivityId: string) => {
    const updatedTasks = projectPlan.tasks.map(task => {
      if (task.id === taskId && task.subActivities) {
        const updatedSubActivities = task.subActivities.map(sub =>
          sub.id === subActivityId
            ? { ...sub, isCompleted: !sub.isCompleted, completionPercentage: !sub.isCompleted ? 100 : 0 }
            : sub
        )
        
        // Calculate task progress based on sub-activities
        const completedCount = updatedSubActivities.filter(s => s.isCompleted).length
        const completionPercentage = Math.round((completedCount / updatedSubActivities.length) * 100)
        
        let newStatus: Task['status'] = 'in-progress'
        if (completionPercentage === 0) newStatus = 'not-started'
        if (completionPercentage === 100) newStatus = 'completed'
        
        return {
          ...task,
          subActivities: updatedSubActivities,
          completionPercentage,
          status: newStatus,
          isCompleted: completionPercentage === 100
        }
      }
      return task
    })

    const updatedPlan = recalculateProjectMetrics(
      { ...projectPlan, tasks: updatedTasks },
      originalCost,
      simulatedDaysElapsed
    )

    onTaskUpdate(updatedPlan)
  }

  const handleWorkItemUpdate = (taskId: string, itemName: string, field: 'totalQuantity' | 'completedQuantity', newValue: number) => {
    const updatedTasks = projectPlan.tasks.map(task => {
      if (task.id === taskId && task.workItems) {
        const updatedWorkItems = task.workItems.map(item => {
          if (item.itemName === itemName) {
            if (field === 'totalQuantity') {
              // Only allow setting total if not locked
              if (!item.isTotalLocked) {
                return { ...item, totalQuantity: Math.max(0, newValue) }
              }
              return item
            } else {
              // For completedQuantity, add to history
              const updated = { ...item, completedQuantity: Math.max(0, Math.min(item.totalQuantity, newValue)) }
              // Don't add to history yet - will be added on save
              return updated
            }
          }
          return item
        })

        // Calculate task completion based on work items
        const totalProgress = updatedWorkItems.reduce((sum, item) => {
          if (item.totalQuantity === 0) return sum
          return sum + (item.completedQuantity / item.totalQuantity)
        }, 0)
        const itemsWithTotal = updatedWorkItems.filter(item => item.totalQuantity > 0).length
        const completionPercentage = itemsWithTotal > 0 ? Math.round((totalProgress / itemsWithTotal) * 100) : 0

        let newStatus: Task['status'] = 'in-progress'
        if (completionPercentage === 0) newStatus = 'not-started'
        if (completionPercentage === 100) newStatus = 'completed'

        return {
          ...task,
          workItems: updatedWorkItems,
          completionPercentage,
          status: newStatus,
          isCompleted: completionPercentage === 100
        }
      }
      return task
    })

    const updatedPlan = recalculateProjectMetrics(
      { ...projectPlan, tasks: updatedTasks },
      originalCost,
      simulatedDaysElapsed
    )

    onTaskUpdate(updatedPlan)
  }

  const handleSaveWorkItem = async (taskId: string, itemName: string) => {
    const fieldKey = `${taskId}-${itemName}`
    setSavingField(fieldKey)
    
    try {
      // Update the task to add history entry and lock total
      const updatedTasks = projectPlan.tasks.map(task => {
        if (task.id === taskId && task.workItems) {
          const updatedWorkItems = task.workItems.map(item => {
            if (item.itemName === itemName) {
              const historyEntry = {
                date: new Date().toISOString(),
                value: item.completedQuantity
              }
              return {
                ...item,
                isTotalLocked: item.totalQuantity > 0, // Lock total after first save
                history: [...item.history, historyEntry]
              }
            }
            return item
          })
          return { ...task, workItems: updatedWorkItems }
        }
        return task
      })

      const updatedPlan = recalculateProjectMetrics(
        { ...projectPlan, tasks: updatedTasks },
        originalCost,
        simulatedDaysElapsed
      )

      onTaskUpdate(updatedPlan)

      // Save to database
      if (projectData) {
        const projectName = `${projectData.projectType}_${new Date(projectData.startDate).toLocaleDateString()}`
        await projectDB.saveProject(projectName, projectData, updatedPlan)
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSavingField(null)
    }
  }

  const getCurrentSimulatedDate = () => {
    const current = new Date(startDate)
    current.setDate(current.getDate() + simulatedDaysElapsed)
    return current
  }

  const handleSimulateTime = () => {
    setShowSimulation(true)
  }

  const handleStartSimulation = () => {
    setIsSimulating(true)
    const interval = setInterval(() => {
      setSimulatedDaysElapsed(prev => {
        const newValue = prev + 1
        if (newValue >= projectPlan.totalDuration) {
          clearInterval(interval)
          setIsSimulating(false)
          return projectPlan.totalDuration
        }
        return newValue
      })
    }, 1000) // 1 day every 1000ms (1 second) - slowed down
  }

  const handleStopSimulation = () => {
    setIsSimulating(false)
  }

  const handleResetSimulation = () => {
    setSimulatedDaysElapsed(0)
    setIsSimulating(false)
  }

  const handleDateSelection = (selectedDate: string) => {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0) // Reset to start of day
    
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0) // Reset to start of day
    
    // Calculate difference in days (can be negative if before start)
    const diffTime = selected.getTime() - start.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    
    // Ensure it's between 0 and total duration
    const newDays = Math.max(0, Math.min(diffDays, projectPlan.totalDuration))
    setSimulatedDaysElapsed(newDays)
  }

  const getTaskDateRange = (task: Task) => {
    const start = new Date(startDate)
    start.setDate(start.getDate() + task.startDay)
    
    const end = new Date(start)
    end.setDate(end.getDate() + task.actualDuration)
    
    return {
      start: start.toLocaleDateString(),
      end: end.toLocaleDateString(),
      duration: task.actualDuration
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return '#10b981' // Green
      case 'in-progress': return '#3b82f6' // Blue (On Track)
      case 'at-risk': return '#f59e0b' // Yellow/Orange (Falling Behind)
      case 'delayed': return '#ef4444' // Red (Past Deadline)
      default: return '#6b7280' // Gray
    }
  }

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'completed': return '✅ COMPLETED'
      case 'in-progress': return '✓ ON TRACK'
      case 'at-risk': return '⚠️ FALLING BEHIND'
      case 'delayed': return '🚫 DELAYED'
      case 'not-started': return 'NOT STARTED'
      default: {
        const _exhaustive: never = status
        return String(_exhaustive).toUpperCase()
      }
    }
  }

  const completedCount = projectPlan.tasks.filter(t => t.isCompleted).length
  const progressPercentage = (completedCount / projectPlan.tasks.length) * 100

  return (
    <div className="card task-timeline">
      <div className="timeline-header">
        <h3 className="card-title">Project Timeline & Checklist</h3>
        <div className="overall-progress">
          <button className="simulate-btn" onClick={handleSimulateTime}>
            Simulate Time
          </button>
          <span className="progress-label">
            Overall Progress: {completedCount}/{projectPlan.tasks.length} tasks ({Math.round(progressPercentage)}%)
          </span>
        </div>
      </div>

      {showSimulation && (
        <div className="simulation-modal-overlay" onClick={() => setShowSimulation(false)}>
          <div className="simulation-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Time Simulation Control</h3>
            <div className="simulation-content">
              <div className="simulation-info">
                <div className="sim-date-display">
                  <strong>Current Simulated Date:</strong>
                  <span className="sim-date">{getCurrentSimulatedDate().toLocaleDateString()}</span>
                </div>
                <div className="sim-days-display">
                  <strong>Days Elapsed:</strong>
                  <span className="sim-days">{simulatedDaysElapsed} / {projectPlan.totalDuration} days</span>
                </div>
                <div className="sim-progress-bar">
                  <div 
                    className="sim-progress-fill" 
                    style={{ width: `${(simulatedDaysElapsed / projectPlan.totalDuration) * 100}%` }}
                  />
                </div>
              </div>

              {/* Date Picker for Manual Selection */}
              <div className="date-picker-section">
                <label htmlFor="sim-date-picker">
                  <strong>Or Jump to Specific Date:</strong>
                </label>
                <input
                  id="sim-date-picker"
                  type="date"
                  className="date-picker-input"
                  min={startDate}
                  max={(() => {
                    const maxDate = new Date(startDate)
                    maxDate.setDate(maxDate.getDate() + projectPlan.totalDuration)
                    return maxDate.toISOString().split('T')[0]
                  })()}
                  value={getCurrentSimulatedDate().toISOString().split('T')[0]}
                  onChange={(e) => handleDateSelection(e.target.value)}
                />
                <small className="date-hint">
                  Select any date between {new Date(startDate).toLocaleDateString()} and {(() => {
                    const end = new Date(startDate)
                    end.setDate(end.getDate() + projectPlan.totalDuration)
                    return end.toLocaleDateString()
                  })()}
                </small>
              </div>

              <div className="simulation-controls">
                <button 
                  className="sim-btn sim-start" 
                  onClick={handleStartSimulation}
                  disabled={isSimulating || simulatedDaysElapsed >= projectPlan.totalDuration}
                >
                  ▶ Auto Play
                </button>
                <button 
                  className="sim-btn sim-stop" 
                  onClick={handleStopSimulation}
                  disabled={!isSimulating}
                >
                  ⏸ Pause
                </button>
                <button className="sim-btn sim-reset" onClick={handleResetSimulation}>
                  ⏮ Reset
                </button>
                <button className="sim-btn sim-close" onClick={() => setShowSimulation(false)}>
                  Close
                </button>
              </div>
              <div className="sim-delay-info">
                {simulatedDaysElapsed > 0 && (
                  <div className={`sim-status ${projectPlan.currentDelay > 0 ? 'delayed' : 'on-track'}`}>
                    {projectPlan.currentDelay > 0 ? (
                      <span>⚠️ Project Delayed by {Math.round(projectPlan.currentDelay)} days</span>
                    ) : (
                      <span>✅ Project On Track</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="delay-alert">
        {projectPlan.currentDelay > 0 ? (
          <div className="alert alert-warning">
            Project Delay: {projectPlan.currentDelay.toFixed(0)} days | 
            Cost Impact: +₹{projectPlan.costOverrun.toFixed(2)} Cr
          </div>
        ) : (
          <div className="alert alert-success">
            Project on track - No delays detected
          </div>
        )}
      </div>

      <div className="tasks-list">
        {projectPlan.tasks.map((task, index) => {
          const dates = getTaskDateRange(task)
          
          return (
            <div 
              key={task.id} 
              className={`task-item ${task.isCompleted ? 'completed' : ''} ${task.status === 'delayed' ? 'delayed' : ''}`}
            >
              <div className="task-checkbox">
                <input 
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => handleTaskComplete(task.id)}
                  id={`task-${task.id}`}
                />
                <label htmlFor={`task-${task.id}`}></label>
              </div>

              <div className="task-content">
                <div className="task-header-row">
                  <h4 className="task-name">
                    {index + 1}. {task.name}
                  </h4>
                  <span 
                    className="task-status-badge"
                    style={{ background: getStatusColor(task.status) }}
                  >
                    {getStatusLabel(task.status)}
                  </span>
                </div>

                <div className="task-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Start:</span>
                    <span className="detail-value">{dates.start}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">End:</span>
                    <span className="detail-value">{dates.end} ({dates.duration} days)</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Budget:</span>
                    <span className="detail-value">₹{(projectPlan.totalCost * task.costAllocation / 100).toFixed(2)} Cr</span>
                  </div>
                </div>

                {task.workItems && task.workItems.length > 0 && (
                  <div className="work-items-section">
                    <h5 className="work-items-title">Work Quantities:</h5>
                    <div className="work-items-list">
                      {task.workItems.map((item) => (
                        <div key={item.itemName} className="work-item">
                          <div className="work-item-header">
                            <span className="work-item-name">{item.itemName}</span>
                            <span className="work-item-planned">
                              Planned: {item.plannedPerMonth} {item.unit}/month
                            </span>
                          </div>
                          <div className="work-item-input-row">
                            <div className="work-item-input-group">
                              <label className="work-item-label">
                                Total:
                              </label>
                              {item.isTotalLocked ? (
                                <span className="work-item-total-locked">
                                  {item.totalQuantity} {item.unit}
                                </span>
                              ) : (
                                <>
                                  <input
                                    type="number"
                                    className="work-item-input"
                                    value={item.totalQuantity || ''}
                                    min={0}
                                    onChange={(e) => handleWorkItemUpdate(task.id, item.itemName, 'totalQuantity', parseInt(e.target.value) || 0)}
                                    placeholder="Enter total"
                                  />
                                  <span className="work-item-unit">{item.unit}</span>
                                </>
                              )}
                            </div>
                            <div className="work-item-input-group">
                              <label htmlFor={`${task.id}-${item.itemName}-completed`} className="work-item-label">
                                Completed:
                              </label>
                              <input
                                id={`${task.id}-${item.itemName}-completed`}
                                type="number"
                                className="work-item-input"
                                value={item.completedQuantity || ''}
                                min={0}
                                max={item.totalQuantity}
                                onChange={(e) => handleWorkItemUpdate(task.id, item.itemName, 'completedQuantity', parseInt(e.target.value) || 0)}
                                placeholder="0"
                                disabled={!item.totalQuantity}
                              />
                              <span className="work-item-unit">/ {item.totalQuantity}</span>
                              <button 
                                className="save-btn"
                                onClick={() => handleSaveWorkItem(task.id, item.itemName)}
                                disabled={savingField === `${task.id}-${item.itemName}` || !item.totalQuantity}
                                title="Update Progress"
                              >
                                {savingField === `${task.id}-${item.itemName}` ? '✓' : 'Update'}
                              </button>
                              {item.history.length > 0 && (
                                <button
                                  className="history-btn"
                                  onClick={() => setShowHistory(showHistory === `${task.id}-${item.itemName}` ? null : `${task.id}-${item.itemName}`)}
                                  title="View History"
                                >
                                  History ({item.history.length})
                                </button>
                              )}
                            </div>
                          </div>
                          {showHistory === `${task.id}-${item.itemName}` && item.history.length > 0 && (
                            <div className="progress-history">
                              <div className="progress-history-header">
                                <strong>Update History:</strong>
                                <button className="close-history-btn" onClick={() => setShowHistory(null)}>×</button>
                              </div>
                              <div className="progress-history-list">
                                {item.history.slice().reverse().map((entry, idx) => (
                                  <div key={idx} className="progress-history-item">
                                    <span className="history-date">{new Date(entry.date).toLocaleString()}</span>
                                    <span className="history-value">{entry.value} {item.unit}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {item.totalQuantity > 0 && (
                            <div className="work-item-bar">
                              <div 
                                className="work-item-bar-fill"
                                style={{ width: `${(item.completedQuantity / item.totalQuantity) * 100}%` }}
                              />
                              <span className="work-item-percentage">
                                {Math.round((item.completedQuantity / item.totalQuantity) * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {task.canRunInParallel && task.canRunInParallel.length > 0 && (
                  <div className="parallel-info">
                    <span className="parallel-label">Can run in parallel with:</span>
                    <span className="parallel-tasks">{task.canRunInParallel.join(', ')}</span>
                  </div>
                )}

                {/* New Parallel Tasks and Staggered Start Indicators */}
                <div className="linear-project-indicators">
                  {/* Parallel Task Indicator */}
                  {task.parallelTasks && task.parallelTasks.length > 0 && (
                    <div className="parallel-execution-box">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="indicator-icon">
                        <path d="M6 3v18"/><path d="M18 3v18"/><path d="M6 8h12"/><path d="M6 16h12"/>
                      </svg>
                      <div>
                        <span className="indicator-title">Parallel Execution:</span> Can proceed simultaneously with:
                        <ul className="parallel-task-list">
                          {task.parallelTasks.map((taskName, idx) => (
                            <li key={idx}>{taskName}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Staggered Start (Ladder Logic) */}
                  {task.staggeredStart && (
                    <div className="ladder-logic-box">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="indicator-icon">
                        <path d="M3 10h18"/><path d="M14 6l4 4-4 4"/><path d="M7 6l-4 4 4 4"/>
                      </svg>
                      <span>
                        <span className="indicator-title">Ladder Logic:</span> {task.staggeredStart}
                      </span>
                    </div>
                  )}
                </div>

                <div className="task-progress">
                  <div className="progress-controls">
                    <label>Progress: {task.completionPercentage}%</label>
                    <div className="progress-bar-thin">
                      <div 
                        className="progress-bar-thin-fill"
                        style={{ width: `${task.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Catch-Up Alert for Delayed Tasks */}
                  {task.catchUpAlert && task.catchUpAlert.message && (
                    <div className={`catch-up-alert ${task.catchUpAlert.isCriticalRisk ? 'critical' : 'warning'}`}>
                      <span className="alert-icon">
                        {task.catchUpAlert.isCriticalRisk ? '⚠️' : '⚡'}
                      </span>
                      <div className="alert-content">
                        <div className="alert-message">{task.catchUpAlert.message}</div>
                        <div className="alert-details">
                          Required: <strong>{task.catchUpAlert.requiredRunRate.toFixed(0)}</strong> units/month | 
                          Base Capacity: <strong>{task.catchUpAlert.currentCapacity.toFixed(0)}</strong> units/month
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {task.subActivities && task.subActivities.length > 0 && (
                  <div className="sub-activities">
                    <h5 className="sub-activities-title">Sub-Activities:</h5>
                    <div className="sub-activities-list">
                      {task.subActivities.map((subActivity) => (
                        <div key={subActivity.id} className="sub-activity-item">
                          <div className="sub-activity-checkbox">
                            <input
                              type="checkbox"
                              checked={subActivity.isCompleted}
                              onChange={() => handleSubActivityToggle(task.id, subActivity.id)}
                              id={`sub-${subActivity.id}`}
                            />
                            <label htmlFor={`sub-${subActivity.id}`}></label>
                          </div>
                          <span className={`sub-activity-name ${subActivity.isCompleted ? 'completed' : ''}`}>
                            {subActivity.name}
                          </span>
                          <span className="sub-activity-duration">
                            {subActivity.duration} days
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TaskTimeline
