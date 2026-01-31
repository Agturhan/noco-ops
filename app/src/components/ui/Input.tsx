import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

/**
 * Input Component
 * 
 * Form input with label, error, and helper text support.
 */
export function Input({
    label,
    error,
    helperText,
    id,
    className = '',
    ...props
}: InputProps) {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;

    return (
        <div className="input-group">
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                    {props.required && <span className="text-error"> *</span>}
                </label>
            )}
            <input
                id={inputId}
                className={`input ${error ? 'input-error' : ''} ${className}`}
                style={error ? { borderColor: 'var(--color-error)' } : undefined}
                {...props}
            />
            {error && (
                <span className="text-error" style={{ fontSize: 'var(--text-caption)' }}>
                    {error}
                </span>
            )}
            {helperText && !error && (
                <span className="text-muted" style={{ fontSize: 'var(--text-caption)' }}>
                    {helperText}
                </span>
            )}
        </div>
    );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export function Textarea({
    label,
    error,
    id,
    className = '',
    ...props
}: TextareaProps) {
    const generatedId = useId();
    const inputId = id || `textarea-${generatedId}`;

    return (
        <div className="input-group">
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                    {props.required && <span className="text-error"> *</span>}
                </label>
            )}
            <textarea
                id={inputId}
                className={`input textarea ${error ? 'input-error' : ''} ${className}`}
                style={error ? { borderColor: 'var(--color-error)' } : undefined}
                {...props}
            />
            {error && (
                <span className="text-error" style={{ fontSize: 'var(--text-caption)' }}>
                    {error}
                </span>
            )}
        </div>
    );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export function Select({
    label,
    error,
    options,
    id,
    className = '',
    ...props
}: SelectProps) {
    const generatedId = useId();
    const inputId = id || `select-${generatedId}`;

    return (
        <div className="input-group">
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                    {props.required && <span className="text-error"> *</span>}
                </label>
            )}
            <select
                id={inputId}
                className={`input select ${error ? 'input-error' : ''} ${className}`}
                style={error ? { borderColor: 'var(--color-error)' } : undefined}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <span className="text-error" style={{ fontSize: 'var(--text-caption)' }}>
                    {error}
                </span>
            )}
        </div>
    );
}

export default Input;
