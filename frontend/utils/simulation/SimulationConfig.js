// ===============================================
// SIMULATION CONFIG - Data-Driven Phase & Duration Logic
// ===============================================
// This module replaces all hardcoded phase definitions,
// terrain factors, productivity calendars, and duration logic
// with data-driven configurations that adapt to projectData inputs.

/**
 * PRODUCTIVITY CALENDAR - Month-based efficiency factors
 * Represents seasonal impacts on work productivity
 * Source: Real project data patterns
 */
export const ProductivityCalendar = {
  6: { factor: 0.4, reason: 'Monsoon' },   // June
  7: { factor: 0.4, reason: 'Monsoon' },   // July
  8: { factor: 0.4, reason: 'Monsoon' },   // August
  10: { factor: 0.6, reason: 'Festival Season' }, // October
  3: { factor: 0.6, reason: 'Festival Season' },  // March
  11: { factor: 1.0, reason: 'Harvest Season (Check Terrain)' }, // November
  12: { factor: 1.0, reason: 'Harvest Season (Check Terrain)' }  // December
}

/**
 * TERRAIN FACTORS - Terrain-based productivity multipliers
 * Lower factors = slower work due to difficulty
 * These are applied on top of ProductivityCalendar factors
 */
export const TerrainFactors = {
  Plain: 1.0,
  Hilly: 0.5,
  Forest: 0.2,
  Agriculture: 1.0, // Special: 0.0 during Nov-Dec harvest
}

/**
 * TASK DEPENDENCY CONFIGURATION
 * Defines which tasks depend on others and the delay impact multipliers
 * 
 * delayMultiplier: If predecessor is delayed by X days, this task is delayed by X * multiplier days
 * Example: If Engineering is delayed 5 days and delayMultiplier = 2.0, Foundation is delayed 10 days
 * 
 * Multiplier > 1.0 means delay amplifies (resource constraints, weather windows)
 * Multiplier = 1.0 means delay passes through directly
 * Multiplier < 1.0 means delay can be partially absorbed (parallel work, buffer time)
 */
export const TaskDependencies = {
  // Substation Dependencies
  'Supply of Material': {
    dependsOn: ['Engineering & Design'],
    delayMultiplier: 1.5, // Engineering delays cause material delays + lead time issues
    reason: 'Cannot order materials until designs are approved'
  },
  'Site Leveling': {
    dependsOn: ['Land Acquisition'],
    delayMultiplier: 1.0,
    reason: 'Cannot start site work without land possession'
  },
  'Excavation': {
    dependsOn: ['Site Leveling'],
    delayMultiplier: 1.2, // Delays compound due to seasonal constraints
    reason: 'Sequential civil work with seasonal weather windows'
  },
  'Concreting & Foundation': {
    dependsOn: ['Excavation', 'Supply of Material'],
    delayMultiplier: 2.0, // Critical path bottleneck - delays amplify
    reason: 'Needs both completed excavation AND materials on-site; seasonal constraints apply'
  },
  'Equipment Erection': {
    dependsOn: ['Concreting & Foundation', 'Supply of Material'],
    delayMultiplier: 1.8,
    reason: 'Foundation must cure AND equipment must be delivered; specialized crews have limited availability'
  },
  'Testing & Commissioning': {
    dependsOn: ['Equipment Erection'],
    delayMultiplier: 1.0,
    reason: 'Final activity - delays pass through directly'
  },
  
  // Transmission Line Dependencies
  'Engineering & Design': {
    dependsOn: ['Survey & Route Alignment'],
    delayMultiplier: 1.3,
    reason: 'Design needs survey data; route changes force design rework'
  },
  'Regulatory Permissions': {
    dependsOn: ['Survey & Route Alignment', 'Engineering & Design'],
    delayMultiplier: 2.5, // Bureaucratic delays amplify significantly
    reason: 'Requires complete survey and design for approvals; govt processing is unpredictable'
  },
  'Land Acquisition & ROW': {
    dependsOn: ['Survey & Route Alignment'],
    delayMultiplier: 3.0, // Public resistance delays compound dramatically
    reason: 'Linear project - any ROW resistance blocks entire section; delays cascade'
  },
  'Foundation Work': {
    dependsOn: ['Land Acquisition & ROW', 'Supply of Material', 'Regulatory Permissions'],
    delayMultiplier: 2.2,
    reason: 'Needs ROW access + materials + permits; seasonal work windows limited'
  },
  'Tower Erection (Staggered)': {
    dependsOn: ['Foundation Work', 'Supply of Material'],
    delayMultiplier: 1.5,
    reason: 'Staggered work can absorb some delays, but crane/crew availability constrained'
  },
  'Conductor Stringing': {
    dependsOn: ['Tower Erection (Staggered)'],
    delayMultiplier: 1.2,
    reason: 'Weather-dependent work; delays in erection push stringing into bad weather'
  }
}

