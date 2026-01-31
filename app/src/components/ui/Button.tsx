import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'warning';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    blockedReason?: string | null;
}

/**
 * Button Component
 * 
 * State-aware button that respects business rules.
 * When blockedReason is provided, the button is disabled with a tooltip.
 */
export function Button({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    blockedReason,
    disabled,
    className = '',
    ...props
}: ButtonProps) {
    const isDisabled = disabled || isLoading || !!blockedReason;

    const baseClasses = 'btn';
    const variantClasses = `btn-${variant}`;
    const sizeClasses = `btn-${size}`;
    const tooltipClasses = blockedReason ? 'tooltip' : '';

    return (
        <button
            className={`${baseClasses} ${variantClasses} ${sizeClasses} ${tooltipClasses} ${className}`}
            disabled={isDisabled}
            data-tip={blockedReason || undefined}
            {...props}
        >
            {isLoading ? (
                <span className="btn-spinner" aria-hidden="true">
                    ⏳
                </span>
            ) : null}
            {children}
        </button>
    );
}

// Convenience exports
export const PrimaryButton = (props: Omit<ButtonProps, 'variant'>) => (
    <Button variant="primary" {...props} />
);

export const SecondaryButton = (props: Omit<ButtonProps, 'variant'>) => (
    <Button variant="secondary" {...props} />
);

export const DangerButton = (props: Omit<ButtonProps, 'variant'>) => (
    <Button variant="danger" {...props} />
);

export default Button;
