"""
ASTRA GRID - Simulation Project Generator
Generates realistic project plans with phases, costs, and timelines
Based on the TypeScript simulation model
"""
from datetime import datetime, timedelta
import random

def generate_project_plan(project_data):
    """Generate complete project plan based on project type"""
    
    project_type = project_data.get('projectType', 'transmission')
    start_date_str = project_data.get('startDate')
    end_date_str = project_data.get('plannedEndDate')
    estimated_cost = float(project_data.get('estimatedCost', 0))  # in Crores
    terrain = project_data.get('terrain', 'plain').lower()
    
    start_date = datetime.fromisoformat(start_date_str) if isinstance(start_date_str, str) else start_date_str
    end_date = datetime.fromisoformat(end_date_str) if isinstance(end_date_str, str) else end_date_str
    
    planned_duration = (end_date - start_date).days
    
    # Generate tasks based on project type
    if project_type == 'substation':
        tasks = _generate_substation_tasks(start_date, estimated_cost, terrain)
    else:
        tasks = _generate_transmission_tasks(start_date, estimated_cost, terrain)
    
    # Calculate totals
    total_duration = sum(t['actualDuration'] for t in tasks)
    total_cost = estimated_cost
    
    # Cost breakdown
    material_cost = estimated_cost * 0.60
    labor_cost = estimated_cost * 0.25
    equipment_cost = estimated_cost * 0.10
    overhead_cost = estimated_cost * 0.05
    
    cost_breakdown = {
        'materialCost': round(material_cost, 2),
        'laborCost': round(labor_cost, 2),
        'equipmentCost': round(equipment_cost, 2),
        'overheadCost': round(overhead_cost, 2),
        'totalCost': round(total_cost, 2)
    }
    
    return {
        'tasks': tasks,
        'totalDuration': total_duration,
        'totalDurationMonths': round(total_duration / 30, 1),
        'totalCost': total_cost,
        'costBreakdown': cost_breakdown,
        'currentDelay': max(0, total_duration - planned_duration),
        'costOverrun': 0,
        'terrain': terrain
    }


def _generate_substation_tasks(start_date, total_cost, terrain):
    """Generate substation project tasks"""
    terrain_multiplier = {'Plain': 1.0, 'Hilly': 1.2, 'Forest': 1.3, 'Agriculture': 1.1}
    multiplier = terrain_multiplier.get(terrain, 1.0)
    
    phases = [
        {'name': 'Engineering & Design', 'duration': 60, 'cost': 0.12, 'workItems': [
            {'itemName': 'Technical Drawings', 'plannedPerMonth': 500, 'unit': 'diagrams'},
            {'itemName': 'Design Calculations', 'plannedPerMonth': 100, 'unit': 'sheets'}
        ]},
        {'name': 'Supply of Material', 'duration': 120, 'cost': 0.35},
        {'name': 'Land Acquisition', 'duration': 90, 'cost': 0.08, 'workItems': [
            {'itemName': 'Land Parcels', 'plannedPerMonth': 4, 'unit': 'plots'}
        ]},
        {'name': 'Site Leveling', 'duration': 30, 'cost': 0.05},
        {'name': 'Excavation', 'duration': 45, 'cost': 0.07},
        {'name': 'Concreting & Foundation', 'duration': 60, 'cost': 0.15, 'workItems': [
            {'itemName': 'Equipment Foundations', 'plannedPerMonth': 8, 'unit': 'nos'}
        ]},
        {'name': 'Equipment Erection', 'duration': 75, 'cost': 0.10},
        {'name': 'Testing & Commissioning', 'duration': 30, 'cost': 0.08}
    ]
    
    return _build_tasks(phases, start_date, total_cost, multiplier)


def _generate_transmission_tasks(start_date, total_cost, terrain):
    """Generate transmission line project tasks"""
    terrain_multiplier = {'Plain': 1.0, 'Hilly': 1.5, 'Forest': 1.7, 'Agriculture': 1.2}
    multiplier = terrain_multiplier.get(terrain, 1.0)
    
    phases = [
        {'name': 'Survey & Route Alignment', 'duration': 45, 'cost': 0.08, 'workItems': [
            {'itemName': 'Survey Points', 'plannedPerMonth': 80, 'unit': 'points'},
            {'itemName': 'Route Km', 'plannedPerMonth': 25, 'unit': 'km'}
        ]},
        {'name': 'Engineering & Design', 'duration': 60, 'cost': 0.10, 'workItems': [
            {'itemName': 'Tower Designs', 'plannedPerMonth': 400, 'unit': 'diagrams'}
        ]},
        {'name': 'Regulatory Permissions', 'duration': 75, 'cost': 0.06},
        {'name': 'Supply of Material', 'duration': 120, 'cost': 0.40},
        {'name': 'Land Acquisition & ROW', 'duration': 90, 'cost': 0.10, 'workItems': [
            {'itemName': 'ROW Acquired', 'plannedPerMonth': 15, 'unit': 'km'}
        ]},
        {'name': 'Foundation Work', 'duration': 90, 'cost': 0.12, 'workItems': [
            {'itemName': 'Foundations Completed', 'plannedPerMonth': 50, 'unit': 'nos'}
        ]},
        {'name': 'Tower Erection', 'duration': 105, 'cost': 0.12, 'workItems': [
            {'itemName': 'Towers Erected', 'plannedPerMonth': 45, 'unit': 'nos'}
        ]},
        {'name': 'Conductor Stringing', 'duration': 60, 'cost': 0.05, 'workItems': [
            {'itemName': 'Circuit Km Strung', 'plannedPerMonth': 60, 'unit': 'km'}
        ]},
        {'name': 'Testing & Commissioning', 'duration': 30, 'cost': 0.03}
    ]
    
    return _build_tasks(phases, start_date, total_cost, multiplier)


def _build_tasks(phases, start_date, total_cost, multiplier):
    """Build task objects with realistic variations"""
    tasks = []
    current_day = 0
    
    for i, phase in enumerate(phases):
        # Apply terrain multiplier and random variation
        base_duration = phase['duration']
        actual_duration = int(base_duration * multiplier * random.uniform(0.9, 1.2))
        
        # Build work items
        work_items = []
        if 'workItems' in phase:
            for item in phase['workItems']:
                total_qty = item['plannedPerMonth'] * (actual_duration / 30)
                work_items.append({
                    'itemName': item['itemName'],
                    'totalQuantity': int(total_qty),
                    'plannedPerMonth': item['plannedPerMonth'],
                    'completedQuantity': 0,
                    'unit': item['unit'],
                    'isTotalLocked': True,
                    'history': []
                })
        
        task = {
            'id': f'task-{i+1}',
            'name': phase['name'],
            'plannedDuration': base_duration,
            'actualDuration': actual_duration,
            'actualDurationMonths': round(actual_duration / 30, 1),
            'startDay': current_day,
            'startMonth': round(current_day / 30, 1),
            'costAllocation': phase['cost'] * 100,
            'materialCost': round(total_cost * phase['cost'], 2),
            'status': 'not-started',
            'completionPercentage': 0,
            'isCompleted': False,
            'dependencies': [],
            'workItems': work_items if work_items else None
        }
        
        tasks.append(task)
        current_day += actual_duration
    
    return tasks
