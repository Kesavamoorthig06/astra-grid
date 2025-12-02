import React from 'react';
import { MdElectricBolt } from 'react-icons/md';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/base-select';
import ProjectTypeSelect from '../base-select/project-type';
import FormSection from './FormSection';

export default function ProjectBasicsSection({ 
  formData, 
  targetCostValue,
  targetCostUnit,
  rupeeValue,
  formattedRupeeValue,
  handleChange,
  setTargetCostValue,
  setTargetCostUnit,
  resetFeedback
}) {
  return (
    <FormSection icon={MdElectricBolt} title="Project Basics" iconClassName="text-green-400">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">Project Type</label>
          <ProjectTypeSelect
            value={formData.project_type || ''}
            onValueChange={(val) => {
              resetFeedback();
              handleChange('project_type', val);
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Target Cost (₹)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={targetCostValue}
              onChange={(e) => {
                resetFeedback();
                setTargetCostValue(e.target.value);
              }}
              placeholder={`Enter amount in ${targetCostUnit === 'crore' ? 'Crores' : 'Lakhs'}`}
              className="w-full h-9 rounded-md border bg-background pr-28 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <Select
              value={targetCostUnit}
              onValueChange={(unit) => {
                resetFeedback();
                setTargetCostUnit(unit);
              }}
            >
              <SelectTrigger className="absolute right-1 top-1/2 h-7 w-24 -translate-y-1/2 rounded-md border border-input bg-muted/70 px-2 text-xs font-medium text-foreground shadow-none z-10">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent align="end" className="z-50">
                <SelectItem value="crore">Crores</SelectItem>
                <SelectItem value="lakh">Lakhs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {rupeeValue !== null && (
            <p className="mt-2 text-xs text-muted-foreground">
              Value in INR: ₹{formattedRupeeValue}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Target Duration (days)</label>
          <input
            type="number"
            value={formData.target_duration_days}
            onChange={(e) => handleChange('target_duration_days', e.target.value)}
            className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
    </FormSection>
  );
}
