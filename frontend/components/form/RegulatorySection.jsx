import React from 'react';
import { HiDocumentText } from 'react-icons/hi2';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/base-select';
import FormSection from './FormSection';

export default function RegulatorySection({ formData, handleChange }) {
  return (
    <FormSection icon={HiDocumentText} title="Regulatory Factors" iconClassName="text-green-400">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">Number of Required Permits</label>
          <input
            type="number"
            value={formData.num_required_permits}
            onChange={(e) => handleChange('num_required_permits', e.target.value)}
            className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Average Permit Lag (days)</label>
          <input
            type="number"
            value={formData.average_permit_lag_days}
            onChange={(e) => handleChange('average_permit_lag_days', e.target.value)}
            className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Regulatory Hotspot Region</label>
          <Select 
            value={formData.regulatory_hotspot_region || undefined}
            onValueChange={(val) => handleChange('regulatory_hotspot_region', val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </FormSection>
  );
}
