import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, Calendar, DollarSign, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

export default function History() {
  const { t } = useTranslation();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/', { replace: true });
        return;
      }

      const response = await fetch(`http://localhost:5001/api/prediction-history?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setPredictions(data.predictions);
        setTotalPages(data.pages);
      } else {
        setError(data.error || 'Failed to load history');
      }
    } catch (err) {
      setError('Connection error. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (predictionId) => {
    if (!window.confirm(t('history.confirmDelete'))) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/prediction-history/${predictionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setPredictions(predictions.filter(p => p._id !== predictionId));
      } else {
        alert(data.error || 'Failed to delete prediction');
      }
    } catch (err) {
      alert('Connection error');
    }
  };

  const formatInr = (value) => {
    if (!value || Number.isNaN(Number(value))) return '—';
    return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRiskColor = (percent) => {
    if (percent <= 5) return 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border dark:border-emerald-700/50';
    if (percent <= 15) return 'text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400 dark:border dark:border-amber-700/50';
    return 'text-rose-700 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-400 dark:border dark:border-rose-700/50';
  };

  if (loading && predictions.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Prediction History</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">View and manage all your past predictions</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {predictions.length === 0 && !loading ? (
          <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-12 text-center backdrop-blur-sm">
            <AlertTriangle className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Predictions Yet</h3>
            <p className="text-gray-500 dark:text-gray-400">Start making predictions to see your history here</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {predictions.map((prediction) => (
                <div
                  key={prediction._id}
                  className="bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/50 p-6 hover:shadow-md dark:hover:shadow-slate-700/20 transition-shadow backdrop-blur-sm cursor-pointer"
                  onClick={() => {
                    // Navigate to prediction page with this prediction data
                    navigate('/prediction', { 
                      state: { 
                        viewPrediction: {
                          cost_overrun_percent: prediction.cost_overrun_percent,
                          schedule_delay_days: prediction.schedule_delay_days,
                          predicted_cost: prediction.predicted_cost,
                          predicted_duration: prediction.predicted_duration,
                          risk_classification: prediction.risk_classification,
                          risk_analysis: prediction.risk_analysis || prediction.form_data?.risk_analysis,
                          hotspot_analysis: prediction.hotspot_analysis || prediction.form_data?.hotspot_analysis,
                          recommendations: prediction.recommendations || prediction.form_data?.recommendations
                        }
                      }
                    });
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {prediction.project_type || 'Transmission Line'}
                        </h3>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {prediction.region || '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(prediction.created_at)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(prediction._id)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                      title="Delete prediction"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="uppercase tracking-wider">Target Cost</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {formatInr(prediction.target_cost)}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="uppercase tracking-wider">Predicted Cost</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {formatInr(prediction.predicted_cost)}
                      </p>
                    </div>

                    <div className={`rounded-lg p-4 ${getRiskColor(prediction.cost_overrun_percent || 0)}`}>
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="uppercase tracking-wider font-medium">Cost Overrun</span>
                      </div>
                      <p className="text-lg font-bold">
                        {Number.isFinite(prediction.cost_overrun_percent) 
                          ? `${prediction.cost_overrun_percent.toFixed(1)}%`
                          : '—'}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="uppercase tracking-wider">Schedule Delay</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {prediction.schedule_delay_days > 0
                          ? `${prediction.schedule_delay_days.toFixed(0)} days`
                          : 'On time'}
                      </p>
                    </div>
                  </div>

                  {prediction.risk_classification && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                      <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Risk Level: </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {prediction.risk_classification}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
