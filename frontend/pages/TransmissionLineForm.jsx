import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { predictRisk } from '../utils/api';
import FormErrorAlert from '../components/form/FormErrorAlert';
import ProjectBasicsSection from '../components/form/ProjectBasicsSection';
import TechnicalSpecsSection from '../components/form/TechnicalSpecsSection';
import LocationEnvironmentSection from '../components/form/LocationEnvironmentSection';
import RegulatorySection from '../components/form/RegulatorySection';
import ResourcePlanningSection from '../components/form/ResourcePlanningSection';
import VendorSupplyChainSection from '../components/form/VendorSupplyChainSection';
import PredictionResultsModal from '../components/form/PredictionResults';
import FormSkeleton from '../components/form/FormSkeleton';
import { GradientBackground } from '@/components/ui/gradient-background';

const UNIT_MULTIPLIERS = {
  lakh: 100000,
  crore: 10000000,
};

const HISTORY_STORAGE_KEY = 'astra-grid:prediction-history';
const HISTORY_LIMIT = 8;

const AUTOFILL_PRESETS = [
  {
    name: 'Urban 220kV Short Line',
    data: {
      project_type: 'Transmission Line',
      target_cost_inr: 45 * 10000000,
      target_duration_days: 365,
      voltage_level_kv: 220,
      line_length_km: 25,
      number_of_bays: 4,
      terrain_complexity_index: 3,
      environmental_impact_severity: 2,
      forest_land_required_ha: 5,
      annual_rainfall_mm: 1200,
      num_required_permits: 8,
      average_permit_lag_days: 45,
      regulatory_hotspot_region: 'Low',
      labour_cost_estimate_inr: 12 * 10000000,
      material_cost_estimate_inr: 28 * 10000000,
      num_skilled_workers_required: 150,
      vendor_performance_rating: 4,
      material_availability_issue: 'Low',
    }
  },
  {
    name: 'Rural 400kV Long Line',
    data: {
      project_type: 'Transmission Line',
      target_cost_inr: 180 * 10000000,
      target_duration_days: 730,
      voltage_level_kv: 400,
      line_length_km: 120,
      number_of_bays: 8,
      terrain_complexity_index: 7,
      environmental_impact_severity: 5,
      forest_land_required_ha: 45,
      annual_rainfall_mm: 2500,
      num_required_permits: 18,
      average_permit_lag_days: 90,
      regulatory_hotspot_region: 'High',
      labour_cost_estimate_inr: 55 * 10000000,
      material_cost_estimate_inr: 110 * 10000000,
      num_skilled_workers_required: 450,
      vendor_performance_rating: 3,
      material_availability_issue: 'High',
    }
  },
  {
    name: 'Coastal 132kV Medium Line',
    data: {
      project_type: 'Transmission Line',
      target_cost_inr: 65 * 10000000,
      target_duration_days: 450,
      voltage_level_kv: 132,
      line_length_km: 40,
      number_of_bays: 5,
      terrain_complexity_index: 5,
      environmental_impact_severity: 6,
      forest_land_required_ha: 12,
      annual_rainfall_mm: 3200,
      num_required_permits: 12,
      average_permit_lag_days: 60,
      regulatory_hotspot_region: 'Medium',
      labour_cost_estimate_inr: 18 * 10000000,
      material_cost_estimate_inr: 42 * 10000000,
      num_skilled_workers_required: 220,
      vendor_performance_rating: 4,
      material_availability_issue: 'Low',
    }
  },
  {
    name: 'Mountain 765kV Complex',
    data: {
      project_type: 'Transmission Line',
      target_cost_inr: 350 * 10000000,
      target_duration_days: 1095,
      voltage_level_kv: 765,
      line_length_km: 200,
      number_of_bays: 12,
      terrain_complexity_index: 9,
      environmental_impact_severity: 8,
      forest_land_required_ha: 85,
      annual_rainfall_mm: 1800,
      num_required_permits: 25,
      average_permit_lag_days: 120,
      regulatory_hotspot_region: 'High',
      labour_cost_estimate_inr: 95 * 10000000,
      material_cost_estimate_inr: 220 * 10000000,
      num_skilled_workers_required: 750,
      vendor_performance_rating: 2,
      material_availability_issue: 'High',
    }
  },
  {
    name: 'Desert 220kV Standard',
    data: {
      project_type: 'Transmission Line',
      target_cost_inr: 85 * 10000000,
      target_duration_days: 540,
      voltage_level_kv: 220,
      line_length_km: 60,
      number_of_bays: 6,
      terrain_complexity_index: 6,
      environmental_impact_severity: 4,
      forest_land_required_ha: 2,
      annual_rainfall_mm: 400,
      num_required_permits: 10,
      average_permit_lag_days: 50,
      regulatory_hotspot_region: 'Medium',
      labour_cost_estimate_inr: 24 * 10000000,
      material_cost_estimate_inr: 55 * 10000000,
      num_skilled_workers_required: 280,
      vendor_performance_rating: 3,
      material_availability_issue: 'Low',
    }
  },
  {
    name: 'Metro 400kV Urban',
    data: {
      project_type: 'Substation',
      target_cost_inr: 125 * 10000000,
      target_duration_days: 600,
      voltage_level_kv: 400,
      line_length_km: 55,
      number_of_bays: 7,
      terrain_complexity_index: 4,
      environmental_impact_severity: 3,
      forest_land_required_ha: 8,
      annual_rainfall_mm: 1400,
      num_required_permits: 15,
      average_permit_lag_days: 75,
      regulatory_hotspot_region: 'High',
      labour_cost_estimate_inr: 38 * 10000000,
      material_cost_estimate_inr: 78 * 10000000,
      num_skilled_workers_required: 380,
      vendor_performance_rating: 4,
      material_availability_issue: 'Low',
    }
  },
  {
    name: 'Plain 132kV Quick Build',
    data: {
      project_type: 'Distribution',
      target_cost_inr: 35 * 10000000,
      target_duration_days: 270,
      voltage_level_kv: 132,
      line_length_km: 18,
      number_of_bays: 3,
      terrain_complexity_index: 2,
      environmental_impact_severity: 2,
      forest_land_required_ha: 3,
      annual_rainfall_mm: 900,
      num_required_permits: 6,
      average_permit_lag_days: 30,
      regulatory_hotspot_region: 'Low',
      labour_cost_estimate_inr: 9 * 10000000,
      material_cost_estimate_inr: 22 * 10000000,
      num_skilled_workers_required: 120,
      vendor_performance_rating: 5,
      material_availability_issue: 'Low',
    }
  },
  {
    name: 'Flood Zone 220kV',
    data: {
      project_type: 'Transmission Line',
      target_cost_inr: 95 * 10000000,
      target_duration_days: 620,
      voltage_level_kv: 220,
      line_length_km: 70,
      number_of_bays: 7,
      terrain_complexity_index: 6,
      environmental_impact_severity: 7,
      forest_land_required_ha: 22,
      annual_rainfall_mm: 3800,
      num_required_permits: 14,
      average_permit_lag_days: 85,
      regulatory_hotspot_region: 'High',
      labour_cost_estimate_inr: 28 * 10000000,
      material_cost_estimate_inr: 60 * 10000000,
      num_skilled_workers_required: 320,
      vendor_performance_rating: 3,
      material_availability_issue: 'High',
    }
  },
  {
    name: 'Industrial 400kV High-Load',
    data: {
      project_type: 'Substation',
      target_cost_inr: 210 * 10000000,
      target_duration_days: 820,
      voltage_level_kv: 400,
      line_length_km: 145,
      number_of_bays: 10,
      terrain_complexity_index: 5,
      environmental_impact_severity: 5,
      forest_land_required_ha: 38,
      annual_rainfall_mm: 1100,
      num_required_permits: 20,
      average_permit_lag_days: 100,
      regulatory_hotspot_region: 'Medium',
      labour_cost_estimate_inr: 62 * 10000000,
      material_cost_estimate_inr: 135 * 10000000,
      num_skilled_workers_required: 560,
      vendor_performance_rating: 3,
      material_availability_issue: 'Medium',
    }
  },
  {
    name: 'Hill Station 132kV Challenging',
    data: {
      project_type: 'Distribution',
      target_cost_inr: 72 * 10000000,
      target_duration_days: 510,
      voltage_level_kv: 132,
      line_length_km: 48,
      number_of_bays: 5,
      terrain_complexity_index: 8,
      environmental_impact_severity: 6,
      forest_land_required_ha: 28,
      annual_rainfall_mm: 2200,
      num_required_permits: 13,
      average_permit_lag_days: 70,
      regulatory_hotspot_region: 'High',
      labour_cost_estimate_inr: 22 * 10000000,
      material_cost_estimate_inr: 45 * 10000000,
      num_skilled_workers_required: 240,
      vendor_performance_rating: 3,
      material_availability_issue: 'High',
    }
  },
];

