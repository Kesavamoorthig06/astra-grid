"""
Power Grid Project Simulation API
Provides endpoints for project planning, cost calculation, and CPM/EVM analytics
"""

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
import math

simulation_bp = Blueprint('simulation', __name__)

# ===============================================
# PRODUCTIVITY & TERRAIN FACTORS
# ===============================================

PRODUCTIVITY_CALENDAR = {
    6: {"factor": 0.4, "reason": "Monsoon"},
    7: {"factor": 0.4, "reason": "Monsoon"},
    8: {"factor": 0.4, "reason": "Monsoon"},
    10: {"factor": 0.6, "reason": "Festival Season"},
    3: {"factor": 0.6, "reason": "Festival Season"},
    11: {"factor": 1.0, "reason": "Harvest Season"},
    12: {"factor": 1.0, "reason": "Harvest Season"}
}

TERRAIN_FACTORS = {
    "Plain": 1.0,
    "Hilly": 0.5,
    "Forest": 0.2,
    "Agriculture": 1.0
}

# ===============================================
# SUBSTATION PROJECT PHASES
# ===============================================

SUBSTATION_PHASES = [
    {
        "id": "design",
        "name": "Design & Engineering",
        "plannedDuration": 90,
        "costAllocation": 5,
        "dependencies": [],
        "canRunInParallel": [],
        "workItems": [
            {"itemName": "SLD Diagrams", "totalQuantity": 50, "plannedPerMonth": 20, "unit": "diagrams"},
            {"itemName": "Layout Drawings", "totalQuantity": 30, "plannedPerMonth": 15, "unit": "drawings"}
        ]
    },
    {
        "id": "procurement",
        "name": "Equipment Procurement",
        "plannedDuration": 120,
        "costAllocation": 40,
        "dependencies": ["design"],
        "canRunInParallel": ["civil"],
        "workItems": [
            {"itemName": "Transformers", "totalQuantity": 3, "plannedPerMonth": 1, "unit": "units"},
            {"itemName": "Circuit Breakers", "totalQuantity": 12, "plannedPerMonth": 4, "unit": "units"}
        ]
    },
    {
        "id": "civil",
        "name": "Civil Construction",
        "plannedDuration": 150,
        "costAllocation": 20,
        "dependencies": ["design"],
        "canRunInParallel": ["procurement"],
        "workItems": [
            {"itemName": "Foundation Work", "totalQuantity": 500, "plannedPerMonth": 150, "unit": "cum"},
            {"itemName": "Cable Trenches", "totalQuantity": 2000, "plannedPerMonth": 600, "unit": "meters"}
        ]
    },
    {
        "id": "erection",
        "name": "Equipment Erection",
        "plannedDuration": 90,
        "costAllocation": 15,
        "dependencies": ["procurement", "civil"],
        "canRunInParallel": [],
        "workItems": [
            {"itemName": "Transformer Installation", "totalQuantity": 3, "plannedPerMonth": 1, "unit": "units"},
            {"itemName": "Bay Equipment", "totalQuantity": 12, "plannedPerMonth": 4, "unit": "bays"}
        ]
    },
    {
        "id": "testing",
        "name": "Testing & Commissioning",
        "plannedDuration": 60,
        "costAllocation": 10,
        "dependencies": ["erection"],
        "canRunInParallel": [],
        "workItems": [
            {"itemName": "Primary Tests", "totalQuantity": 50, "plannedPerMonth": 25, "unit": "tests"},
            {"itemName": "Secondary Tests", "totalQuantity": 100, "plannedPerMonth": 50, "unit": "tests"}
        ]
    },
    {
        "id": "scada",
        "name": "SCADA Integration",
        "plannedDuration": 45,
        "costAllocation": 5,
        "dependencies": ["testing"],
        "canRunInParallel": [],
        "workItems": [
            {"itemName": "RTU Configuration", "totalQuantity": 10, "plannedPerMonth": 5, "unit": "devices"},
            {"itemName": "HMI Development", "totalQuantity": 5, "plannedPerMonth": 3, "unit": "screens"}
        ]
    },
    {
        "id": "protection",
        "name": "Protection Systems",
        "plannedDuration": 75,
        "costAllocation": 3,
        "dependencies": ["erection"],
        "canRunInParallel": ["testing"],
        "workItems": [
            {"itemName": "Relay Settings", "totalQuantity": 24, "plannedPerMonth": 10, "unit": "relays"},
            {"itemName": "CT/PT Installation", "totalQuantity": 36, "plannedPerMonth": 15, "unit": "units"}
        ]
    },
    {
        "id": "commissioning",
        "name": "Final Commissioning",
        "plannedDuration": 30,
        "costAllocation": 2,
        "dependencies": ["testing", "scada", "protection"],
        "canRunInParallel": [],
        "workItems": [
            {"itemName": "Energization Tests", "totalQuantity": 10, "plannedPerMonth": 10, "unit": "tests"},
            {"itemName": "Documentation", "totalQuantity": 20, "plannedPerMonth": 20, "unit": "documents"}
        ]
    }
]

