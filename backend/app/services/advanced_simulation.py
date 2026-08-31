"""
ASTRA GRID - Advanced Simulation Generator
Complete implementation of dynamic simulation with:
1. Productivity Matrix (Dynamic Time Engine)
2. Real Cost Algorithm (Dynamic Costing)
3. Catch-Up Logic (Prescriptive Analytics)
"""
from datetime import datetime, timedelta
import random
from typing import Dict, List, Tuple, Any

# ===============================================
# 1. PRODUCTIVITY MATRIX - Dynamic Time Engine
# ===============================================

PRODUCTIVITY_CALENDAR = {
    6: {'factor': 0.4, 'reason': 'Monsoon'},   # June
    7: {'factor': 0.4, 'reason': 'Monsoon'},   # July
    8: {'factor': 0.4, 'reason': 'Monsoon'},   # August
    10: {'factor': 0.6, 'reason': 'Festival Season'},  # October
    3: {'factor': 0.6, 'reason': 'Festival Season'},   # March
    11: {'factor': 1.0, 'reason': 'Harvest Season (Check Terrain)'},  # November
    12: {'factor': 1.0, 'reason': 'Harvest Season (Check Terrain)'}   # December
}

TERRAIN_FACTORS = {
    'Plain': 1.0,
    'Hilly': 0.5,
    'Forest': 0.2,
    'Agriculture': 1.0  # Special: 0.0 during Nov-Dec harvest
}

# ===============================================
# 2. REAL COST - Dynamic Costing Parameters
# ===============================================

def calculate_dynamic_cost(tasks: List[Dict], cost_params: Dict, total_duration_months: int) -> Dict:
    """
    Calculate time-dependent costs with:
    - Material Cost (base)
    - Establishment Cost (duration dependent)
    - Interest During Construction (compound)
    - Storage Cost (if supply arrives early)
    """
    material_cost = cost_params['materialCost']
    
    # Establishment Cost = rate × duration
    establishment_cost = cost_params['establishmentCostPerMonth'] * total_duration_months
    
    # Interest During Construction - Compound interest month-by-month
    interest_cost = 0
    monthly_interest_rate = cost_params['annualInterestRate'] / 100 / 12
    cumulative_spend = 0
    monthly_material_spend = material_cost / total_duration_months
    
    for month in range(total_duration_months):
        cumulative_spend += monthly_material_spend + cost_params['establishmentCostPerMonth']
        interest_cost += cumulative_spend * monthly_interest_rate
    
    # Storage Cost - if Supply arrives before Site Ready
    storage_cost = 0
    supply_task = next((t for t in tasks if 'supply' in t['name'].lower()), None)
    land_task = next((t for t in tasks if 'land' in t['name'].lower() or 'foundation' in t['name'].lower()), None)
    
    if supply_task and land_task:
        supply_end_month = supply_task['startMonth'] + supply_task['actualDurationMonths']
        site_ready_month = land_task['startMonth'] + land_task['actualDurationMonths']
        
        if supply_end_month < site_ready_month:
            delay_months = site_ready_month - supply_end_month
            storage_cost = delay_months * cost_params['storageCostPerMonth']
            supply_task['supplyArrivalMonth'] = supply_end_month
            supply_task['siteReadyMonth'] = site_ready_month
            supply_task['storageMonths'] = delay_months
    
    total_cost = material_cost + establishment_cost + interest_cost + storage_cost
    
    return {
        'materialCost': round(material_cost, 2),
        'establishmentCost': round(establishment_cost, 2),
        'interestCost': round(interest_cost, 2),
        'storageCost': round(storage_cost, 2),
        'totalCost': round(total_cost, 2)
    }

# ===============================================
# 3. CATCH-UP LOGIC - Prescriptive Analytics
# ===============================================

