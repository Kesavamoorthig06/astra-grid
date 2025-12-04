import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GradientBackground } from '@/components/ui/gradient-background';
import FormSection from '../components/form/FormSection';
import SimulationResultsModal from '../components/form/SimulationResultsModal';
import { MdElectricBolt } from 'react-icons/md';
import { GiElectric } from 'react-icons/gi';
import { FaMapMarkedAlt, FaRegFileAlt, FaUsers, FaTruck, FaExclamationTriangle, FaChartLine } from 'react-icons/fa';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/base-select';

const SimulationPage = () => {
  const { t } = useTranslation();
  
  // Map values to translation keys for dropdown display
  const getTranslatedValue = (fieldName, value) => {
    const valueMap = {
      // Terrain Complexity
      'Terrain_Complexity_Index': {
        'Low (Plain)': 'form.plain',
        'Medium (Plateau)': 'form.plateau',
        'Moderate (Hilly)': 'form.hilly',
        'Very High (Hilly)': 'form.veryHighHilly',
      },
      // Environmental Impact
      'Environmental_Impact_Severity': {
        'Low': 'form.low',
        'Medium': 'form.medium',
        'Moderate': 'form.moderate',
        'Very High': 'form.veryHigh',
      },
      // Right of Way Delay
      'Right_of_Way_Delay_Severity': {
        'Low': 'form.low',
        'Medium': 'form.medium',
        'High': 'form.high',
      },
      // Regulatory Hotspot
      'Regulatory_Hotspot_Region': {
        'Northern Region': 'form.northernRegion',
        'Southern Region': 'form.southernRegion',
        'Eastern Region': 'form.easternRegion',
        'Western Region': 'form.westernRegion',
        'Central Region': 'form.centralRegion',
        'North-Eastern Region': 'form.northEasternRegion',
      },
      // Project Type
      'Project_Type': {
        'Transmission Line': 'form.transmissionLine',
        'Substation': 'form.substation',
        'Distribution': 'form.distribution',
        'Hybrid': 'form.hybrid',
      },
    };
    
    const translationKey = valueMap[fieldName]?.[value];
    return translationKey ? t(translationKey) : value;
  };
  const [formData, setFormData] = useState({
    Voltage_Level_kV: '',
    Line_Length_km: '',
    Number_of_Bays: '',
    Terrain_Complexity_Index: 'Low (Plain)',
    Environmental_Impact_Severity: 'Low',
    Forest_Land_Required_Ha: '',
    Num_Required_Permits: '',
    Average_Permit_Lag_Days: '',
    Right_of_Way_Delay_Severity: 'Low',
    Regulatory_Hotspot_Region: 'Northern Region',
    Labour_Cost_Estimate_INR: '',
    Material_Cost_Estimate_INR: '',
    Num_Skilled_Workers_Required: '',
    Vendor_Performance_Rating: '',
    Num_Vendor_Change_Events: '0',
    Material_Availability_Issue: 0,
    Commodity_Price_Index_Start: '',
    Commodity_Price_Change_During_Project: '',
    Historical_Local_Delay_Index: '',
    Escalation_Reason_Material: 0,
    Escalation_Reason_Regulatory: 0,
    Escalation_Reason_Manpower: 0,
    Qualitative_Risk_Score: '',
    Year: new Date().getFullYear(),
    Project_Type: 'Transmission Line',
    Target_Duration_Days: '',
    project_location: '',
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (name) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name] === 1 ? 0 : 1
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        Voltage_Level_kV: Number(formData.Voltage_Level_kV),
        Line_Length_km: Number(formData.Line_Length_km),
        Number_of_Bays: Number(formData.Number_of_Bays),
        Forest_Land_Required_Ha: Number(formData.Forest_Land_Required_Ha),
        Num_Required_Permits: Number(formData.Num_Required_Permits),
        Average_Permit_Lag_Days: Number(formData.Average_Permit_Lag_Days),
        Labour_Cost_Estimate_INR: Number(formData.Labour_Cost_Estimate_INR),
        Material_Cost_Estimate_INR: Number(formData.Material_Cost_Estimate_INR),
        Num_Skilled_Workers_Required: Number(formData.Num_Skilled_Workers_Required),
        Vendor_Performance_Rating: Number(formData.Vendor_Performance_Rating),
        Num_Vendor_Change_Events: Number(formData.Num_Vendor_Change_Events),
        Commodity_Price_Index_Start: Number(formData.Commodity_Price_Index_Start),
        Commodity_Price_Change_During_Project: Number(formData.Commodity_Price_Change_During_Project),
        Historical_Local_Delay_Index: Number(formData.Historical_Local_Delay_Index),
        Qualitative_Risk_Score: Number(formData.Qualitative_Risk_Score),
        Year: Number(formData.Year),
        Target_Duration_Days: Number(formData.Target_Duration_Days),
      };

      const response = await fetch('http://localhost:5002/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Simulation results:', data);
      
      if (data.success) {
        setResults(data);
        setShowResults(true);
      } else {
        alert('Simulation failed: ' + (data.error || 'Unknown error'));
      }
      
    } catch (error) {
      console.error('Simulation error:', error);
      alert('Failed to run simulation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <GradientBackground className="absolute inset-0 opacity-75" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-y-0 right-10 w-80 bg-gradient-radial from-blue-200/50 via-transparent to-transparent blur-2xl" />
        <div className="absolute inset-y-0 left-10 w-72 bg-gradient-radial from-emerald-200/50 via-transparent to-transparent blur-2xl" />
      </div>
      <div className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Technical Specifications */}
          <FormSection icon={GiElectric} title={t('simulation.technicalSpecs')} iconClassName="text-green-400">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.voltageLevel')}</label>
                <Select
                  value={formData.Voltage_Level_kV?.toString() || undefined}
                  onValueChange={(val) => handleChange('Voltage_Level_kV', val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('form.selectVoltage')} />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="400">{t('form.voltage400')}</SelectItem>
                    <SelectItem value="765">{t('form.voltage765')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.lineLength')}</label>
                <input
                  type="number"
                  value={formData.Line_Length_km}
                  onChange={(e) => handleChange('Line_Length_km', e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />

              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.numberOfBays')}</label>
                <input
                  type="number"
                  value={formData.Number_of_Bays}
                  onChange={(e) => handleChange('Number_of_Bays', e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />

              </div>
            </div>
          </FormSection>

          {/* Terrain & Environment */}
          <FormSection icon={FaMapMarkedAlt} title={t('simulation.terrainEnvironment')} iconClassName="text-green-400">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.terrainComplexity')}</label>
                <Select
                  value={formData.Terrain_Complexity_Index}
                  onValueChange={(val) => handleChange('Terrain_Complexity_Index', val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('form.selectLevel')} />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="Low (Plain)">{t('form.plain')}</SelectItem>
                    <SelectItem value="Medium (Plateau)">{t('form.plateau')}</SelectItem>
                    <SelectItem value="Moderate (Hilly)">{t('form.hilly')}</SelectItem>
                    <SelectItem value="Very High (Hilly)">{t('form.veryHighHilly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.environmentalImpact')}</label>
                <Select
                  value={formData.Environmental_Impact_Severity}
                  onValueChange={(val) => handleChange('Environmental_Impact_Severity', val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('form.selectLevel')} />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="Low">{t('form.low')}</SelectItem>
                    <SelectItem value="Medium">{t('form.medium')}</SelectItem>
                    <SelectItem value="Moderate">{t('form.moderate')}</SelectItem>
                    <SelectItem value="Very High">{t('form.veryHigh')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.forestLand')}</label>
                <input
                  type="number"
                  value={formData.Forest_Land_Required_Ha}
                  onChange={(e) => handleChange('Forest_Land_Required_Ha', e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />

              </div>
            </div>
          </FormSection>

          {/* Regulatory Factors */}
          <FormSection icon={FaRegFileAlt} title={t('simulation.regulatoryFactors')} iconClassName="text-green-400">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.requiredPermits')}</label>
                <input
                  type="number"
                  value={formData.Num_Required_Permits}
                  onChange={(e) => handleChange('Num_Required_Permits', e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />

              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.permitLag')}</label>
                <input
                  type="number"
                  value={formData.Average_Permit_Lag_Days}
                  onChange={(e) => handleChange('Average_Permit_Lag_Days', e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />

              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.rowDelay')}</label>
                <Select
                  value={formData.Right_of_Way_Delay_Severity}
                  onValueChange={(val) => handleChange('Right_of_Way_Delay_Severity', val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('form.selectLevel')} />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="Low">{t('form.low')}</SelectItem>
                    <SelectItem value="Medium">{t('form.medium')}</SelectItem>
                    <SelectItem value="High">{t('form.high')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.regulatoryHotspot')}</label>
                <Select
                  value={formData.Regulatory_Hotspot_Region}
                  onValueChange={(val) => handleChange('Regulatory_Hotspot_Region', val)}
                >
                  <SelectTrigger className="w-full">
                    {formData.Regulatory_Hotspot_Region ? (
                      <span>{getTranslatedValue('Regulatory_Hotspot_Region', formData.Regulatory_Hotspot_Region)}</span>
                    ) : (
                      <SelectValue placeholder={t('form.selectLevel')} />
                    )}
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="Northern Region">{t('form.northernRegion')}</SelectItem>
                    <SelectItem value="Southern Region">{t('form.southernRegion')}</SelectItem>
                    <SelectItem value="Eastern Region">{t('form.easternRegion')}</SelectItem>
                    <SelectItem value="Western Region">{t('form.westernRegion')}</SelectItem>
                    <SelectItem value="Central Region">{t('form.centralRegion')}</SelectItem>
                    <SelectItem value="North-Eastern Region">{t('form.northEasternRegion')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FormSection>

          {/* Cost Estimates */}
          <FormSection icon={FaChartLine} title={t('simulation.costEstimates')} iconClassName="text-green-400">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.labourCost')}</label>
                <input
                  type="number"
                  value={formData.Labour_Cost_Estimate_INR}
                  onChange={(e) => handleChange('Labour_Cost_Estimate_INR', e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('simulation.materialCost')}
                  <span className="text-amber-400 text-xs ml-2">{t('simulation.materialCostImpact')}</span>
                </label>
                <input
                  type="number"
                  value={formData.Material_Cost_Estimate_INR}
                  onChange={(e) => handleChange('Material_Cost_Estimate_INR', e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
            </div>
          </FormSection>

          {/* Resource Planning */}
          <FormSection icon={FaUsers} title={t('simulation.resourcePlanning')} iconClassName="text-green-400">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.skilledWorkers')}</label>
                <input
                  type="number"
                  value={formData.Num_Skilled_Workers_Required}
                  onChange={(e) => handleChange('Num_Skilled_Workers_Required', e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />

              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.vendorRating')}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.Vendor_Performance_Rating}
                  onChange={(e) => handleChange('Vendor_Performance_Rating', e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />

              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.vendorChanges')}</label>
                <input
                  type="number"
                  value={formData.Num_Vendor_Change_Events}
                  onChange={(e) => handleChange('Num_Vendor_Change_Events', e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />

              </div>
            </div>
          </FormSection>

          {/* Market & Supply Chain Risk */}
          <FormSection icon={FaTruck} title={t('simulation.marketSupplyChain')} iconClassName="text-green-400">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.Material_Availability_Issue === 1}
                    onChange={() => handleCheckboxChange('Material_Availability_Issue')}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">{t('simulation.materialAvailability')}</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.commodityPriceStart')}</label>
                <input
                  type="number"
                  value={formData.Commodity_Price_Index_Start}
                  onChange={(e) => handleChange('Commodity_Price_Index_Start', e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />

              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.commodityPriceChange')}</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.Commodity_Price_Change_During_Project}
                  onChange={(e) => handleChange('Commodity_Price_Change_During_Project', e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />

              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('simulation.historicalDelay')}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.Historical_Local_Delay_Index}
                  onChange={(e) => handleChange('Historical_Local_Delay_Index', e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  required
                />

              </div>
            </div>
          </FormSection>

          </div>

          {/* Escalation Reasons & Project Details - Full Width Section */}
          <FormSection icon={FaExclamationTriangle} title={t('simulation.escalationReasons')} iconClassName="text-green-400">
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10">
              {/* Escalation Reasons Column */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold mb-2">{t('simulation.escalationReasons')}</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.Escalation_Reason_Material === 1}
                    onChange={() => handleCheckboxChange('Escalation_Reason_Material')}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">{t('simulation.escalationMaterial')}</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.Escalation_Reason_Regulatory === 1}
                    onChange={() => handleCheckboxChange('Escalation_Reason_Regulatory')}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">{t('simulation.escalationRegulatory')}</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.Escalation_Reason_Manpower === 1}
                    onChange={() => handleCheckboxChange('Escalation_Reason_Manpower')}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">
                    {t('simulation.escalationManpower')}
                    <span className="text-red-400 text-xs ml-2">{t('simulation.manpowerImpactDelay')}</span>
                  </span>
                </label>
              </div>

              {/* Project Details Column - 3 column grid for wider layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('simulation.riskScore')}</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.Qualitative_Risk_Score}
                    onChange={(e) => handleChange('Qualitative_Risk_Score', e.target.value)}
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                    required
                  />

                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('simulation.projectYear')}</label>
                  <input
                    type="number"
                    value={formData.Year}
                    onChange={(e) => handleChange('Year', e.target.value)}
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                    required
                  />

                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t('simulation.targetDuration')}</label>
                  <input
                    type="number"
                    value={formData.Target_Duration_Days}
                    onChange={(e) => handleChange('Target_Duration_Days', e.target.value)}
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                    required
                  />

                </div>
                
                <div className="md:col-span-2 xl:col-span-1">
                  <label className="block text-sm font-medium mb-1.5">{t('simulation.projectType')}</label>
                  <Select
                    value={formData.Project_Type}
                    onValueChange={(val) => handleChange('Project_Type', val)}
                  >
                    <SelectTrigger className="w-full">
                      {formData.Project_Type ? (
                        <span>{getTranslatedValue('Project_Type', formData.Project_Type)}</span>
                      ) : (
                        <SelectValue placeholder={t('form.selectProjectType')} />
                      )}
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="Transmission Line">{t('form.transmissionLine')}</SelectItem>
                      <SelectItem value="Substation">{t('form.substation')}</SelectItem>
                      <SelectItem value="Hybrid">{t('form.hybrid')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">
                    {t('simulation.projectLocationWeather')}
                    <span className="text-muted-foreground text-xs ml-2">{t('form.optional')}</span>
                  </label>
                  <input
                    type="text"
                    value={formData.project_location}
                    onChange={(e) => handleChange('project_location', e.target.value)}
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  />

                </div>
              </div>
            </div>
          </FormSection>

          {/* Submit Button */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-white dark:bg-black border-[3px] border-gray-300 dark:border-gray-700 text-black dark:text-white rounded-md font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:shadow-md shadow-lg"
            >
              {loading ? t('simulation.simulating') : t('simulation.simulate')}
            </button>
          </div>
          </form>
        </div>
      </div>

      {/* Results Modal */}
      <SimulationResultsModal 
        results={results} 
        open={showResults} 
        onClose={handleCloseResults} 
      />
    </div>
  );
};

export default SimulationPage;