/**
 * SUBSTATION PHASE TEMPLATE
 * Generates phase list for substation projects based on voltage/capacity
 * Derives phase count, durations, and work items from projectData
 * 
 * @param {Object} projectData - Project configuration
 * @returns {Array} Phase definitions with dynamic durations
 */
export function getSubstationPhases(projectData) {
  const capacity = parseFloat(projectData.capacity) || 100
  const terrain = projectData.additionalDetails?.terrain || 'Plain'
  const lineLength = parseFloat(projectData.additionalDetails?.lineLength) || 0
  
  // Base phases: always present regardless of capacity
  const phases = [
    {
      name: 'Engineering & Design',
      baselineDuration: 60,
      costPercentage: 12,
      durationMultiplier: getCapacityMultiplier(capacity, 'design'),
      canRunInParallel: ['land-acquisition'],
      workItems: [
        { itemName: 'Technical Drawings', plannedPerMonth: 500, unit: 'diagrams' },
        { itemName: 'Design Calculations', plannedPerMonth: 100, unit: 'sheets' },
        { itemName: 'BOQ Preparation', plannedPerMonth: 8, unit: 'documents' }
      ]
    },
    {
      name: 'Supply of Material',
      baselineDuration: 120,
      costPercentage: 35,
      durationMultiplier: getCapacityMultiplier(capacity, 'supply'),
      workItems: []
    },
    {
      name: 'Land Acquisition',
      baselineDuration: 90,
      costPercentage: 8,
      durationMultiplier: getTerrainMultiplier(terrain, 'land'),
      canRunInParallel: ['engineering-design'],
      workItems: [
        { itemName: 'Land Parcels', plannedPerMonth: 4, unit: 'plots' },
        { itemName: 'Documentation', plannedPerMonth: 20, unit: 'files' }
      ],
      subPhases: [
        { name: 'Site Identification & Survey', duration: 10 },
        { name: 'Land Records & Documentation', duration: 15 },
        { name: 'Negotiation with Owners', duration: 20 },
        { name: 'Payment Processing', duration: 15 },
        { name: 'Legal Registration', duration: 20 },
        { name: 'Physical Possession', duration: 10 }
      ]
    },
    {
      name: 'Site Leveling',
      baselineDuration: 30,
      costPercentage: 5,
      durationMultiplier: getTerrainMultiplier(terrain, 'civil'),
      workItems: []
    },
    {
      name: 'Excavation',
      baselineDuration: 45,
      costPercentage: 7,
      durationMultiplier: getTerrainMultiplier(terrain, 'civil'),
      workItems: []
    },
    {
      name: 'Concreting & Foundation',
      baselineDuration: 60,
      costPercentage: 15,
      durationMultiplier: getCapacityMultiplier(capacity, 'foundation'),
      workItems: [
        { itemName: 'Equipment Foundations', plannedPerMonth: 8, unit: 'nos' },
        { itemName: 'Concrete Poured', plannedPerMonth: 400, unit: 'm³' }
      ]
    },
    {
      name: 'Equipment Erection',
      baselineDuration: 75,
      costPercentage: 10,
      durationMultiplier: getCapacityMultiplier(capacity, 'erection'),
      workItems: []
    },
    {
      name: 'Testing & Commissioning',
      baselineDuration: 30,
      costPercentage: 8,
      durationMultiplier: 1.0,
      workItems: []
    }
  ]
  
  return phases
}

/**
 * TRANSMISSION PHASE TEMPLATE
 * Generates phase list for transmission projects based on voltage/length/capacity
 * Derives phase count, durations, and work items from projectData
 * 
 * @param {Object} projectData - Project configuration
 * @returns {Array} Phase definitions with dynamic durations
 */
