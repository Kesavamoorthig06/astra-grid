/**
 * TEST DELAY PROPAGATION SYSTEM
 * Run this in browser console to verify the system works
 */

// Test Data: Substation project with Engineering backlog
const testProjectData = {
  projectType: 'substation',
  capacity: 220,
  startDate: '2024-01-01',
  plannedEndDate: '2024-12-31',
  estimatedCost: 200, // 200 Crores
  additionalDetails: {
    terrain: 'Hilly',
    voltage: '220kV',
    establishmentCost: '0.5',
    interestRate: '12',
    storageCost: '0.2'
  }
}

console.log('🧪 Testing Delay Propagation System...')
console.log('Project Data:', testProjectData)

// Import required modules (adjust path if needed)
import { generateProjectPlan } from './utils/simulation/projectGenerator.js'

// Generate project plan
const plan = generateProjectPlan(testProjectData)

console.log('\n📊 Project Plan Generated:')
console.log('- Total Tasks:', plan.tasks.length)
console.log('- Total Duration:', plan.totalDuration, 'days')
console.log('- Total Cost:', (plan.totalCost / 10000000).toFixed(2), 'Crores')

// Check delay analysis
if (plan.delayAnalysis) {
  console.log('\n✅ Delay Analysis Present!')
  console.log('- Total Project Delay:', plan.delayAnalysis.totalProjectDelay, 'days')
  console.log('- Delayed Tasks:', plan.delayAnalysis.delayedTaskCount)
  
  if (plan.delayAnalysis.criticalPath && plan.delayAnalysis.criticalPath.length > 0) {
    console.log('\n📈 Critical Path (Tasks with Delays):')
    plan.delayAnalysis.criticalPath.forEach((task, i) => {
      console.log(`\n${i + 1}. ${task.taskName}`)
      console.log(`   - Base Delay: ${task.baseDelay} days`)
      console.log(`   - Propagated Delay: ${task.propagatedDelay} days`)
      console.log(`   - Total Delay: ${task.totalDelay} days`)
      
      if (task.upstreamImpacts && task.upstreamImpacts.length > 0) {
        console.log('   - Upstream Impacts:')
        task.upstreamImpacts.forEach(impact => {
          console.log(`     • ${impact.from}: ${impact.originalDelay} days × ${impact.multiplier} = ${impact.propagatedDelay} days`)
        })
      }
    })
  }
} else {
  console.log('\n⚠️ No delay analysis in plan. Check if calculateDelayPropagation is being called.')
}

// Simulate work progress and recalculate
console.log('\n🔄 Simulating Engineering Backlog...')

// Simulate: Engineering only 75% complete when 100% expected
plan.tasks[0].completionPercentage = 75
if (plan.tasks[0].workItems && plan.tasks[0].workItems.length > 0) {
  const workItem = plan.tasks[0].workItems[0]
  workItem.completedQuantity = Math.round(workItem.totalQuantity * 0.75)
  console.log(`- ${workItem.itemName}: ${workItem.completedQuantity}/${workItem.totalQuantity} completed`)
}

// Recalculate metrics (simulating 6 months elapsed)
import { recalculateProjectMetrics } from './utils/simulation/projectGenerator.js'
const updatedPlan = recalculateProjectMetrics(plan, plan.estimatedCost, 180) // 6 months = 180 days

console.log('\n📊 After Recalculation (6 months elapsed):')
console.log('- Current Delay:', updatedPlan.currentDelay, 'days')
console.log('- Total Project Delay:', updatedPlan.delayAnalysis?.totalProjectDelay, 'days')

if (updatedPlan.delayAnalysis) {
  console.log('\n🔴 Updated Critical Path:')
  updatedPlan.delayAnalysis.criticalPath.slice(0, 3).forEach((task, i) => {
    console.log(`${i + 1}. ${task.taskName}: ${task.totalDelay} days delay`)
  })
}

console.log('\n✅ Test Complete!')
console.log('If you see delay analysis data above, the system is working correctly.')
console.log('Open the Project Planner UI to see the visual delay propagation component.')

export { testProjectData, plan, updatedPlan }
