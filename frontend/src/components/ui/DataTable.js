import React from 'react';

const DataTable = ({
  columns = [],
  rows = [],
  loading = false,
  emptyText = 'No records found.',
  rowKey = '_id',
  onRowClick
}) => (
  <div className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-ink-100/70 text-xs uppercase tracking-wide text-ink-500">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 font-semibold ${column.className || ''}`}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-ink-500">
                Loading…
              </td>
            </tr>
          ) : rows.length ? (
            rows.map((row, index) => {
              const key = typeof rowKey === 'function' ? rowKey(row, index) : row[rowKey] || index;
              return (
                <tr
                  key={key}
                  className={`border-t border-ink-100 ${onRowClick ? 'cursor-pointer hover:bg-ink-50/80' : ''}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={`px-4 py-3.5 align-middle ${column.cellClassName || ''}`}>
                      {column.render ? column.render(row[column.key], row, index) : row[column.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-ink-500">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default DataTable;
