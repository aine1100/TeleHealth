import React from 'react';
import { Package, Plus, ShoppingCart } from 'lucide-react';
import { resolveApiUrl } from '../../utils/apiUrl';

const MedicineCard = ({
  medicine,
  onView,
  onAdd,
  quantityInCart = 0,
  canOrder = true
}) => {
  const inStock = Number(medicine.stockQuantity) > 0;
  const formLabel = medicine.form
    ? String(medicine.form).charAt(0).toUpperCase() + String(medicine.form).slice(1)
    : null;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-card transition hover:border-brand-200 hover:shadow-md">
      <button type="button" onClick={() => onView?.(medicine)} className="block w-full text-left">
        <div className="relative aspect-[4/3] overflow-hidden bg-ink-50">
          {medicine.imageUrl ? (
            <img
              src={resolveApiUrl(medicine.imageUrl)}
              alt={medicine.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-300">
              <Package size={36} />
            </div>
          )}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {medicine.requiresPrescription ? (
              <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">Rx</span>
            ) : (
              <span className="rounded-full bg-ink-900/80 px-2 py-0.5 text-[10px] font-bold text-white">OTC</span>
            )}
            {!inStock ? (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                Out of stock
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col px-3.5 pb-2 pt-3">
          <p className="line-clamp-2 text-sm font-bold text-ink-900">{medicine.name}</p>
          <p className="mt-1 line-clamp-2 text-xs text-ink-500">
            {[medicine.strength, formLabel, medicine.category].filter(Boolean).join(' · ') || 'Medicine'}
          </p>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-base font-bold text-brand-600">
                {medicine.price != null ? `UGX ${Number(medicine.price).toLocaleString()}` : '—'}
              </p>
              <p className="text-[11px] text-ink-500">
                {inStock ? `${medicine.stockQuantity} available` : 'Unavailable'}
              </p>
            </div>
            {quantityInCart > 0 ? (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                {quantityInCart} in cart
              </span>
            ) : null}
          </div>
        </div>
      </button>

      <div className="mt-auto flex gap-2 border-t border-ink-100 p-3">
        <button
          type="button"
          onClick={() => onView?.(medicine)}
          className="flex-1 rounded-xl border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50"
        >
          Details
        </button>
        {canOrder ? (
          <button
            type="button"
            disabled={!inStock}
            onClick={() => onAdd?.(medicine)}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {quantityInCart > 0 ? <Plus size={13} /> : <ShoppingCart size={13} />}
            {quantityInCart > 0 ? 'Add more' : 'Order'}
          </button>
        ) : null}
      </div>
    </article>
  );
};

export default MedicineCard;
