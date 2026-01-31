'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button, Badge } from '@/components/ui';

// ===== TİPLER =====
interface FileUploadProps {
    onUpload: (files: File[]) => Promise<void>;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // MB
    disabled?: boolean;
}

interface UploadedFile {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

// ===== FILE UPLOAD COMPONENT =====
export function FileUpload({
    onUpload,
    accept = '*',
    multiple = true,
    maxSize = 10, // 10MB default
    disabled = false,
}: FileUploadProps) {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const validateFile = (file: File): string | undefined => {
        // Boyut kontrolü
        if (file.size > maxSize * 1024 * 1024) {
            return `Dosya çok büyük (max ${maxSize}MB)`;
        }
        return undefined;
    };

    const handleFiles = useCallback((fileList: FileList) => {
        const newFiles: UploadedFile[] = [];

        Array.from(fileList).forEach(file => {
            const error = validateFile(file);
            newFiles.push({
                file,
                progress: 0,
                status: error ? 'error' : 'pending',
                error,
            });
        });

        setFiles(prev => [...prev, ...newFiles]);
    }, [maxSize]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (disabled) return;

        handleFiles(e.dataTransfer.files);
    }, [disabled, handleFiles]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    }, [handleFiles]);

    const handleUpload = async () => {
        const validFiles = files.filter(f => f.status === 'pending').map(f => f.file);

        if (validFiles.length === 0) return;

        setIsUploading(true);

        // Uploading durumuna geçir
        setFiles(prev => prev.map(f =>
            f.status === 'pending' ? { ...f, status: 'uploading' as const, progress: 0 } : f
        ));

        try {
            await onUpload(validFiles);

            // Başarılı
            setFiles(prev => prev.map(f =>
                f.status === 'uploading' ? { ...f, status: 'success' as const, progress: 100 } : f
            ));
        } catch (error: any) {
            // Hata
            setFiles(prev => prev.map(f =>
                f.status === 'uploading' ? { ...f, status: 'error' as const, error: error.message } : f
            ));
        } finally {
            setIsUploading(false);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const clearFiles = () => {
        setFiles([]);
    };

    const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileIcon = (type: string): string => {
        if (type.startsWith('image/')) return '🖼️';
        if (type.startsWith('video/')) return '🎬';
        if (type.startsWith('audio/')) return '🎵';
        if (type.includes('pdf')) return '📄';
        if (type.includes('word')) return '📝';
        if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
        if (type.includes('zip') || type.includes('rar')) return '📦';
        return '📎';
    };

    return (
        <div>
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                    border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)',
                    textAlign: 'center',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    backgroundColor: isDragging ? 'rgba(50, 159, 245, 0.1)' : 'var(--color-surface)',
                    transition: 'all 0.2s ease',
                    opacity: disabled ? 0.5 : 1,
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleInputChange}
                    disabled={disabled}
                    style={{ display: 'none' }}
                />
                <p style={{ fontSize: '32px', marginBottom: 8 }}>📁</p>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>
                    {isDragging ? 'Dosyaları buraya bırakın' : 'Dosyaları sürükleyin veya tıklayın'}
                </p>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                    Maksimum dosya boyutu: {maxSize}MB
                </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <p style={{ fontWeight: 600 }}>{files.length} dosya seçildi</p>
                        <Button variant="ghost" size="sm" onClick={clearFiles}>Temizle</Button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {files.map((item, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: 12,
                                backgroundColor: 'var(--color-card)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)',
                            }}>
                                <span style={{ fontSize: '24px' }}>{getFileIcon(item.file.type)}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        fontWeight: 500,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {item.file.name}
                                    </p>
                                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>
                                        {formatSize(item.file.size)}
                                    </p>
                                    {item.status === 'uploading' && (
                                        <div style={{
                                            height: 4,
                                            backgroundColor: 'var(--color-border)',
                                            borderRadius: 2,
                                            marginTop: 4,
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${item.progress}%`,
                                                backgroundColor: 'var(--color-primary)',
                                                transition: 'width 0.3s',
                                            }} />
                                        </div>
                                    )}
                                </div>
                                <Badge
                                    variant={
                                        item.status === 'success' ? 'success' :
                                            item.status === 'error' ? 'error' :
                                                item.status === 'uploading' ? 'info' : 'warning'
                                    }
                                >
                                    {item.status === 'success' ? '✓' :
                                        item.status === 'error' ? '✗' :
                                            item.status === 'uploading' ? '⏳' : 'Bekliyor'}
                                </Badge>
                                {item.status !== 'uploading' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(index)}
                                        style={{ color: 'var(--color-muted)' }}
                                    >
                                        ✕
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Upload Button */}
                    {files.some(f => f.status === 'pending') && (
                        <Button
                            variant="primary"
                            onClick={handleUpload}
                            disabled={isUploading}
                            style={{ width: '100%', marginTop: 'var(--space-2)' }}
                        >
                            {isUploading ? '⏳ Yükleniyor...' : '📤 Dosyaları Yükle'}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

export default FileUpload;