# ===============================================
# TRANSMISSION PROJECT PHASES
# ===============================================

TRANSMISSION_PHASES = [
    {
        "id": "survey",
        "name": "Route Survey & Design",
        "plannedDuration": 60,
        "costAllocation": 5,
        "dependencies": [],
        "canRunInParallel": [],
        "staggeredStart": "100% completion before procurement",
        "workItems": [
            {"itemName": "Survey Stations", "totalQuantity": 200, "plannedPerMonth": 100, "unit": "stations"},
            {"itemName": "Tower Locations", "totalQuantity": 150, "plannedPerMonth": 75, "unit": "locations"}
        ]
    },
    {
        "id": "procurement",
        "name": "Material Procurement",
        "plannedDuration": 90,
        "costAllocation": 35,
        "dependencies": ["survey"],
        "canRunInParallel": ["foundation"],
        "workItems": [
            {"itemName": "Conductors", "totalQuantity": 300, "plannedPerMonth": 100, "unit": "km"},
            {"itemName": "Insulators", "totalQuantity": 3000, "plannedPerMonth": 1000, "unit": "units"}
        ]
    },
    {
        "id": "foundation",
        "name": "Tower Foundation",
        "plannedDuration": 120,
        "costAllocation": 20,
        "dependencies": ["survey"],
        "canRunInParallel": ["procurement"],
        "staggeredStart": "Starts after 10% of survey",
        "workItems": [
            {"itemName": "Foundations", "totalQuantity": 150, "plannedPerMonth": 40, "unit": "foundations"},
            {"itemName": "Stub Settings", "totalQuantity": 600, "plannedPerMonth": 160, "unit": "stubs"}
        ]
    },
    {
        "id": "erection",
        "name": "Tower Erection",
        "plannedDuration": 150,
        "costAllocation": 15,
        "dependencies": ["foundation", "procurement"],
        "canRunInParallel": [],
        "staggeredStart": "Starts after 20% of foundation",
        "workItems": [
            {"itemName": "Towers Erected", "totalQuantity": 150, "plannedPerMonth": 30, "unit": "towers"},
            {"itemName": "Tower Members", "totalQuantity": 9000, "plannedPerMonth": 1800, "unit": "members"}
        ]
    },
    {
        "id": "stringing",
        "name": "Conductor Stringing",
        "plannedDuration": 90,
        "costAllocation": 10,
        "dependencies": ["erection"],
        "canRunInParallel": [],
        "staggeredStart": "Starts after 30% of erection",
        "workItems": [
            {"itemName": "Conductor Strung", "totalQuantity": 300, "plannedPerMonth": 100, "unit": "km"},
            {"itemName": "Joints Made", "totalQuantity": 450, "plannedPerMonth": 150, "unit": "joints"}
        ]
    },
    {
        "id": "earthing",
        "name": "Earthing & OPGW",
        "plannedDuration": 60,
        "costAllocation": 5,
        "dependencies": ["erection"],
        "canRunInParallel": ["stringing"],
        "workItems": [
            {"itemName": "Earthing Systems", "totalQuantity": 150, "plannedPerMonth": 75, "unit": "systems"},
            {"itemName": "OPGW Installation", "totalQuantity": 100, "plannedPerMonth": 50, "unit": "km"}
        ]
    },
    {
        "id": "termination",
        "name": "Line Termination",
        "plannedDuration": 45,
        "costAllocation": 3,
        "dependencies": ["stringing"],
        "canRunInParallel": [],
        "workItems": [
            {"itemName": "Gantries", "totalQuantity": 2, "plannedPerMonth": 1, "unit": "gantries"},
            {"itemName": "Line Bays", "totalQuantity": 4, "plannedPerMonth": 2, "unit": "bays"}
        ]
    },
    {
        "id": "testing",
        "name": "Testing & Patrol",
        "plannedDuration": 30,
        "costAllocation": 5,
        "dependencies": ["stringing", "earthing", "termination"],
        "canRunInParallel": [],
        "workItems": [
            {"itemName": "Line Patrols", "totalQuantity": 3, "plannedPerMonth": 3, "unit": "patrols"},
            {"itemName": "Tests Completed", "totalQuantity": 50, "plannedPerMonth": 50, "unit": "tests"}
        ]
    },
    {
        "id": "commissioning",
        "name": "Energization & Handover",
        "plannedDuration": 15,
        "costAllocation": 2,
        "dependencies": ["testing"],
        "canRunInParallel": [],
        "workItems": [
            {"itemName": "Trial Charges", "totalQuantity": 3, "plannedPerMonth": 3, "unit": "charges"},
            {"itemName": "Documentation", "totalQuantity": 10, "plannedPerMonth": 10, "unit": "documents"}
        ]
    }
]


