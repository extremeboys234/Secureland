import React, { useState, useCallback, useMemo } from 'react';
import {
  Search,
  Filter,
  Loader2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface DataTableProps<T> {
  columns: Array<{
    key: keyof T;
    label: string;
    sortable?: boolean;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
  }>;
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  enableSelection?: boolean;
  selectedRowKeys?: (keyof T & string)[];
  onSelectionChange?: (selectedRows: T[]) => void;
  showPagination?: boolean;
  pageSizeOptions?: number[];
}

const DataTable = <T,>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  onRowClick,
  enableSelection = false,
  selectedRowKeys = [],
  onSelectionChange,
  showPagination = true,
  pageSizeOptions = [10, 25, 50, 100]
}: DataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(row =>
        columns.some(col =>
          String(row[col.key]).toLowerCase().includes(term)
        )
      );
    }

    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        } else {
          return 0;
        }
      });
    }

    return result;
  }, [data, searchTerm, sortBy, sortOrder, columns]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, currentPage, pageSize]);

  // Handle selection
  const handleSelectRow = useCallback((row: T) => {
    if (!enableSelection) return;

    const key = selectedRowKeys[0] as keyof T;
    const rowKey = String(row[key]);
    const isSelected = selectedRowKeys.includes(rowKey as any);

    let newSelection = [...selectedRowKeys];
    if (isSelected) {
      newSelection = newSelection.filter(k => String(k) !== rowKey);
    } else {
      newSelection = [...newSelection, rowKey as any];
    }

    if (onSelectionChange) {
      const selectedRows = processedData.filter(r =>
        newSelection.includes(String(r[selectedRowKeys[0] as keyof T]) as any)
      );
      onSelectionChange(selectedRows);
    }
  }, [enableSelection, selectedRowKeys, onSelectionChange, processedData]);

  // Check if row is selected
  const isRowSelected = useCallback((row: T) => {
    if (!enableSelection) return false;
    const key = selectedRowKeys[0] as keyof T;
    return selectedRowKeys.includes(String(row[key]) as any);
  }, [enableSelection, selectedRowKeys]);

  return (
    <div className="space-y-4">
      {/* Table Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3 mb-3 sm:mb-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search all columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all sm:w-64"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => {
              // Open filter modal/popup
              alert('Opening filter options...');
            }}
            className="ml-2 flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Filter className="h-4 w-4 text-gray-500" />
            Filter
          </button>
        </div>

        {/* Page Size Selector */}
        {showPagination && (
          <div className="flex items-center space-x-2 mb-3 sm:mb-0">
            <label className="text-sm text-gray-600">Rows per page:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1); // Reset to first page
              }}
              className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {pageSizeOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 mx-auto mb-3 animate-spin text-blue-500" />
          <p className="text-sm text-gray-500">Loading data...</p>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {enableSelection && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-6">
                    <input
                      type="checkbox"
                      checked={selectedRowKeys.length === processedData.length && processedData.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (onSelectionChange) {
                            onSelectionChange(processedData);
                          }
                        } else {
                          if (onSelectionChange) {
                            onSelectionChange([]);
                          }
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={`${String(col.key)}-header`}
                    className={`
                      px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                      cursor-pointer ${col.sortable ? 'hover:text-gray-800' : ''}
                      ${sortBy === col.key ?
                        (sortOrder === 'asc' ? 'text-blue-600' : 'text-blue-600') :
                        'text-gray-500'}
                    `}
                    onClick={col.sortable ? () => {
                      if (sortBy === col.key) {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy(col.key);
                        setSortOrder('asc');
                      }
                    } : undefined}
                  >
                    {col.label}
                    {col.sortable && (
                      <span className="ml-1 h-4 w-4 inline-flex items-center justify-center">
                        {sortBy === col.key ? (
                          sortOrder === 'asc' ? <ChevronUp className="text-xs" /> : <ChevronDown className="text-xs" />
                        ) : (
                          <>
                            <ChevronUp className="text-xs text-gray-300" />
                            <ChevronDown className="text-xs text-gray-300" />
                          </>
                        )}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={enableSelection ? columns.length + 1 : columns.length}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr
                    key={`${String(row[columns[0].key] ?? index)}-${index}`}
                    className={`
                      hover:bg-gray-50
                      ${isRowSelected(row) ? 'bg-blue-50' : ''}
                      ${onRowClick ? 'cursor-pointer' : ''}
                    `}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onMouseEnter={onRowClick ? () => {} : undefined}
                    onMouseLeave={onRowClick ? () => {} : undefined}
                  >
                    {enableSelection && (
                      <td className="px-4 py-3 text-left w-6">
                        <input
                          type="checkbox"
                          checked={isRowSelected(row)}
                          onChange={() => handleSelectRow(row)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={`${String(col.key)}-${index}`}
                        className="px-4 py-3 text-sm text-gray-700"
                      >
                        {col.render ? (
                          col.render(row[col.key], row)
                        ) : (
                          <>
                            {typeof row[col.key] === 'object' && row[col.key] !== null ? (
                              <pre className="text-xs text-gray-600">{JSON.stringify(row[col.key], null, 2)}</pre>
                            ) : (
                              String(row[col.key])
                            )}
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {showPagination && processedData.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-500 border-t border-gray-200">
          <span>
            Showing {Math.min(paginatedData.length, (currentPage - 1) * pageSize + 1)}
            - {Math.min(paginatedData.length, currentPage * pageSize)}
            of {processedData.length} entries
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5
                ${currentPage === 1 ? 'bg-gray-50 text-gray-400 cursor-not-allowed' :
                  'hover:bg-gray-100 text-gray-600'}
                rounded-lg transition-colors`}
            >
              Previous
            </button>
            <span className="mx-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5
                ${currentPage === totalPages ? 'bg-gray-50 text-gray-400 cursor-not-allowed' :
                  'hover:bg-gray-100 text-gray-600'}
                rounded-lg transition-colors`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;