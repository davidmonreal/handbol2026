import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import type { CrudConfig, FormFieldConfig } from '../../../types';
import { LoadingTable, ErrorMessage, ConfirmationModal } from '../../common';


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
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; itemId: string | null }>({ isOpen: false, itemId: null });

    // Pagination state
    const [page, setPage] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [isMoreLoading, setIsMoreLoading] = useState(false);
    const PAGE_SIZE = 20;

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        setPage(0); // Reset page on search term change
        // Only fetch from server if we don't have all items already loaded
        // If all items are loaded (serverFilters applied + totalItems <= items.length), filter client-side
        const allItemsLoaded = config.pagination && config.serverFilters && items.length > 0 && items.length >= totalItems;
        if (!allItemsLoaded) {
            fetchItems(false, 0); // Fetch initial data or new search results with explicit page 0
        }
        // If allItemsLoaded, we skip fetch and filteredItems will handle client-side filtering
    }, [debouncedSearchTerm]);

    useEffect(() => {
        // Only load more if page is incremented and not the initial load (page 0)
        if (page > 0) {
            fetchItems(true);
        }
    }, [page]);

    const fetchItems = async (isLoadMore = false, pageOverride?: number) => {
        const currentPage = pageOverride ?? page;

        // Prevent double fetching on initial load since searchTerm effect runs too
        // If not loading more, and page is already > 0, it means a search term change
        // or initial load has already triggered a fetch for page 0.
        if (!isLoadMore && currentPage > 0) return;

        try {
            if (isLoadMore) {
                setIsMoreLoading(true);
            } else {
                setError(null);
                // Only show full loading on truly initial load (component mount), not on search changes
                // This prevents the search input from being unmounted and losing focus
                if (items.length === 0 && !debouncedSearchTerm) setIsInitialLoading(true);
            }

            let url = `${API_BASE_URL}${config.apiEndpoint}`;

            if (config.pagination) {
                const skip = currentPage * PAGE_SIZE;
                const params = new URLSearchParams();
                params.append('skip', skip.toString());
                params.append('take', PAGE_SIZE.toString());
                if (debouncedSearchTerm) {
                    params.append('search', debouncedSearchTerm);
                }
                // Add server-side filters (e.g., clubId)
                if (config.serverFilters) {
                    Object.entries(config.serverFilters).forEach(([key, value]) => {
                        if (value) params.append(key, value);
                    });
                }
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (config.pagination) {
                // Expect { data: [], total: number }
                if (data.data && Array.isArray(data.data)) {
                    if (isLoadMore) {
                        setItems(prev => [...prev, ...data.data]);
                    } else {
                        setItems(data.data);
                    }
                    setTotalItems(data.total || 0);
                } else {
                    // Fallback or error
                    console.error('Expected paginated result but got:', data);
                    setItems([]);
                    setTotalItems(0);
                }
            } else {
                // Legacy behavior (no pagination)
                if (Array.isArray(data)) {
                    // Client-side filtering if search is active (legacy behavior was handled by client after fetch? 
                    // No, existing code filtered client side in render via filteredItems.
                    // So we just set items here.
                    setItems(data);
                    setTotalItems(data.length); // For non-paginated, total is just current items length
                } else {
                    console.error('Expected array but got:', data);
                    setItems([]);
                    setTotalItems(0);
                    if (data.error) setError(data.error);
                }
            }
        } catch (err) {
            console.error(`Error fetching ${config.entityNamePlural}:`, err);
            setError('Failed to connect to the server.');
            if (!isLoadMore) setItems([]); // Clear items only if not loading more
            setTotalItems(0);
        } finally {
            setIsInitialLoading(false);
            setIsMoreLoading(false);
        }
    };

    const handleLoadMore = () => {
        setPage(prev => prev + 1);
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

            // Refresh items (reset to page 0)
            setPage(0);
            fetchItems(false, 0);
            handleCancel();
        } catch (err) {
            console.error(`Error saving ${config.entityName}:`, err);
            setError(err instanceof Error ? err.message : `Failed to save ${config.entityName}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmation({ isOpen: true, itemId: id });
    };

    const handleDeleteConfirm = async () => {
        const id = deleteConfirmation.itemId;
        if (!id) return;

        setDeleteConfirmation({ isOpen: false, itemId: null });

        try {
            const response = await fetch(`${API_BASE_URL}${config.apiEndpoint}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to delete ${config.entityName}`);
            }
            // Refresh items
            setPage(0);
            fetchItems(false, 0);
        } catch (err) {
            console.error(`Error deleting ${config.entityName}:`, err);
            setError(err instanceof Error ? err.message : `Failed to delete ${config.entityName}. Please try again.`);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmation({ isOpen: false, itemId: null });
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

    // Determine if all items are loaded (for client-side search optimization)
    const allItemsLoaded = config.pagination && config.serverFilters && items.length > 0 && items.length >= totalItems;

    const filteredItems = items.filter((item: T) => {
        const searchLower = searchTerm.toLowerCase();

        // For pagination mode with all items loaded, apply text search client-side
        if (config.pagination && allItemsLoaded && searchLower) {
            // Apply text search to searchFields
            const matchesSearch = config.searchFields.some((field: keyof T) => {
                const value = item[field];
                return value?.toString().toLowerCase().includes(searchLower);
            });
            return matchesSearch;
        }

        // For pagination mode without all items, server handles search
        // But customFilter still applies client-side
        if (config.pagination) {
            if (config.customFilter) {
                return config.customFilter(item, searchLower);
            }
            return true; // No additional filtering
        }

        // For non-paginated mode, apply text search client-side
        if (config.customFilter) {
            return config.customFilter(item, searchLower);
        }

        return config.searchFields.some((field: keyof T) => {
            const value = item[field];
            return value?.toString().toLowerCase().includes(searchLower);
        });
    }).sort((a, b) => {
        if (!config.defaultSort) return 0;

        const { key, direction } = config.defaultSort;
        const valA = a[key];
        const valB = b[key];

        if (typeof valA === 'string' && typeof valB === 'string') {
            return direction === 'asc'
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
            return direction === 'asc' ? valA - valB : valB - valA;
        }

        return 0;
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

    // Show loading state on initial load
    if (isInitialLoading) {
        return (
            <div className="p-6 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">{config.entityNamePlural} Management</h1>
                </div>
                <LoadingTable rows={5} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">{config.entityNamePlural} Management</h1>
                <div className="flex gap-3">
                    {typeof config.headerActions === 'function'
                        ? config.headerActions({ searchTerm })
                        : config.headerActions
                    }
                    <button
                        onClick={() => {
                            if (config.onCreate) {
                                config.onCreate();
                            } else {
                                setIsFormOpen(true);
                            }
                        }}
                        disabled={config.requireSearchToCreate && !searchTerm}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={config.requireSearchToCreate && !searchTerm ? "Search to enable creation" : "Create new"}
                    >
                        <Plus size={20} />
                        New {config.entityName}
                    </button>
                </div>
            </div>


            <div className="mb-6 flex gap-4 items-center">
                {config.filterSlot}
                <div className={`relative ${config.filterSlot ? 'flex-1' : 'w-full'}`}>
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
                <ErrorMessage
                    message={error}
                    onRetry={fetchItems}
                    className="mb-6"
                />
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
                                    {!config.hideDefaultActions && (
                                        <>
                                            <button
                                                aria-label={`Edit ${config.entityName}`}
                                                onClick={() => handleEdit(item)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                aria-label={`Delete ${config.entityName}`}
                                                onClick={() => handleDeleteClick(item.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
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

                {config.pagination && filteredItems.length > 0 && items.length < totalItems && (
                    <div className="p-4 border-t border-gray-100 flex justify-center bg-gray-50">
                        <button
                            onClick={handleLoadMore}
                            disabled={isMoreLoading}
                            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isMoreLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                    Loading more...
                                </>
                            ) : (
                                `Load 20 more (${totalItems - items.length} remaining)`
                            )}
                        </button>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                title="Confirm Delete"
                message={`Are you sure you want to delete this ${config.entityName.toLowerCase()}? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            />
        </div>
    );
}
