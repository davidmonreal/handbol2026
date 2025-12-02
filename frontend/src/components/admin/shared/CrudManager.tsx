import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import type { CrudConfig, FormFieldConfig } from '../../../types';

interface CrudManagerProps<T> {
    config: CrudConfig<T>;
}

export function CrudManager<T extends { id: string }>({ config }: CrudManagerProps<T>) {
    const [items, setItems] = useState<T[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [formData, setFormData] = useState<Record<string, unknown>>({});
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}${config.apiEndpoint}`);
            const data = await response.json();

            if (Array.isArray(data)) {
                setItems(data);
            } else {
                console.error('Expected array but got:', data);
                setItems([]);
                if (data.error) {
                    setError(data.error);
                }
            }
        } catch (err) {
            console.error(`Error fetching ${config.entityNamePlural}:`, err);
            setError('Failed to connect to the server. Please ensure the backend is running.');
            setItems([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const url = editingItem
                ? `${API_BASE_URL}${config.apiEndpoint}/${editingItem.id}`
                : `${API_BASE_URL}${config.apiEndpoint}`;

            const method = editingItem ? 'PUT' : 'POST';

            const dataToSend = config.formatFormData ? config.formatFormData(formData) : formData;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to save ${config.entityName}`);
            }

            fetchItems();
            handleCancel();
        } catch (err) {
            console.error(`Error saving ${config.entityName}:`, err);
            setError(err instanceof Error ? err.message : `Failed to save ${config.entityName}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(`Are you sure you want to delete this ${config.entityName}?`)) return;

        try {
            const response = await fetch(`${API_BASE_URL}${config.apiEndpoint}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to delete ${config.entityName}`);
            }
            fetchItems();
        } catch (err) {
            console.error(`Error deleting ${config.entityName}:`, err);
            setError(err instanceof Error ? err.message : `Failed to delete ${config.entityName}. Please try again.`);
        }
    };

    const handleEdit = (item: T) => {
        // Use custom edit handler if provided (e.g., navigate to page)
        if (config.onEdit) {
            config.onEdit(item);
            return;
        }

        // Default behavior: open modal
        setEditingItem(item);

        const newFormData: Record<string, unknown> = {};

        if (config.mapItemToForm) {
            const mappedData = config.mapItemToForm(item);
            Object.assign(newFormData, mappedData);
        } else {
            config.formFields.forEach((field: FormFieldConfig) => {
                newFormData[field.name] = (item as Record<string, unknown>)[field.name] ?? '';
            });
        }

        setFormData(newFormData);
        setIsFormOpen(true);
    };

    const handleCancel = () => {
        setIsFormOpen(false);
        setEditingItem(null);

        const resetData: Record<string, unknown> = {};
        config.formFields.forEach((field: FormFieldConfig) => {
            resetData[field.name] = field.type === 'checkbox' ? false : '';
        });
        setFormData(resetData);
        setError(null);
    };

    const handleFieldChange = (fieldName: string, value: unknown) => {
        const fieldConfig = config.formFields.find(f => f.name === fieldName);
        const finalValue = fieldConfig?.transform ? fieldConfig.transform(value) : value;
        setFormData(prev => ({ ...prev, [fieldName]: finalValue }));
    };

    const filteredItems = items.filter((item: T) => {
        const searchLower = searchTerm.toLowerCase();

        if (config.customFilter) {
            return config.customFilter(item, searchLower);
        }

        return config.searchFields.some((field: keyof T) => {
            const value = item[field];
            return value?.toString().toLowerCase().includes(searchLower);
        });
    });

    const renderFormField = (field: FormFieldConfig) => {
        const value = formData[field.name] ?? '';
        const fieldId = `field-${field.name}`;

        switch (field.type) {
            case 'checkbox':
                return (
                    <div key={field.name} className="flex items-center">
                        <input
                            id={fieldId}
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor={fieldId} className="ml-2 text-sm text-gray-700">{field.label}</label>
                    </div>
                );

            case 'select':
                return (
                    <div key={field.name} className="mb-4">
                        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
                            {field.label}
                        </label>
                        <select
                            id={fieldId}
                            value={value as string}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required={field.required}
                        >
                            <option value="">Select {field.label}</option>
                            {field.options?.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                );

            case 'number':
            case 'date':
            case 'text':
            default:
                return (
                    <div key={field.name} className="mb-4">
                        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
                            {field.label}
                        </label>
                        <input
                            id={fieldId}
                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                            value={value as string}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required={field.required}
                        />
                    </div>
                );
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">{config.entityNamePlural} Management</h1>
                <div className="flex gap-3">
                    {config.headerActions}
                    <button
                        onClick={() => {
                            if (config.onCreate) {
                                config.onCreate();
                            } else {
                                setIsFormOpen(true);
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={20} />
                        New {config.entityName}
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={`Search ${config.entityNamePlural.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {isFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">
                            {editingItem ? `Edit ${config.entityName}` : `New ${config.entityName}`}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            {config.formFields.map(field => renderFormField(field))}
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isLoading ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {config.columns.map(col => (
                                <th
                                    key={col.key.toString()}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {col.label}
                                </th>
                            ))}
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                {config.columns.map(col => (
                                    <td key={col.key.toString()} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key as string] ?? '')}
                                    </td>
                                ))}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {config.customActions?.map((action, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => action.onClick(item)}
                                            className={action.className || "text-gray-600 hover:text-gray-900 mr-4"}
                                            title={action.label}
                                        >
                                            <action.icon size={18} />
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredItems.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No {config.entityNamePlural.toLowerCase()} found. Create your first {config.entityName.toLowerCase()}!
                    </div>
                )}
            </div>
        </div>
    );
}
