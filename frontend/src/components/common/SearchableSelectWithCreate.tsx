import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Search, X } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface SearchableSelectWithCreateProps {
    label: string;
    value: string | null;
    options: Option[];
    onChange: (value: string) => void;
    onCreate?: (searchTerm: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export const SearchableSelectWithCreate = ({
    label,
    value,
    options,
    onChange,
    onCreate,
    placeholder = 'Select...',
    disabled = false,
    className = '',
}: SearchableSelectWithCreateProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleCreate = () => {
        if (onCreate) {
            onCreate(searchTerm);
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-left cursor-default 
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                    flex justify-between items-center
                    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
                `}
            >
                <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className="text-gray-400" />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {/* Search Input */}
                    <div className="sticky top-0 z-10 bg-white px-2 py-2 border-b border-gray-100">
                        <div className="relative">
                            <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full pl-8 pr-8 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={`
                                        cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50
                                        ${option.value === value ? 'text-indigo-600 font-medium bg-indigo-50' : 'text-gray-900'}
                                    `}
                                >
                                    {option.label}
                                </div>
                            ))
                        ) : (
                            <div className="py-2 px-3 text-sm text-gray-500 italic">
                                No matches found
                            </div>
                        )}
                    </div>

                    {/* Create Option */}
                    {searchTerm && onCreate && !filteredOptions.some(opt => opt.label.toLowerCase() === searchTerm.toLowerCase()) && (
                        <div
                            onClick={handleCreate}
                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-indigo-600 hover:bg-indigo-50 border-t border-gray-100 flex items-center gap-2"
                        >
                            <Plus size={16} />
                            <span>Create "{searchTerm}"</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
