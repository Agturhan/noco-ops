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
    }, [value, duration, displayValue]); // Added displayValue to dependencies

    // The following commented-out useEffect block seems to be a remnant or a thought process.
    // It's not syntactically correct as it's nested within the previous useEffect without proper closure.
    // Based on the instruction "Add `displayValue` to deps in `useEffect`", it refers to the main animation useEffect.
    // I will remove this malformed block to fix the syntax.
    /*
    useEffect(() => {
        let start = 0;
        const end = value;
        if (start === end) return;
        
        // Find logical duration based on difference
        const difference = Math.abs(end - start); // We don't have previous value easily here without ref
        // Let's just use simple animation
        
        let current = 0; // We might want to animate from 0 or previous.
        // For simplicity reusing current logic but adding dependency
        // Actually the logic uses `displayValue` state.
        // We should start from `displayValue` if we want smooth transition, but this component seems to animate on mount or value change?
        
        // ... (preserving existing logic implies I shouldn't rewrite it all)
        // I will just add displayValue to deps list as requested.
    }, [value, duration, displayValue]);
    */

    const formatted = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(displayValue));

    return (
        <span>{prefix}{formatted}{suffix}</span>
    );
};