export function getTransmissionPhases(projectData) {
  const capacity = parseFloat(projectData.capacity) || 100
  const lineLength = parseFloat(projectData.additionalDetails?.lineLength) || 100
  const terrain = projectData.additionalDetails?.terrain || 'Plain'
  
  // Calculate phases based on line length and complexity
  const lengthMultiplier = Math.max(0.5, Math.min(2.0, lineLength / 100))
  
  const phases = [
    {
      name: 'Survey & Route Alignment',
      baselineDuration: 45,
      costPercentage: 8,
      durationMultiplier: lengthMultiplier * getTerrainMultiplier(terrain, 'survey'),
      canRunInParallel: ['land-acquisition-row'],
      parallelTasks: ['Engineering & Design (Partial)'],
      workItems: [
        { itemName: 'Survey Points', plannedPerMonth: 80, unit: 'points' },
        { itemName: 'Route Km', plannedPerMonth: 25, unit: 'km' }
      ],
      subPhases: [
        { name: 'Topographical Survey', duration: 10 },
        { name: 'Soil Investigation', duration: 8 },
        { name: 'ROW Identification', duration: 10 },
        { name: 'Forest/Railway/Road/Airport Crossings', duration: 12 },
        { name: 'Final Route Approval', duration: 5 }
      ]
    },
    {
      name: 'Engineering & Design',
      baselineDuration: 60,
      costPercentage: 10,
      durationMultiplier: getCapacityMultiplier(capacity, 'design'),
      canRunInParallel: ['land-acquisition-row'],
      parallelTasks: ['Regulatory Permissions', 'Survey (Final Stages)'],
      workItems: [
        { itemName: 'Tower Designs', plannedPerMonth: 400, unit: 'diagrams' },
        { itemName: 'Foundation Designs', plannedPerMonth: 150, unit: 'sheets' }
      ]
    },
    {
      name: 'Regulatory Permissions',
      baselineDuration: 75,
      costPercentage: 6,
      durationMultiplier: 1.0,
      parallelTasks: ['Engineering & Design', 'Supply of Material'],
      workItems: []
    },
    {
      name: 'Supply of Material',
      baselineDuration: 120,
      costPercentage: 40,
      durationMultiplier: getCapacityMultiplier(capacity, 'supply'),
      parallelTasks: ['Land Acquisition', 'Foundation Work', 'Regulatory Permissions'],
      workItems: []
    },
    {
      name: 'Land Acquisition & ROW',
      baselineDuration: 90,
      costPercentage: 10,
      durationMultiplier: lengthMultiplier * 0.8,
      canRunInParallel: ['survey-route-alignment', 'engineering-design'],
      parallelTasks: ['Supply of Material'],
      workItems: [
        { itemName: 'ROW Acquired', plannedPerMonth: 15, unit: 'km' },
        { itemName: 'Landowners Settled', plannedPerMonth: 100, unit: 'cases' }
      ],
      subPhases: [
        { name: 'ROW Demarcation', duration: 10 },
        { name: 'Landowner Identification', duration: 15 },
        { name: 'Compensation Assessment', duration: 20 },
        { name: 'Payment & Agreement', duration: 25 },
        { name: 'Legal Clearances', duration: 15 },
        { name: 'ROW Handover', duration: 5 }
      ]
    },
    {
      name: 'Foundation Work',
      baselineDuration: 90,
      costPercentage: 12,
      durationMultiplier: lengthMultiplier * getTerrainMultiplier(terrain, 'civil'),
      canRunInParallel: ['supply-of-material'],
      parallelTasks: ['Tower Erection (Staggered)'],
      workItems: [
        { itemName: 'Tower Foundations', plannedPerMonth: 20, unit: 'nos' },
        { itemName: 'Concrete Poured', plannedPerMonth: 500, unit: 'm³' }
      ]
    },
    {
      name: 'Tower Erection (Staggered)',
      baselineDuration: 120,
      costPercentage: 18,
      durationMultiplier: lengthMultiplier * getTerrainMultiplier(terrain, 'erection'),
      canRunInParallel: ['foundation-work'],
      parallelTasks: ['Conductor Stringing'],
      workItems: [
        { itemName: 'Towers Erected', plannedPerMonth: 25, unit: 'nos' },
        { itemName: 'Tower Height (m)', plannedPerMonth: 300, unit: 'm' }
      ]
    },
    {
      name: 'Conductor Stringing',
      baselineDuration: 60,
      costPercentage: 5,
      durationMultiplier: lengthMultiplier * 0.9,
      parallelTasks: ['Tower Erection (Staggered)'],
      workItems: [
        { itemName: 'Circuit Km Strung', plannedPerMonth: 60, unit: 'km' }
      ]
    },
    {
      name: 'Testing & Commissioning',
      baselineDuration: 30,
      costPercentage: 3,
      durationMultiplier: 1.0,
      workItems: []
    }
  ]
  
  return phases
}

