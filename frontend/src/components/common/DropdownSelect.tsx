import type { ReactNode } from 'react';

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
  return (
    <div className="flex items-center gap-2">
      {label ? <span className="text-xs font-semibold text-gray-500">{label}</span> : null}
      <div className="relative">
        <select
          className="text-sm font-semibold text-gray-800 border border-gray-200 rounded-xl px-3.5 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-[170px]"
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === '' ? null : (val as T));
          }}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
