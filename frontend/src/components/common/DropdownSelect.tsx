import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownSelectOption<T> {
  label: string;
  value: T;
}

interface DropdownSelectProps<T> {
  label?: ReactNode;
  options: DropdownSelectOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  placeholder?: string;
}

export function DropdownSelect<T extends string | number>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
}: DropdownSelectProps<T>) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => options.find((opt) => opt.value === value), [options, value]);

  return (
    <div className="flex items-center gap-2">
      {label ? <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">{label}</span> : null}
      <div
        className="relative"
        tabIndex={0}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-sm font-semibold text-gray-800 border border-gray-200 rounded-xl px-3.5 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-[170px] flex items-center justify-between gap-2"
        >
          <span className="truncate">{selected?.label || placeholder}</span>
          <ChevronDown size={16} className="text-gray-500" />
        </button>
        {open && (
          <div className="absolute right-0 mt-1 w-full min-w-[190px] z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <button
              type="button"
              className={`w-full text-left px-3.5 py-2 text-sm font-medium ${
                !value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              {placeholder}
            </button>
            <div className="max-h-56 overflow-y-auto py-1">
              {options.map((opt) => {
                const isActive = opt.value === value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    className={`w-full text-left px-3.5 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-800 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
