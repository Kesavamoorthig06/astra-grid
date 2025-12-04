import React from 'react';
import { useTranslation } from 'react-i18next';
import { BsBoxSeamFill } from 'react-icons/bs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/base-select';
import FormSection from './FormSection';
import { Slider, SliderThumb } from '../ui/slider';

const getMaterialAvailabilityLabel = (t, value) => {
  const labels = {
    'Low': t('form.low'),
    'Medium': t('form.medium'),
    'High': t('form.high'),
  };
  return labels[value] || '';
};

export default function VendorSupplyChainSection({ formData, handleChange }) {
  const { t } = useTranslation();
  return (
    <FormSection icon={BsBoxSeamFill} title={t('simulation.marketSupplyChain')} iconClassName="text-green-400">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {t('simulation.vendorRating')}: {formData.vendor_performance_rating}/5
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
          <label className="block text-sm font-medium mb-1.5">{t('simulation.materialAvailability')}</label>
          <Select
            value={formData.material_availability_issue || undefined}
            onValueChange={(val) => handleChange('material_availability_issue', val)}
          >
            <SelectTrigger className="w-full">
              {formData.material_availability_issue ? (
                <span>{getMaterialAvailabilityLabel(t, formData.material_availability_issue)}</span>
              ) : (
                <SelectValue placeholder={t('form.selectLevel')} />
              )}
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="Low">{t('form.low')}</SelectItem>
              <SelectItem value="Medium">{t('form.medium')}</SelectItem>
              <SelectItem value="High">{t('form.high')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </FormSection>
  );
}