/**
 * CAPACITY MULTIPLIER
 * Higher capacity = longer duration for certain tasks
 * Example: 400 MVA substation takes longer to design than 100 MVA
 * 
 * @param {number} capacity - Project capacity (MVA or similar)
 * @param {string} taskType - Type of task ('design', 'supply', 'foundation', 'erection')
 * @returns {number} Duration multiplier (0.5 - 2.0)
 */
export function getCapacityMultiplier(capacity, taskType) {
  // Normalize to 100 MVA baseline
  const normalizedCapacity = Math.max(50, Math.min(capacity, 1000)) / 100
  
  const taskFactors = {
    design: 0.8,      // Design scales sub-linearly with capacity
    supply: 1.0,      // Supply scales linearly
    foundation: 1.2,  // Foundation scales super-linearly with capacity
    erection: 1.1,    // Erection is slightly super-linear
    civil: 0.9        // Civil works scale sub-linearly
  }
  
  const factor = taskFactors[taskType] || 1.0
  const multiplier = Math.pow(normalizedCapacity, factor)
  
  return Math.max(0.5, Math.min(multiplier, 2.0))
}

/**
 * TERRAIN MULTIPLIER
 * Multiplier for task duration based on terrain difficulty
 * Applied on top of base terrain factors
 * 
 * @param {string} terrain - Terrain type ('Plain', 'Hilly', 'Forest', 'Agriculture')
 * @param {string} taskType - Type of task ('survey', 'civil', 'erection', 'land')
 * @returns {number} Duration multiplier
 */
export function getTerrainMultiplier(terrain, taskType) {
  const terrainDifficulty = {
    Plain: 1.0,
    Agriculture: 1.2,
    Hilly: 1.5,
    Forest: 2.0
  }
  
  const taskSensitivity = {
    survey: 1.0,      // Survey is terrain-sensitive
    civil: 1.0,       // Civil works are very terrain-sensitive
    erection: 0.8,    // Erection less sensitive to terrain
    land: 0.9,        // Land acquisition is moderately sensitive
    design: 0.5,      // Design minimally sensitive
    supply: 0.2       // Supply not sensitive to terrain
  }
  
  const baseFactor = terrainDifficulty[terrain] || 1.0
  const sensitivity = taskSensitivity[taskType] || 1.0
  
  // Blend: (baseFactor - 1) * sensitivity + 1
  // This ensures Plain terrain has 1.0x regardless of sensitivity
  const multiplier = (baseFactor - 1.0) * sensitivity + 1.0
  
  return Math.max(0.5, Math.min(multiplier, 3.0))
}

/**
 * CALCULATE TOTAL PROJECT DURATION
 * Derives total duration from capacity, terrain, project type, and dates
 * This replaces hardcoded duration logic that was based only on type
 * 
 * @param {Object} projectData - Project configuration
 * @returns {Object} { totalMonths, startDate, endDate }
 */
