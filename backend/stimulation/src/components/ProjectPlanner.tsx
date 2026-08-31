import { useState, useEffect } from 'react'
import './ProjectPlanner.css'
import type { ProjectData } from '../App'
import TaskTimeline from './TaskTimeline'
import CostBreakdown from './CostBreakdown'
import EnterpriseMetrics from './EnterpriseMetrics'
import { generateProjectPlan, type ProjectPlan } from '../utils/projectGenerator'
import { projectDB, type ProjectSnapshot } from '../utils/database'

interface ProjectPlannerProps {
  projectData: ProjectData
  onReset: () => void
}

function ProjectPlanner({ projectData, onReset }: ProjectPlannerProps) {
  const [projectPlan, setProjectPlan] = useState<ProjectPlan | null>(null)
  const [isGenerating, setIsGenerating] = useState(true)
  const [simulatedDaysElapsed, setSimulatedDaysElapsed] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [projectHistory, setProjectHistory] = useState<ProjectSnapshot[]>([])

  useEffect(() => {
    // Initialize database
    projectDB.init()
    
    // Simulate AI processing delay
    setTimeout(() => {
      const plan = generateProjectPlan(projectData)
      setProjectPlan(plan)
      setIsGenerating(false)
    }, 1500)
  }, [projectData])

  const handleSaveProject = async () => {
    if (!projectPlan) return
    
    setIsSaving(true)
    try {
      const projectName = `${projectData.projectType}_${new Date(projectData.startDate).toLocaleDateString()}`
      await projectDB.saveProject(projectName, projectData, projectPlan)
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

  const handleLoadSnapshot = async (snapshot: ProjectSnapshot) => {
    setProjectPlan(snapshot.projectPlan)
    setShowHistory(false)
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

  if (!projectPlan) return null

  const plannedDuration = Math.ceil(
    (new Date(projectData.plannedEndDate).getTime() - new Date(projectData.startDate).getTime()) 
    / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="project-planner">
      <div className="planner-header">
        <div>
          <h2>
            {projectData.projectType === 'substation' ? 'Substation' : 'Transmission Line'} Project
          </h2>
          <div className="project-meta">
            <span>Start: {new Date(projectData.startDate).toLocaleDateString()} - End: {new Date(projectData.plannedEndDate).toLocaleDateString()}</span>
            <span>Budget: ₹{projectData.estimatedCost.toFixed(2)} Cr</span>
            <span>Duration: {plannedDuration} days planned</span>
            {projectData.additionalDetails.voltage && (
              <span>Voltage: {projectData.additionalDetails.voltage}</span>
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
        startDate={projectData.startDate}
        onTaskUpdate={(updatedPlan: ProjectPlan) => setProjectPlan(updatedPlan)}
        onSimulatedDaysChange={(days: number) => setSimulatedDaysElapsed(days)}
        projectData={projectData}
      />

      <EnterpriseMetrics 
        projectPlan={projectPlan}
        startDate={projectData.startDate}
        simulatedDaysElapsed={simulatedDaysElapsed}
      />

      <CostBreakdown projectPlan={projectPlan} />
    </div>
  )
}

export default ProjectPlanner
