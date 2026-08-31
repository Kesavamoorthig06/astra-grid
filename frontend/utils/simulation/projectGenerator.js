// ===============================================
// PROJECT GENERATOR - Data-Driven Simulation Engine
// ===============================================
// All hardcoded phase definitions, terrain factors, and productivity calendars
// have been moved to SimulationConfig.js to enable dynamic, reusable configurations
// wired to real projectData inputs

import {
  ProductivityCalendar,
  TerrainFactors,
  getSubstationPhases,
  getTransmissionPhases,
  getCapacityMultiplier,
  getTerrainMultiplier,
  calculateTotalDuration,
  getCostAllocationForPhase,
  validatePhaseConfig,
  calculateDelayPropagation,
  TaskDependencies
} from './SimulationConfig.js'


/**
 * Apply AI Variation to make durations realistic (not perfectly uniform)
 * Variation: -10% to +30%
 */
function applyAIVariation(baseDuration) {
  const variation = Math.random() * 0.4 - 0.1
  return Math.round(baseDuration * (1 + variation))
}

/**
 * Get Month Efficiency Factor
 * Combines ProductivityCalendar (seasonal factors) with TerrainFactors (location difficulty)
 * Special handling for Agriculture terrain during harvest season (Nov-Dec)
 * 
 * @param {number} monthIndex - Month offset from project start (0-based)
 * @param {Date} startDate - Project start date
 * @param {string} terrain - Terrain type from projectData
 * @returns {Object} { factor: number (0.0 - 2.0), reasons: Array }
 */
function getMonthEfficiencyFactor(monthIndex, startDate, terrain) {
  const currentDate = new Date(startDate)
  currentDate.setMonth(currentDate.getMonth() + monthIndex)
  const month = currentDate.getMonth() + 1 // 1-12
  
  const reasons = []
  let factor = 1.0
  
  // Apply seasonal productivity factor from calendar
  if (ProductivityCalendar[month]) {
    const calendarFactor = ProductivityCalendar[month].factor
    
    // Special case: Agriculture terrain has 0 productivity during harvest (Nov-Dec)
    if (terrain === 'Agriculture' && (month === 11 || month === 12)) {
      factor = 0.0
      reasons.push('Harvest Season - No work on Agriculture terrain')
    } else {
      factor = calendarFactor
      reasons.push(ProductivityCalendar[month].reason)
    }
  }
  
  // Apply terrain difficulty factor
  const terrainFactor = TerrainFactors[terrain] || 1.0
  factor *= terrainFactor
  
  if (terrainFactor < 1.0) {
    reasons.push(`${terrain} terrain (${terrainFactor}x difficulty)`)
  }
  
  return { factor: Math.max(factor, 0.0), reasons }
}

/**
 * Simulate Task Duration
 * Simulates month-by-month work progress accounting for seasonal and terrain factors
 * Returns detailed log of each month's work and cumulative progress
 * 
 * @param {number} totalWorkQuantity - Total work units to complete
 * @param {number} baseCapacityPerMonth - Normal work units per month
 * @param {number} startMonthIndex - Project month when this task starts
 * @param {Date} startDate - Project start date
 * @param {string} terrain - Terrain type from projectData
 * @returns {Object} { durationMonths, durationDays, monthByMonthLog: Array }
 */
function simulateTaskDuration(totalWorkQuantity, baseCapacityPerMonth, startMonthIndex, startDate, terrain) {
  let remainingWork = totalWorkQuantity
  let monthsElapsed = 0
  const monthByMonthLog = []
  const MAX_MONTHS = 360 // 30-year safety limit
  
  while (remainingWork > 0 && monthsElapsed < MAX_MONTHS) {
    const { factor, reasons } = getMonthEfficiencyFactor(startMonthIndex + monthsElapsed, startDate, terrain)
    
    const actualCapacity = baseCapacityPerMonth * factor
    const workDone = Math.min(actualCapacity, remainingWork)
    
    monthByMonthLog.push({
      month: monthsElapsed + 1,
      efficiency: factor,
      reasons,
      planned: baseCapacityPerMonth,
      actual: actualCapacity,
      workDone,
      remaining: remainingWork - workDone
    })
    
    remainingWork -= workDone
    monthsElapsed++
    
    // If factor is 0 (e.g., harvest season), continue to next month
    if (factor === 0.0 && remainingWork > 0) {
      continue
    }
  }
  
  const durationDays = monthsElapsed * 30
  
  return {
    durationMonths: monthsElapsed,
    durationDays,
    monthByMonthLog
  }
}

