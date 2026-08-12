import React from 'react';
import { createPortal } from 'react-dom';
import { Package, ShieldCheck, X } from 'lucide-react';
import { resolveApiUrl } from '../../utils/apiUrl';

const DetailRow = ({ label, value }) => {
  if (value == null || value === '') return null;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-2.5 last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="max-w-[60%] text-right text-sm font-medium text-ink-800">{value}</dd>
    </div>
  );
};

const MedicineDetailModal = ({ open, medicine, onClose, onAdd, canOrder = false }) => {
  if (!open || !medicine) return null;

  const inStock = Number(medicine.stockQuantity) > 0;
  const formLabel = medicine.form
    ? String(medicine.form).charAt(0).toUpperCase() + String(medicine.form).slice(1)
    : '—';

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/55" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink-200 bg-white shadow-xl animate-fade-up">
        <div className="flex items-start justify-between border-b border-ink-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Medicine details</p>
            <h2 className="mt-0.5 text-lg font-bold text-ink-900">{medicine.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex gap-4">
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-ink-50">
              {medicine.imageUrl ? (
                <img
                  src={resolveApiUrl(medicine.imageUrl)}
                  alt={medicine.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ink-300">
                  <Package size={28} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-ink-900">
                {medicine.price != null ? `UGX ${Number(medicine.price).toLocaleString()}` : 'Price on request'}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {[medicine.strength, formLabel, medicine.category].filter(Boolean).join(' · ')}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {inStock ? `${medicine.stockQuantity} in stock` : 'Out of stock'}
                </span>
                {medicine.requiresPrescription ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                    <ShieldCheck size={11} /> Prescription required
                  </span>
                ) : (
                  <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-700">
                    Over the counter
                  </span>
                )}
              </div>
            </div>
          </div>

          {medicine.description ? (
            <div className="rounded-xl border border-ink-100 bg-ink-50/50 px-3.5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">About</p>
              <p className="mt-1 text-sm leading-6 text-ink-700">{medicine.description}</p>
            </div>
          ) : null}

          <dl>
            <DetailRow label="Generic name" value={medicine.genericName} />
            <DetailRow label="Brand name" value={medicine.brandName} />
            <DetailRow label="Form" value={formLabel} />
            <DetailRow label="Strength" value={medicine.strength} />
            <DetailRow label="Category" value={medicine.category} />
            <DetailRow label="Manufacturer" value={medicine.manufacturer} />
            <DetailRow label="SKU" value={medicine.sku} />
            <DetailRow
              label="Reorder level"
              value={medicine.reorderLevel != null ? String(medicine.reorderLevel) : null}
            />
          </dl>
        </div>

        <div className="flex gap-2 border-t border-ink-100 px-5 py-3">
          {canOrder ? (
            <button
              type="button"
              disabled={!inStock}
              onClick={() => onAdd?.(medicine)}
              className="flex-1 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              Add to order
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className={`${canOrder ? '' : 'w-full '}rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50`}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MedicineDetailModal;
