import React from 'react';
import { BsBoxSeamFill } from 'react-icons/bs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/base-select';
import FormSection from './FormSection';
import { Slider, SliderThumb } from '../ui/slider';

export default function VendorSupplyChainSection({ formData, handleChange }) {
  return (
    <FormSection icon={BsBoxSeamFill} title="Vendor & Supply Chain" iconClassName="text-green-400">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Vendor Performance Rating: {formData.vendor_performance_rating}/5
          </label>
          <div className="flex items-center h-9">
            <Slider
              min={1}
              max={5}
              step={1}
              value={[formData.vendor_performance_rating]}
              onValueChange={(value) => handleChange('vendor_performance_rating', value[0])}
            >
              <SliderThumb />
            </Slider>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Material Availability Issue</label>
          <Select 
            value={formData.material_availability_issue || undefined}
            onValueChange={(val) => handleChange('material_availability_issue', val)}
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
