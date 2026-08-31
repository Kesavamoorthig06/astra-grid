"""
ASTRA GRID - Dashboard API Endpoints
Provides comprehensive dashboard metrics and data
"""
from flask import Blueprint, jsonify, request
from app.services.dashboard_metrics_service import DashboardMetricsService
import logging

logger = logging.getLogger(__name__)

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/metrics', methods=['GET'])
def get_dashboard_metrics():
    """Get all dashboard metrics with caching"""
    try:
        metrics = DashboardMetricsService.get_cached_metrics()
        stats = DashboardMetricsService.get_summary_stats()
        
        return jsonify({
            'status': 'success',
            'data': metrics,
            'summary': stats,
            'timestamp': '2024-12-07'
        }), 200
    except Exception as e:
        logger.error(f"Dashboard metrics error: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch dashboard metrics'
        }), 500

@dashboard_bp.route('/summary', methods=['GET'])
def get_summary_stats():
    """Get summary statistics only"""
    try:
        stats = DashboardMetricsService.get_summary_stats()
        return jsonify({
            'status': 'success',
            'data': stats
        }), 200
    except Exception as e:
        logger.error(f"Summary stats error: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch summary statistics'
        }), 500

@dashboard_bp.route('/chart/<chart_type>', methods=['GET'])
def get_chart_data(chart_type):
    """Get specific chart data"""
    try:
        metrics = DashboardMetricsService.get_cached_metrics()
        
        if chart_type not in metrics:
            return jsonify({
                'status': 'error',
                'message': f'Chart type {chart_type} not found'
            }), 404
        
        return jsonify({
            'status': 'success',
            'chart_type': chart_type,
            'data': metrics[chart_type]
        }), 200
    except Exception as e:
        logger.error(f"Chart data error: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch chart data'
        }), 500

@dashboard_bp.route('/cache-clear', methods=['POST'])
def clear_cache():
    """Clear dashboard metrics cache (admin only)"""
    try:
        # TODO: Add authentication check
        DashboardMetricsService._metrics_cache = None
        DashboardMetricsService._cache_timestamp = None
        
        return jsonify({
            'status': 'success',
            'message': 'Cache cleared successfully'
        }), 200
    except Exception as e:
        logger.error(f"Cache clear error: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to clear cache'
        }), 500
