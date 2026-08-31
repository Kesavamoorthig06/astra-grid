// ===============================================
// 1. PRODUCTIVITY MATRIX - Dynamic Time Engine
// ===============================================

export const ProductivityCalendar: Record<number, { factor: number; reason: string }> = {
  6: { factor: 0.4, reason: 'Monsoon' },   // June
  7: { factor: 0.4, reason: 'Monsoon' },   // July
  8: { factor: 0.4, reason: 'Monsoon' },   // August
  10: { factor: 0.6, reason: 'Festival Season' }, // October
  3: { factor: 0.6, reason: 'Festival Season' },  // March
  11: { factor: 1.0, reason: 'Harvest Season (Check Terrain)' }, // November - will be 0 for Agriculture
  12: { factor: 1.0, reason: 'Harvest Season (Check Terrain)' }  // December - will be 0 for Agriculture
}

export type TerrainType = 'Plain' | 'Hilly' | 'Forest' | 'Agriculture'

export const TerrainFactors: Record<TerrainType, number> = {
  Plain: 1.0,
  Hilly: 0.5,
  Forest: 0.2,
  Agriculture: 1.0 // Special: 0.0 during Nov-Dec harvest
}

// ===============================================
// 2. REAL COST - Dynamic Costing Parameters
// ===============================================

export interface CostParameters {
  establishmentCostPerMonth: number // Cr per month
  annualInterestRate: number // percentage (e.g., 12 for 12%)
  storageCostPerMonth: number // Cr per month for delayed materials
  materialCost: number // Base material cost
}

export interface DynamicCostBreakdown {
  materialCost: number
  establishmentCost: number
  interestCost: number
  storageCost: number
  totalCost: number
}

// ===============================================
// 3. CATCH-UP LOGIC - Prescriptive Analytics
// ===============================================

export interface CatchUpAlert {
  isCriticalRisk: boolean
  requiredRunRate: number // units per month
  currentCapacity: number // units per month
  message: string
}

// ===============================================
// Core Data Structures
// ===============================================

export interface ProgressHistoryEntry {
  date: string
  value: number
}

export interface WorkItem {
  itemName: string
  totalQuantity: number // Total work to be done
  plannedPerMonth: number // Base capacity (units per month)
  completedQuantity: number
  unit: string // e.g., "diagrams", "km", "towers", "foundations"
  isTotalLocked: boolean // True after initial setup
  history: ProgressHistoryEntry[] // Track all updates
}

export interface SubActivity {
  id: string
  name: string
  duration: number // days
  isCompleted: boolean
  completionPercentage: number
  workItems?: WorkItem[]
}

export interface Task {
  id: string
  name: string
  plannedDuration: number // days (ORIGINAL STATIC)
  actualDuration: number // days (DYNAMIC - calculated by simulation)
  actualDurationMonths: number // months (calculated)
  startDay: number
  startMonth: number // month index from project start
  costAllocation: number // percentage of total MATERIAL cost
  materialCost: number // Base material cost for this task
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed' | 'at-risk'
  completionPercentage: number
  isCompleted: boolean
  dependencies: string[]
  canRunInParallel: string[] // IDs of tasks that can run simultaneously
  parallelTasks?: string[] // Names of tasks that can run simultaneously
  staggeredStart?: string // Note for linear projects (e.g., "Starts after 10% of Foundation")
  workItems?: WorkItem[]
  subActivities?: SubActivity[]
  baseCapacity?: number // Base capacity per month (for tasks with work quantity)
  totalWorkQuantity?: number // Total work quantity for this task
  catchUpAlert?: CatchUpAlert // Warning if behind schedule
  
  // For Material Supply tracking
  supplyArrivalMonth?: number
  siteReadyMonth?: number
  storageMonths?: number // Months material sits in storage
}

export interface ProjectPlan {
  tasks: Task[]
  totalDuration: number // in days
  totalDurationMonths: number // in months
  totalCost: number
  costBreakdown: DynamicCostBreakdown
  currentDelay: number
  costOverrun: number
  terrain: TerrainType
  costParams: CostParameters
}

