import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className = '', disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`input-group ${error ? 'has-error' : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="input-label" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`input-field ${error ? 'input-error' : ''}`}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: error ? '1px solid #dc2626' : '1px solid #d1d5db',
            outline: 'none',
            fontSize: 14,
            ...props.style
          }}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="input-error-message" style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="input-helper-message" style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
