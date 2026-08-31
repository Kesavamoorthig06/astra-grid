import React from 'react';
import FormSection from './FormSection';

export default function AdditionalDataSection({ formData, handleChange }) {
  const handleInputChange = (e) => {
    handleChange(e.target.name, e.target.value);
  };

  return (
    <FormSection 
      title="" 
      description=""
    >
      {/* Conductor & Tower Specifications */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
          Conductor & Tower Specifications
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Conductor Type
            </label>
            <select
              name="conductor_type"
              value={formData.conductor_type || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
            >
              <option value="">Select conductor type...</option>
              <option value="Wolf">Wolf</option>
              <option value="Panther">Panther</option>
              <option value="Moose">Moose</option>
              <option value="Zebra">Zebra</option>
              <option value="Drake">Drake</option>
              <option value="Tern">Tern</option>
              <option value="Bersimis">Bersimis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tower Type
            </label>
            <select
              name="tower_type"
              value={formData.tower_type || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
            >
              <option value="">Select tower type...</option>
              <option value="Suspension">Suspension</option>
              <option value="Tension">Tension</option>
              <option value="Transposition">Transposition</option>
              <option value="Terminal">Terminal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Number of Circuit Type
            </label>
            <select
              name="circuit_type"
              value={formData.circuit_type || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
            >
              <option value="">Select circuit type...</option>
              <option value="Single Circuit">Single Circuit</option>
              <option value="Double Circuit">Double Circuit</option>
              <option value="Multi Circuit">Multi Circuit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tower Average Height (m)
            </label>
            <input
              type="number"
              name="tower_height"
              value={formData.tower_height || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
              placeholder="e.g., 35"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Number of Towers Required
            </label>
            <input
              type="number"
              name="number_of_towers"
              value={formData.number_of_towers || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
              placeholder="Enter count"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Electrical & Grounding Parameters */}
      <div className="space-y-4 mt-6">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
          Electrical & Grounding Parameters
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Earth Resistance Value (Ω)
            </label>
            <input
              type="number"
              name="earth_resistance"
              value={formData.earth_resistance || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
              placeholder="Soil resistivity parameter"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Wind Zone Classification
            </label>
            <select
              name="wind_zone"
              value={formData.wind_zone || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
            >
              <option value="">Select wind zone...</option>
              <option value="Zone 1">Zone 1</option>
              <option value="Zone 2">Zone 2</option>
              <option value="Zone 3">Zone 3</option>
              <option value="Zone 4">Zone 4</option>
              <option value="Zone 5">Zone 5</option>
            </select>
          </div>
        </div>
      </div>

      {/* Soil & Foundation */}
      <div className="space-y-4 mt-6">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
          Soil & Foundation
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Soil Type
            </label>
            <select
              name="soil_type"
              value={formData.soil_type || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
            >
              <option value="">Select soil type...</option>
              <option value="Black Cotton">Black Cotton</option>
              <option value="Sandy">Sandy</option>
              <option value="Rocky">Rocky</option>
              <option value="Clay">Clay</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Foundation Type
            </label>
            <select
              name="foundation_type"
              value={formData.foundation_type || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
            >
              <option value="">Select foundation type...</option>
              <option value="Pedestal">Pedestal</option>
              <option value="Chimney">Chimney</option>
              <option value="Raft">Raft</option>
              <option value="Pile">Pile</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Right-of-Way Criticality
            </label>
            <select
              name="row_criticality"
              value={formData.row_criticality || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
            >
              <option value="">Select criticality...</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Stringing Configuration
            </label>
            <select
              name="stringing_config"
              value={formData.stringing_config || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white"
            >
              <option value="">Select configuration...</option>
              <option value="ACSR Single">ACSR Single</option>
              <option value="ACSR Twin">ACSR Twin</option>
              <option value="Triple">Triple</option>
              <option value="Quad Bundle">Quad Bundle</option>
            </select>
          </div>
        </div>
      </div>


    </FormSection>
  );
}
