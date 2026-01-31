'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import styles from './Toast.module.css';

// ===== TİPLER =====
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: ToastMessage[];
    addToast: (toast: Omit<ToastMessage, 'id'>) => void;
    removeToast: (id: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// ===== TOAST PROVIDER =====
interface ToastProviderProps {
    children: React.ReactNode;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function ToastProvider({ children, position = 'top-right' }: ToastProviderProps) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: ToastMessage = {
            ...toast,
            id,
            duration: toast.duration ?? 5000,
        };

        setToasts(prev => [...prev, newToast]);

        // Auto dismiss
        if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, newToast.duration);
        }
    }, [removeToast]);

    const success = useCallback((title: string, message?: string) => {
        addToast({ type: 'success', title, message });
    }, [addToast]);

    const error = useCallback((title: string, message?: string) => {
        addToast({ type: 'error', title, message, duration: 8000 });
    }, [addToast]);

    const warning = useCallback((title: string, message?: string) => {
        addToast({ type: 'warning', title, message });
    }, [addToast]);

    const info = useCallback((title: string, message?: string) => {
        addToast({ type: 'info', title, message });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} position={position} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

// ===== TOAST HOOK =====
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// ===== TOAST CONTAINER =====
interface ToastContainerProps {
    toasts: ToastMessage[];
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    onRemove: (id: string) => void;
}

function ToastContainer({ toasts, position, onRemove }: ToastContainerProps) {
    const positionStyles: Record<string, React.CSSProperties> = {
        'top-right': { top: 20, right: 20 },
        'top-left': { top: 20, left: 20 },
        'bottom-right': { bottom: 20, right: 20 },
        'bottom-left': { bottom: 20, left: 20 },
    };

    return (
        <div className={styles.container} style={positionStyles[position]}>
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
            ))}
        </div>
    );
}

// ===== TOAST ITEM =====
interface ToastProps {
    toast: ToastMessage;
    onRemove: () => void;
}

const icons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
};

function Toast({ toast, onRemove }: ToastProps) {
    const [isExiting, setIsExiting] = useState(false);

    const handleRemove = () => {
        setIsExiting(true);
        setTimeout(onRemove, 300);
    };

    return (
        <div
            className={`${styles.toast} ${styles[toast.type]} ${isExiting ? styles.exiting : ''}`}
            onClick={handleRemove}
        >
            <span className={styles.icon}>{icons[toast.type]}</span>
            <div className={styles.content}>
                <p className={styles.title}>{toast.title}</p>
                {toast.message && <p className={styles.message}>{toast.message}</p>}
            </div>
            <button className={styles.closeButton} onClick={handleRemove}>×</button>
        </div>
    );
}

export default Toast;
