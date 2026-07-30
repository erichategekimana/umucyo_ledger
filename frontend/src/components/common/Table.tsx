import { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
}

export function Table<T>({ data, columns, keyExtractor, loading, emptyMessage = 'No data found', emptyIcon }: TableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 skeleton rounded-lg" style={{ opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        {emptyIcon && <div className="mb-3 text-4xl">{emptyIcon}</div>}
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table w-full">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={keyExtractor(row)} className="group">
              {columns.map((col, idx) => {
                let content: ReactNode;
                if (typeof col.accessor === 'function') {
                  content = col.accessor(row);
                } else {
                  content = String(row[col.accessor] ?? '—');
                }
                return (
                  <td key={idx} className={col.className}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}