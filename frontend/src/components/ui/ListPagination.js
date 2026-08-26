import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ListPagination = ({ page = 1, limit = 10, total = 0, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(Number(total || 0) / Math.max(1, Number(limit) || 10)));
  const current = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const from = total === 0 ? 0 : (current - 1) * limit + 1;
  const to = Math.min(current * limit, total);

  if (total <= 0) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-ink-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-ink-500">
        Showing <span className="font-semibold text-ink-700">{from}</span>–
        <span className="font-semibold text-ink-700">{to}</span> of{' '}
        <span className="font-semibold text-ink-700">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={current <= 1}
          onClick={() => onPageChange?.(current - 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={14} />
          Previous
        </button>
        <span className="min-w-[4.5rem] text-center text-xs font-medium text-ink-500">
          Page {current} of {totalPages}
        </span>
        <button
          type="button"
          disabled={current >= totalPages}
          onClick={() => onPageChange?.(current + 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default ListPagination;
