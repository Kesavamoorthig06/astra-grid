// Enterprise Project Management Engine  

export function calculateCriticalPath(tasks) {
  const criticalTasks = tasks.map(task => ({
    ...task,
    earlyStart: 0,
    earlyFinish: 0,
    lateStart: 0,
    lateFinish: 0,
    totalFloat: 0,
    freeFloat: 0,
    isCritical: false
  }))

  // Forward Pass
  criticalTasks.forEach((task) => {
    if (task.dependencies.length === 0) {
      task.earlyStart = 0
    } else {
      const maxPredecessorFinish = Math.max(
        ...task.dependencies.map(depId => {
          const depTask = criticalTasks.find(t => t.id === depId)
          return depTask ? depTask.earlyFinish : 0
        })
      )
      task.earlyStart = maxPredecessorFinish
    }
    task.earlyFinish = task.earlyStart + task.actualDuration
  })

  const projectFinish = Math.max(...criticalTasks.map(t => t.earlyFinish))

  // Backward Pass
  for (let i = criticalTasks.length - 1; i >= 0; i--) {
    const task = criticalTasks[i]
    const successors = criticalTasks.filter(t => t.dependencies.includes(task.id))
    
    if (successors.length === 0) {
      task.lateFinish = projectFinish
    } else {
      task.lateFinish = Math.min(...successors.map(s => s.lateStart))
    }
    task.lateStart = task.lateFinish - task.actualDuration
  }

  // Calculate Float
  criticalTasks.forEach(task => {
    task.totalFloat = task.lateStart - task.earlyStart
    task.isCritical = task.totalFloat === 0
    
    const successors = criticalTasks.filter(t => t.dependencies.includes(task.id))
    if (successors.length === 0) {
      task.freeFloat = task.totalFloat
    } else {
      const minSuccessorES = Math.min(...successors.map(s => s.earlyStart))
      task.freeFloat = minSuccessorES - task.earlyFinish
    }
  })

  return criticalTasks
}

export function calculateCostBreakdown(totalCost) {
  const directCostsRatio = 0.75
  const indirectCostsRatio = 0.25

  const directTotal = totalCost * directCostsRatio
  const indirectTotal = totalCost * indirectCostsRatio

  return {
    directCosts: {
      labor: directTotal * 0.35,
      materials: directTotal * 0.40,
      equipment: directTotal * 0.15,
      subcontracts: directTotal * 0.10
    },
    indirectCosts: {
      overhead: indirectTotal * 0.50,
      administration: indirectTotal * 0.30,
      contingency: indirectTotal * 0.20
    },
    totalCost
  }
}

export function generateCashFlowForecast(projectPlan, startDate) {
  const monthlyForecasts = []
  const totalMonths = Math.ceil(projectPlan.totalDuration / 30)
  
  let cumulativePlanned = 0
  let cumulativeActual = 0

  for (let month = 0; month < totalMonths; month++) {
    const monthStart = month * 30
    const monthEnd = (month + 1) * 30

    let plannedSpend = 0
    projectPlan.tasks.forEach(task => {
      const taskOverlapDays = calculateOverlapDays(
        task.startDay,
        task.startDay + task.actualDuration,
        monthStart,
        monthEnd
      )
      if (taskOverlapDays > 0) {
        const taskMonthlyAllocation = 
          (projectPlan.totalCost * task.costAllocation / 100) * 
          (taskOverlapDays / task.actualDuration)
        plannedSpend += taskMonthlyAllocation
      }
    })

    let actualSpend = 0
    projectPlan.tasks.forEach(task => {
      if (task.isCompleted || task.completionPercentage > 0) {
        const taskOverlapDays = calculateOverlapDays(
          task.startDay,
          task.startDay + task.actualDuration,
          monthStart,
          monthEnd
        )
        if (taskOverlapDays > 0) {
          const taskMonthlyAllocation = 
            (projectPlan.totalCost * task.costAllocation / 100) * 
            (taskOverlapDays / task.actualDuration) *
            (task.completionPercentage / 100)
          actualSpend += taskMonthlyAllocation
        }
      }
    })

    cumulativePlanned += plannedSpend
    cumulativeActual += actualSpend

    const monthDate = new Date(startDate)
    monthDate.setMonth(monthDate.getMonth() + month)

    monthlyForecasts.push({
      period: monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      plannedSpend,
      actualSpend,
      forecast: plannedSpend,
      variance: actualSpend - plannedSpend,
      cumulativePlanned,
      cumulativeActual
    })
  }

  return monthlyForecasts
}

function calculateOverlapDays(start1, end1, start2, end2) {
  const overlapStart = Math.max(start1, start2)
  const overlapEnd = Math.min(end1, end2)
  return Math.max(0, overlapEnd - overlapStart)
}

export function calculateEVM(projectPlan, simulatedDaysElapsed) {
  const BAC = projectPlan.totalCost

  let PV = 0
  projectPlan.tasks.forEach(task => {
    const taskPlannedEnd = task.startDay + task.plannedDuration
    if (taskPlannedEnd <= simulatedDaysElapsed) {
      PV += (BAC * task.costAllocation / 100)
    } else if (task.startDay < simulatedDaysElapsed) {
      const daysCompleted = simulatedDaysElapsed - task.startDay
      const percentComplete = daysCompleted / task.plannedDuration
      PV += (BAC * task.costAllocation / 100) * percentComplete
    }
  })

  let EV = 0
  projectPlan.tasks.forEach(task => {
    EV += (BAC * task.costAllocation / 100) * (task.completionPercentage / 100)
  })

  const AC = BAC + projectPlan.costOverrun

  const SV = EV - PV
  const CV = EV - AC
  const SPI = PV > 0 ? EV / PV : 1
  const CPI = AC > 0 ? EV / AC : 1

  const EAC = CPI > 0 ? BAC / CPI : BAC
  const ETC = EAC - AC
  const VAC = BAC - EAC

  return {
    plannedValue: PV,
    earnedValue: EV,
    actualCost: AC,
    scheduleVariance: SV,
    costVariance: CV,
    schedulePerformanceIndex: SPI,
    costPerformanceIndex: CPI,
    estimateAtCompletion: EAC,
    estimateToComplete: ETC,
    varianceAtCompletion: VAC
  }
}
