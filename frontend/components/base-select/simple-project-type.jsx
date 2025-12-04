import React, { useState, useRef, useEffect } from 'react';
import { MdCable, MdPowerSettingsNew, MdOutlineHub, MdClose } from 'react-icons/md';
import { ChevronDown } from 'lucide-react';

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

export default function SimpleProjectTypeSelect({ value, onValueChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = OPTIONS.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    console.log('📌 [SimpleProjectTypeSelect] Selected:', optionValue);
    onValueChange(optionValue);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    console.log('📌 [SimpleProjectTypeSelect] Cleared');
    onValueChange('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-9 px-3 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-ring flex items-center justify-between hover:bg-muted transition-colors"
      >
        <span className={`flex items-center gap-2 ${!value ? 'text-muted-foreground' : 'text-foreground'}`}>
          {selectedOption ? (
            <>
              <selectedOption.Icon className="size-4 opacity-60" />
              <span>{selectedOption.label}</span>
            </>
          ) : (
            'Select project type'
          )}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-destructive/10 rounded opacity-60 hover:opacity-100 transition-opacity"
              title="Clear selection"
            >
              <MdClose className="size-4" />
            </button>
          )}
          <ChevronDown
            className={`size-4 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                  value === option.value
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
              >
                <option.Icon className="size-4 opacity-60" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