const formatInrCompact = (value) => {
  if (!value || Number.isNaN(Number(value))) return '—';
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}`;
};

const getHistoryTone = (costPercent = 0) => {
  if (costPercent <= 5) return 'text-emerald-600';
  if (costPercent <= 15) return 'text-amber-600';
  return 'text-rose-600';
};

const formatHistoryDate = (timestamp) => {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function TransmissionLineForm() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    // Project Basics
    project_type: '',
    target_cost_inr: '',
    target_duration_days: '',
    
    // Technical Specifications
    voltage_level_kv: '',
    line_length_km: '',
    number_of_bays: '',
    
    // Location & Environment
    terrain_complexity_index: 5,
    environmental_impact_severity: 3,
    forest_land_required_ha: '',
    annual_rainfall_mm: '',
    
    // Regulatory Factors
    num_required_permits: '',
    average_permit_lag_days: '',
    regulatory_hotspot_region: '',
    
    // Resource Planning
    labour_cost_estimate_inr: '',
    material_cost_estimate_inr: '',
    num_skilled_workers_required: '',
    
    // Vendor & Supply Chain
    vendor_performance_rating: 3,
    material_availability_issue: '',
  });

  const [targetCostValue, setTargetCostValue] = useState('');
  const [targetCostUnit, setTargetCostUnit] = useState('crore');
  const [labourCostValue, setLabourCostValue] = useState('');
  const [labourCostUnit, setLabourCostUnit] = useState('crore');
  const [materialCostValue, setMaterialCostValue] = useState('');
  const [materialCostUnit, setMaterialCostUnit] = useState('crore');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Check if coming from history page with prediction data
  useEffect(() => {
    if (location.state?.viewPrediction) {
      setPrediction(location.state.viewPrediction);
      setIsResultsModalOpen(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const resetFeedback = useCallback(() => {
    setSubmitError('');
    setPrediction(null);
  }, []);

  const multiplier = UNIT_MULTIPLIERS[targetCostUnit] ?? 1;
  const parsedCost = parseFloat(targetCostValue);
  const rupeeValue =
    targetCostValue && !Number.isNaN(parsedCost) ? parsedCost * multiplier : null;
  const formattedRupeeValue =
    rupeeValue === null ? '' : new Intl.NumberFormat('en-IN').format(Math.round(rupeeValue));

  const labourMultiplier = UNIT_MULTIPLIERS[labourCostUnit] ?? 1;
  const labourParsed = parseFloat(labourCostValue);
  const labourRupeeValue =
    labourCostValue && !Number.isNaN(labourParsed) ? labourParsed * labourMultiplier : null;
  const labourFormattedRupeeValue =
    labourRupeeValue === null
      ? ''
      : new Intl.NumberFormat('en-IN').format(Math.round(labourRupeeValue));

  const materialMultiplier = UNIT_MULTIPLIERS[materialCostUnit] ?? 1;
  const materialParsed = parseFloat(materialCostValue);
  const materialRupeeValue =
    materialCostValue && !Number.isNaN(materialParsed) ? materialParsed * materialMultiplier : null;
  const materialFormattedRupeeValue =
    materialRupeeValue === null
      ? ''
      : new Intl.NumberFormat('en-IN').format(Math.round(materialRupeeValue));

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      target_cost_inr: rupeeValue === null ? '' : Math.round(rupeeValue),
    }));
  }, [rupeeValue]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      labour_cost_estimate_inr: labourRupeeValue === null ? '' : Math.round(labourRupeeValue),
    }));
  }, [labourRupeeValue]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      material_cost_estimate_inr: materialRupeeValue === null ? '' : Math.round(materialRupeeValue),
    }));
  }, [materialRupeeValue]);

  const handleTargetCostChange = useCallback((value, unit) => {
    setTargetCostValue(value);
    setTargetCostUnit(unit);
  }, []);

  const handleLabourCostChange = useCallback((value, unit) => {
    setLabourCostValue(value);
    setLabourCostUnit(unit);
  }, []);

  const handleMaterialCostChange = useCallback((value, unit) => {
    setMaterialCostValue(value);
    setMaterialCostUnit(unit);
  }, []);

  const handleChange = useCallback(
    (name, value) => {
      resetFeedback();
      setFormData(prev => ({ ...prev, [name]: value }));
    },
    [resetFeedback]
  );

  const handleAutofill = useCallback((preset) => {
    const data = preset.data;
    
    // Update ALL state in a batch
    setFormData({
      project_type: data.project_type || '',
      target_cost_inr: data.target_cost_inr || '',
      target_duration_days: data.target_duration_days || '',
      voltage_level_kv: data.voltage_level_kv || '',
      line_length_km: data.line_length_km || '',
      number_of_bays: data.number_of_bays || '',
      terrain_complexity_index: data.terrain_complexity_index || 5,
      environmental_impact_severity: data.environmental_impact_severity || 3,
      forest_land_required_ha: data.forest_land_required_ha || '',
      annual_rainfall_mm: data.annual_rainfall_mm || '',
      num_required_permits: data.num_required_permits || '',
      average_permit_lag_days: data.average_permit_lag_days || '',
      regulatory_hotspot_region: data.regulatory_hotspot_region || '',
      labour_cost_estimate_inr: data.labour_cost_estimate_inr || '',
      material_cost_estimate_inr: data.material_cost_estimate_inr || '',
      num_skilled_workers_required: data.num_skilled_workers_required || '',
      vendor_performance_rating: data.vendor_performance_rating || 3,
      material_availability_issue: data.material_availability_issue || '',
    });
    
    // Set the visual unit values for cost inputs
    setTargetCostValue((data.target_cost_inr / 10000000).toString());
    setTargetCostUnit('crore');
    setLabourCostValue((data.labour_cost_estimate_inr / 10000000).toString());
    setLabourCostUnit('crore');
    setMaterialCostValue((data.material_cost_estimate_inr / 10000000).toString());
    setMaterialCostUnit('crore');
    
    resetFeedback();
  }, [resetFeedback]);

  // Listen for autofill events from navbar
  useEffect(() => {
    const handleAutofillEvent = (event) => {
      handleAutofill(event.detail);
    };
    
    window.addEventListener('autofill-form', handleAutofillEvent);
    
    return () => {
      window.removeEventListener('autofill-form', handleAutofillEvent);
    };
  }, [handleAutofill]);

  // Check if navigated with autofill preset
  useEffect(() => {
    if (location.state?.autofillPreset) {
      handleAutofill(location.state.autofillPreset);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, handleAutofill]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setHistory(parsed);
      }
    } catch (error) {
      console.warn('Failed to read prediction history', error);
    }
  }, []);

  const recordHistory = useCallback(async (inputPayload, result) => {
    if (!result) return;

    const entry = {
      id: `${Date.now()}`,
      projectType: inputPayload.project_type || 'Transmission Line',
      targetCost: Number(inputPayload.target_cost_inr) || null,
      costOverrunPercent: Number(result.cost_overrun_percent) || 0,
      scheduleDelayDays: Number(result.schedule_delay_days) || 0,
      region: inputPayload.regulatory_hotspot_region || 'Not specified',
      createdAt: new Date().toISOString(),
    };

    // Update local state and localStorage
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, HISTORY_LIMIT);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });

    // Save to backend
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('http://localhost:5001/api/prediction-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            project_type: inputPayload.project_type,
            region: inputPayload.regulatory_hotspot_region,
            target_cost: Number(inputPayload.target_cost_inr),
            cost_overrun_percent: Number(result.cost_overrun_percent),
            schedule_delay_days: Number(result.schedule_delay_days),
            predicted_cost: Number(result.predicted_cost),
            predicted_duration: Number(result.predicted_duration),
            risk_classification: result.risk_classification,
            risk_analysis: result.risk_analysis,
            hotspot_analysis: result.hotspot_analysis,
            recommendations: result.recommendations,
            form_data: inputPayload,
          }),
        });
      }
    } catch (error) {
      console.warn('Failed to save prediction to backend:', error);
    }
  }, []);

  const recentHistory = useMemo(() => history.slice(0, 3), [history]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isBlank = (value) => value === null || value === undefined || value === '';
    const requiresPositive = [
      ['target_duration_days', 'Target duration (days)'],
      ['line_length_km', 'Line length (km)'],
      ['number_of_bays', 'Number of bays'],
      ['labour_cost_estimate_inr', 'Labour cost estimate'],
      ['material_cost_estimate_inr', 'Material cost estimate'],
      ['num_skilled_workers_required', 'Skilled workers required'],
    ];

    const missingFields = [];

    if (!formData.project_type) {
      missingFields.push('Project type');
    }

    const costNumeric = Number(targetCostValue);
    if (
      isBlank(targetCostValue) ||
      Number.isNaN(costNumeric) ||
      costNumeric <= 0
    ) {
      missingFields.push('Target cost');
    }

    requiresPositive.forEach(([key, label]) => {
      const raw = formData[key];
      const parsed = Number(raw);
      if (isBlank(raw) || Number.isNaN(parsed) || parsed <= 0) {
        missingFields.push(label);
      }
    });

    const requiredPresence = [
      ['voltage_level_kv', 'Voltage level'],
      ['forest_land_required_ha', 'Forest land required (ha)'],
      ['annual_rainfall_mm', 'Annual rainfall (mm)'],
      ['num_required_permits', 'Number of required permits'],
      ['average_permit_lag_days', 'Average permit lag (days)'],
      ['regulatory_hotspot_region', 'Regulatory hotspot region'],
      ['material_availability_issue', 'Material availability issue'],
    ];

    requiredPresence.forEach(([key, label]) => {
      if (isBlank(formData[key])) {
        missingFields.push(label);
      }
    });

    if (missingFields.length > 0) {
      setPrediction(null);
      console.log('Missing fields:', missingFields);
      setSubmitError(`Missing: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setPrediction(null);

    const numericFields = [
      'target_cost_inr',
      'target_duration_days',
      'voltage_level_kv',
      'line_length_km',
      'number_of_bays',
      'forest_land_required_ha',
      'annual_rainfall_mm',
      'num_required_permits',
      'average_permit_lag_days',
      'labour_cost_estimate_inr',
      'material_cost_estimate_inr',
      'num_skilled_workers_required',
      'terrain_complexity_index',
      'environmental_impact_severity',
      'vendor_performance_rating',
    ];

    const payload = { ...formData };
    numericFields.forEach((key) => {
      const value = formData[key];
      const parsed = Number(value);
      payload[key] = Number.isFinite(parsed) ? parsed : 0;
    });

    try {
      const response = await predictRisk(payload);
      if (!response?.success) {
        throw new Error(response?.error || 'Prediction failed');
      }
      setPrediction(response.data);
      setIsResultsModalOpen(true);
      recordHistory(payload, response.data);
    } catch (err) {
      setPrediction(null);
      setSubmitError(err.message || 'Failed to fetch prediction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <FormSkeleton />;
  }

  return (  
    <div className="relative min-h-screen overflow-hidden">
      <GradientBackground className="absolute inset-0 opacity-75" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-y-0 right-10 w-80 bg-gradient-radial from-blue-200/50 via-transparent to-transparent blur-2xl" />
        <div className="absolute inset-y-0 left-10 w-72 bg-gradient-radial from-emerald-200/50 via-transparent to-transparent blur-2xl" />
      </div>
      <div className="relative z-10 p-4">
        <FormErrorAlert 
          error={submitError} 
          onDismiss={() => setSubmitError('')} 
        />

        <div className="max-w-7xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ProjectBasicsSection
              formData={formData}
              targetCostValue={targetCostValue}
              targetCostUnit={targetCostUnit}
              rupeeValue={rupeeValue}
              formattedRupeeValue={formattedRupeeValue}
              handleChange={handleChange}
              setTargetCostValue={setTargetCostValue}
              setTargetCostUnit={setTargetCostUnit}
              onTargetCostChange={handleTargetCostChange}
              resetFeedback={resetFeedback}
            />

            <TechnicalSpecsSection 
              formData={formData}
              handleChange={handleChange}
            />

            <LocationEnvironmentSection 
              formData={formData}
              handleChange={handleChange}
            />

            <RegulatorySection 
              formData={formData}
              handleChange={handleChange}
            />

            <ResourcePlanningSection 
              formData={formData}
              handleChange={handleChange}
              resetFeedback={resetFeedback}
              labourCostValue={labourCostValue}
              labourCostUnit={labourCostUnit}
              labourRupeeValue={labourRupeeValue}
              labourFormattedRupeeValue={labourFormattedRupeeValue}
              setLabourCostValue={setLabourCostValue}
              setLabourCostUnit={setLabourCostUnit}
              onLabourCostChange={handleLabourCostChange}
              materialCostValue={materialCostValue}
              materialCostUnit={materialCostUnit}
              materialRupeeValue={materialRupeeValue}
              materialFormattedRupeeValue={materialFormattedRupeeValue}
              setMaterialCostValue={setMaterialCostValue}
              setMaterialCostUnit={setMaterialCostUnit}
              onMaterialCostChange={handleMaterialCostChange}
            />

            <VendorSupplyChainSection 
              formData={formData}
              handleChange={handleChange}
            />
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-white dark:bg-black border-[3px] border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-md font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:shadow-md shadow-lg"
            >
              {isSubmitting ? t('form.predicting') : t('form.predictRisk')}
            </button>
          </div>

          <PredictionResultsModal 
            prediction={prediction} 
            open={isResultsModalOpen}
            onClose={() => setIsResultsModalOpen(false)}
          />
        </form>
      </div>
      </div>
    </div>
  );
}
