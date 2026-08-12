import React from 'react';
import Dropdown from '../auth/Dropdown';

const EXPERIENCE_OPTIONS = [
  { value: '', label: 'Any experience' },
  { value: '1', label: '1+ Years' },
  { value: '3', label: '3+ Years' },
  { value: '5', label: '5+ Years' },
  { value: '10', label: '10+ Years' }
];

const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'Any time' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' }
];

const CONSULT_TYPES = [
  { value: 'all', label: 'All types' },
  { value: 'video', label: 'Televisit' },
  { value: 'in_person', label: 'On-site' },
  { value: 'chat', label: 'Home visit / chat' }
];

const formatFee = (value) => `UGX ${Number(value).toLocaleString()}`;

const DoctorFiltersSidebar = ({ filters, onChange, onReset }) => {
  const set = (key, value) => onChange({ ...filters, [key]: value });

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
        <fieldset>
          <legend className="text-sm font-bold text-ink-900">Gender</legend>
          <div className="mt-3 space-y-2.5">
            {[
              { value: 'all', label: 'All' },
              { value: 'male', label: 'Male doctor' },
              { value: 'female', label: 'Female doctor' }
            ].map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
                <input
                  type="radio"
                  name="gender"
                  checked={filters.gender === option.value}
                  onChange={() => set('gender', option.value)}
                  className="h-4 w-4 border-ink-300 text-brand-500 focus:ring-brand-500"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <Dropdown
          label="Experience"
          value={filters.minExperience}
          onChange={(value) => set('minExperience', value)}
          options={EXPERIENCE_OPTIONS}
        />

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-ink-900">Consultation fee</label>
            <span className="text-xs font-medium text-ink-500">
              {formatFee(filters.minFee)} – {formatFee(filters.maxFee)}
            </span>
          </div>
          <div className="mt-3 space-y-3">
            <input
              type="range"
              min={0}
              max={500000}
              step={5000}
              value={filters.minFee}
              onChange={(e) => set('minFee', Math.min(Number(e.target.value), filters.maxFee - 5000))}
              className="h-2 w-full cursor-pointer accent-brand-500"
            />
            <input
              type="range"
              min={0}
              max={500000}
              step={5000}
              value={filters.maxFee}
              onChange={(e) => set('maxFee', Math.max(Number(e.target.value), filters.minFee + 5000))}
              className="h-2 w-full cursor-pointer accent-brand-500"
            />
          </div>
        </div>

        <Dropdown
          label="Availability"
          value={filters.availability}
          onChange={(value) => set('availability', value)}
          options={AVAILABILITY_OPTIONS}
        />

        <fieldset>
          <legend className="text-sm font-bold text-ink-900">Consult type</legend>
          <div className="mt-3 space-y-2.5">
            {CONSULT_TYPES.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
                <input
                  type="radio"
                  name="consultType"
                  checked={filters.consultType === option.value}
                  onChange={() => set('consultType', option.value)}
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

export default DoctorFiltersSidebar;