def simulate_task_duration(work_quantity: float, capacity: float, start_month: int, 
                          start_date: datetime, terrain: str) -> Dict[str, Any]:
    """
    Simulate actual task duration considering seasonal and terrain factors
    """
    remaining_work = work_quantity
    days_elapsed = 0
    current_date = start_date
    
    while remaining_work > 0:
        month = current_date.month
        productivity = PRODUCTIVITY_CALENDAR.get(month, {"factor": 1.0})["factor"]
        
        # Special case: Agriculture terrain has 0 productivity in Nov-Dec
        if terrain == "Agriculture" and month in [11, 12]:
            productivity = 0.0
        else:
            productivity *= TERRAIN_FACTORS.get(terrain, 1.0)
        
        # Calculate work done this day
        daily_capacity = capacity / 30  # Convert monthly to daily
        work_done = daily_capacity * productivity
        remaining_work -= work_done
        
        days_elapsed += 1
        current_date += timedelta(days=1)
        
        # Safety limit
        if days_elapsed > 3650:  # 10 years max
            break
    
    return {
        "actualDuration": days_elapsed,
        "actualDurationMonths": days_elapsed / 30,
        "endDate": current_date
    }


def calculate_dynamic_cost(tasks: List[Dict], cost_params: Dict, duration_months: float) -> Dict[str, float]:
    """
    Calculate real project cost with time-dependent factors
    """
    material_cost = cost_params["materialCost"]
    establishment_cost = duration_months * cost_params["establishmentCostPerMonth"]
    
    # Calculate compound interest (IDC)
    monthly_rate = cost_params["annualInterestRate"] / 100 / 12
    total_months = int(duration_months)
    cumulative_spend = 0
    interest_cost = 0
    
    for month in range(total_months):
        monthly_spend = material_cost / total_months
        cumulative_spend += monthly_spend
        interest_cost += cumulative_spend * monthly_rate
    
    # Storage cost (simplified - assume 10% of materials arrive early)
    storage_cost = cost_params["storageCostPerMonth"] * (duration_months * 0.1)
    
    return {
        "materialCost": material_cost,
        "establishmentCost": establishment_cost,
        "interestCost": interest_cost,
        "storageCost": storage_cost,
        "totalCost": material_cost + establishment_cost + interest_cost + storage_cost
    }


def calculate_critical_path(tasks: List[Dict]) -> List[Dict]:
    """
    Calculate Critical Path Method (CPM) - Forward and Backward Pass
    """
    task_dict = {task["id"]: task for task in tasks}
    
    # Forward pass - calculate early start/finish
    for task in tasks:
        if not task.get("dependencies"):
            task["earlyStart"] = 0
        else:
            max_finish = 0
            for dep_id in task["dependencies"]:
                if dep_id in task_dict:
                    dep = task_dict[dep_id]
                    max_finish = max(max_finish, dep.get("earlyFinish", 0))
            task["earlyStart"] = max_finish
        
        task["earlyFinish"] = task["earlyStart"] + task["actualDuration"]
    
    # Project completion time
    project_duration = max(task["earlyFinish"] for task in tasks)
    
    # Backward pass - calculate late start/finish
    for task in reversed(tasks):
        successors = [t for t in tasks if task["id"] in t.get("dependencies", [])]
        if not successors:
            task["lateFinish"] = project_duration
        else:
            min_start = min(succ.get("lateStart", project_duration) for succ in successors)
            task["lateFinish"] = min_start
        
        task["lateStart"] = task["lateFinish"] - task["actualDuration"]
        task["totalFloat"] = task["lateStart"] - task["earlyStart"]
        task["isCritical"] = task["totalFloat"] == 0
    
    return tasks


def calculate_evm(project_plan: Dict, simulated_days: int) -> Dict[str, float]:
    """
    Calculate Earned Value Management metrics
    """
    total_cost = project_plan["costBreakdown"]["totalCost"]
    total_duration = project_plan["totalDuration"]
    
    # Planned Value (PV) - what should have been spent by now
    planned_value = (simulated_days / total_duration) * total_cost
    
    # Earned Value (EV) - actual work completed
    completed_tasks = [t for t in project_plan["tasks"] if t["isCompleted"]]
    earned_value = sum(t["materialCost"] for t in completed_tasks)
    
    # Actual Cost (AC) - money spent (simplified)
    actual_cost = planned_value * 1.05  # Assume 5% cost overrun
    
    # Performance indices
    spi = earned_value / planned_value if planned_value > 0 else 1.0
    cpi = earned_value / actual_cost if actual_cost > 0 else 1.0
    
    # Estimate at Completion
    eac = total_cost / cpi if cpi > 0 else total_cost
    
    return {
        "plannedValue": planned_value,
        "earnedValue": earned_value,
        "actualCost": actual_cost,
        "schedulePerformanceIndex": spi,
        "costPerformanceIndex": cpi,
        "estimateAtCompletion": eac
    }


