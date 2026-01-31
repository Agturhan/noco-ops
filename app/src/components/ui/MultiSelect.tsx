'use client';

import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectProps {
    label?: string;
    options: { value: string; label: string; color?: string }[];
    value: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
}

export function MultiSelect({ label, options, value, onChange, placeholder = 'Seçiniz...' }: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter(v => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    };

    const removeItem = (optionValue: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(value.filter(v => v !== optionValue));
    };

    const getOptionLabel = (optionValue: string) => {
        return options.find(o => o.value === optionValue)?.label || optionValue;
    };

    const getOptionColor = (optionValue: string) => {
        return options.find(o => o.value === optionValue)?.color;
    };

    // Generate consistent color from string
    const stringToColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = ['#329FF5', '#00F5B0', '#F6D73C', '#FF4242', '#9C27B0', '#E91E63', '#FF9800'];
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            {label && (
                <label style={{
                    display: 'block',
                    fontSize: 'var(--text-body-sm)',
                    fontWeight: 500,
                    color: 'var(--color-sub-ink)',
                    marginBottom: '4px'
                }}>
                    {label}
                </label>
            )}

            {/* Trigger Box */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    minHeight: 40,
                    padding: '6px 12px',
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    alignItems: 'center'
                }}
            >
                {value.length === 0 ? (
                    <span style={{ color: 'var(--color-muted)' }}>{placeholder}</span>
                ) : (
                    value.map(v => {
                        const color = getOptionColor(v) || stringToColor(v);
                        return (
                            <span
                                key={v}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 8px',
                                    backgroundColor: color + '20',
                                    color: color,
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 500
                                }}
                            >
                                {getOptionLabel(v)}
                                <button
                                    onClick={(e) => removeItem(v, e)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'inherit',
                                        cursor: 'pointer',
                                        padding: 0,
                                        fontSize: '14px',
                                        lineHeight: 1
                                    }}
                                >
                                    ×
                                </button>
                            </span>
                        );
                    })
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-z2)',
                    zIndex: 100,
                    maxHeight: 200,
                    overflowY: 'auto'
                }}>
                    {options.map(option => {
                        const isSelected = value.includes(option.value);
                        const color = option.color || stringToColor(option.value);
                        return (
                            <div
                                key={option.value}
                                onClick={() => toggleOption(option.value)}
                                style={{
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? 'var(--color-surface)' : 'transparent',
                                    transition: 'background-color 0.1s'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) (e.target as HTMLElement).style.backgroundColor = 'var(--color-zebra)';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) (e.target as HTMLElement).style.backgroundColor = 'transparent';
                                }}
                            >
                                <span style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: 3,
                                    border: `2px solid ${isSelected ? color : 'var(--color-border)'}`,
                                    backgroundColor: isSelected ? color : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    color: 'white'
                                }}>
                                    {isSelected && '✓'}
                                </span>
                                <span style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: isSelected ? color : 'inherit'
                                }}>
                                    <span style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: color
                                    }} />
                                    {option.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default MultiSelect;
