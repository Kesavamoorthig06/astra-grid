import { useState } from 'react'
import './App.css'
import ProjectSelector from './components/ProjectSelector'
import ProjectPlanner from './components/ProjectPlanner'

export interface ProjectData {
  projectType: 'substation' | 'transmission'
  startDate: string
  plannedEndDate: string
  estimatedCost: number
  additionalDetails: {
    voltage?: string
    capacity?: string
    length?: string
    location?: string
    terrain?: string
    establishmentCost?: string
    interestRate?: string
    storageCost?: string
  }
}

function App() {
  const [projectData, setProjectData] = useState<ProjectData | null>(null)

  const handleProjectSetup = (data: ProjectData) => {
    setProjectData(data)
  }

  const handleReset = () => {
    setProjectData(null)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background)', color: 'var(--foreground)' }}>
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--foreground)', marginBottom: '0.25rem' }}>
            Infrastructure Project Planner & Tracker
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
            AI-Powered Scheduling & Risk Analysis for Power Projects
          </p>
        </div>
      </header>
      
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        {!projectData ? (
          <ProjectSelector onProjectSetup={handleProjectSetup} />
        ) : (
          <ProjectPlanner projectData={projectData} onReset={handleReset} />
        )}
      </main>
    </div>
  )
}

export default App