def calculate_catch_up_alert(completed_qty: int, total_qty: int, base_capacity: int, 
                             months_elapsed: int, planned_duration_months: int) -> Dict:
    """
    Provides actionable warnings when project falls behind
    Calculates exact capacity increases needed to recover
    """
    remaining_work = total_qty - completed_qty
    remaining_months = max(planned_duration_months - months_elapsed, 1)
    required_run_rate = remaining_work / remaining_months
    
    max_capacity = base_capacity * 1.2
    is_critical_risk = required_run_rate > max_capacity
    
    message = ''
    if is_critical_risk:
        message = f"⚠️ CRITICAL: To finish on time, increase capacity to {int(required_run_rate)} units/month (Current max: {int(max_capacity)}, Base: {base_capacity})"
    elif required_run_rate > base_capacity:
        message = f"⚡ Warning: Required run rate {int(required_run_rate)} units/month exceeds base capacity {base_capacity}"
    
    return {
        'isCriticalRisk': is_critical_risk,
        'requiredRunRate': round(required_run_rate, 1),
        'currentCapacity': base_capacity,
        'message': message
    }

# ===============================================
# Dynamic Time Engine
# ===============================================

def get_month_efficiency_factor(month_index: int, start_date: datetime, terrain: str) -> Tuple[float, List[str]]:
    """Calculate productivity factor for a specific month considering season and terrain"""
    current_date = start_date + timedelta(days=month_index * 30)
    month = current_date.month
    
    reasons = []
    factor = 1.0
    
    # Apply seasonal calendar
    if month in PRODUCTIVITY_CALENDAR:
        calendar_factor = PRODUCTIVITY_CALENDAR[month]['factor']
        
        # Special case: Harvest season on Agriculture terrain
        if terrain == 'Agriculture' and month in [11, 12]:
            factor = 0.0
            reasons.append('Harvest Season - No work on Agriculture terrain')
        else:
            factor = calendar_factor
            reasons.append(PRODUCTIVITY_CALENDAR[month]['reason'])
    
    # Apply terrain multiplier
    terrain_factor = TERRAIN_FACTORS.get(terrain, 1.0)
    factor *= terrain_factor
    
    if terrain_factor < 1.0:
        reasons.append(f"{terrain} terrain ({terrain_factor}x)")
    
    return max(factor, 0.0), reasons

def simulate_task_duration(total_work_qty: int, base_capacity_per_month: int, 
                          start_month_index: int, start_date: datetime, terrain: str) -> Dict:
    """
    Simulate task duration month-by-month considering:
    - Seasonal productivity (monsoon, festivals)
    - Terrain difficulty
    - Harvest seasons
    """
    remaining_work = total_work_qty
    months_elapsed = 0
    month_by_month_log = []
    
    while remaining_work > 0 and months_elapsed < 360:  # Max 30 years safety
        factor, reasons = get_month_efficiency_factor(
            start_month_index + months_elapsed,
            start_date,
            terrain
        )
        
        actual_capacity = base_capacity_per_month * factor
        work_done = min(actual_capacity, remaining_work)
        
        month_by_month_log.append({
            'month': months_elapsed + 1,
            'efficiency': round(factor, 2),
            'reasons': reasons,
            'planned': base_capacity_per_month,
            'actual': round(actual_capacity, 1),
            'workDone': round(work_done, 1),
            'remaining': round(remaining_work - work_done, 1)
        })
        
        remaining_work -= work_done
        months_elapsed += 1
        
        # Skip month if capacity is zero
        if factor == 0.0 and remaining_work > 0:
            continue
    
    duration_days = months_elapsed * 30
    
    return {
        'durationMonths': months_elapsed,
        'durationDays': duration_days,
        'monthByMonthLog': month_by_month_log
    }

def apply_ai_variation(base_duration: int) -> int:
    """Apply realistic variation: -10% to +30%"""
    variation = random.uniform(-0.1, 0.3)
    return round(base_duration * (1 + variation))

# ===============================================
# Project Data
# ===============================================