/**
 * Calculate Dynamic Cost
 * Computes total project cost from material, establishment, interest, and storage components
 * Interest accrues on cumulative spend; storage cost applies if supply arrives before site ready
 * 
 * @param {Array} tasks - Task array with timing information
 * @param {Object} costParams - { materialCost, establishmentCostPerMonth, annualInterestRate, storageCostPerMonth }
 * @param {number} totalDurationMonths - Total project duration in months
 * @returns {Object} { materialCost, establishmentCost, interestCost, storageCost, totalCost }
 */
function calculateDynamicCost(tasks, costParams, totalDurationMonths) {
  const materialCost = costParams.materialCost
  const establishmentCost = costParams.establishmentCostPerMonth * totalDurationMonths
  
  // Calculate interest cost (accrues on cumulative spend over project duration)
  let interestCost = 0
  const monthlyInterestRate = costParams.annualInterestRate / 100 / 12
  
  let cumulativeSpend = 0
  const monthlyMaterialSpend = materialCost / totalDurationMonths
  
  for (let month = 0; month < totalDurationMonths; month++) {
    cumulativeSpend += monthlyMaterialSpend + costParams.establishmentCostPerMonth
    interestCost += cumulativeSpend * monthlyInterestRate
  }
  
  // Calculate storage cost (if supply arrives before site is ready)
  let storageCost = 0
  const supplyTask = tasks.find(t => t.name.toLowerCase().includes('supply'))
  const landTask = tasks.find(t => 
    t.name.toLowerCase().includes('land') || 
    t.name.toLowerCase().includes('foundation')
  )
  
  if (supplyTask && landTask) {
    const supplyEndMonth = (supplyTask.startMonth || 0) + (supplyTask.actualDurationMonths || 0)
    const siteReadyMonth = (landTask.startMonth || 0) + (landTask.actualDurationMonths || 0)
    
    if (supplyEndMonth < siteReadyMonth) {
      const delayMonths = siteReadyMonth - supplyEndMonth
      storageCost = delayMonths * costParams.storageCostPerMonth
      
      supplyTask.supplyArrivalMonth = supplyEndMonth
      supplyTask.siteReadyMonth = siteReadyMonth
      supplyTask.storageMonths = delayMonths
    }
  }
  
  const totalCost = materialCost + establishmentCost + interestCost + storageCost
  
  return {
    materialCost,
    establishmentCost,
    interestCost,
    storageCost,
    totalCost
  }
}

/**
 * Calculate Catch-Up Alert
 * Determines if remaining work can be completed on time with current capacity
 * Returns criticality level and required run rate
 * 
 * @param {number} completedQuantity - Work units already completed
 * @param {number} totalQuantity - Total work units required
 * @param {number} baseCapacity - Normal work units per month
 * @param {number} monthsElapsed - Months since task start
 * @param {number} plannedDurationMonths - Planned total duration
 * @returns {Object} { isCriticalRisk, requiredRunRate, currentCapacity, message }
 */
function calculateCatchUpAlert(completedQuantity, totalQuantity, baseCapacity, monthsElapsed, plannedDurationMonths) {
  const remainingWork = totalQuantity - completedQuantity
  const remainingMonths = Math.max(plannedDurationMonths - monthsElapsed, 1)
  const requiredRunRate = remainingWork / remainingMonths
  
  const maxCapacity = baseCapacity * 1.2
  const isCriticalRisk = requiredRunRate > maxCapacity
  
  let message = ''
  if (isCriticalRisk) {
    message = `⚠️ CRITICAL: To finish on time, you need to increase capacity to ${requiredRunRate.toFixed(0)} units/month (Current max: ${maxCapacity.toFixed(0)}, Base: ${baseCapacity.toFixed(0)})`
  } else if (requiredRunRate > baseCapacity) {
    message = `⚡ Warning: Required run rate ${requiredRunRate.toFixed(0)} units/month exceeds base capacity ${baseCapacity.toFixed(0)}`
  }
  
  return {
    isCriticalRisk,
    requiredRunRate,
    currentCapacity: baseCapacity,
    message
  }
}

