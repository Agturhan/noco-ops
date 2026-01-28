'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Modal } from '@/components/ui';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { AssigneeStack } from '@/components/ui/AssigneeStack';
import { getBrandName } from '@/lib/data';
import { getDashboardStats, type DashboardStats } from '@/lib/actions/dashboard';
import { toggleTaskStatus, getUserTodayTasks, getUserWeekDeadlines, updateTask } from '@/lib/actions/tasks';
import { getMemberColors } from '@/lib/actions/userSettings';
import { getRetainerStatus } from '@/lib/actions/content';
import { AnimatedList } from '@/components/react-bits/AnimatedList';
import { MagicBento } from '@/components/react-bits/MagicBento';
import { BlurText, ShinyText } from '@/components/react-bits/TextAnimations';
import { GlassIcon } from '@/components/react-bits/GlassIcons';
import { StarBorder } from '@/components/react-bits/StarBorder';
import { Clapperboard, Camera, Clock, Check, ListChecks, LogOut, X, CheckCircle, Share2, Calendar } from 'lucide-react';
import { DashboardDebugger } from '@/components/debug/DashboardDebugger';

const defaultMemberColors: Record<string, string> = {
    'Şeyma Bora': '#E91E63',
    'Fatih Ustaosmanoğlu': '#329FF5',
    'Ahmet Gürkan Turhan': '#9C27B0',
    'Ayşegül Güler Ustaosmanoğlu': '#FF9800',
    'user-ops': '#9C27B0',
    'user-studio': '#329FF5',
    'user-digital': '#E91E63',
    'user-owner': '#FF9800'
};

const memberNames: Record<string, string> = {
    'user-ops': 'Ahmet Turhan',
    'user-studio': 'Fatih Usta',
    'user-digital': 'Şeyma Bora',
    'user-owner': 'Ayşegül Güler'
};

const CELEBRATION_MESSAGES = [
    "Harika iş! Bu haftayı fethettin.",
    "Tüm görevler tamam! Şimdi kahve molası zamanı.",
    "Efsane performans! Hiçbir şey senin elinden kaçamaz.",
    "Şov yapıyorsun! Bu hafta senden sorulur.",
    "Mükemmel! Liste tertemiz, kafan rahat."
];

interface CurrentUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
};

