import React from 'react';
import { useTranslation } from 'react-i18next';
import { TbWorldLatitude } from 'react-icons/tb';
import FormSection from './FormSection';
import { Slider, SliderThumb } from '../ui/slider';

export default function LocationEnvironmentSection({ formData, handleChange }) {
  const { t } = useTranslation();
  return (
    <FormSection icon={TbWorldLatitude} title={t('simulation.terrainEnvironment')} iconClassName="text-green-400">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {t('simulation.terrainComplexity')}: {formData.terrain_complexity_index}/10
          </label>
          <div className="flex items-center h-9">
            <Slider
              min={1}
              max={10}
              step={1}
              value={[formData.terrain_complexity_index]}
              onValueChange={(value) => handleChange('terrain_complexity_index', value[0])}
            >
              <SliderThumb />
            </Slider>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            {t('simulation.environmentalImpact')}: {formData.environmental_impact_severity}/5
          </label>
          <div className="flex items-center h-9">
            <Slider
              min={1}
              max={5}
              step={1}
              value={[formData.environmental_impact_severity]}
              onValueChange={(value) => handleChange('environmental_impact_severity', value[0])}
            >
              <SliderThumb />
            </Slider>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('simulation.forestLand')}</label>
            <input
              type="number"
              value={formData.forest_land_required_ha}
              onChange={(e) => handleChange('forest_land_required_ha', e.target.value)}
              className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t('simulation.annualRainfall')}</label>
            <input
              type="number"
              value={formData.annual_rainfall_mm}
              onChange={(e) => handleChange('annual_rainfall_mm', e.target.value)}
              className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
}
