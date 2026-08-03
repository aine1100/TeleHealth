import React from 'react';

const StepProgress = ({ steps, currentStep }) => {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between text-xs font-medium text-ink-500">
        <span>
          Step {currentStep + 1} of {steps.length}
        </span>
        <span className="text-ink-700">{steps[currentStep]}</span>
      </div>
      <div className="flex gap-2">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full transition ${
              index <= currentStep ? 'bg-brand-500' : 'bg-ink-200'
            }`}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
};

export const StepActions = ({
  onBack,
  nextLabel = 'Continue',
  showBack = true,
  loading = false,
  nextType = 'button',
  onNext
}) => (
  <div className={`mt-2 flex gap-3 ${showBack ? '' : ''}`}>
    {showBack ? (
      <button
        type="button"
        onClick={onBack}
        className="auth-btn-secondary w-auto min-w-[100px] px-5"
        disabled={loading}
      >
        Back
      </button>
    ) : null}
    <button
      type={nextType}
      onClick={onNext}
      className="auth-btn flex-1"
      disabled={loading}
    >
      {loading ? 'Please wait…' : nextLabel}
    </button>
  </div>
);

export default StepProgress;
