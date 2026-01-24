import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

/**
 * Card Component
 * 
 * Container for grouped content with subtle elevation.
 */
export function Card({ children, className = '', style, onClick }: CardProps) {
    return <div className={`card ${className}`} style={style} onClick={onClick}>{children}</div>;
}

interface CardHeaderProps {
    title: React.ReactNode;
    description?: string;
    action?: React.ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
    return (
        <div className="card-header">
            <div>
                <h3 className="card-title">{title}</h3>
                {description && <p className="card-description">{description}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

interface CardContentProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export function CardContent({ children, className = '', style }: CardContentProps) {
    return <div className={`card-content ${className}`} style={style}>{children}</div>;
}

export default Card;
