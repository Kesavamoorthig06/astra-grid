import React from 'react';
import { useTranslation } from 'react-i18next';
import { GiElectric } from 'react-icons/gi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/base-select';
import FormSection from './FormSection';

export default function TechnicalSpecsSection({ formData, handleChange }) {
  const { t } = useTranslation();
  return (
    <FormSection icon={GiElectric} title={t('simulation.technicalSpecs')} iconClassName="text-green-400">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('simulation.voltageLevel')}</label>
          <Select
            value={formData.voltage_level_kv || undefined}
            onValueChange={(val) => handleChange('voltage_level_kv', val)}
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
            value={formData.line_length_km}
            onChange={(e) => handleChange('line_length_km', e.target.value)}
            className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('simulation.numberOfBays')}</label>
          <input
            type="number"
            value={formData.number_of_bays}
            onChange={(e) => handleChange('number_of_bays', e.target.value)}
            className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
    </FormSection>
  );
}