/**
 * Calculate CPM (Critical Path Method)
 * Computes start times for each task based on dependencies
 * Tasks with no dependencies start at time 0; dependent tasks start after predecessors complete
 * 
 * @param {Array} tasks - Task array to schedule
 * @returns {Array} Tasks with updated startDay and startMonth
 */
function calculateCPM(tasks) {
  let currentDay = 0
  let currentMonth = 0
  
  return tasks.map((task) => {
    if (task.dependencies && task.dependencies.length > 0) {
      // Find latest completion time from dependencies
      const maxDependencyEnd = Math.max(
        ...task.dependencies.map(depId => {
          const depTask = tasks.find(t => t.id === depId)
          return depTask ? depTask.startDay + depTask.actualDuration : 0
        })
      )
      const maxDependencyEndMonth = Math.max(
        ...task.dependencies.map(depId => {
          const depTask = tasks.find(t => t.id === depId)
          return depTask ? (depTask.startMonth || 0) + (depTask.actualDurationMonths || 0) : 0
        })
      )
      currentDay = maxDependencyEnd
      currentMonth = maxDependencyEndMonth
    }
    
    return {
      ...task,
      startDay: currentDay,
      startMonth: currentMonth
    }
  })
}

/**
 * GENERATE PROJECT PLAN - Main Entry Point
 * This is the core function that orchestrates the entire simulation
 * 
 * Workflow:
 * 1. Fetch phase definitions dynamically from SimulationConfig based on projectType
 * 2. For each phase, calculate actual duration using productivity simulation
 * 3. Apply capacity and terrain multipliers to base durations
 * 4. Generate work items and cost allocations from projectData
 * 5. Calculate critical path scheduling (task dependencies)
 * 6. Calculate total project cost (material + establishment + interest + storage)
 * 7. Return complete plan ready for visualization
 * 
 * NO HARDCODES: All durations, phases, costs, terrain factors come from:
 * - projectData inputs (type, capacity, terrain, dates, costs)
 * - SimulationConfig dynamic functions
 * - Productivity/Terrain factors from real project data
 * 
 * @param {Object} projectData - Project configuration containing:
 *   - projectType: 'substation' | 'transmission'
 *   - capacity: number (MVA)
 *   - startDate: ISO date string
 *   - estimatedCost: number (project cost in ₹)
 *   - additionalDetails: { terrain, lineLength, establishmentCost, interestRate, storageCost }
 * @returns {Object} Complete project plan with tasks, timeline, cost breakdown
 */
