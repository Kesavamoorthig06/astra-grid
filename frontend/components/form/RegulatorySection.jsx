import React from 'react';
import { useTranslation } from 'react-i18next';
import { HiDocumentText } from 'react-icons/hi2';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/base-select';
import FormSection from './FormSection';

const getRegulatoryLabel = (t, value) => {
  const labels = {
    'Low': t('form.low'),
    'Medium': t('form.medium'),
    'High': t('form.high'),
  };
  return labels[value] || '';
};

export default function RegulatorySection({ formData, handleChange }) {
  const { t } = useTranslation();
  return (
    <FormSection icon={HiDocumentText} title={t('simulation.regulatoryFactors')} iconClassName="text-green-400">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('simulation.requiredPermits')}</label>
          <input
            type="number"
            value={formData.num_required_permits}
            onChange={(e) => handleChange('num_required_permits', e.target.value)}
            className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('simulation.permitLag')}</label>
          <input
            type="number"
            value={formData.average_permit_lag_days}
            onChange={(e) => handleChange('average_permit_lag_days', e.target.value)}
            className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('simulation.regulatoryHotspot')}</label>
          <Select
            value={formData.regulatory_hotspot_region || undefined}
            onValueChange={(val) => handleChange('regulatory_hotspot_region', val)}
          >
            <SelectTrigger className="w-full">
              {formData.regulatory_hotspot_region ? (
                <span>{getRegulatoryLabel(t, formData.regulatory_hotspot_region)}</span>
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
