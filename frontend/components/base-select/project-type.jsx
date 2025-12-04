import { Select, SelectClear, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/base-select';
import { MdCable, MdPowerSettingsNew, MdOutlineHub } from 'react-icons/md';
import { useTranslation } from 'react-i18next';

const OPTIONS = [
  {
    labelKey: 'form.transmissionLine',
    value: 'Transmission Line',
    Icon: MdCable,
  },
  {
    labelKey: 'form.substation',
    value: 'Substation',
    Icon: MdPowerSettingsNew,
  },
  {
    labelKey: 'form.distribution',
    value: 'Distribution',
    Icon: MdOutlineHub,
  },
];

export default function ProjectTypeSelect({ value, onValueChange }) {
  const { t } = useTranslation();
  const handleValueChange = (nextValue) => {
    console.log('🎯 [ProjectTypeSelect] Value changed:', nextValue);
    console.log('🎯 [ProjectTypeSelect] Calling onValueChange...');
    onValueChange(nextValue);
  };

  const handleClear = () => {
    console.log('🎯 [ProjectTypeSelect] Clearing value');
    onValueChange('');
  };

  console.log('🎯 [ProjectTypeSelect] Rendering with value:', value);

  return (
    <Select value={value || undefined} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t('form.selectProjectType')} />
        {value && <SelectClear onClick={handleClear} />}
      </SelectTrigger>
      <SelectContent className="z-50">
        {OPTIONS.map(({ labelKey, value: optionValue, Icon }) => (
          <SelectItem key={optionValue} value={optionValue}>
            <span className="flex items-center gap-2">
              <Icon className="size-4 opacity-60" />
              <span>{t(labelKey)}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
