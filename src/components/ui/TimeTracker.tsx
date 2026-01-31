'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button, Input } from '@/components/ui';
import { Play, Square, Plus, Clock, History } from 'lucide-react';
import { startTimeLog, stopActiveTimer, logManualTime, getTaskLogs, getActiveTimer, TimeLog } from '@/lib/actions/timelogs';
import { useToast } from '@/components/ui/Toast';

interface TimeTrackerProps {
    taskId: string;
    userId: string; // Current logged in user
}

export function TimeTracker({ taskId, userId }: TimeTrackerProps) {
    const { success, error } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTimer, setActiveTimer] = useState<TimeLog | null>(null);
    const [logs, setLogs] = useState<TimeLog[]>([]);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualMinutes, setManualMinutes] = useState('');
    const [manualDesc, setManualDesc] = useState('');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initial load
    useEffect(() => {
        loadLogs();
        checkActiveTimer();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [taskId]);

    // Timer tick
    useEffect(() => {
        if (activeTimer) {
            // Fix: Supabase might return TIMESTAMP without 'Z'. We must treat it as UTC.
            const dateStr = activeTimer.startedAt.endsWith('Z') || activeTimer.startedAt.includes('+')
                ? activeTimer.startedAt
                : activeTimer.startedAt + 'Z';

            const start = new Date(dateStr).getTime();

            timerRef.current = setInterval(() => {
                const now = new Date().getTime();
                setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
            }, 1000);

            // Initial set
            const now = new Date().getTime();
            setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setElapsedSeconds(0);
        }
    }, [activeTimer]);

    const loadLogs = async () => {
        const res = await getTaskLogs(taskId);
        if (res?.success) setLogs(res.data);
    };

    const checkActiveTimer = async () => {
        const res = await getActiveTimer(userId);
        if (res?.success && res.data) {
            // Only if the active timer belongs to THIS task
            if (res.data.taskId === taskId) {
                // We use the same 'Z' fix here for consistency if needed, but the effect uses activeTimer state
                setActiveTimer(res.data);
            }
        }
    };

    const handleStart = async () => {
        setLoading(true);
        const res = await startTimeLog(taskId, userId, 'Süre Tutuluyor');
        if (res.success) {
            setActiveTimer(res.data);
            success('Başarılı', 'Süre sayacı başlatıldı.');
            loadLogs(); // Refresh list potentially
        } else {
            error('Hata', 'Sayaç başlatılamadı.');
        }
        setLoading(false);
    };

    const handleStop = async () => {
        setLoading(true);
        const res = await stopActiveTimer(userId);
        if (res.success) {
            setActiveTimer(null);
            success('Başarılı', 'Süre kaydedildi.');
            loadLogs();
        } else {
            error('Hata', 'Sayaç durdurulamadı.');
        }
        setLoading(false);
    };

    const handleManualAdd = async () => {
        if (!manualMinutes) return;
        setLoading(true);
        const res = await logManualTime(taskId, userId, parseInt(manualMinutes), new Date().toISOString(), manualDesc);
        if (res.success) {
            success('Başarılı', 'Süre manuel olarak eklendi.');
            setShowManualInput(false);
            setManualMinutes('');
            setManualDesc('');
            loadLogs();
        } else {
            error('Hata', 'Ekleme başarısız.');
        }
        setLoading(false);
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const totalMinutes = logs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    return (
        <div className="bg-[#1C1C1E] border border-white/5 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/70 font-medium">
                    <Clock size={16} />
                    <span>Zaman Takibi</span>
                </div>
                <div className="text-white/40 text-xs font-mono">
                    Toplam: {totalHours} Saat
                </div>
            </div>

            {/* Active Timer Area */}
            <div className={`p-4 rounded-lg flex items-center justify-between transition-colors ${activeTimer ? 'bg-[#32D74B]/10 border border-[#32D74B]/20' : 'bg-white/5'}`}>
                <div className="font-mono text-2xl font-bold tracking-wider text-white">
                    {activeTimer ? formatTime(elapsedSeconds) : '00:00:00'}
                </div>
                {activeTimer ? (
                    <Button
                        onClick={handleStop}
                        disabled={loading}
                        className="bg-[#FF453A] hover:bg-[#FF453A]/90 text-white border-none flex items-center gap-2"
                    >
                        {loading ? '...' : <><Square size={14} fill="currentColor" /> Durdur</>}
                    </Button>
                ) : (
                    <Button
                        onClick={handleStart}
                        disabled={loading}
                        className="bg-[#32D74B] hover:bg-[#32D74B]/90 text-black border-none flex items-center gap-2"
                    >
                        {loading ? '...' : <><Play size={14} fill="currentColor" /> Başlat</>}
                    </Button>
                )}
            </div>

            {/* Manual Entry Toggle */}
            {!showManualInput ? (
                <button
                    onClick={() => setShowManualInput(true)}
                    className="text-xs text-[#2997FF] hover:underline flex items-center gap-1 w-full justify-center py-2"
                >
                    <Plus size={12} /> Manuel Süre Ekle
                </button>
            ) : (
                <div className="space-y-2 bg-white/5 p-3 rounded-lg animate-in slide-in-from-top-2">
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder="Dk"
                            value={manualMinutes}
                            onChange={(e) => setManualMinutes(e.target.value)}
                            className="w-20"
                        />
                        <Input
                            placeholder="Açıklama (Opsiyonel)"
                            value={manualDesc}
                            onChange={(e) => setManualDesc(e.target.value)}
                            className="flex-1"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setShowManualInput(false)}>İptal</Button>
                        <Button size="sm" onClick={handleManualAdd} disabled={!manualMinutes}>Ekle</Button>
                    </div>
                </div>
            )}

            {/* Recent Logs (Condensed) */}
            {logs.length > 0 && (
                <div className="space-y-2 mt-4">
                    <p className="text-xs text-white/30 uppercase font-bold tracking-wider">Son Kayıtlar</p>
                    <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {logs.slice(0, 5).map(log => (
                            <div key={log.id} className="flex items-center justify-between text-xs p-2 rounded bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-white/80 font-medium">{log.user?.name || 'Kullanıcı'}</span>
                                    <span className="text-white/40 text-[10px]">{new Date(log.startedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-white/40">{log.stageLabel}</span>
                                    <span className="font-mono text-[#329FF5]">{log.durationMinutes} dk</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