export function DashboardPageClient() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [todayTasks, setTodayTasks] = useState<any[]>([]);
    const [upcomingStudio, setUpcomingStudio] = useState<any[]>([]);
    const [retainerStats, setRetainerStats] = useState<any[]>([]);
    const [weekDeadlines, setWeekDeadlines] = useState<any[]>([]);
    const [teamMemberColors, setTeamMemberColors] = useState<Record<string, string>>(defaultMemberColors);
    const [taskViewMode, setTaskViewMode] = useState<'today' | 'upcoming'>('today');

    // Define currentDate for display
    const currentDate = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    const handleToggleTask = async (taskId: string) => {
        setTodayTasks(prev => {
            const updated = prev.map(t =>
                t.id === taskId ? { ...t, completed: !t.completed, status: t.completed ? 'TODO' : 'DONE' } : t
            );
            return updated.sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));
        });

        try {
            await toggleTaskStatus(taskId, currentUser?.id);
        } catch (error) {
            console.error('Görev güncellenirken hata:', error);
            setTodayTasks(prev => {
                const updated = prev.map(t =>
                    t.id === taskId ? { ...t, completed: !t.completed, status: t.completed ? 'DONE' : 'TODO' } : t
                );
                return updated.sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));
            });
        }
    };

    const handleSnoozeTask = async (taskId: string) => {
        if (!taskId) return;

        // Calculate new date: Tomorrow
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const newDate = tomorrow.toISOString();

        // Optimistic update: Update local state immediately
        setTodayTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                return { ...t, deadline: new Date(newDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + " (Ertelendi)" };
            }
            return t;
        }));

        // Also update week deadlines if it exists there
        setWeekDeadlines(prev => prev.map(t => {
            if (t.id === taskId) {
                const d = new Date(newDate);
                const daysLeft = Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return { ...t, date: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }), daysLeft };
            }
            return t;
        }));

        try {
            await updateTask(taskId, { dueDate: newDate });

            // Remove from "Today" list as it is snoozed
            setTimeout(() => {
                setTodayTasks(prev => prev.filter(t => t.id !== taskId));
                setSelectedTask(null);
            }, 500); // Small delay to let user see "Ertelendi" or some feedback, or simply close it.

        } catch (error) {
            console.error('Snooze error:', error);
            // Revert logic could be added here
        }
    };

    useEffect(() => {
        const userStr = localStorage.getItem('currentUser');
        let userId = 'user-owner';
        let userName = '';
        if (userStr) {
            const user = JSON.parse(userStr);

            // AUTO-FIX: Corrupted ID correction
            if (user.id === '2' || user.id === '4') {
                console.warn('Fixing corrupted User ID:', user.id);
                if (user.name.includes('Fatih')) user.id = 'user-studio';
                else if (user.name.includes('Seyma')) user.id = 'user-digital';
                else if (user.name.includes('Ahmet')) user.id = 'user-ops';
                else if (user.name.includes('Aysegul')) user.id = 'user-owner';

                // Save fixed user back to storage
                localStorage.setItem('currentUser', JSON.stringify(user));
            }

            setCurrentUser(user);
            userId = user.id || 'user-owner';
            userName = user.name || '';
        }



        const loadDashboardData = async () => {
            try {
                const [dbTasks, dbDeadlines, memberColors] = await Promise.all([
                    getUserTodayTasks(userId),
                    getUserWeekDeadlines(userId),
                    getMemberColors().catch(() => defaultMemberColors),
                ]);

                setTeamMemberColors(memberColors);

                let userTasks = dbTasks || [];
                const now = new Date();
                const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

                if (userId || userName) {
                    const filtered = userTasks.filter((t: any) => {
                        const assignees = t.assigneeIds || [];
                        if (t.assigneeId && !assignees.includes(t.assigneeId)) assignees.push(t.assigneeId);

                        let isAssigned = false;
                        if (userId && assignees.includes(userId)) isAssigned = true;
                        else if (userName) {
                            const lowerUserName = userName.toLowerCase();
                            const firstName = lowerUserName.split(' ')[0].trim();
                            isAssigned = assignees.some((a: string) => {
                                if (!a) return false;
                                return a.toLowerCase().includes(firstName) || lowerUserName.includes(a.toLowerCase());
                            });
                        }
                        if (!isAssigned) return false;

                        if (t.dueDate) {
                            const d = new Date(t.dueDate);
                            // Safe check
                            if (isNaN(d.getTime()) || d.getFullYear() < 2000) return false; // Invalid dates
                            const taskDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                            if (taskDate >= endOfTomorrow) return false; // Future tasks (after tomorrow)
                            if (taskDate < startOfToday) { return !t.completed; } // Overdue logic (only incomplete)
                        } else {
                            // If no due date, show it if it's active (TODO/IN_PROGRESS)
                            if (t.completed) return false;
                        }

                        return true;
                    });

                    filtered.sort((a: any, b: any) => {
                        if (!a.dueDate) return 1; // Undated last
                        if (!b.dueDate) return -1;
                        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                    });
                    userTasks = filtered;
                }

                if (dbDeadlines && dbDeadlines.length > 0) {
                    setWeekDeadlines(dbDeadlines);
                } else {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const weekLater = new Date(today);
                    weekLater.setDate(weekLater.getDate() + 7);
                    const deadlines = userTasks.filter((t: any) => {
                        if (!t.dueDate) return false;
                        const due = new Date(t.dueDate);
                        due.setHours(0, 0, 0, 0);
                        return due >= today && due <= weekLater && t.status !== 'DONE';
                    }).map((t: any) => ({
                        id: t.id,
                        title: t.title,
                        date: new Date(t.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
                        brand: t.project || 'Genel',
                        daysLeft: Math.ceil((new Date(t.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
                        assigneeIds: t.assigneeIds || (t.assigneeId ? [t.assigneeId] : [])
                    })).slice(0, 5);
                    setWeekDeadlines(deadlines);
                }

                const formattedTasks = userTasks.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    brand: t.project?.name || t.brand || 'Genel',
                    priority: t.priority,
                    deadline: t.dueDate ? new Date(t.dueDate).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Belirsiz',
                    completed: t.status === 'DONE',
                    assignee: t.assignee || t.assigneeId || '',
                    assigneeIds: t.assigneeIds || (t.assigneeId ? [t.assigneeId] : [])
                })).slice(0, 10);
                setTodayTasks(formattedTasks);

                let studioData: any[] = [];
                if (typeof window !== 'undefined') { try { const saved = localStorage.getItem('studioBookings'); if (saved) studioData = JSON.parse(saved); } catch (e) { } }
                const studioNow = new Date();
                studioNow.setHours(0, 0, 0, 0);
                const filteredStudio = studioData
                    .filter((b: any) => {
                        const bDate = new Date(b.date);
                        const diffDays = Math.ceil((bDate.getTime() - studioNow.getTime()) / (1000 * 60 * 60 * 24));
                        return diffDays >= 0 && diffDays <= 7;
                    })
                    .sort((a: any, b: any) => new Date(a.date + 'T' + a.startTime).getTime() - new Date(b.date + 'T' + b.startTime).getTime());

                const groupedStudio: any[] = [];
                filteredStudio.forEach((b: any) => {
                    const dateStr = b.date;
                    let group = groupedStudio.find(g => g.date === dateStr);
                    if (!group) { group = { date: dateStr, bookings: [] }; groupedStudio.push(group); }
                    group.bookings.push(b);
                });
                setUpcomingStudio(groupedStudio);

                const [stats, rStats] = await Promise.all([getDashboardStats(), getRetainerStatus()]);
                setDashboardStats(stats);
                setRetainerStats(rStats);
            } catch (error) { console.error('Data load error:', error); }
        };
        loadDashboardData();
    }, []);

    const handleLogout = () => { localStorage.removeItem('currentUser'); router.push('/login'); };

    return (
        <div className="p-4 md:p-6 min-h-screen pt-6">
            {/* Header Section - Compact & Aligned */}
            {/* Header Section Removed (Duplicate) */}

            {/* HEADER SECTION */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-1 flex items-center gap-3">
                        {getGreeting()}, <ShinyText text={currentUser?.name?.split(' ')[0] || 'Misafir'} disabled={false} speed={3} className="text-[#2997FF]" />!
                    </h1>
                    <div className="text-white/40 text-sm font-medium tracking-wide uppercase">{currentDate}</div>
                </div>
                <Link href="/dashboard/content-production?action=new">
                    <Button variant="primary" className="h-[42px] px-6 text-[13px] font-semibold bg-[#0A84FF] hover:bg-[#007AFF] shadow-[0_0_20px_rgba(10,132,255,0.3)] border-none rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                        + Yeni İçerik
                    </Button>
                </Link>
            </div>

            {/* Magic Bento Grid - More whitespace */}
            <MagicBento gap={32}>
                {/* 1. TODAY TASKS (Main Top) - Col span 8 */}
                <div className="md:col-span-8 group relative rounded-[20px] overflow-hidden h-full min-h-[400px] shadow-sm">
                    <StarBorder color="#2997FF" speed="4s" />
                    <GlassSurface className="h-full w-full" intensity="medium">
                        {/* Header: px-6 pt-6 pb-2 */}
                        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                            <h3 className="text-[16px] font-semibold text-white tracking-tight flex items-center gap-2">
                                {taskViewMode === 'today' ? 'Bugünkü Görevlerim' : 'Sıradaki İşler'}
                                {taskViewMode === 'upcoming' && <Badge variant="success" className="text-[10px] h-5 px-2 font-medium bg-[#30D158]/20 text-[#30D158] border-none">Bugün Boş</Badge>}
                            </h3>
                            <Link href="/dashboard/tasks">
                                <Button size="sm" variant="ghost" className="text-[12px] h-auto p-0 text-white/40 hover:text-white transition-colors">Tümünü Gör</Button>
                            </Link>
                        </div>
                        {/* Body: px-6 pb-6 */}
                        <div className="px-6 pb-6">
                            <p className="text-[12px] text-white/40 font-medium mb-4">
                                {taskViewMode === 'today' ? <>{todayTasks.filter(t => !t.completed).length} aktif görev</> : 'Checking upcoming items...'}
                            </p>
                            <AnimatedList className="flex flex-col gap-2">
                                {todayTasks.length > 0 ? todayTasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => setSelectedTask(task)}
                                        className="relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/[0.08] hover:scale-[1.005] border border-white/5 bg-white/[0.03]"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                onClick={(e) => { e.stopPropagation(); handleToggleTask(task.id); }}
                                                className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-300 ${task.completed ? 'border-[#30D158] bg-[#30D158]' : 'border-white/20 hover:border-[#30D158]/60'
                                                    }`}
                                            >
                                                {task.completed && <Check size={12} color="white" strokeWidth={3} />}
                                            </div>
                                            {/* Priority Dot */}
                                            <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'urgent' ? 'bg-[#FF453A] shadow-[0_0_8px_rgba(255,69,58,0.6)]' : task.priority === 'high' ? 'bg-[#FFD60A]' : 'bg-[#2997FF]'
                                                }`} />
                                            <div>
                                                <p className={`text-[14px] font-medium leading-snug ${task.completed ? 'line-through text-white/30' : 'text-white/90'}`}>
                                                    {task.title}
                                                </p>
                                                <p className="text-[11px] text-white/40">{task.brand}</p>
                                            </div>
                                        </div>
                                        {!task.completed && task.assigneeIds?.length > 0 && (
                                            <AssigneeStack assignees={task.assigneeIds.map((id: string) => {
                                                const realName = memberNames[id] || id;
                                                return { id: id, name: realName, color: teamMemberColors[realName] || teamMemberColors[id] };
                                            })} size={24} max={4} />
                                        )}
                                    </div>
                                )) : (
                                    <div className="text-center py-10 text-white/20 text-xs text-sm">
                                        Bugün için atanmış görev yok!
                                    </div>
                                )}
                            </AnimatedList>
                        </div>
                    </GlassSurface>
                </div>

                {/* 2. DEADLINES (Side Top) - Col span 4 */}
                <div className="md:col-span-4 group relative rounded-[20px] overflow-hidden h-full shadow-sm">
                    <StarBorder color="#FF453A" speed="5s" />
                    <GlassSurface className="h-full w-full" intensity="medium">
                        <div className="px-6 pt-6 pb-4">
                            <h3 className="text-[16px] font-semibold text-white tracking-tight">Bu Hafta Deadline</h3>
                        </div>
                        <div className="px-6 pb-6 flex flex-col gap-3">
                            {weekDeadlines.length > 0 ? (
                                weekDeadlines.every(dl => dl.status === 'DONE') ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <p className="text-[13px] font-medium text-white/80 px-4 leading-relaxed">{CELEBRATION_MESSAGES[0]}</p>
                                    </div>
                                ) : (
                                    weekDeadlines.map(dl => (
                                        <div
                                            key={dl.id}
                                            onClick={() => setSelectedTask(dl)} /* Tıklanabilirlik eklendi */
                                            className="flex items-center justify-between p-4 border border-white/5 rounded-2xl bg-black/20 hover:bg-white/[0.06] cursor-pointer transition-colors"
                                        >
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[14px] font-medium text-white/90 leading-tight">{dl.title}</span>
                                                <span className={`text-[12px] font-medium flex items-center gap-1.5 ${dl.daysLeft <= 1 ? 'text-[#FF453A]' : 'text-white/50'}`}>
                                                    <span className="opacity-90 tracking-wide text-[11px] uppercase">{dl.date}</span>
                                                    <span className="w-0.5 h-0.5 rounded-full bg-white/40"></span>
                                                    <span>{dl.status === 'DONE' ? 'Tamamlandı' : `${dl.daysLeft} gün kaldı`}</span>
                                                </span>
                                            </div>
                                            {dl.assigneeIds && dl.assigneeIds.length > 0 && (
                                                <AssigneeStack assignees={dl.assigneeIds.map((id: string) => {
                                                    const realName = memberNames[id] || id;
                                                    return { id: id, name: realName, color: teamMemberColors[realName] || teamMemberColors[id] };
                                                })} size={22} max={3} />
                                            )}
                                        </div>
                                    ))
                                )
                            ) : (
                                <div className="text-white/30 text-xs text-center py-10">
                                    Bu hafta teslim edilecek iş yok.
                                </div>
                            )}
                        </div>
                    </GlassSurface>
                </div>

                {/* 3. STUDIO (Side Bottom) - Col span 4 */}
                <div className="md:col-span-4 md:order-last group relative rounded-[20px] overflow-hidden h-full shadow-sm">
                    <StarBorder color="#BF5AF2" speed="6s" />
                    <GlassSurface className="h-full w-full" intensity="medium">
                        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                            <h3 className="text-[16px] font-semibold text-white tracking-tight">Stüdyo Programı</h3>
                            <Link href="/dashboard/studio"><Button variant="ghost" size="sm" className="text-[12px] h-auto p-0 text-white/40 hover:text-white transition-colors">Detay →</Button></Link>
                        </div>
                        <div className="px-6 pb-6 pt-1">
                            <div className="flex flex-col gap-6">
                                {upcomingStudio.length > 0 ? upcomingStudio.map(group => (
                                    <div key={group.date}>
                                        <p className="text-[11px] font-bold text-[#2997FF] mb-3 uppercase tracking-widest opacity-80">{group.date}</p>
                                        <div className="flex flex-col gap-2.5">
                                            {group.bookings.map((booking: any) => (
                                                <div
                                                    key={booking.id}
                                                    onClick={() => setSelectedBooking(booking)}
                                                    className="flex items-center gap-3.5 p-3 bg-white/[0.02] rounded-xl border border-white/5 hover:bg-white/[0.08] cursor-pointer transition-colors"
                                                >
                                                    <span className="text-[12px] font-bold min-w-[64px] text-center bg-white/[0.08] py-1.5 rounded-lg text-white/90">{booking.time}</span>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[13px] font-semibold text-white/90">{booking.client}</span>
                                                        <span className="text-[11px] text-white/50">{booking.project}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-white/30 text-xs">Program boş</div>
                                )}
                            </div>
                        </div>
                    </GlassSurface>
                </div>

                {/* 4. RETAINER (Main Bottom) - Col span 8 */}
                <div className="md:col-span-8 group relative rounded-[20px] overflow-hidden h-full shadow-sm">
                    <StarBorder color="#00D4FF" speed="7s" />
                    <GlassSurface className="h-full w-full" intensity="medium">
                        <div className="px-8 pt-8 pb-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-[18px] font-semibold text-white tracking-tight">Hakediş Paneli</h3>
                                <p className="text-[12px] text-white/40 mt-1">Aylık Üretim (Ocak 2026)</p>
                            </div>
                            <Link href="/dashboard/retainers"><Button variant="ghost" size="sm" className="text-[13px] h-auto p-0 text-white/40 hover:text-white transition-colors">Rapor</Button></Link>
                        </div>
                        <div className="px-8 pb-8">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/[0.08] text-white/40 text-[11px] uppercase tracking-wider">
                                            <th className="pb-4 pl-2 font-medium">Müşteri</th>
                                            <th className="pb-4 font-medium w-[40%]">Durum</th>
                                            <th className="pb-4 font-medium">Stok</th>
                                            <th className="pb-4 font-medium text-right pr-2">Not</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.04]">
                                        {retainerStats.length > 0 ? retainerStats.map((item) => (
                                            <tr key={item.id} className="group/row hover:bg-white/[0.02] transition-colors">
                                                <td className="py-3.5 pl-2 font-medium text-white text-[14px]">
                                                    <Link
                                                        href={item.clientId ? `/dashboard/system/clients?id=${item.clientId}` : `/dashboard/system/clients`}
                                                        className="no-underline hover:text-[#2997FF] transition-colors relative group-link"
                                                    >
                                                        {item.client}
                                                    </Link>
                                                </td>
                                                <td className="py-3.5 pr-6">
                                                    <div className="flex items-center gap-[2px] h-3 mb-1.5">
                                                        {Array.from({ length: item.total || 8 }).map((_, i) => {
                                                            const isFilled = i < (item.progress || 0);
                                                            // Calculate color based on percentage
                                                            const usagePercent = item.total > 0 ? (item.progress / item.total) * 100 : 0;
                                                            let bgColor = 'rgba(255,255,255,0.1)';

                                                            if (isFilled) {
                                                                if (usagePercent >= 100) bgColor = '#FF453A'; // Red
                                                                else if (usagePercent >= 80) bgColor = '#FF9F0A'; // Orange
                                                                else bgColor = '#32D74B'; // Green
                                                            }

                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className="flex-1 h-full rounded-[1px]"
                                                                    style={{
                                                                        backgroundColor: bgColor,
                                                                        opacity: isFilled ? 1 : 0.4
                                                                    }}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] bg-white/[0.08] text-white/80 px-2 py-0.5 rounded-md font-medium">{item.label}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 font-medium text-[13px] text-white/90">{item.stock} ad.</td>
                                                <td className="py-3.5 text-[12px] text-white/40 text-right pr-2 max-w-[180px] truncate">{item.note}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={4} className="text-center py-6 text-white/30">Veri yok...</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </GlassSurface>
                </div>
            </MagicBento >

            {/* Slide-over Panel for Task Detail */}
            < div className={`fixed inset-0 z-[100] transition-all duration-500 ${selectedTask ? 'bg-black/60 backdrop-blur-[4px] pointer-events-auto' : 'bg-transparent pointer-events-none delay-100'}`
            }>
                <div
                    className={`absolute top-2 right-2 bottom-2 w-full max-w-[420px] bg-[#161616]/95 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[24px] z-10 transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col overflow-hidden ${selectedTask ? 'translate-x-0' : 'translate-x-[110%]'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {selectedTask && (
                        <>
                            {/* Slide-over Header */}
                            <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-white/5 shrink-0">
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-wrap gap-2 mb-1">
                                        <Badge variant="neutral" className={`border-none px-2 py-0.5 text-[10px] font-bold tracking-wider ${selectedTask?.priority === 'urgent' ? 'bg-red-500/10 text-red-400' :
                                            selectedTask?.priority === 'high' ? 'bg-amber-500/10 text-amber-400' :
                                                selectedTask?.priority === 'medium' ? 'bg-blue-500/10 text-blue-400' :
                                                    'bg-gray-500/10 text-gray-400'
                                            }`}>
                                            {selectedTask.priority === 'urgent' ? 'ACİL' : selectedTask.priority === 'high' ? 'YÜKSEK' : selectedTask.priority === 'medium' ? 'NORMAL' : 'DÜŞÜK'}
                                        </Badge>
                                        <Badge variant="neutral" className="bg-white/5 text-white/50 border-none px-2 py-0.5 text-[10px] font-bold tracking-wider">{getBrandName(selectedTask?.brand)}</Badge>
                                    </div>
                                    <h2 className="text-xl font-semibold text-white leading-snug">{selectedTask.title}</h2>
                                </div>
                                <button onClick={() => setSelectedTask(null)} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer z-50">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Slide-over Body */}
                            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                                {/* Action Bar */}
                                <div className="flex gap-2 mb-8">
                                    <Button onClick={() => handleToggleTask(selectedTask.id)} variant="ghost" size="sm" className={`flex-1 border border-white/10 bg-white/5 hover:bg-white/10 text-xs h-10 ${selectedTask.completed ? 'text-[#30D158]' : 'text-white/80'}`}>
                                        <CheckCircle size={15} className={`mr-2 ${selectedTask.completed ? 'fill-[#30D158]/20' : ''}`} /> {selectedTask.completed ? 'Tamamlandı' : 'Tamamla'}
                                    </Button>
                                    <Button onClick={() => handleSnoozeTask(selectedTask.id)} variant="ghost" size="sm" className="flex-1 border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 text-xs h-10">
                                        <Clock size={15} className="mr-2" /> Ertele
                                    </Button>
                                    <Button variant="ghost" size="sm" className="flex-1 border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 text-xs h-10">
                                        <Share2 size={15} className="mr-2" /> Paylaş
                                    </Button>
                                </div>

                                {/* Description */}
                                <div className="mb-8">
                                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 pl-1">Açıklama</h4>
                                    <div className="text-[14px] leading-relaxed text-white/80 whitespace-pre-wrap font-light p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        {selectedTask.description || <span className="text-white/20 italic">Açıklama girilmemiş.</span>}
                                    </div>
                                </div>

                                {/* Metadata Grid */}
                                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 pl-1">Detaylar</h4>
                                <div className="grid grid-cols-1 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                                    <div className="bg-white/[0.02] p-4 flex items-center justify-between group/meta hover:bg-white/[0.04] transition-colors">
                                        <span className="text-[13px] text-white/50">Son Tarih</span>
                                        <div className="flex items-center gap-2 text-white/90 text-[13px] font-medium">
                                            <Clock size={14} className="text-[#F5A623]" />
                                            {selectedTask.deadline}
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] p-4 flex items-center justify-between group/meta hover:bg-white/[0.04] transition-colors">
                                        <span className="text-[13px] text-white/50">Atanan Kişi</span>
                                        <div className="flex items-center gap-2 text-white/90 text-[13px]">
                                            {selectedTask?.assigneeIds?.length > 0 ? (
                                                <div className="flex items-center gap-1.5">
                                                    <AssigneeStack assignees={selectedTask.assigneeIds.map((id: string) => {
                                                        const realName = memberNames[id] || id;
                                                        return { id: id, name: realName, color: teamMemberColors[realName] || teamMemberColors[id] };
                                                    })} size={20} max={3} />
                                                </div>
                                            ) : <span className="text-white/30">Yok</span>}
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] p-4 flex items-center justify-between group/meta hover:bg-white/[0.04] transition-colors">
                                        <span className="text-[13px] text-white/50">Durum</span>
                                        <div className="flex items-center gap-2 text-white/90 text-[13px]">
                                            <div className={`w-2 h-2 rounded-full ${selectedTask.completed ? 'bg-[#30D158] shadow-[0_0_8px_rgba(48,209,88,0.4)]' : 'bg-white/20'}`} />
                                            {selectedTask.completed ? 'Tamamlandı' : 'Beklemede'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                {/* Backdrop Click to Close */}
                <div className="absolute inset-0 z-0" onClick={() => setSelectedTask(null)} />
            </div >

            {/* Slide-over Panel for Booking Detail */}
            < div className={`fixed inset-0 z-[100] transition-all duration-500 ${selectedBooking ? 'bg-black/60 backdrop-blur-[4px] pointer-events-auto' : 'bg-transparent pointer-events-none delay-100'}`}>
                <div
                    className={`absolute top-2 right-2 bottom-2 w-full max-w-[420px] bg-[#161616]/95 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[24px] z-10 transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col overflow-hidden ${selectedBooking ? 'translate-x-0' : 'translate-x-[110%]'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {selectedBooking && (
                        <>
                            <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-white/5 shrink-0">
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-wrap gap-2 mb-1">
                                        <Badge variant="neutral" className={`border-none px-2 py-0.5 text-[10px] font-bold tracking-wider ${selectedBooking?.type === 'EXTERNAL' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {selectedBooking?.type === 'EXTERNAL' ? 'DIŞ ÇEKİM' : 'STÜDYO'}
                                        </Badge>
                                    </div>
                                    <h2 className="text-xl font-semibold text-white leading-snug">{selectedBooking.project}</h2>
                                    <p className="text-sm text-white/50">{selectedBooking.client}</p>
                                </div>
                                <button onClick={() => setSelectedBooking(null)} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer z-50">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3 pl-1">Rezervasyon Detayları</h4>
                                <div className="grid grid-cols-1 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                                    <div className="bg-white/[0.02] p-4 flex items-center justify-between group/meta hover:bg-white/[0.04] transition-colors">
                                        <span className="text-[13px] text-white/50">Tarih</span>
                                        <div className="flex items-center gap-2 text-white/90 text-[13px] font-medium">
                                            <Calendar size={14} className="text-[#2997FF]" />
                                            {selectedBooking.date ? new Date(selectedBooking.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }) : ''}
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] p-4 flex items-center justify-between group/meta hover:bg-white/[0.04] transition-colors">
                                        <span className="text-[13px] text-white/50">Saat Aralığı</span>
                                        <div className="flex items-center gap-2 text-white/90 text-[13px] font-medium">
                                            <Clock size={14} className="text-white/50" />
                                            {selectedBooking.startTime} - {selectedBooking?.endTime}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <Link href="/dashboard/studio">
                                        <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/15 text-white border-none h-12 rounded-xl text-sm font-medium">Takvime Git</Button>
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="absolute inset-0 z-0" onClick={() => setSelectedBooking(null)} />
            </div >
        </div >
    );
}
