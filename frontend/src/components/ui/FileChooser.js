import React, { useId, useRef } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { Field } from '../auth/FormFields';

const FileChooser = ({
  label = 'Choose file',
  required = false,
  hint,
  error,
  accept = 'image/png,image/jpeg,image/jpg,image/webp',
  previewUrl = '',
  fileName = '',
  onChange,
  onClear,
  disabled = false,
  buttonLabel = 'Choose file'
}) => {
  const inputId = useId();
  const inputRef = useRef(null);

  const handlePick = (event) => {
    const file = event.target.files?.[0] || null;
    onChange?.(file);
    // Allow selecting the same file again later
    event.target.value = '';
  };

  const handleClear = () => {
    if (inputRef.current) inputRef.current.value = '';
    onClear?.();
    onChange?.(null);
  };

  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <div
        className={`rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-3 ${
          disabled ? 'opacity-60' : ''
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-100 bg-white">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-5 w-5 text-ink-300" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-800">
              {fileName || (previewUrl ? 'Current image' : 'No file selected')}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">PNG, JPG, or WebP up to the upload limit.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:cursor-not-allowed"
              >
                <Upload size={13} />
                {buttonLabel}
              </button>
              {previewUrl || fileName ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={handlePick}
        />
      </div>
    </Field>
  );
};

export default FileChooser;
