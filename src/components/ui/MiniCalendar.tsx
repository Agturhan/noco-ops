'use client';

import React, { useState } from 'react';

interface MiniCalendarProps {
    selectedDate: string;
    onSelectDate: (date: string) => void;
}

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export function MiniCalendar({ selectedDate, onSelectDate }: MiniCalendarProps) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(selectedDate ? new Date(selectedDate) : today);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Ayın ilk günü hangi gün
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Pazartesi = 0

    // Ayın son günü
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Önceki ay
    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    // Sonraki ay
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    // Takvim grid'i oluştur
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push(null); // Boş hücreler
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const handleSelectDay = (day: number) => {
        const date = new Date(year, month, day);
        const isoDate = date.toISOString().split('T')[0];
        onSelectDate(isoDate);
    };

    const selectedDateObj = selectedDate ? new Date(selectedDate) : null;
    const isSelected = (day: number) => {
        if (!selectedDateObj) return false;
        return selectedDateObj.getFullYear() === year &&
            selectedDateObj.getMonth() === month &&
            selectedDateObj.getDate() === day;
    };

    const isToday = (day: number) => {
        return today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;
    };

    return (
        <div style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-2)',
            width: '100%'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-2)'
            }}>
                <button
                    onClick={prevMonth}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)'
                    }}
                >◀</button>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>
                    {MONTHS[month]} {year}
                </span>
                <button
                    onClick={nextMonth}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)'
                    }}
                >▶</button>
            </div>

            {/* Gün başlıkları */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '2px',
                marginBottom: '4px'
            }}>
                {DAYS.map(day => (
                    <div key={day} style={{
                        textAlign: 'center',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--color-muted)',
                        padding: '4px'
                    }}>
                        {day}
                    </div>
                ))}
            </div>

            {/* Günler */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '2px'
            }}>
                {days.map((day, idx) => (
                    <div
                        key={idx}
                        onClick={() => day && handleSelectDay(day)}
                        style={{
                            textAlign: 'center',
                            padding: '8px 4px',
                            fontSize: 'var(--text-body-sm)',
                            fontWeight: day && isSelected(day) ? 700 : 400,
                            backgroundColor: day && isSelected(day)
                                ? 'var(--color-primary)'
                                : day && isToday(day)
                                    ? 'rgba(50, 159, 245, 0.15)'
                                    : 'transparent',
                            color: day && isSelected(day)
                                ? 'white'
                                : day
                                    ? 'var(--color-ink)'
                                    : 'transparent',
                            borderRadius: 'var(--radius-sm)',
                            cursor: day ? 'pointer' : 'default',
                            transition: 'all 0.15s',
                            border: day && isToday(day) && !isSelected(day)
                                ? '1px solid var(--color-primary)'
                                : '1px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                            if (day && !isSelected(day)) {
                                (e.target as HTMLElement).style.backgroundColor = 'var(--color-zebra)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (day && !isSelected(day)) {
                                (e.target as HTMLElement).style.backgroundColor = isToday(day)
                                    ? 'rgba(50, 159, 245, 0.15)'
                                    : 'transparent';
                            }
                        }}
                    >
                        {day || ''}
                    </div>
                ))}
            </div>

            {/* Seçilen tarih gösterimi */}
            {selectedDate && (
                <div style={{
                    marginTop: 'var(--space-2)',
                    padding: 'var(--space-1)',
                    backgroundColor: 'var(--color-card)',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center',
                    fontSize: 'var(--text-body-sm)',
                    color: 'var(--color-primary)',
                    fontWeight: 600
                }}>
                    📅 {new Date(selectedDate).toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    })}
                </div>
            )}
        </div>
    );
}

export default MiniCalendar;
