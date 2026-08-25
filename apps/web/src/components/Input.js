import React from 'react';

/**
 * Reusable, accessible Input UI component supporting labels, error states, helper text, and native input props forwarding.
 *
 * @param {Object} props
 * @param {string} [props.label] - Accessible label text for the input.
 * @param {string} [props.error] - Validation error message string.
 * @param {string} [props.helperText] - Supplementary hint text.
 * @param {string} [props.id] - Element ID for linking label and input.
 * @param {string} [props.className] - Optional custom CSS classes.
 * @param {boolean} [props.disabled] - Disabled state.
 * @returns {React.ReactElement}
 */
export function Input({
  label,
  error,
  helperText,
  id,
  className = '',
  disabled = false,
  ...nativeProps
}) {
  const generatedId = id || (label ? `input_${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : undefined);
  const hasError = Boolean(error);

  const children = [];

  if (label) {
    children.push(
      React.createElement(
        'label',
        { key: 'label', htmlFor: generatedId, className: 'label' },
        React.createElement('span', { className: 'label-text' }, label)
      )
    );
  }

  children.push(
    React.createElement('input', {
      key: 'input',
      id: generatedId,
      disabled: disabled,
      'aria-invalid': hasError ? 'true' : 'false',
      'aria-describedby': error
        ? `${generatedId}-error`
        : helperText
        ? `${generatedId}-helper`
        : undefined,
      className: `input input-bordered w-full ${hasError ? 'input-error border-red-500' : ''}`.trim(),
      ...nativeProps,
    })
  );

  if (error) {
    children.push(
      React.createElement(
        'span',
        {
          key: 'error',
          id: `${generatedId}-error`,
          className: 'text-sm text-red-500 mt-1 block',
          role: 'alert',
        },
        error
      )
    );
  } else if (helperText) {
    children.push(
      React.createElement(
        'span',
        {
          key: 'helper',
          id: `${generatedId}-helper`,
          className: 'text-sm text-gray-500 mt-1 block',
        },
        helperText
      )
    );
  }

  return React.createElement(
    'div',
    { className: `form-control ${className}`.trim() },
    children
  );
}

export default Input;