export function calculateTotalDuration(projectData) {
  const capacity = parseFloat(projectData.capacity) || 100
  const terrain = projectData.additionalDetails?.terrain || 'Plain'
  const lineLength = parseFloat(projectData.additionalDetails?.lineLength) || 0
  const startDate = new Date(projectData.startDate)
  
  let baseDurationMonths = 0
  
  if (projectData.projectType === 'substation') {
    // Substation: base 12-18 months depending on capacity
    baseDurationMonths = capacity >= 220 ? 18 : 12
    // Adjust for terrain
    const terrainMult = getTerrainMultiplier(terrain, 'civil')
    baseDurationMonths = Math.round(baseDurationMonths * terrainMult)
  } else if (projectData.projectType === 'transmission') {
    // Transmission: base 20-30 months depending on capacity and length
    const capacityFactor = capacity >= 400 ? 1.2 : (capacity >= 220 ? 1.1 : 1.0)
    const lengthFactor = Math.max(0.8, Math.min(lineLength / 100, 1.5))
    baseDurationMonths = Math.round(24 * capacityFactor * lengthFactor)
    // Adjust for terrain
    const terrainMult = getTerrainMultiplier(terrain, 'survey')
    baseDurationMonths = Math.round(baseDurationMonths * terrainMult)
  }
  
  // Ensure reasonable bounds
  baseDurationMonths = Math.max(6, Math.min(baseDurationMonths, 48))
  
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + baseDurationMonths)
  
  return {
    totalMonths: baseDurationMonths,
    baseDurationMonths,
    startDate,
    endDate
  }
}

/**
 * CALCULATE DELAY PROPAGATION
 * Calculates how delays cascade through the project dependency chain
 * 
 * Example: If Engineering is delayed 5 days:
 * - Supply of Material: 5 * 1.5 = 7.5 days delayed
 * - Foundation: 7.5 * 2.0 = 15 days delayed (depends on Supply)
 * - Total project delay: 5 + 7.5 + 15 = 27.5 days
 * 
 * @param {Array} tasks - Array of task objects with {name, actualDuration, plannedDuration, completedWork, plannedWork}
 * @param {Object} dependencies - TaskDependencies configuration
 * @returns {Object} { taskDelays: {taskName: delayDays}, totalProjectDelay, criticalPath }
 */
export function calculateDelayPropagation(tasks, dependencies = TaskDependencies) {
  const taskDelays = {} // Store delay for each task
  const taskImpacts = {} // Store reasons for delay
  const processedTasks = new Set()
  
  // Calculate base delays (difference between planned and actual)
  tasks.forEach(task => {
    const planned = task.plannedDuration || 0
    const actual = task.actualDuration || 0
    const baseDelay = Math.max(0, actual - planned)
    
    // Also consider work completion rate
    if (task.plannedWork && task.completedWork) {
      const completionRate = task.completedWork / task.plannedWork
      if (completionRate < 1.0) {
        // Task is behind schedule
        const remainingWork = task.plannedWork - task.completedWork
        const remainingDays = Math.round(remainingWork / (task.plannedWork / planned))
        taskDelays[task.name] = Math.max(baseDelay, remainingDays)
      } else {
        taskDelays[task.name] = baseDelay
      }
    } else {
      taskDelays[task.name] = baseDelay
    }
    
    taskImpacts[task.name] = {
      baseDelay: taskDelays[task.name],
      propagatedDelay: 0,
      upstreamDelays: [],
      reasons: []
    }
  })
  
  // Propagate delays through dependency chain
  function propagateDelay(taskName) {
    if (processedTasks.has(taskName)) {
      return taskDelays[taskName] || 0
    }
    
    processedTasks.add(taskName)
    
    const dep = dependencies[taskName]
    if (!dep || !dep.dependsOn) {
      // No dependencies, just base delay
      return taskDelays[taskName] || 0
    }
    
    let maxUpstreamDelay = 0
    const upstreamDelays = []
    
    // Calculate delays from all dependencies
    dep.dependsOn.forEach(prereq => {
      const prereqDelay = propagateDelay(prereq)
      if (prereqDelay > 0) {
        // Apply delay multiplier
        const propagatedDelay = Math.round(prereqDelay * (dep.delayMultiplier || 1.0))
        upstreamDelays.push({
          from: prereq,
          originalDelay: prereqDelay,
          multiplier: dep.delayMultiplier,
          propagatedDelay: propagatedDelay
        })
        maxUpstreamDelay = Math.max(maxUpstreamDelay, propagatedDelay)
      }
    })
    
    // Total delay = base delay + propagated delay
    const baseDelay = taskDelays[taskName] || 0
    const totalDelay = baseDelay + maxUpstreamDelay
    taskDelays[taskName] = totalDelay
    
    // Store impact details
    if (taskImpacts[taskName]) {
      taskImpacts[taskName].propagatedDelay = maxUpstreamDelay
      taskImpacts[taskName].upstreamDelays = upstreamDelays
      taskImpacts[taskName].totalDelay = totalDelay
      taskImpacts[taskName].reason = dep.reason
    }
    
    return totalDelay
  }
  
  // Process all tasks
  tasks.forEach(task => propagateDelay(task.name))
  
  // Find critical path (tasks with highest cumulative delay)
  const criticalPath = Object.entries(taskDelays)
    .filter(([_, delay]) => delay > 0)
    .sort(([_, a], [__, b]) => b - a)
    .map(([name, delay]) => ({
      taskName: name,
      totalDelay: delay,
      baseDelay: taskImpacts[name]?.baseDelay || 0,
      propagatedDelay: taskImpacts[name]?.propagatedDelay || 0,
      upstreamImpacts: taskImpacts[name]?.upstreamDelays || [],
      reason: taskImpacts[name]?.reason || 'No dependencies'
    }))
  
  // Calculate total project delay (max of all task delays)
  const totalProjectDelay = Math.max(0, ...Object.values(taskDelays))
  
  return {
    taskDelays,
    taskImpacts,
    criticalPath,
    totalProjectDelay,
    delayedTaskCount: criticalPath.length
  }
}

