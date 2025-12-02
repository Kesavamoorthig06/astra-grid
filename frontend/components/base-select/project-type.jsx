import { Select, SelectClear, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/base-select';
import { MdCable, MdPowerSettingsNew, MdOutlineHub } from 'react-icons/md';

const OPTIONS = [
  {
    label: 'Transmission Line',
    value: 'Transmission Line',
    Icon: MdCable,
  },
  {
    label: 'Substation',
    value: 'Substation',
    Icon: MdPowerSettingsNew,
  },
  {
    label: 'Distribution',
    value: 'Distribution',
    Icon: MdOutlineHub,
  },
];

export default function ProjectTypeSelect({ value, onValueChange }) {
  const handleValueChange = (nextValue) => {
    onValueChange(nextValue);
  };

  const handleClear = () => {
    onValueChange('');
  };

  return (
    <Select value={value || undefined} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select project type" />
        {value && <SelectClear onClick={handleClear} />}
      </SelectTrigger>
      <SelectContent className="z-50">
        {OPTIONS.map(({ label, value: optionValue, Icon }) => (
          <SelectItem key={optionValue} value={optionValue}>
            <span className="flex items-center gap-2">
              <Icon className="size-4 opacity-60" />
              <span>{label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