SUBSTATION_PHASES = [
    { 
        'name': 'Engineering & Design', 
        'duration': 60, 
        'cost': 12,
        'workItems': [
            {'itemName': 'Technical Drawings', 'plannedPerMonth': 500, 'unit': 'diagrams'},
            {'itemName': 'Design Calculations', 'plannedPerMonth': 100, 'unit': 'sheets'},
            {'itemName': 'BOQ Preparation', 'plannedPerMonth': 8, 'unit': 'documents'}
        ]
    },
    {'name': 'Supply of Material', 'duration': 120, 'cost': 35},
    { 
        'name': 'Land Acquisition', 
        'duration': 90, 
        'cost': 8,
        'workItems': [
            {'itemName': 'Land Parcels', 'plannedPerMonth': 4, 'unit': 'plots'},
            {'itemName': 'Documentation', 'plannedPerMonth': 20, 'unit': 'files'}
        ],
        'subPhases': [
            {'name': 'Site Identification & Survey', 'duration': 10},
            {'name': 'Land Records & Documentation', 'duration': 15},
            {'name': 'Negotiation with Owners', 'duration': 20},
            {'name': 'Payment Processing', 'duration': 15},
            {'name': 'Legal Registration', 'duration': 20},
            {'name': 'Physical Possession', 'duration': 10}
        ]
    },
    {'name': 'Site Leveling', 'duration': 30, 'cost': 5},
    {'name': 'Excavation', 'duration': 45, 'cost': 7},
    { 
        'name': 'Concreting & Foundation', 
        'duration': 60, 
        'cost': 15,
        'workItems': [
            {'itemName': 'Equipment Foundations', 'plannedPerMonth': 8, 'unit': 'nos'},
            {'itemName': 'Concrete Poured', 'plannedPerMonth': 400, 'unit': 'm³'}
        ]
    },
    {'name': 'Equipment Erection', 'duration': 75, 'cost': 10},
    {'name': 'Testing & Commissioning', 'duration': 30, 'cost': 8}
]

TRANSMISSION_PHASES = [
    { 
        'name': 'Survey & Route Alignment', 
        'duration': 45, 
        'cost': 8,
        'workItems': [
            {'itemName': 'Survey Points', 'plannedPerMonth': 80, 'unit': 'points'},
            {'itemName': 'Route Km', 'plannedPerMonth': 25, 'unit': 'km'}
        ],
        'subPhases': [
            {'name': 'Topographical Survey', 'duration': 10},
            {'name': 'Soil Investigation', 'duration': 8},
            {'name': 'ROW Identification', 'duration': 10},
            {'name': 'Forest/Railway/Road/Airport Crossings', 'duration': 12},
            {'name': 'Final Route Approval', 'duration': 5}
        ]
    },
    { 
        'name': 'Engineering & Design', 
        'duration': 60, 
        'cost': 10,
        'workItems': [
            {'itemName': 'Tower Designs', 'plannedPerMonth': 400, 'unit': 'diagrams'},
            {'itemName': 'Foundation Designs', 'plannedPerMonth': 150, 'unit': 'sheets'}
        ]
    },
    {'name': 'Regulatory Permissions', 'duration': 75, 'cost': 6},
    {'name': 'Supply of Material', 'duration': 120, 'cost': 40},
    { 
        'name': 'Land Acquisition & ROW', 
        'duration': 90, 
        'cost': 10,
        'workItems': [
            {'itemName': 'ROW Acquired', 'plannedPerMonth': 15, 'unit': 'km'},
            {'itemName': 'Landowners Settled', 'plannedPerMonth': 100, 'unit': 'cases'}
        ],
        'subPhases': [
            {'name': 'ROW Demarcation', 'duration': 10},
            {'name': 'Landowner Identification', 'duration': 15},
            {'name': 'Compensation Assessment', 'duration': 20},
            {'name': 'Payment & Agreement', 'duration': 25},
            {'name': 'Legal Clearances', 'duration': 15},
            {'name': 'ROW Handover', 'duration': 5}
        ]
    },
    { 
        'name': 'Foundation Work', 
        'duration': 90, 
        'cost': 12,
        'workItems': [
            {'itemName': 'Foundations Completed', 'plannedPerMonth': 50, 'unit': 'nos'},
            {'itemName': 'Excavation', 'plannedPerMonth': 750, 'unit': 'm³'}
        ]
    },
    { 
        'name': 'Tower Erection', 
        'duration': 105, 
        'cost': 12,
        'workItems': [
            {'itemName': 'Towers Erected', 'plannedPerMonth': 45, 'unit': 'nos'}
        ]
    },
    { 
        'name': 'Conductor Stringing', 
        'duration': 60, 
        'cost': 5,
        'workItems': [
            {'itemName': 'Circuit Km Strung', 'plannedPerMonth': 60, 'unit': 'km'}
        ]
    },
    {'name': 'Testing & Commissioning', 'duration': 30, 'cost': 3}
]

# ===============================================
# Main Generator
# ===============================================

