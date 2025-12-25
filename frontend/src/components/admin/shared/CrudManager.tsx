import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import type { CrudConfig, FormFieldConfig } from '../../../types';
import { LoadingTable, ErrorMessage, ConfirmationModal } from '../../common';
import { useSafeTranslation } from '../../../context/LanguageContext';

type ServerFilters = Record<string, string>;

const buildServerFiltersKey = (serverFilters?: ServerFilters) =>
    JSON.stringify(serverFilters ?? {});

const hasActiveServerFilters = (serverFilters?: ServerFilters) => {
    if (!serverFilters) return false;
    return Object.values(serverFilters).some((value) => value !== undefined && value !== null && value !== '');
};

const buildFetchUrl = ({
    apiEndpoint,
    pagination,
    page,
    pageSize,
    searchTerm,
    serverFilters,
}: {
    apiEndpoint: string;
    pagination?: boolean;
    page: number;
    pageSize: number;
    searchTerm: string;
    serverFilters?: ServerFilters;
}) => {
    let url = `${API_BASE_URL}${apiEndpoint}`;

    if (!pagination) return url;

    const skip = page * pageSize;
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('take', pageSize.toString());
    if (searchTerm) {
        params.append('search', searchTerm);
    }
    if (serverFilters) {
        Object.entries(serverFilters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
    }

    url += `?${params.toString()}`;
    return url;
};

const parsePaginatedResult = <T,>(data: unknown) => {
    if (
        data &&
        typeof data === 'object' &&
        'data' in data &&
        Array.isArray((data as { data: unknown }).data)
    ) {
        const payload = data as { data: T[]; total?: number };
        return { ok: true, items: payload.data, total: payload.total ?? 0 };
    }

    const error =
        data && typeof data === 'object' && 'error' in data
            ? String((data as { error: unknown }).error)
            : undefined;
    return { ok: false, items: [] as T[], total: 0, error };
};

const parseArrayResult = <T,>(data: unknown) => {
    if (Array.isArray(data)) {
        return { ok: true, items: data as T[] };
    }

    const error =
        data && typeof data === 'object' && 'error' in data
            ? String((data as { error: unknown }).error)
            : undefined;
    return { ok: false, items: [] as T[], error };
};

const filterCrudItems = <T,>(
    items: T[],
    config: CrudConfig<T>,
    searchTerm: string,
    allItemsLoaded: boolean,
) => {
    const searchLower = searchTerm.toLowerCase();

    if (config.pagination && allItemsLoaded && searchLower) {
        return items.filter((item) =>
            config.searchFields.some((field: keyof T) => {
                const value = item[field];
                return value?.toString().toLowerCase().includes(searchLower);
            }),
        );
    }

    if (config.pagination) {
        if (config.customFilter) {
            return items.filter((item) => config.customFilter!(item, searchLower));
        }
        return items;
    }

    if (config.customFilter) {
        return items.filter((item) => config.customFilter!(item, searchLower));
    }

    return items.filter((item: T) =>
        config.searchFields.some((field: keyof T) => {
            const value = item[field];
            return value?.toString().toLowerCase().includes(searchLower);
        }),
    );
};

const sortCrudItems = <T,>(items: T[], config: CrudConfig<T>) => {
    if (config.sortItems) {
        return config.sortItems([...items]);
    }

    if (!config.defaultSort) return items;

    return [...items].sort((a, b) => {
        const { key, direction } = config.defaultSort!;
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
};

const buildEditFormData = <T,>(item: T, config: CrudConfig<T>) => {
    if (config.mapItemToForm) {
        return config.mapItemToForm(item);
    }

    const newFormData: Record<string, unknown> = {};
    config.formFields.forEach((field: FormFieldConfig) => {
        newFormData[field.name] = (item as Record<string, unknown>)[field.name] ?? '';
    });
    return newFormData;
};

const buildEmptyFormData = <T,>(config: CrudConfig<T>) => {
    const resetData: Record<string, unknown> = {};
    config.formFields.forEach((field: FormFieldConfig) => {
        resetData[field.name] = field.type === 'checkbox' ? false : '';
    });
    return resetData;
};

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
    const [isFetching, setIsFetching] = useState(false);
    const [hasFetchResolved, setHasFetchResolved] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; itemId: string | null }>({ isOpen: false, itemId: null });

    // Pagination state
    const [page, setPage] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [isMoreLoading, setIsMoreLoading] = useState(false);
    const PAGE_SIZE = 20;
    const { t } = useSafeTranslation();

    const itemsLengthRef = useRef(items.length);
    const pageRef = useRef(page);

    useEffect(() => {
        itemsLengthRef.current = items.length;
    }, [items.length]);

    useEffect(() => {
        pageRef.current = page;
    }, [page]);

    const minSearchLength = config.minSearchLength ?? 1;
    const serverFilters = config.serverFilters;
    const serverFiltersKey = useMemo(
        () => buildServerFiltersKey(serverFilters),
        [serverFilters],
    );
    const hasActiveFilters = useMemo(
        () => hasActiveServerFilters(serverFilters),
        [serverFilters],
    );
    const shouldFetch = useCallback(() => {
        if (!config.requireSearchBeforeFetch) return true;
        if (config.allowFetchWithoutSearchIfFilters && hasActiveFilters) return true;
        return debouncedSearchTerm.trim().length >= minSearchLength;
    }, [
        config.allowFetchWithoutSearchIfFilters,
        config.requireSearchBeforeFetch,
        debouncedSearchTerm,
        hasActiveFilters,
        minSearchLength,
    ]);

    const allItemsLoaded = useMemo(() => (
        Boolean(config.pagination && serverFilters && items.length > 0 && items.length >= totalItems)
    ), [config.pagination, items.length, serverFilters, totalItems]);

    const lastFiltersKeyRef = useRef(serverFiltersKey);

    const fetchItems = useCallback(async (isLoadMore = false, pageOverride?: number) => {
        if (!shouldFetch()) {
            setIsInitialLoading(false);
            setIsMoreLoading(false);
            setIsFetching(false);
            return;
        }

        const currentPage = pageOverride ?? pageRef.current;

        // Prevent double fetching on initial load since searchTerm effect runs too
        // If not loading more, and page is already > 0, it means a search term change
        // or initial load has already triggered a fetch for page 0.
        if (!isLoadMore && currentPage > 0) return;

        try {
            if (isLoadMore) {
                setIsMoreLoading(true);
            } else {
                setError(null);
                setIsFetching(true);
                // Only show full loading on truly initial load (component mount), not on search changes
                // This prevents the search input from being unmounted and losing focus
                if (itemsLengthRef.current === 0 && !debouncedSearchTerm) setIsInitialLoading(true);
            }

            const url = buildFetchUrl({
                apiEndpoint: config.apiEndpoint,
                pagination: config.pagination,
                page: currentPage,
                pageSize: PAGE_SIZE,
                searchTerm: debouncedSearchTerm,
                serverFilters,
            });
            const response = await fetch(url);
            const data = await response.json();

            if (config.pagination) {
                // Expect { data: [], total: number }
                const parsed = parsePaginatedResult<T>(data);
                if (parsed.ok) {
                    if (isLoadMore) {
                        setItems((prev) => [...prev, ...parsed.items]);
                    } else {
                        setItems(parsed.items);
                    }
                    setTotalItems(parsed.total);
                } else {
                    console.error('Expected paginated result but got:', data);
                    setItems([]);
                    setTotalItems(0);
                    if (parsed.error) setError(parsed.error);
                }
            } else {
                // Legacy behavior (no pagination)
                const parsed = parseArrayResult<T>(data);
                if (parsed.ok) {
                    setItems(parsed.items);
                    setTotalItems(parsed.items.length);
                } else {
                    console.error('Expected array but got:', data);
                    setItems([]);
                    setTotalItems(0);
                    if (parsed.error) setError(parsed.error);
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
            if (!isLoadMore) {
                setIsFetching(false);
                setHasFetchResolved(true);
            }
        }
    }, [
        config.apiEndpoint,
        config.entityNamePlural,
        config.pagination,
        debouncedSearchTerm,
        serverFilters,
        shouldFetch,
    ]);

    // Debounce search term
    useEffect(() => {
        setHasFetchResolved(false);
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const filtersChanged = lastFiltersKeyRef.current !== serverFiltersKey;
        if (filtersChanged) {
            lastFiltersKeyRef.current = serverFiltersKey;
        }

        setPage(0); // Reset page on search term change
        // Only fetch from server if we don't have all items already loaded
        // If all items are loaded (serverFilters applied + totalItems <= items.length), filter client-side
        if (!shouldFetch()) {
            setItems([]);
            setTotalItems(0);
            setIsInitialLoading(false);
            setIsFetching(false);
            setHasFetchResolved(false);
            return;
        }
        if (allItemsLoaded && !filtersChanged) {
            setHasFetchResolved(true);
            return;
        }
        setHasFetchResolved(false);
        fetchItems(false, 0); // Fetch initial data or new search results with explicit page 0
        // If allItemsLoaded, we skip fetch and filteredItems will handle client-side filtering
    }, [allItemsLoaded, debouncedSearchTerm, fetchItems, serverFiltersKey, shouldFetch]);

    useEffect(() => {
        // Only load more if page is incremented and not the initial load (page 0)
        if (page > 0) {
            fetchItems(true);
        }
    }, [fetchItems, page]);

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
            const savedItem = await response.json();

            if (config.onAfterSave) {
                config.onAfterSave(savedItem);
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

        setFormData(buildEditFormData(item, config));
        setIsFormOpen(true);
    };

    const handleCancel = () => {
        setIsFormOpen(false);
        setEditingItem(null);
        setFormData(buildEmptyFormData(config));
        setError(null);
    };

    const handleFieldChange = (fieldName: string, value: unknown) => {
        const fieldConfig = config.formFields.find(f => f.name === fieldName);
        const finalValue = fieldConfig?.transform ? fieldConfig.transform(value) : value;
        setFormData(prev => ({ ...prev, [fieldName]: finalValue }));
    };

    // Determine if all items are loaded (for client-side search optimization)
    const canFetchNow = shouldFetch();
    const isSearchPending = searchTerm !== debouncedSearchTerm;
    const isResultsReady = hasFetchResolved && !isFetching && !isSearchPending;

    const filteredItems = filterCrudItems(items, config, searchTerm, allItemsLoaded);
    const sortedItems = sortCrudItems(filteredItems, config);

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
                        ? config.headerActions({ searchTerm, canFetchNow, isResultsReady })
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
                        disabled={Boolean(config.requireSearchToCreate) && (!canFetchNow || !isResultsReady)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={config.requireSearchToCreate && !canFetchNow ? "Search to enable creation" : "Create new"}
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
                        {sortedItems.map((item) => (
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
                {sortedItems.length === 0 &&
                    !isFetching &&
                    !isSearchPending &&
                    ((config.requireSearchBeforeFetch && !canFetchNow) || hasFetchResolved) && (
                        <div className="text-center py-12 text-gray-500">
                            {config.requireSearchBeforeFetch && !canFetchNow
                                ? t('crud.emptySearchPrompt', { entityPlural: config.entityNamePlural.toLowerCase() })
                                : t('crud.emptyCreatePrompt', {
                                    entityPlural: config.entityNamePlural.toLowerCase(),
                                    entity: config.entityName.toLowerCase(),
                                  })}
                        </div>
                    )}

                {config.pagination && sortedItems.length > 0 && items.length < totalItems && (
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
