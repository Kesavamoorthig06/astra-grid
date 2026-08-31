import { useState, useEffect } from 'react'
import './ProjectPlanner.css'
import TaskTimeline from './TaskTimeline'
import CostBreakdown from './CostBreakdown'
import EnterpriseMetrics from './EnterpriseMetrics'
import DelayPropagationView from '../DelayPropagationView'
import { generateProjectPlan } from '../../utils/simulation/projectGenerator'
import { projectDB } from '../../utils/simulation/database'

function ProjectPlanner({ projectData, onReset }) {
  const reschedulePlanToEndDate = (plan, startDateStr, endDateStr) => {
    if (!plan || !startDateStr || !endDateStr) return plan

    const startMs = Date.parse(startDateStr)
    const endMs = Date.parse(endDateStr)
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return plan

    const targetTotalDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)))
    const currentTotalDays = plan.totalDuration || plan.tasks.reduce((sum, t) => sum + (t.actualDuration || 0), 0)
    if (!currentTotalDays || !Number.isFinite(currentTotalDays)) return plan

    const scale = targetTotalDays / currentTotalDays
    let rollingDay = 0
    let rollingMonth = 0

    const rescheduledTasks = plan.tasks.map((task) => {
      const scaledDuration = Math.max(1, Math.round((task.actualDuration || 0) * scale))
      const scaledMonths = Math.max(1, Math.ceil(scaledDuration / 30))
      const updatedTask = {
        ...task,
        actualDuration: scaledDuration,
        actualDurationMonths: scaledMonths,
        plannedDuration: scaledDuration,
        startDay: rollingDay,
        startMonth: rollingMonth
      }
      rollingDay += scaledDuration
      rollingMonth += scaledMonths
      return updatedTask
    })

    const totalDuration = rescheduledTasks.reduce((sum, t) => sum + t.actualDuration, 0)
    const totalDurationMonths = rescheduledTasks.reduce((sum, t) => sum + t.actualDurationMonths, 0)

    return {
      ...plan,
      tasks: rescheduledTasks,
      totalDuration,
      totalDurationMonths,
      baseStartDate: startDateStr,
      baseEndDate: endDateStr
    }
  }

  const [editableProjectData, setEditableProjectData] = useState(projectData)
  const [projectPlan, setProjectPlan] = useState(null)
  const [isGenerating, setIsGenerating] = useState(true)
  const [simulatedDaysElapsed, setSimulatedDaysElapsed] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [projectHistory, setProjectHistory] = useState([])

  useEffect(() => {
    projectDB.init()
  }, [])

  useEffect(() => {
    setEditableProjectData(projectData)
  }, [projectData])

  useEffect(() => {
    if (!editableProjectData) return

    setIsGenerating(true)
    const timer = setTimeout(() => {
      const plan = generateProjectPlan(editableProjectData)
      const adjustedPlan = reschedulePlanToEndDate(
        plan,
        editableProjectData.startDate,
        editableProjectData.plannedEndDate
      )
      setProjectPlan(adjustedPlan)
      setIsGenerating(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [editableProjectData])

  const handleSaveProject = async () => {
    if (!projectPlan) return
    
    setIsSaving(true)
    try {
      const projectName = `${editableProjectData.projectType}_${new Date(editableProjectData.startDate).toLocaleDateString()}`
      await projectDB.saveProject(projectName, editableProjectData, projectPlan)
      alert('Project saved successfully!')
    } catch (error) {
      console.error('Failed to save project:', error)
      alert('Failed to save project')
    } finally {
      setIsSaving(false)
    }
  }

  const handleShowHistory = async () => {
    try {
      const history = await projectDB.getAllProjects()
      setProjectHistory(history)
      setShowHistory(true)
    } catch (error) {
      console.error('Failed to load history:', error)
      alert('Failed to load project history')
    }
  }

  const handleLoadSnapshot = async (snapshot) => {
    setEditableProjectData(snapshot.projectData)
    setProjectPlan(snapshot.projectPlan)
    setIsGenerating(false)
    setShowHistory(false)
  }

  const handleDateChange = (field, value) => {
    setEditableProjectData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  if (isGenerating) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>AI is analyzing your project...</h2>
        <p>Generating optimized schedule and cost breakdown</p>
      </div>
    )
  }

  if (!projectPlan || !editableProjectData) return null

  const startMs = Date.parse(editableProjectData.startDate)
  const endMs = Date.parse(editableProjectData.plannedEndDate)
  const plannedDuration = startMs && endMs
    ? Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24))
    : null
  const budgetValue = Number(editableProjectData.estimatedCost ?? 0)

  return (
    <div className="project-planner">
      <div className="planner-header">
        <div>
          <h2>
            {editableProjectData.projectType === 'substation' ? 'Substation' : 'Transmission Line'} Project
          </h2>
          <div className="project-meta" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
            <span>
              Start: 
              <input
                type="date"
                value={editableProjectData.startDate || ''}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="meta-input"
              />
              {' '} - End: 
              <input
                type="date"
                value={editableProjectData.plannedEndDate || ''}
                onChange={(e) => handleDateChange('plannedEndDate', e.target.value)}
                className="meta-input"
              />
            </span>
            <span>Budget: ₹{budgetValue.toFixed(2)} Cr</span>
            <span>Duration: {plannedDuration ? `${plannedDuration} days planned` : '--'}</span>
            {editableProjectData.additionalDetails.voltage && (
              <span>Voltage: {editableProjectData.additionalDetails.voltage}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={handleSaveProject} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Project'}
          </button>
          <button className="btn btn-secondary" onClick={handleShowHistory}>
            Load History
          </button>
          <button className="btn btn-secondary" onClick={onReset}>
            New Project
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="history-modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Project History</h3>
            <div className="history-list">
              {projectHistory.length === 0 ? (
                <p>No saved projects found</p>
              ) : (
                projectHistory.map((snapshot) => (
                  <div key={snapshot.id} className="history-item">
                    <div className="history-item-info">
                      <strong>{snapshot.projectName}</strong>
                      <span>{new Date(snapshot.timestamp).toLocaleString()}</span>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleLoadSnapshot(snapshot)}
                    >
                      Load
                    </button>
                  </div>
                ))
              )}
            </div>
            <button className="btn btn-secondary" onClick={() => setShowHistory(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      <TaskTimeline 
        projectPlan={projectPlan}
        startDate={editableProjectData.startDate}
        onTaskUpdate={(updatedPlan) => setProjectPlan(updatedPlan)}
        onSimulatedDaysChange={(days) => setSimulatedDaysElapsed(days)}
        projectData={editableProjectData}
      />

      <EnterpriseMetrics 
        projectPlan={projectPlan}
        startDate={editableProjectData.startDate}
        simulatedDaysElapsed={simulatedDaysElapsed}
      />

      {/* Delay Propagation Analysis */}
      {projectPlan.delayAnalysis && projectPlan.delayAnalysis.delayedTaskCount > 0 && (
        <div className="delay-analysis-section" style={{ 
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            color: '#333'
          }}>
            ⚠️ Delay Impact Analysis
          </h2>
          <DelayPropagationView delayAnalysis={projectPlan.delayAnalysis} />
        </div>
      )}

      <CostBreakdown projectPlan={projectPlan} />
    </div>
  )
}

export default ProjectPlanner