def generate_project_plan(project_data: Dict) -> Dict:
    """
    Generate complete dynamic project plan
    Implements all three advanced engines
    """
    project_type = project_data.get('projectType', 'transmission')
    start_date_str = project_data.get('startDate')
    terrain = project_data.get('terrain', 'Plain')
    
    start_date = datetime.fromisoformat(start_date_str) if isinstance(start_date_str, str) else start_date_str
    
    # Cost parameters with defaults
    additional = project_data.get('additionalDetails', {})
    cost_params = {
        'materialCost': float(project_data.get('estimatedCost', 0)),
        'establishmentCostPerMonth': float(additional.get('establishmentCost', 0.5)),
        'annualInterestRate': float(additional.get('interestRate', 12)),
        'storageCostPerMonth': float(additional.get('storageCost', 0.2))
    }
    
    # Select phases
    phases = SUBSTATION_PHASES if project_type == 'substation' else TRANSMISSION_PHASES
    
    tasks = []
    current_start_day = 0
    current_start_month = 0
    
    for idx, phase in enumerate(phases):
        # Initialize work items
        work_items = []
        total_work_qty = 0
        base_capacity = 0
        
        if 'workItems' in phase:
            for item in phase['workItems']:
                planned_per_month = item['plannedPerMonth']
                # Calculate total quantity based on base duration
                total_qty = int(planned_per_month * (phase['duration'] / 30))
                
                work_items.append({
                    'itemName': item['itemName'],
                    'totalQuantity': total_qty,
                    'plannedPerMonth': planned_per_month,
                    'completedQuantity': 0,
                    'unit': item['unit'],
                    'isTotalLocked': True,
                    'history': []
                })
            
            if work_items:
                base_capacity = work_items[0]['plannedPerMonth']
                total_work_qty = work_items[0]['totalQuantity']
        
        # DYNAMIC DURATION CALCULATION
        if total_work_qty > 0 and base_capacity > 0:
            simulation = simulate_task_duration(
                total_work_qty,
                base_capacity,
                current_start_month,
                start_date,
                terrain
            )
            actual_duration = simulation['durationDays']
            actual_duration_months = simulation['durationMonths']
        else:
            actual_duration = apply_ai_variation(phase['duration'])
            actual_duration_months = round(actual_duration / 30, 1)
        
        # Sub-activities
        sub_activities = []
        if 'subPhases' in phase:
            for sub_idx, sub_phase in enumerate(phase['subPhases']):
                sub_activities.append({
                    'id': f"task-{idx}-sub-{sub_idx}",
                    'name': sub_phase['name'],
                    'duration': sub_phase['duration'],
                    'isCompleted': False,
                    'completionPercentage': 0
                })
        
        task_id = phase['name'].lower().replace(' ', '-').replace('&', 'and')
        material_cost = (phase['cost'] / 100) * cost_params['materialCost']
        
        task = {
            'id': task_id,
            'name': phase['name'],
            'plannedDuration': phase['duration'],
            'actualDuration': actual_duration,
            'actualDurationMonths': actual_duration_months,
            'startDay': current_start_day,
            'startMonth': current_start_month,
            'costAllocation': phase['cost'],
            'materialCost': round(material_cost, 2),
            'status': 'not-started',
            'completionPercentage': 0,
            'isCompleted': False,
            'dependencies': [],
            'workItems': work_items if work_items else None,
            'subActivities': sub_activities if sub_activities else None,
            'baseCapacity': base_capacity if base_capacity > 0 else None,
            'totalWorkQuantity': total_work_qty if total_work_qty > 0 else None
        }
        
        tasks.append(task)
        current_start_day += actual_duration
        current_start_month += actual_duration_months
    
    total_duration = sum(t['actualDuration'] for t in tasks)
    total_duration_months = sum(t['actualDurationMonths'] for t in tasks)
    
    # Calculate dynamic costs
    cost_breakdown = calculate_dynamic_cost(tasks, cost_params, int(total_duration_months))
    
    return {
        'tasks': tasks,
        'totalDuration': int(total_duration),
        'totalDurationMonths': round(total_duration_months, 1),
        'totalCost': cost_breakdown['totalCost'],
        'costBreakdown': cost_breakdown,
        'currentDelay': 0,
        'costOverrun': 0,
        'terrain': terrain,
        'costParams': cost_params
    }