export function generateProjectPlan(projectData) {
  // ========== STEP 1: Get dynamic phase list based on project type ==========
  const phases = projectData.projectType === 'substation' 
    ? getSubstationPhases(projectData)
    : getTransmissionPhases(projectData)
  
  // Validate phase config
  const validation = validatePhaseConfig(phases)
  if (!validation.isValid) {
    console.warn('Phase configuration warnings:', validation.warnings)
  }
  
  // ========== STEP 2: Extract project parameters ==========
  const terrain = projectData.additionalDetails?.terrain || 'Plain'
  const startDate = new Date(projectData.startDate)
  
  const costParams = {
    materialCost: projectData.estimatedCost || 10000000,
    establishmentCostPerMonth: parseFloat(projectData.additionalDetails?.establishmentCost || '0.5'),
    annualInterestRate: parseFloat(projectData.additionalDetails?.interestRate || '12'),
    storageCostPerMonth: parseFloat(projectData.additionalDetails?.storageCost || '0.2')
  }
  
  // ========== STEP 3: Generate tasks from phase definitions ==========
  let tasks = []
  let currentStartDay = 0
  let currentStartMonth = 0
  
  phases.forEach((phase, idx) => {
    // Apply dynamic duration multipliers based on capacity and terrain
    const durationMultiplier = phase.durationMultiplier || 1.0
    const phaseDuration = Math.round(phase.baselineDuration * durationMultiplier)
    
    // Process work items if defined
    let workItems = []
    let totalWorkQuantity = 0
    let baseCapacity = 0
    
    if (phase.workItems && phase.workItems.length > 0) {
      workItems = phase.workItems.map((item) => ({
        itemName: item.itemName,
        totalQuantity: 0,
        plannedPerMonth: item.plannedPerMonth,
        completedQuantity: 0,
        unit: item.unit,
        isTotalLocked: false,
        history: []
      }))
      
      if (workItems.length > 0) {
        baseCapacity = workItems[0].plannedPerMonth
        totalWorkQuantity = workItems[0].totalQuantity || (baseCapacity * (phaseDuration / 30))
      }
    }
    
    // ========== Calculate actual duration using simulation ==========
    let actualDuration, actualDurationMonths
    
    if (totalWorkQuantity > 0 && baseCapacity > 0) {
      // Simulate month-by-month progress accounting for seasonal and terrain impacts
      const simulation = simulateTaskDuration(totalWorkQuantity, baseCapacity, currentStartMonth, startDate, terrain)
      actualDuration = simulation.durationDays
      actualDurationMonths = simulation.durationMonths
    } else {
      // No work items: use scaled phase duration with AI variation
      actualDuration = applyAIVariation(phaseDuration)
      actualDurationMonths = Math.ceil(actualDuration / 30)
    }
    
    // ========== Process sub-phases if defined ==========
    let subActivities
    if (phase.subPhases) {
      subActivities = phase.subPhases.map((subPhase, subIdx) => ({
        id: `task-${idx}-sub-${subIdx}`,
        name: subPhase.name,
        duration: subPhase.duration,
        isCompleted: false,
        completionPercentage: 0
      }))
    }
    
    // ========== Generate cost allocation for this phase ==========
    const adjustedCostPercentage = getCostAllocationForPhase(
      projectData,
      phase.name,
      phase.costPercentage
    )
    const materialCost = (adjustedCostPercentage / 100) * costParams.materialCost
    
    // ========== Create task object ==========
    const taskId = phase.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
    
    const task = {
      id: taskId,
      name: phase.name,
      plannedDuration: phaseDuration,
      actualDuration: actualDuration,
      actualDurationMonths: actualDurationMonths,
      startDay: currentStartDay,
      startMonth: currentStartMonth,
      costAllocation: adjustedCostPercentage,
      materialCost: materialCost,
      status: 'not-started',
      completionPercentage: 0,
      isCompleted: false,
      dependencies: idx > 0 && !phase.canRunInParallel ? [`task-${idx - 1}`] : [],
      canRunInParallel: phase.canRunInParallel || [],
      parallelTasks: phase.parallelTasks || [],
      staggeredStart: phase.staggeredStart,
      workItems,
      subActivities,
      baseCapacity: baseCapacity > 0 ? baseCapacity : undefined,
      totalWorkQuantity: totalWorkQuantity > 0 ? totalWorkQuantity : undefined
    }
    
    tasks.push(task)
    currentStartDay += actualDuration
    currentStartMonth += actualDurationMonths
  })
  
  // ========== STEP 4: Calculate critical path (task scheduling) ==========
  tasks = calculateCPM(tasks)
  
  // ========== STEP 5: Calculate project totals ==========
  const totalDuration = tasks.reduce((sum, t) => sum + t.actualDuration, 0)
  const totalDurationMonths = tasks.reduce((sum, t) => sum + t.actualDurationMonths, 0)
  
  // ========== STEP 6: Calculate total cost ==========
  const costBreakdown = calculateDynamicCost(tasks, costParams, totalDurationMonths)
  
  // ========== STEP 7: Calculate delay propagation (NEW) ==========
  // For initial plan, no delays yet, but set up tracking structure
  const delayAnalysis = calculateDelayPropagation(
    tasks.map(t => ({
      name: t.name,
      plannedDuration: t.plannedDuration,
      actualDuration: t.actualDuration,
      plannedWork: t.totalWorkQuantity || 0,
      completedWork: 0 // Not started yet
    })),
    TaskDependencies
  )
  
  // ========== STEP 8: Return complete project plan ==========
  return {
    tasks,
    totalDuration,
    totalDurationMonths,
    totalCost: costBreakdown.totalCost,
    costBreakdown,
    currentDelay: delayAnalysis.totalProjectDelay,
    costOverrun: 0,
    terrain,
    costParams,
    delayAnalysis, // NEW: Add delay tracking
    // Store metadata for what-if analysis
    projectType: projectData.projectType,
    capacity: projectData.capacity,
    estimatedCost: projectData.estimatedCost
  }
}

