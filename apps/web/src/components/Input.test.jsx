import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Input from './Input';

describe('Input', () => {
  it('renders input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('forwards id to input and label', () => {
    render(<Input id="custom-id" label="Test" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'custom-id');
    expect(screen.getByLabelText('Test')).toHaveAttribute('for', 'custom-id');
  });

  it('generates id when not provided', () => {
    render(<Input label="Test" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id');
    expect(input.id).toMatch(/^input-/);
  });

  it('forwards native input props', () => {
    render(
      <Input
        type="email"
        placeholder="Enter email"
        value="test@example.com"
        onChange={jest.fn()}
        name="email"
        autoComplete="email"
        required
      />
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'Enter email');
    expect(input).toHaveAttribute('value', 'test@example.com');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('autoComplete', 'email');
    expect(input).toBeRequired();
  });

  it('calls onChange when value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(expect.any(Object));
  });

  it('applies disabled state', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled');
  });

  it('shows error message and sets aria-invalid', () => {
    render(<Input error="This field is required" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
    expect(input).toHaveClass('error');
  });

  it('shows helper text when no error', () => {
    render(<Input helperText="Enter your email" />);
    expect(screen.getByText('Enter your email')).toBeInTheDocument();
  });

  it('shows error instead of helper text when both provided', () => {
    render(<Input error="Error" helperText="Helper" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Error');
    expect(screen.queryByText('Helper')).not.toBeInTheDocument();
  });

  it('sets aria-describedby with error and helper ids', () => {
    render(<Input id="test-id" error="Error" helperText="Helper" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'test-id-error test-id-helper');
  });

  it('forwards ref to input element', () => {
    const ref = React.createRef();
    render(<Input ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('textbox'));
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole('textbox').parentElement).toHaveClass('custom-class');
  });

  it('forwards additional props like maxLength, minLength, pattern', () => {
    render(<Input maxLength={10} minLength={3} pattern="[a-z]+" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '10');
    expect(input).toHaveAttribute('minLength', '3');
    expect(input).toHaveAttribute('pattern', '[a-z]+');
  });
});
