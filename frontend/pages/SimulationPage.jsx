import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './SimulationPage.css'
import ProjectSelector from '../components/simulation/ProjectSelector'
import ProjectPlanner from '../components/simulation/ProjectPlanner'

function SimulationPage() {
  const location = useLocation()
  const [projectData, setProjectData] = useState(null)

  useEffect(() => {
    if (location.state?.projectData) {
      handleProjectSetup(location.state.projectData)
    }
  }, [location.state])

  const handleProjectSetup = (data) => {
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

export default SimulationPage