const SUBSTATION_PHASES = [
  { 
    name: 'Engineering & Design', 
    duration: 60, 
    cost: 12,
    canRunInParallel: ['land-acquisition'],
    workItems: [
      { itemName: 'Technical Drawings', plannedPerMonth: 500, unit: 'diagrams' },
      { itemName: 'Design Calculations', plannedPerMonth: 100, unit: 'sheets' },
      { itemName: 'BOQ Preparation', plannedPerMonth: 8, unit: 'documents' }
    ]
  },
  { name: 'Supply of Material', duration: 120, cost: 35 },
  { 
    name: 'Land Acquisition', 
    duration: 90, 
    cost: 8,
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
  { name: 'Site Leveling', duration: 30, cost: 5 },
  { name: 'Excavation', duration: 45, cost: 7 },
  { 
    name: 'Concreting & Foundation', 
    duration: 60, 
    cost: 15,
    workItems: [
      { itemName: 'Equipment Foundations', plannedPerMonth: 8, unit: 'nos' },
      { itemName: 'Concrete Poured', plannedPerMonth: 400, unit: 'm³' }
    ]
  },
  { name: 'Equipment Erection', duration: 75, cost: 10 },
  { name: 'Testing & Commissioning', duration: 30, cost: 8 }
]

const TRANSMISSION_PHASES = [
  { 
    name: 'Survey & Route Alignment', 
    duration: 45, 
    cost: 8,
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
    duration: 60, 
    cost: 10,
    canRunInParallel: ['land-acquisition-row'],
    parallelTasks: ['Regulatory Permissions', 'Survey (Final Stages)'],
    workItems: [
      { itemName: 'Tower Designs', plannedPerMonth: 400, unit: 'diagrams' },
      { itemName: 'Foundation Designs', plannedPerMonth: 150, unit: 'sheets' }
    ]
  },
  { 
    name: 'Regulatory Permissions',
    duration: 75,
    cost: 6,
    parallelTasks: ['Engineering & Design', 'Supply of Material']
  },
  { 
    name: 'Supply of Material', 
    duration: 120, 
    cost: 40,
    parallelTasks: ['Land Acquisition', 'Foundation Work', 'Regulatory Permissions']
  },
  { 
    name: 'Land Acquisition & ROW', 
    duration: 90, 
    cost: 10,
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
    duration: 90, 
    cost: 12,
    parallelTasks: ['Supply of Material'],
    workItems: [
      { itemName: 'Foundations Completed', plannedPerMonth: 50, unit: 'nos' },
      { itemName: 'Excavation', plannedPerMonth: 750, unit: 'm³' }
    ]
  },
  { 
    name: 'Tower Erection', 
    duration: 105, 
    cost: 12,
    staggeredStart: 'Can start after first ~10 foundations are ready',
    parallelTasks: ['Foundation Work (Staggered)'],
    workItems: [
      { itemName: 'Towers Erected', plannedPerMonth: 45, unit: 'nos' }
    ]
  },
  { 
    name: 'Conductor Stringing', 
    duration: 60, 
    cost: 5,
    staggeredStart: 'Can start after first ~10 towers are erected',
    parallelTasks: ['Tower Erection (Staggered)'],
    workItems: [
      { itemName: 'Circuit Km Strung', plannedPerMonth: 60, unit: 'km' }
    ]
  },
  { name: 'Testing & Commissioning', duration: 30, cost: 3 }
]

// AI-based duration prediction using Monte Carlo-like variation
function applyAIVariation(baseDuration: number): number {
  // Simulate realistic variation: -10% to +30%
  const variation = (Math.random() * 0.4 - 0.1)
  return Math.round(baseDuration * (1 + variation))
}

// ===============================================
// DYNAMIC TIME ENGINE - Month-by-Month Simulation
// ===============================================

function getMonthEfficiencyFactor(
  monthIndex: number, // 0-based from project start
  startDate: Date,
  terrain: TerrainType
): { factor: number; reasons: string[] } {
  const currentDate = new Date(startDate)
  currentDate.setMonth(currentDate.getMonth() + monthIndex)
  const month = currentDate.getMonth() + 1 // 1-12
  
  const reasons: string[] = []
  let factor = 1.0
  
  // Apply seasonal calendar factors
  if (ProductivityCalendar[month]) {
    const calendarFactor = ProductivityCalendar[month].factor
    
    // Special case: Harvest season on Agriculture terrain
    if (terrain === 'Agriculture' && (month === 11 || month === 12)) {
      factor = 0.0
      reasons.push('Harvest Season - No work on Agriculture terrain')
    } else {
      factor = calendarFactor
      reasons.push(ProductivityCalendar[month].reason)
    }
  }
  
  // Apply terrain multiplier
  const terrainFactor = TerrainFactors[terrain]
  factor *= terrainFactor
  
  if (terrainFactor < 1.0) {
    reasons.push(`${terrain} terrain (${terrainFactor}x)`)
  }
  
  return { factor: Math.max(factor, 0.0), reasons }
}

function simulateTaskDuration(
  totalWorkQuantity: number,
  baseCapacityPerMonth: number,
  startMonthIndex: number,
  startDate: Date,
  terrain: TerrainType
): { durationMonths: number; durationDays: number; monthByMonthLog: any[] } {
  let remainingWork = totalWorkQuantity
  let monthsElapsed = 0
  const monthByMonthLog: any[] = []
  
  while (remainingWork > 0 && monthsElapsed < 360) { // Safety: max 30 years
    const { factor, reasons } = getMonthEfficiencyFactor(
      startMonthIndex + monthsElapsed,
      startDate,
      terrain
    )
    
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
    
    // Prevent infinite loop if capacity is zero
    if (factor === 0.0 && remainingWork > 0) {
      // Skip this month, continue to next
      continue
    }
  }
  
  const durationDays = monthsElapsed * 30 // Rough conversion
  
  return {
    durationMonths: monthsElapsed,
    durationDays,
    monthByMonthLog
  }
}

// ===============================================
// DYNAMIC COST ENGINE
// ===============================================

function calculateDynamicCost(
  tasks: Task[],
  costParams: CostParameters,
  totalDurationMonths: number
): DynamicCostBreakdown {
  // 1. Material Cost (base)
  const materialCost = costParams.materialCost
  
  // 2. Establishment Cost = rate * duration
  const establishmentCost = costParams.establishmentCostPerMonth * totalDurationMonths
  
  // 3. Interest (IDC) - Compound interest on cumulative spend
  // Assume material cost is spread evenly, establishment monthly
  // Simplified: Calculate interest on average balance
  let interestCost = 0
  const monthlyInterestRate = costParams.annualInterestRate / 100 / 12
  
  // Simulate month-by-month spend and interest
  let cumulativeSpend = 0
  const monthlyMaterialSpend = materialCost / totalDurationMonths
  
  for (let month = 0; month < totalDurationMonths; month++) {
    cumulativeSpend += monthlyMaterialSpend + costParams.establishmentCostPerMonth
    interestCost += cumulativeSpend * monthlyInterestRate
  }
  
  // 4. Storage Cost - Check if Supply arrives before Site Ready
  let storageCost = 0
  
  // Find Supply task and Site Ready task (Land/Foundation)
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
      
      // Update task with storage info
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

// ===============================================
// CATCH-UP LOGIC - Prescriptive Analytics
// ===============================================

function calculateCatchUpAlert(
  completedQuantity: number,
  totalQuantity: number,
  baseCapacity: number,
  monthsElapsed: number,
  plannedDurationMonths: number
): CatchUpAlert {
  const remainingWork = totalQuantity - completedQuantity
  const remainingMonths = Math.max(plannedDurationMonths - monthsElapsed, 1)
  const requiredRunRate = remainingWork / remainingMonths
  
  // Critical if required rate is > 1.2x base capacity
  const maxCapacity = baseCapacity * 1.2
  const isCriticalRisk = requiredRunRate > maxCapacity
  
  let message = ''
  if (isCriticalRisk) {
    message = `⚠️ CRITICAL: To finish on time, you need to increase capacity to ${requiredRunRate.toFixed(0)} ${' '}units/month (Current max: ${maxCapacity.toFixed(0)}, Base: ${baseCapacity.toFixed(0)})`
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

// Calculate Critical Path Method (CPM) based scheduling
function calculateCPM(tasks: Task[]): Task[] {
  let currentDay = 0
  let currentMonth = 0
  
  return tasks.map((task) => {
    // Check dependencies
    if (task.dependencies.length > 0) {
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

export function generateProjectPlan(projectData: any): ProjectPlan {
  const phases = projectData.projectType === 'substation' 
    ? SUBSTATION_PHASES 
    : TRANSMISSION_PHASES

  // Extract parameters from projectData
  const terrain = (projectData.additionalDetails?.terrain as TerrainType) || 'Plain'
  const costParams: CostParameters = {
    materialCost: projectData.estimatedCost,
    establishmentCostPerMonth: parseFloat(projectData.additionalDetails?.establishmentCost || '0.5'),
    annualInterestRate: parseFloat(projectData.additionalDetails?.interestRate || '12'),
    storageCostPerMonth: parseFloat(projectData.additionalDetails?.storageCost || '0.2')
  }
  
  const startDate = new Date(projectData.startDate)

  let tasks: Task[] = []
  let currentStartDay = 0
  let currentStartMonth = 0

  phases.forEach((phase, idx) => {
    // Initialize work items with completed quantity = 0
    let workItems: WorkItem[] | undefined
    let totalWorkQuantity = 0
    let baseCapacity = 0
    
    if ((phase as any).workItems) {
      workItems = (phase as any).workItems.map((item: any) => ({
        itemName: item.itemName,
        totalQuantity: 0, // User will input this during project setup
        plannedPerMonth: item.plannedPerMonth,
        completedQuantity: 0,
        unit: item.unit,
        isTotalLocked: false, // Will be locked after first save
        history: [] // Track all progress updates
      }))
      
      // Use first work item as primary capacity indicator
      if (workItems && workItems.length > 0) {
        baseCapacity = workItems[0].plannedPerMonth
        totalWorkQuantity = workItems[0].totalQuantity || (baseCapacity * (phase.duration / 30))
      }
    }
    
    // DYNAMIC DURATION CALCULATION
    let actualDuration: number
    let actualDurationMonths: number
    
    if (totalWorkQuantity > 0 && baseCapacity > 0) {
      // Use dynamic simulation
      const simulation = simulateTaskDuration(
        totalWorkQuantity,
        baseCapacity,
        currentStartMonth,
        startDate,
        terrain
      )
      actualDuration = simulation.durationDays
      actualDurationMonths = simulation.durationMonths
    } else {
      // Fall back to AI variation for tasks without work items
      actualDuration = applyAIVariation(phase.duration)
      actualDurationMonths = Math.ceil(actualDuration / 30)
    }
    
    let subActivities: SubActivity[] | undefined
    if ((phase as any).subPhases) {
      subActivities = (phase as any).subPhases.map((subPhase: any, subIdx: number) => ({
        id: `task-${idx}-sub-${subIdx}`,
        name: subPhase.name,
        duration: subPhase.duration,
        isCompleted: false,
        completionPercentage: 0
      }))
    }

    const taskId = phase.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
    
    // Calculate material cost allocation
    const materialCost = (phase.cost / 100) * costParams.materialCost
    
    const task: Task = {
      id: taskId,
      name: phase.name,
      plannedDuration: phase.duration,
      actualDuration: actualDuration,
      actualDurationMonths: actualDurationMonths,
      startDay: currentStartDay,
      startMonth: currentStartMonth,
      costAllocation: phase.cost,
      materialCost: materialCost,
      status: 'not-started',
      completionPercentage: 0,
      isCompleted: false,
      dependencies: idx > 0 && !(phase as any).canRunInParallel ? [`task-${idx - 1}`] : [],
      canRunInParallel: (phase as any).canRunInParallel || [],
      parallelTasks: (phase as any).parallelTasks,
      staggeredStart: (phase as any).staggeredStart,
      workItems,
      subActivities,
      baseCapacity: baseCapacity > 0 ? baseCapacity : undefined,
      totalWorkQuantity: totalWorkQuantity > 0 ? totalWorkQuantity : undefined
    }

    tasks.push(task)
    currentStartDay += actualDuration
    currentStartMonth += actualDurationMonths
  })

  // Apply CPM scheduling
  tasks = calculateCPM(tasks)

  const totalDuration = tasks.reduce((sum, t) => sum + t.actualDuration, 0)
  const totalDurationMonths = tasks.reduce((sum, t) => sum + t.actualDurationMonths, 0)
  
  // Calculate dynamic costs
  const costBreakdown = calculateDynamicCost(tasks, costParams, totalDurationMonths)
  
  return {
    tasks,
    totalDuration,
    totalDurationMonths,
    totalCost: costBreakdown.totalCost,
    costBreakdown,
    currentDelay: 0,
    costOverrun: 0,
    terrain,
    costParams
  }
}

// Recalculate project metrics when tasks are updated
export function recalculateProjectMetrics(
  plan: ProjectPlan,
  _originalCost: number,
  simulatedDaysElapsed: number = 0
): ProjectPlan {
  let totalDelay = 0
  let completedTasks = 0
  const simulatedMonthsElapsed = Math.ceil(simulatedDaysElapsed / 30)

  plan.tasks.forEach((task) => {
    // CATCH-UP LOGIC: Calculate required run rate for tasks with work items
    if (task.workItems && task.baseCapacity && task.totalWorkQuantity) {
      const workItem = task.workItems[0] // Primary work item
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
    
    if (task.isCompleted) {
      // Task is already completed
      completedTasks++
      task.status = 'completed'
    } else {
      // Task is not completed - determine status based on simulation
      const taskStartDay = task.startDay
      const taskEndDay = task.startDay + task.actualDuration
      
      // Check if simulation has not reached this task yet
      if (simulatedDaysElapsed < taskStartDay) {
        // Task hasn't started yet
        task.status = 'not-started'
      } 
      // Check if simulation has passed task end date (HARD DEADLINE PASSED)
      else if (simulatedDaysElapsed > taskEndDay) {
        // Simulation has passed the task end date
        if (task.completionPercentage < 100) {
          // Task is incomplete after its deadline - RED (DELAYED)
          const delayDays = simulatedDaysElapsed - taskEndDay
          totalDelay += delayDays
          task.status = 'delayed'
        } else {
          // Task was completed (this shouldn't happen as isCompleted would be true)
          task.status = 'completed'
          task.isCompleted = true
          completedTasks++
        }
      }
      // Check if simulation is within task duration
      else if (simulatedDaysElapsed >= taskStartDay && simulatedDaysElapsed <= taskEndDay) {
        // Currently within task timeline - Calculate expected progress
        // Expected = (CurrentDate - StartDate) / (EndDate - StartDate) * 100
        const expectedProgress = ((simulatedDaysElapsed - taskStartDay) / task.actualDuration) * 100
        
        // 3-TIER STATUS LOGIC:
        // GREEN: Actual >= Expected (On Track or Ahead)
        // YELLOW: Actual < Expected BUT still before deadline (At Risk / Falling Behind)
        // RED: Only when deadline has passed (handled above)
        
        if (task.completionPercentage >= expectedProgress) {
          // GREEN: On track or ahead of schedule
          task.status = 'in-progress'
        } else {
          // YELLOW: Falling behind but deadline hasn't passed yet
          // Recovery is still possible but requires acceleration
          task.status = 'at-risk'
          // Note: We don't add to totalDelay here because deadline hasn't passed
          // This is a warning state, not a hard delay
        }
      }
    }
  })

  // Recalculate total duration based on actual progress
  const newTotalDuration = plan.tasks.reduce((sum, task) => {
    if (task.isCompleted) {
      return sum + task.actualDuration
    } else {
      // Estimated remaining duration
      const remaining = task.plannedDuration * (1 - task.completionPercentage / 100)
      return sum + remaining
    }
  }, 0)
  
  const newTotalDurationMonths = Math.ceil(newTotalDuration / 30)
  
  // Recalculate dynamic costs with new duration
  const costBreakdown = calculateDynamicCost(plan.tasks, plan.costParams, newTotalDurationMonths)
  
  // Cost overrun = new total cost - original material cost
  const costOverrun = costBreakdown.totalCost - plan.costParams.materialCost

  return {
    ...plan,
    totalDuration: newTotalDuration,
    totalDurationMonths: newTotalDurationMonths,
    totalCost: costBreakdown.totalCost,
    costBreakdown,
    currentDelay: totalDelay,
    costOverrun
  }
}
