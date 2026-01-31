
'use client';

import { useEffect, useState, useRef } from 'react';

export const AnimatedCounter = ({ value, duration = 1500, prefix = '', suffix = '' }: { value: number; duration?: number; prefix?: string; suffix?: string }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const startRef = useRef(0);
    const startTimeRef = useRef(0);

    useEffect(() => {
        startRef.current = displayValue;
        startTimeRef.current = Date.now();

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);

            const current = startRef.current + (value - startRef.current) * ease;
            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    const formatted = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(displayValue));

    return (
        <span>{prefix}{formatted}{suffix}</span>
    );
};
