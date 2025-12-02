import React, { useCallback, useEffect, useState } from 'react';
import { predictRisk } from '../utils/api';
import FormErrorAlert from '../components/form/FormErrorAlert';
import ProjectBasicsSection from '../components/form/ProjectBasicsSection';
import TechnicalSpecsSection from '../components/form/TechnicalSpecsSection';
import LocationEnvironmentSection from '../components/form/LocationEnvironmentSection';
import RegulatorySection from '../components/form/RegulatorySection';
import ResourcePlanningSection from '../components/form/ResourcePlanningSection';
import VendorSupplyChainSection from '../components/form/VendorSupplyChainSection';
import PredictionResults from '../components/form/PredictionResults';
import FormSkeleton from '../components/form/FormSkeleton';
import { GradientBackground } from '@/components/ui/gradient-background';

const UNIT_MULTIPLIERS = {
  lakh: 100000,
  crore: 10000000,
};

export default function TransmissionLineForm() {
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

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

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

  const handleChange = useCallback(
    (name, value) => {
      resetFeedback();
      setFormData(prev => ({ ...prev, [name]: value }));
    },
    [resetFeedback]
  );

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
      const preview = missingFields.slice(0, 2).join(', ');
      const remainder = missingFields.length - 2;
      setSubmitError('Please complete the required information.');
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
        <div className="mb-4">
          <p className="text-sm text-black font-medium">Enter project parameters to predict cost and timeline overrun risks</p>
        </div>

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
              materialCostValue={materialCostValue}
              materialCostUnit={materialCostUnit}
              materialRupeeValue={materialRupeeValue}
              materialFormattedRupeeValue={materialFormattedRupeeValue}
              setMaterialCostValue={setMaterialCostValue}
              setMaterialCostUnit={setMaterialCostUnit}
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
              className="px-8 py-3 bg-white border-2 border-black text-black rounded-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-black hover:text-white hover:shadow-md shadow-lg"
            >
              {isSubmitting ? 'Predicting…' : 'Predict Risk Assessment'}
            </button>
          </div>

          <PredictionResults prediction={prediction} />
        </form>
      </div>
      </div>
    </div>
  );
}