@simulation_bp.route('/api/simulation/generate-project', methods=['POST'])
@cross_origin()
def generate_project():
    """
    Generate complete project plan with dynamic simulation
    """
    try:
        data = request.json
        project_type = data.get('projectType')
        project_name = data.get('projectName', 'Untitled Project')
        material_cost = float(data.get('materialCost', 100))
        terrain = data.get('terrain', 'Plain')
        start_date_str = data.get('startDate', datetime.now().isoformat())
        start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        
        # Select phases based on project type
        phases = SUBSTATION_PHASES if project_type == 'substation' else TRANSMISSION_PHASES
        
        # Cost parameters
        cost_params = {
            "materialCost": material_cost,
            "establishmentCostPerMonth": data.get('establishmentCostPerMonth', 0.5),
            "annualInterestRate": data.get('annualInterestRate', 12),
            "storageCostPerMonth": data.get('storageCostPerMonth', 0.1)
        }
        
        # Generate tasks with dynamic durations
        tasks = []
        current_start_day = 0
        
        for phase in phases:
            # Simulate actual duration
            total_work = sum(item["totalQuantity"] for item in phase.get("workItems", []))
            avg_capacity = sum(item["plannedPerMonth"] for item in phase.get("workItems", [])) / len(phase.get("workItems", [1]))
            
            simulation = simulate_task_duration(
                total_work,
                avg_capacity,
                start_date.month,
                start_date + timedelta(days=current_start_day),
                terrain
            )
            
            task = {
                "id": phase["id"],
                "name": phase["name"],
                "plannedDuration": phase["plannedDuration"],
                "actualDuration": simulation["actualDuration"],
                "actualDurationMonths": simulation["actualDurationMonths"],
                "startDay": current_start_day,
                "startMonth": current_start_day // 30,
                "costAllocation": phase["costAllocation"],
                "materialCost": (phase["costAllocation"] / 100) * material_cost,
                "status": "not-started",
                "completionPercentage": 0,
                "isCompleted": False,
                "dependencies": phase.get("dependencies", []),
                "canRunInParallel": phase.get("canRunInParallel", []),
                "staggeredStart": phase.get("staggeredStart"),
                "workItems": phase.get("workItems", [])
            }
            
            tasks.append(task)
            current_start_day += simulation["actualDuration"]
        
        # Calculate CPM
        tasks = calculate_critical_path(tasks)
        
        # Calculate total duration
        total_duration = max(t["earlyFinish"] for t in tasks)
        total_duration_months = total_duration / 30
        
        # Calculate dynamic costs
        cost_breakdown = calculate_dynamic_cost(tasks, cost_params, total_duration_months)
        
        # Build project plan
        project_plan = {
            "projectId": f"proj_{datetime.now().timestamp()}",
            "projectName": project_name,
            "projectType": project_type,
            "terrain": terrain,
            "startDate": start_date.isoformat(),
            "tasks": tasks,
            "totalDuration": int(total_duration),
            "totalDurationMonths": round(total_duration_months, 2),
            "costParams": cost_params,
            "costBreakdown": cost_breakdown,
            "currentDelay": 0,
            "createdAt": datetime.now().isoformat()
        }
        
        return jsonify({
            "success": True,
            "projectPlan": project_plan
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@simulation_bp.route('/api/simulation/calculate-cpm', methods=['POST'])
@cross_origin()
def calculate_cpm():
    """
    Calculate Critical Path Method for given tasks
    """
    try:
        data = request.json
        tasks = data.get('tasks', [])
        
        tasks_with_cpm = calculate_critical_path(tasks)
        
        return jsonify({
            "success": True,
            "tasks": tasks_with_cpm,
            "criticalPath": [t for t in tasks_with_cpm if t.get("isCritical")]
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@simulation_bp.route('/api/simulation/calculate-evm', methods=['POST'])
@cross_origin()
def calculate_evm_endpoint():
    """
    Calculate Earned Value Management metrics
    """
    try:
        data = request.json
        project_plan = data.get('projectPlan')
        simulated_days = data.get('simulatedDays', 0)
        
        evm_metrics = calculate_evm(project_plan, simulated_days)
        
        return jsonify({
            "success": True,
            "evm": evm_metrics
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@simulation_bp.route('/api/simulation/health', methods=['GET'])
@cross_origin()
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        "status": "healthy",
        "service": "Power Grid Simulation API",
        "timestamp": datetime.now().isoformat()
    })
