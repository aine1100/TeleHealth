import React from 'react';
import Dropdown from '../auth/Dropdown';

const SERVICE_OPTIONS = [
  { value: 'all', label: 'Any service' },
  { value: 'pickup', label: 'Pickup available' },
  { value: 'delivery', label: 'Delivery available' },
  { value: 'both', label: 'Pickup & delivery' }
];

const STOCK_OPTIONS = [
  { value: 'all', label: 'Any catalog size' },
  { value: '1', label: '1+ medicines' },
  { value: '10', label: '10+ medicines' },
  { value: '25', label: '25+ medicines' },
  { value: '50', label: '50+ medicines' }
];

const OPEN_OPTIONS = [
  { value: 'all', label: 'All pharmacies' },
  { value: 'open', label: 'Accepting orders' },
  { value: 'closed', label: 'Temporarily closed' }
];

const formatFee = (value) => `UGX ${Number(value).toLocaleString()}`;

const PharmacyFiltersSidebar = ({ filters, onChange, onReset, cityOptions = [] }) => {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  const cities = [
    { value: 'all', label: 'All cities' },
    ...cityOptions.map((city) => ({ value: city, label: city }))
  ];

  return (
    <aside className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card lg:sticky lg:top-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-brand-600">Filters</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-ink-500 hover:text-brand-600"
        >
          Reset
        </button>
      </div>

      <div className="mt-6 space-y-6">
        <Dropdown
          label="City"
          value={filters.city}
          onChange={(value) => set('city', value)}
          options={cities}
          placeholder="Select city"
        />

        <Dropdown
          label="Services"
          value={filters.service}
          onChange={(value) => set('service', value)}
          options={SERVICE_OPTIONS}
        />

        <fieldset>
          <legend className="text-sm font-bold text-ink-900">Store status</legend>
          <div className="mt-3 space-y-2.5">
            {OPEN_OPTIONS.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
                <input
                  type="radio"
                  name="openStatus"
                  checked={filters.openStatus === option.value}
                  onChange={() => set('openStatus', option.value)}
                  className="h-4 w-4 border-ink-300 text-brand-500 focus:ring-brand-500"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-ink-900">Max delivery fee</label>
            <span className="text-xs font-medium text-ink-500">{formatFee(filters.maxDeliveryFee)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={50000}
            step={1000}
            value={filters.maxDeliveryFee}
            onChange={(e) => set('maxDeliveryFee', Number(e.target.value))}
            className="mt-3 h-2 w-full cursor-pointer accent-brand-500"
          />
          <p className="mt-1.5 text-xs text-ink-500">Includes pharmacies with pickup only.</p>
        </div>

        <Dropdown
          label="Catalog size"
          value={filters.minMedicines}
          onChange={(value) => set('minMedicines', value)}
          options={STOCK_OPTIONS}
        />

        <fieldset>
          <legend className="text-sm font-bold text-ink-900">Prescription handling</legend>
          <div className="mt-3 space-y-2.5">
            {[
              { value: 'all', label: 'All pharmacies' },
              { value: 'rx', label: 'Handles Rx medicines' }
            ].map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
                <input
                  type="radio"
                  name="rxSupport"
                  checked={filters.rxSupport === option.value}
                  onChange={() => set('rxSupport', option.value)}
                  className="h-4 w-4 border-ink-300 text-brand-500 focus:ring-brand-500"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </aside>
  );
};

export default PharmacyFiltersSidebar;
