import { useState } from 'react'
import './ProjectSelector.css'
import type { ProjectData } from '../App'

interface ProjectSelectorProps {
  onProjectSetup: (data: ProjectData) => void
}

function ProjectSelector({ onProjectSetup }: ProjectSelectorProps) {
  const [projectType, setProjectType] = useState<'substation' | 'transmission' | null>(null)
  const [startDate, setStartDate] = useState('')
  const [plannedEndDate, setPlannedEndDate] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [voltage, setVoltage] = useState('')
  const [capacity, setCapacity] = useState('')
  const [length, setLength] = useState('')
  const [location, setLocation] = useState('')
  
  // New Dynamic Simulation Parameters
  const [terrain, setTerrain] = useState<'Plain' | 'Hilly' | 'Forest' | 'Agriculture'>('Plain')
  const [establishmentCost, setEstablishmentCost] = useState('0.5')
  const [interestRate, setInterestRate] = useState('12')
  const [storageCost, setStorageCost] = useState('0.2')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectType || !startDate || !plannedEndDate || !estimatedCost) {
      alert('Please fill all required fields')
      return
    }

    onProjectSetup({
      projectType,
      startDate,
      plannedEndDate,
      estimatedCost: parseFloat(estimatedCost),
      additionalDetails: {
        voltage,
        capacity,
        length,
        location,
        terrain,
        establishmentCost,
        interestRate,
        storageCost
      }
    })
  }

  return (
    <div className="project-selector">
      <div className="selector-card">
        <h2>Start New Project</h2>
        
        {!projectType ? (
          <div className="project-type-selection">
            <p className="selection-prompt">Select Project Type:</p>
            <div className="type-buttons">
              <button 
                className="type-btn substation"
                onClick={() => setProjectType('substation')}
              >
                <div className="type-icon">🏭</div>
                <h3>Substation</h3>
                <p>Electrical substation construction project</p>
              </button>
              <button 
                className="type-btn transmission"
                onClick={() => setProjectType('transmission')}
              >
                <div className="type-icon">⚡</div>
                <h3>Transmission Line</h3>
                <p>Overhead transmission line project</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="project-form">
            <div className="form-header">
              <h3>{projectType === 'substation' ? 'Substation Project' : 'Transmission Line Project'}</h3>
              <button 
                className="btn-link"
                onClick={() => setProjectType(null)}
              >
                Change Type
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Planned End Date *</label>
                  <input 
                    type="date"
                    value={plannedEndDate}
                    onChange={(e) => setPlannedEndDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Estimated Cost (₹ Crores) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    placeholder="e.g., 2000"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Voltage Level</label>
                  <select 
                    value={voltage}
                    onChange={(e) => setVoltage(e.target.value)}
                  >
                    <option value="">Select...</option>
                    <option value="33kV">33 kV</option>
                    <option value="66kV">66 kV</option>
                    <option value="132kV">132 kV</option>
                    <option value="220kV">220 kV</option>
                    <option value="400kV">400 kV</option>
                    <option value="765kV">765 kV</option>
                  </select>
                </div>

                {projectType === 'substation' ? (
                  <div className="form-group">
                    <label>Capacity (MVA)</label>
                    <input 
                      type="text"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="e.g., 315 MVA"
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Line Length (km)</label>
                    <input 
                      type="text"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder="e.g., 150 km"
                    />
                  </div>
                )}

                <div className="form-group full-width">
                  <label>Location</label>
                  <input 
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Delhi to Agra"
                  />
                </div>

                {/* Dynamic Simulation Parameters */}
                <div className="form-section-header full-width">
                  <h4>⚙️ Dynamic Simulation Parameters</h4>
                  <p className="section-subtitle">Advanced AI-based time and cost calculation</p>
                </div>

                <div className="form-group">
                  <label>Terrain Type *</label>
                  <select 
                    value={terrain}
                    onChange={(e) => setTerrain(e.target.value as any)}
                    required
                  >
                    <option value="Plain">Plain (1.0x productivity)</option>
                    <option value="Hilly">Hilly (0.5x productivity)</option>
                    <option value="Forest">Forest (0.2x productivity)</option>
                    <option value="Agriculture">Agriculture (0.0x Nov-Dec)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Establishment Cost/Month (₹ Cr)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={establishmentCost}
                    onChange={(e) => setEstablishmentCost(e.target.value)}
                    placeholder="e.g., 0.5"
                  />
                  <small className="field-hint">Site office, staff, utilities per month</small>
                </div>

                <div className="form-group">
                  <label>Annual Interest Rate (%)</label>
                  <input 
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="e.g., 12"
                  />
                  <small className="field-hint">For calculating Interest During Construction (IDC)</small>
                </div>

                <div className="form-group">
                  <label>Storage Cost/Month (₹ Cr)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={storageCost}
                    onChange={(e) => setStorageCost(e.target.value)}
                    placeholder="e.g., 0.2"
                  />
                  <small className="field-hint">If materials arrive before site is ready</small>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-large">
                Generate Dynamic Project Plan with Real AI
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectSelector
