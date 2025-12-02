import React from 'react';
import { FiUsers } from 'react-icons/fi';
import FormSection from './FormSection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/base-select';

export default function ResourcePlanningSection({
  formData,
  handleChange,
  resetFeedback,
  labourCostValue,
  labourCostUnit,
  labourRupeeValue,
  labourFormattedRupeeValue,
  setLabourCostValue,
  setLabourCostUnit,
  materialCostValue,
  materialCostUnit,
  materialRupeeValue,
  materialFormattedRupeeValue,
  setMaterialCostValue,
  setMaterialCostUnit,
}) {
  return (
    <FormSection icon={FiUsers} title="Resource Planning" iconClassName="text-green-400">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">Labour Cost Estimate (₹)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={labourCostValue}
              onChange={(e) => {
                resetFeedback();
                setLabourCostValue(e.target.value);
              }}
              placeholder={`Enter amount in ${labourCostUnit === 'crore' ? 'Crores' : 'Lakhs'}`}
              className="w-full h-9 rounded-md border bg-background pr-28 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <Select
              value={labourCostUnit}
              onValueChange={(unit) => {
                resetFeedback();
                setLabourCostUnit(unit);
              }}
            >
              <SelectTrigger className="absolute right-1 top-1/2 h-7 w-24 -translate-y-1/2 rounded-md border border-input bg-muted/70 px-2 text-xs font-medium text-foreground shadow-none z-10">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="crore">Crores</SelectItem>
                <SelectItem value="lakh">Lakhs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {labourRupeeValue !== null && (
            <p className="mt-2 text-xs text-muted-foreground">
              Value in INR: ₹{labourFormattedRupeeValue}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Material Cost Estimate (₹)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={materialCostValue}
              onChange={(e) => {
                resetFeedback();
                setMaterialCostValue(e.target.value);
              }}
              placeholder={`Enter amount in ${materialCostUnit === 'crore' ? 'Crores' : 'Lakhs'}`}
              className="w-full h-9 rounded-md border bg-background pr-28 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <Select
              value={materialCostUnit}
              onValueChange={(unit) => {
                resetFeedback();
                setMaterialCostUnit(unit);
              }}
            >
              <SelectTrigger className="absolute right-1 top-1/2 h-7 w-24 -translate-y-1/2 rounded-md border border-input bg-muted/70 px-2 text-xs font-medium text-foreground shadow-none z-10">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="crore">Crores</SelectItem>
                <SelectItem value="lakh">Lakhs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {materialRupeeValue !== null && (
            <p className="mt-2 text-xs text-muted-foreground">
              Value in INR: ₹{materialFormattedRupeeValue}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Skilled Workers Required</label>
          <input
            type="number"
            value={formData.num_skilled_workers_required}
            onChange={(e) => handleChange('num_skilled_workers_required', e.target.value)}
            className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
    </FormSection>
  );
}