/**
 * RECALCULATE PROJECT METRICS
 * Updates plan metrics based on simulated time elapsed (e.g., for timeline scrubbing)
 * Recalculates task statuses, delays, cost impacts based on work progress
 * NOW INCLUDES DELAY PROPAGATION ANALYSIS
 * 
 * @param {Object} plan - Current project plan
 * @param {number} originalCost - Original estimated cost
 * @param {number} simulatedDaysElapsed - Days simulated (from timeline scrubber)
 * @returns {Object} Updated plan with new metrics including cascading delays
 */
export function recalculateProjectMetrics(plan, _originalCost, simulatedDaysElapsed = 0) {
  let totalDelay = 0
  let completedTasks = 0
  const simulatedMonthsElapsed = Math.ceil(simulatedDaysElapsed / 30)
  
  plan.tasks.forEach((task) => {
    // Check if work items need catch-up
    if (task.workItems && task.baseCapacity && task.totalWorkQuantity) {
      const workItem = task.workItems[0]
      if (workItem.isTotalLocked && workItem.totalQuantity > 0) {
        const taskElapsedMonths = Math.max(0, simulatedMonthsElapsed - (task.startMonth || 0))
        const catchUpAlert = calculateCatchUpAlert(
          workItem.completedQuantity,
          workItem.totalQuantity,
          task.baseCapacity,
          taskElapsedMonths,
          task.actualDurationMonths
        )
        task.catchUpAlert = catchUpAlert
      }
    }
    
    // Update task status based on elapsed time
    if (task.isCompleted) {
      completedTasks++
      task.status = 'completed'
    } else {
      const taskStartDay = task.startDay
      const taskEndDay = task.startDay + task.actualDuration
      
      if (simulatedDaysElapsed < taskStartDay) {
        task.status = 'not-started'
      } else if (simulatedDaysElapsed > taskEndDay) {
        if (task.completionPercentage < 100) {
          const delayDays = simulatedDaysElapsed - taskEndDay
          totalDelay += delayDays
          task.status = 'delayed'
        } else {
          task.status = 'completed'
          task.isCompleted = true
          completedTasks++
        }
      } else if (simulatedDaysElapsed >= taskStartDay && simulatedDaysElapsed <= taskEndDay) {
        const expectedProgress = ((simulatedDaysElapsed - taskStartDay) / task.actualDuration) * 100
        
        if (task.completionPercentage >= expectedProgress) {
          task.status = 'in-progress'
        } else {
          task.status = 'at-risk'
        }
      }
    }
  })
  
  // ========== NEW: Calculate delay propagation ==========
  const delayAnalysis = calculateDelayPropagation(
    plan.tasks.map(t => ({
      name: t.name,
      plannedDuration: t.plannedDuration,
      actualDuration: t.actualDuration,
      plannedWork: t.totalWorkQuantity || t.plannedDuration,
      completedWork: t.totalWorkQuantity 
        ? (t.workItems?.[0]?.completedQuantity || 0)
        : (t.completionPercentage / 100) * t.plannedDuration
    })),
    TaskDependencies
  )
  
  // Update total delay to include cascading delays
  totalDelay = Math.max(totalDelay, delayAnalysis.totalProjectDelay)
  
  // Recalculate remaining project duration
  const newTotalDuration = plan.tasks.reduce((sum, task) => {
    if (task.isCompleted) {
      return sum + task.actualDuration
    } else {
      const remaining = task.plannedDuration * (1 - task.completionPercentage / 100)
      return sum + remaining
    }
  }, 0)
  
  const newTotalDurationMonths = Math.ceil(newTotalDuration / 30)
  const costBreakdown = calculateDynamicCost(plan.tasks, plan.costParams, newTotalDurationMonths)
  const costOverrun = costBreakdown.totalCost - plan.costParams.materialCost
  
  return {
    ...plan,
    totalDuration: newTotalDuration,
    totalDurationMonths: newTotalDurationMonths,
    totalCost: costBreakdown.totalCost,
    costBreakdown,
    currentDelay: totalDelay,
    costOverrun,
    delayAnalysis // NEW: Include delay analysis in returned plan
  }
}
