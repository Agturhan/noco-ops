import React from 'react';

type AnimatedListProps = {
    children: React.ReactNode;
    className?: string;
    delay?: number;
};

export const AnimatedList: React.FC<AnimatedListProps> = ({ children, className = '', delay = 100 }) => {
    return (
        <ul className={`flex flex-col gap-2 ${className}`}>
            {React.Children.map(children, (child, index) => (
                <li
                    key={index}
                    className="animate-slide-in-up"
                    style={{ animationDelay: `${index * delay}ms`, animationFillMode: 'both' }}
                >
                    {child}
                </li>
            ))}
        </ul>
    );
};