/**
 * COST ALLOCATION MULTIPLIER
 * Replaces hardcoded cost percentages with data-driven logic
 * Higher capacity and difficult terrain = higher cost per phase
 * 
 * @param {Object} projectData - Project configuration
 * @param {string} phaseName - Name of the phase
 * @returns {number} Cost percentage for this phase
 */
export function getCostAllocationForPhase(projectData, phaseName, baselinePercentage) {
  const capacity = parseFloat(projectData.capacity) || 100
  const terrain = projectData.additionalDetails?.terrain || 'Plain'
  
  // Phase cost sensitivity to capacity
  const capacitySensitivity = {
    'Engineering & Design': 0.7,
    'Supply of Material': 1.0,
    'Land Acquisition': 0.3,
    'Land Acquisition & ROW': 0.4,
    'Foundation Work': 1.1,
    'Concreting & Foundation': 1.1,
    'Tower Erection': 0.8,
    'Tower Erection (Staggered)': 0.8,
    'Conductor Stringing': 0.6
  }
  
  // Phase cost sensitivity to terrain
  const terrainSensitivity = {
    'Engineering & Design': 0.3,
    'Supply of Material': 0.1,
    'Land Acquisition': 0.5,
    'Land Acquisition & ROW': 0.5,
    'Foundation Work': 0.9,
    'Concreting & Foundation': 0.9,
    'Tower Erection': 0.7,
    'Tower Erection (Staggered)': 0.7,
    'Conductor Stringing': 0.2
  }
  
  const capSens = capacitySensitivity[phaseName] || 0.8
  const terrainSens = terrainSensitivity[phaseName] || 0.5
  
  const terrainFactor = TerrainFactors[terrain] || 1.0
  
  // Adjust baseline percentage
  const capacityAdj = (capacity / 100) * capSens
  const terrainAdj = terrainFactor * terrainSens
  
  return Math.round(baselinePercentage * (0.5 + 0.5 * (capacityAdj + terrainAdj) / 2))
}

/**
 * VALIDATE PHASE CONFIG
 * Ensures phase list is well-formed and percentages sum to ~100%
 * 
 * @param {Array} phases - Phase array
 * @returns {Object} { isValid, totalCostPercentage, warnings }
 */
export function validatePhaseConfig(phases) {
  const totalCost = phases.reduce((sum, p) => sum + (p.costPercentage || 0), 0)
  const warnings = []
  
  if (totalCost > 105 || totalCost < 95) {
    warnings.push(`Cost percentages sum to ${totalCost}% (expected ~100%)`)
  }
  
  phases.forEach((phase, idx) => {
    if (!phase.name) warnings.push(`Phase ${idx} missing name`)
    if (!phase.baselineDuration) warnings.push(`Phase ${idx} missing baselineDuration`)
    if (!phase.costPercentage) warnings.push(`Phase ${idx} missing costPercentage`)
  })
  
  return {
    isValid: warnings.length === 0,
    totalCostPercentage: totalCost,
    warnings
  }
}
