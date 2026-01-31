'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    label?: string;
}

// Önceden tanımlı renk paleti
const colorPalette = [
    '#E91E63', // Pembe
    '#F44336', // Kırmızı
    '#FF9800', // Turuncu
    '#FFC107', // Amber
    '#FFEB3B', // Sarı
    '#8BC34A', // Açık Yeşil
    '#4CAF50', // Yeşil
    '#00F5B0', // Turkuaz
    '#00BCD4', // Cyan
    '#329FF5', // Mavi
    '#3F51B5', // İndigo
    '#9C27B0', // Mor
    '#673AB7', // Derin Mor
    '#795548', // Kahverengi
    '#607D8B', // Gri-Mavi
    '#6B7B80', // Gri
];

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
            {label && (
                <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: 'var(--color-muted)',
                    marginBottom: '4px'
                }}>
                    {label}
                </label>
            )}

            {/* Color Preview Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    backgroundColor: value,
                    border: '2px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'transform 0.1s, box-shadow 0.1s'
                }}
                onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.transform = 'scale(1.1)';
                    (e.target as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.transform = 'scale(1)';
                    (e.target as HTMLElement).style.boxShadow = 'none';
                }}
            />

            {/* Color Palette Dropdown */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-z3)',
                    zIndex: 200,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '6px',
                    width: 140
                }}>
                    {colorPalette.map(color => (
                        <button
                            key={color}
                            onClick={() => {
                                onChange(color);
                                setIsOpen(false);
                            }}
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: '6px',
                                backgroundColor: color,
                                border: value === color ? '3px solid white' : '2px solid transparent',
                                cursor: 'pointer',
                                boxShadow: value === color ? `0 0 0 2px ${color}` : 'none',
                                transition: 'transform 0.1s'
                            }}
                            onMouseEnter={(e) => {
                                (e.target as HTMLElement).style.transform = 'scale(1.15)';
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLElement).style.transform = 'scale(1)';
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default ColorPicker;
