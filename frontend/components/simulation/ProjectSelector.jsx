import { useState } from 'react'
import './ProjectSelector.css'

function ProjectSelector({ onProjectSetup }) {
  const todayIso = new Date().toISOString().split('T')[0]

  const computePlannedEnd = (type, capacity, startDateStr) => {
    const start = startDateStr ? new Date(startDateStr) : new Date()
    let durationMonths = 12
    if (type === 'Substation') {
      durationMonths = capacity >= 220 ? 18 : 12
    } else {
      durationMonths = capacity >= 400 ? 24 : 18
    }
    const end = new Date(start)
    end.setMonth(end.getMonth() + durationMonths)
    return end.toISOString().split('T')[0]
  }

  const [selectedType, setSelectedType] = useState('Substation')
  const [userSetPlannedEnd, setUserSetPlannedEnd] = useState(false)
  const [formData, setFormData] = useState({
    capacity: 132,
    location: 'Normal',
    urgency: 'Standard',
    terrainType: 'plain',
    establishmentCostPerMonth: 3.5,
    annualInterestRate: 8.5,
    storageCostPerMonth: 0.8,
    startDate: todayIso,
    plannedEndDate: computePlannedEnd('Substation', 132, todayIso)
  })

  const projectTypes = [
    {
      id: 'Substation',
      name: 'Substation',
      icon: '⚡',
      description: 'Power distribution facility'
    },
    {
      id: 'Transmission',
      name: 'Transmission Line',
      icon: '🔌',
      description: 'Long-distance power lines'
    }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Use user-provided dates when available; otherwise fall back to derived values
    const todayIso = new Date().toISOString().split('T')[0]
    const startDate = formData.startDate || todayIso
    const endDate = formData.plannedEndDate ? new Date(formData.plannedEndDate) : new Date(startDate)
    
    // Set project duration based on type and capacity when planned end date not provided
    let durationMonths = 12
    if (selectedType === 'Substation') {
      durationMonths = formData.capacity >= 220 ? 18 : 12
    } else {
      durationMonths = formData.capacity >= 400 ? 24 : 18
    }
    if (!formData.plannedEndDate && !userSetPlannedEnd) {
      endDate.setMonth(endDate.getMonth() + durationMonths)
    }
    
    // Calculate estimated cost based on capacity
    let estimatedCost = 50
    if (selectedType === 'Substation') {
      estimatedCost = formData.capacity * 0.5
    } else {
      estimatedCost = formData.capacity * 0.8
    }
    
    onProjectSetup({
      projectType: selectedType.toLowerCase(),
      startDate: startDate,
      plannedEndDate: endDate.toISOString().split('T')[0],
      estimatedCost: estimatedCost,
      additionalDetails: {
        voltage: formData.capacity + ' kV',
        capacity: formData.capacity,
        location: formData.location,
        terrain: formData.terrainType,
        establishmentCost: formData.establishmentCostPerMonth,
        interestRate: formData.annualInterestRate,
        storageCost: formData.storageCostPerMonth
      }
    })
  }

  return (
    <div className="project-selector">
      <div className="selector-header">
        <h2 className="selector-title">Configure Your Power Grid Project</h2>
        <p className="selector-subtitle">
          Choose project type and customize parameters for realistic simulation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="selector-form">
        <div className="form-section">
          <h3 className="form-section-title">Project Type</h3>
          <div className="project-type-grid">
            {projectTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                className={`project-type-card ${selectedType === type.id ? 'selected' : ''}`}
                onClick={() => {
                  const nextType = type.id
                  const recomputedEnd = userSetPlannedEnd
                    ? formData.plannedEndDate
                    : computePlannedEnd(nextType, formData.capacity, formData.startDate)
                  setSelectedType(nextType)
                  setFormData({ ...formData, plannedEndDate: recomputedEnd })
                }}
              >
                <span className="type-icon">{type.icon}</span>
                <span className="type-name">{type.name}</span>
                <span className="type-description">{type.description}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedType === 'Substation' && (
          <div className="form-section">
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="startDate">Start Date *</label>
                <input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => {
                    const nextStart = e.target.value
                    const recomputedEnd = userSetPlannedEnd
                      ? formData.plannedEndDate
                      : computePlannedEnd(selectedType, formData.capacity, nextStart)
                    setFormData({ ...formData, startDate: nextStart, plannedEndDate: recomputedEnd })
                  }}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="plannedEndDate">Planned End Date *</label>
                <input
                  id="plannedEndDate"
                  type="date"
                  value={formData.plannedEndDate || ''}
                  onChange={(e) => {
                    setUserSetPlannedEnd(true)
                    setFormData({ ...formData, plannedEndDate: e.target.value })
                  }}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="estimatedCost">Estimated Cost (₹ Crores) *</label>
                <input
                  id="estimatedCost"
                  type="text"
                  placeholder="e.g., 2000"
                  value={formData.estimatedCost || ''}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="voltageLevel">Voltage Level</label>
                <select
                  id="voltageLevel"
                  value={formData.voltageLevel || ''}
                  onChange={(e) => setFormData({ ...formData, voltageLevel: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select...</option>
                  <option value="33kV">33 kV</option>
                  <option value="66kV">66 kV</option>
                  <option value="132kV">132 kV</option>
                  <option value="220kV">220 kV</option>
                  <option value="400kV">400 kV</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="capacityMVA">Capacity (MVA)</label>
                <input
                  id="capacity"
                  type="number"
                  min="33"
                  max="765"
                  value={formData.capacity}
                  onChange={(e) => {
                    const nextCapacity = Number(e.target.value)
                    const recomputedEnd = userSetPlannedEnd
                      ? formData.plannedEndDate
                      : computePlannedEnd(selectedType, nextCapacity, formData.startDate)
                    setFormData({ ...formData, capacity: nextCapacity, plannedEndDate: recomputedEnd })
                  }}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  placeholder="e.g., Delhi to Agra"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">
                ⚡ Dynamic Simulation Parameters
              </h3>
              <p className="form-description">Advanced AI-based time and cost calculation</p>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="terrainType">Terrain Type *</label>
                  <select
                    id="terrainType"
                    value={formData.terrainType || 'Plain (1.0x productivity)'}
                    onChange={(e) => setFormData({ ...formData, terrainType: e.target.value })}
                    className="form-select"
                  >
                    <option value="Plain (1.0x productivity)">Plain (1.0x productivity)</option>
                    <option value="Hilly (1.5x productivity)">Hilly (1.5x productivity)</option>
                    <option value="Mountain (2.0x productivity)">Mountain (2.0x productivity)</option>
                  </select>
                  <small className="field-hint">Multiplies task durations based on terrain</small>
                </div>

                <div className="form-field">
                  <label htmlFor="establishmentCost">Establishment Cost/Month (₹ Cr)</label>
                  <input
                    id="establishmentCost"
                    type="number"
                    step="0.1"
                    placeholder="0.5"
                    value={formData.establishmentCost || ''}
                    onChange={(e) => setFormData({ ...formData, establishmentCost: e.target.value })}
                    className="form-input"
                  />
                  <small className="field-hint">Site office, staff, utilities per month</small>
                </div>

                <div className="form-field">
                  <label htmlFor="annualInterestRate">Annual Interest Rate (%)</label>
                  <input
                    id="annualInterestRate"
                    type="number"
                    step="0.1"
                    placeholder="12"
                    value={formData.annualInterestRate || ''}
                    onChange={(e) => setFormData({ ...formData, annualInterestRate: e.target.value })}
                    className="form-input"
                  />
                  <small className="field-hint">For calculating Interest During Construction (IDC)</small>
                </div>

                <div className="form-field">
                  <label htmlFor="storageCost">Storage Cost/Month (₹ Cr)</label>
                  <input
                    id="storageCost"
                    type="number"
                    step="0.1"
                    placeholder="0.2"
                    value={formData.storageCost || ''}
                    onChange={(e) => setFormData({ ...formData, storageCost: e.target.value })}
                    className="form-input"
                  />
                  <small className="field-hint">If materials arrive before site is ready</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedType === 'Transmission' && (
          <div className="form-section">
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="startDate">Start Date *</label>
                <input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="plannedEndDate">Planned End Date *</label>
                <input
                  id="plannedEndDate"
                  type="date"
                  value={formData.plannedEndDate || ''}
                  onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="estimatedCost">Estimated Cost (₹ Crores) *</label>
                <input
                  id="estimatedCost"
                  type="text"
                  placeholder="e.g., 5000"
                  value={formData.estimatedCost || ''}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="voltageLevel">Voltage Level (kV)</label>
                <select
                  id="voltageLevel"
                  value={formData.voltageLevel || ''}
                  onChange={(e) => setFormData({ ...formData, voltageLevel: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select...</option>
                  <option value="132kV">132 kV</option>
                  <option value="220kV">220 kV</option>
                  <option value="400kV">400 kV</option>
                  <option value="765kV">765 kV</option>
                </select>
                <small className="field-hint">Higher voltage = longer lines</small>
              </div>

              <div className="form-field">
                <label htmlFor="length">Line Length (km)</label>
                <input
                  id="length"
                  type="text"
                  placeholder="e.g., 250 km"
                  value={formData.length || ''}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="rightOfWayStatus">Right of Way Status</label>
                <select
                  id="rightOfWayStatus"
                  value={formData.rightOfWayStatus || ''}
                  onChange={(e) => setFormData({ ...formData, rightOfWayStatus: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select...</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Partially Approved">Partially Approved</option>
                </select>
                <small className="field-hint">Approval status affects timeline</small>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">
                ⚡ Dynamic Simulation Parameters
              </h3>
              <p className="form-description">Advanced AI-based time and cost calculation</p>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="terrainType">Terrain Type *</label>
                  <select
                    id="terrainType"
                    value={formData.terrainType || 'Plain (1.0x productivity)'}
                    onChange={(e) => setFormData({ ...formData, terrainType: e.target.value })}
                    className="form-select"
                  >
                    <option value="Plain (1.0x productivity)">Plain (1.0x productivity)</option>
                    <option value="Hilly (1.5x productivity)">Hilly (1.5x productivity)</option>
                    <option value="Mountain (2.0x productivity)">Mountain (2.0x productivity)</option>
                    <option value="Forest (1.8x productivity)">Forest (1.8x productivity)</option>
                    <option value="Coastal (1.3x productivity)">Coastal (1.3x productivity)</option>
                  </select>
                  <small className="field-hint">Multiplies task durations based on terrain</small>
                </div>

                <div className="form-field">
                  <label htmlFor="establishmentCost">Establishment Cost/Month (₹ Cr)</label>
                  <input
                    id="establishmentCost"
                    type="number"
                    step="0.1"
                    placeholder="0.5"
                    value={formData.establishmentCost || ''}
                    onChange={(e) => setFormData({ ...formData, establishmentCost: e.target.value })}
                    className="form-input"
                  />
                  <small className="field-hint">Site office, staff, utilities per month</small>
                </div>

                <div className="form-field">
                  <label htmlFor="annualInterestRate">Annual Interest Rate (%)</label>
                  <input
                    id="annualInterestRate"
                    type="number"
                    step="0.1"
                    placeholder="12"
                    value={formData.annualInterestRate || ''}
                    onChange={(e) => setFormData({ ...formData, annualInterestRate: e.target.value })}
                    className="form-input"
                  />
                  <small className="field-hint">For calculating Interest During Construction (IDC)</small>
                </div>

                <div className="form-field">
                  <label htmlFor="storageCost">Storage Cost/Month (₹ Cr)</label>
                  <input
                    id="storageCost"
                    type="number"
                    step="0.1"
                    placeholder="0.2"
                    value={formData.storageCost || ''}
                    onChange={(e) => setFormData({ ...formData, storageCost: e.target.value })}
                    className="form-input"
                  />
                  <small className="field-hint">If materials arrive before site is ready</small>
                </div>
              </div>
            </div>
          </div>
        )}

        <button type="submit" className="submit-btn">
          Generate Project Plan
        </button>
      </form>
    </div>
  )
}

export default ProjectSelector
