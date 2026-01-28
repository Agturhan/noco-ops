'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Button, Badge, Modal, Input, Select, Textarea, MultiSelect, ColorPicker } from '@/components/ui';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { MagicBento } from '@/components/react-bits/MagicBento';
import { ShinyText } from '@/components/react-bits/TextAnimations';
import { getTasks, createTask, updateTask, deleteTask as deleteTaskAction, updateTaskStatus } from '@/lib/actions/tasks';
import type { TaskStatus as TaskStatusType, TaskPriority as TaskPriorityType } from '@/lib/actions/tasks';
import { getMemberColors, saveMemberColors } from '@/lib/actions/userSettings';
import { CheckCircle2, Circle, Trash2, Edit, Calendar, User as UserIcon, FolderOpen, Check, Clock, AlertCircle } from 'lucide-react';
import { ContentDetailPanel } from '@/components/content/ContentDetailPanel';
import { NewContentModal } from '@/components/content/NewContentModal';
import { getActiveTeamMembers, User as DBUser } from '@/lib/actions/users';

// ===== TİPLER =====
interface Task {
    id: string;
    title: string;
    description: string;
    status: 'TODO' | 'DONE';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    assignees: string[];
    project: string;
    dueDate: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    contentType?: string;
    brandId?: string;
    brandName?: string;
    notes?: string;
}

const statusConfig = {
    TODO: { label: 'Yapılacak', color: '#FF9800', icon: Circle },
    DONE: { label: 'Tamamlandı', color: '#00F5B0', icon: CheckCircle2 },
};

const priorityConfig = {
    LOW: { label: 'Düşük', color: '#6B7B80', border: 'border-slate-500/20', bg: 'bg-slate-500/10' },
    NORMAL: { label: 'Normal', color: '#329FF5', border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
    HIGH: { label: 'Yüksek', color: '#F6D73C', border: 'border-yellow-500/20', bg: 'bg-yellow-500/10' },
    URGENT: { label: 'Acil', color: '#FF4242', border: 'border-red-500/20', bg: 'bg-red-500/10' },
};

export function TasksPageClient() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showNewContentModal, setShowNewContentModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showColorSettings, setShowColorSettings] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'TODO' | 'DONE'>('ALL');
    const [filterPriority, setFilterPriority] = useState<string>('ALL');
    const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const [teamMemberColors, setTeamMemberColors] = useState<Record<string, string>>({});
    const [currentUser, setCurrentUser] = useState<{ name: string; id: string } | null>(null);
    const [noteHistory, setNoteHistory] = useState<any[]>([]);

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formPriority, setFormPriority] = useState<Task['priority']>('NORMAL');
    const [formAssignees, setFormAssignees] = useState<string[]>([]);
    const [formProject, setFormProject] = useState('');
    const [formDueDate, setFormDueDate] = useState('');
    const [formTags, setFormTags] = useState('');
    const [activeTeam, setActiveTeam] = useState<DBUser[]>([]);

    useEffect(() => {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) setCurrentUser(JSON.parse(userStr));
        getActiveTeamMembers().then(setActiveTeam);
    }, []);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [dbTasks, colors] = await Promise.all([getTasks(), getMemberColors()]);

                const formattedTasks: Task[] = dbTasks.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    description: t.description || '',
                    status: t.status === 'DONE' ? 'DONE' : 'TODO',
                    priority: t.priority || 'NORMAL',
                    assignees: t.assigneeIds || (t.assigneeId ? [t.assigneeId] : []),
                    project: t.project?.name || t.brandName || '',
                    dueDate: t.dueDate || '',
                    tags: t.tags || [],
                    createdAt: t.createdAt || new Date().toISOString(),
                    updatedAt: t.updatedAt || new Date().toISOString(),
                    contentType: t.contentType,
                    brandId: t.brandId || t.clientId,
                    brandName: t.brandName || t.project?.client?.name,
                    notes: t.notes
                }));

                setTasks(formattedTasks);
                setTeamMemberColors(colors);
            } catch (error) {
                console.error('Data loading error:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const updateMemberColor = async (member: string, color: string) => {
        const newColors = { ...teamMemberColors, [member]: color };
        setTeamMemberColors(newColors);
        await saveMemberColors(newColors).catch(console.error);
    };

    const toggleTaskStatus = async (task: Task) => {
        const newStatus = task.status === 'TODO' ? 'DONE' : 'TODO';
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t));

        try {
            await updateTaskStatus(task.id, newStatus as TaskStatusType);
        } catch (error) {
            console.error('Status update failed:', error);
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
        }
    };

    const handleDeleteTask = async (task: Task) => {
        if (!confirm(`"${task.title}" görevini silmek istediğinize emin misiniz?`)) return;
        try {
            await deleteTaskAction(task.id);
            setTasks(prev => prev.filter(t => t.id !== task.id));
            setSelectedTask(null);
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const saveTask = async () => {
        if (!formTitle || !editingTask) return;
        try {
            await updateTask(editingTask.id, {
                title: formTitle,
                description: formDescription,
                priority: formPriority as TaskPriorityType,
                dueDate: formDueDate || null,
                assigneeIds: formAssignees,
                assigneeId: formAssignees[0] || null,
            });

            // Refresh logic omitted for brevity, standard optimistic update
            setTasks(prev => prev.map(t => t.id === editingTask.id ? {
                ...t, title: formTitle, description: formDescription, priority: formPriority,
                assignees: formAssignees, project: formProject, dueDate: formDueDate
            } : t));
            setShowModal(false);
        } catch (error) {
            console.error('Save failed:', error);
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (filterStatus !== 'ALL' && task.status !== filterStatus) return false;
        if (filterPriority !== 'ALL' && task.priority !== filterPriority) return false;
        if (filterAssignee !== 'ALL' && !task.assignees.includes(filterAssignee)) return false;
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        if (a.status === 'DONE' && b.status !== 'DONE') return 1;
        if (a.status !== 'DONE' && b.status === 'DONE') return -1;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
    });

    const todoTasks = sortedTasks.filter(t => t.status === 'TODO');
    const doneTasks = sortedTasks.filter(t => t.status === 'DONE');

    return (
        <div className="p-4 md:p-6 min-h-screen pt-6 pb-20 md:pb-6">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-1 flex items-center gap-3">
                        <ShinyText text="Görevler" disabled={false} speed={3} className="text-[#2997FF]" />
                    </h1>
                    <p className="text-muted-foreground">İş takibi ve yönetimi</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowColorSettings(true)} className="glass-button">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#FF9800] via-[#E91E63] to-[#329FF5] mr-2" />
                        Renkler
                    </Button>
                    <Button variant="primary" onClick={() => setShowNewContentModal(true)} className="shadow-lg shadow-blue-500/20">
                        + Yeni İş
                    </Button>
                </div>
            </div>

            {/* Responsive Grid */}
            <div className={`grid gap-6 h-full transition-all duration-300 ${selectedTask ? 'grid-cols-1 lg:grid-cols-[1fr_1fr_400px]' : 'grid-cols-1 md:grid-cols-2'}`}>

                {/* TODO Column */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            Yapılacaklar <Badge variant="warning" className="bg-[#FF9800]/10 text-[#FF9800] border-[#FF9800]/20">{todoTasks.length}</Badge>
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {todoTasks.map(task => {
                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status === 'TODO';
                            const priority = priorityConfig[task.priority];

                            return (
                                <GlassSurface
                                    key={task.id}
                                    onClick={() => setSelectedTask(task)}
                                    className={`
                                        p-4 cursor-pointer group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] border-l-4
                                        ${selectedTask?.id === task.id ? 'ring-1 ring-[#329FF5]/50 bg-white/[0.08]' : ''}
                                    `}
                                    style={{ borderLeftColor: isOverdue ? '#FF4242' : priority.color }}
                                >
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }}
                                            className="mt-1 w-5 h-5 rounded-full border-2 border-white/20 hover:border-[#00F5B0] transition-colors flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className={`font-medium text-sm leading-snug ${isOverdue ? 'text-[#FF4242]' : 'text-white/90'}`}>
                                                    {task.title}
                                                </p>
                                                {isOverdue && <AlertCircle size={14} className="text-[#FF4242] flex-shrink-0 animate-pulse" />}
                                            </div>

                                            {task.project && (
                                                <p className="text-xs text-white/40 mt-1 flex items-center gap-1.5">
                                                    <FolderOpen size={10} /> {task.project}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                                                {task.dueDate && (
                                                    <span className={`text-[10px] flex items-center gap-1 font-medium ${isOverdue ? 'text-[#FF4242]' : 'text-white/40'}`}>
                                                        <Calendar size={10} />
                                                        {new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                )}

                                                {task.assignees.length > 0 && (
                                                    <div className="flex -space-x-1.5">
                                                        {task.assignees.map(a => {
                                                            const user = activeTeam.find(u => u.id === a);
                                                            const name = user ? user.name : a;
                                                            return (
                                                                <div key={a}
                                                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ring-1 ring-[#121212]"
                                                                    style={{ backgroundColor: teamMemberColors[a] || '#6B7B80', color: 'white' }}
                                                                    title={name}
                                                                >
                                                                    {name.charAt(0).toUpperCase()}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                <Badge className={`ml-auto text-[9px] h-5 px-1.5 border ${priority.border} ${priority.bg} text-white/80`}>
                                                    {priority.label}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </GlassSurface>
                            );
                        })}
                        {todoTasks.length === 0 && (
                            <div className="text-center py-10 opacity-30 text-sm">Hiç görev yok, harika! 🎉</div>
                        )}
                    </div>
                </div>

                {/* DONE Column */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-white/50">
                            Tamamlananlar <Badge variant="neutral" className="bg-white/5 text-white/40">{doneTasks.length}</Badge>
                        </h3>
                    </div>
                    <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
                        {doneTasks.map(task => (
                            <GlassSurface
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                className={`
                                    p-4 cursor-pointer group relative overflow-hidden transition-all bg-black/20 hover:bg-white/[0.04]
                                    ${selectedTask?.id === task.id ? 'ring-1 ring-[#329FF5]/50' : ''}
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }}
                                        className="mt-1 w-5 h-5 rounded-full bg-[#00F5B0] flex items-center justify-center flex-shrink-0"
                                    >
                                        <Check size={12} className="text-black font-bold" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-white/50 line-through decoration-white/20">
                                            {task.title}
                                        </p>
                                        <p className="text-[10px] text-[#00F5B0] mt-1 flex items-center gap-1">
                                            <CheckCircle2 size={10} />
                                            {new Date(task.updatedAt).toLocaleDateString('tr-TR')}
                                        </p>
                                    </div>
                                </div>
                            </GlassSurface>
                        ))}
                    </div>
                </div>

                {/* Detail Panel */}
                {selectedTask && (
                    <div className="hidden lg:block h-full">
                        <div className="sticky top-6">
                            <ContentDetailPanel
                                content={{
                                    id: selectedTask.id,
                                    title: selectedTask.title,
                                    brandId: selectedTask.brandId || '',
                                    status: selectedTask.status === 'DONE' ? 'PAYLASILD' : 'PLANLANDI',
                                    type: (selectedTask.contentType as any) || 'OTHER',
                                    notes: selectedTask.notes || selectedTask.description || '',
                                    deliveryDate: selectedTask.dueDate,
                                    assigneeIds: selectedTask.assignees,
                                    assigneeId: selectedTask.assignees[0]
                                }}
                                onClose={() => setSelectedTask(null)}
                                onUpdateStatus={async (id, status) => {
                                    /* Handler logic same as before */
                                    const task = tasks.find(t => t.id === id);
                                    if (task) toggleTaskStatus(task);
                                }}
                                onUpdateNotes={async (id, note) => {
                                    /* Minimal optimistic update for demo */
                                    setTasks(prev => prev.map(t => t.id === id ? { ...t, notes: note, description: note } : t));
                                    try { await updateTask(id, { notes: note, description: note }); } catch (e) { }
                                }}
                                onDelete={async (id) => {
                                    const task = tasks.find(t => t.id === id);
                                    if (task) handleDeleteTask(task);
                                }}
                                noteHistory={noteHistory}
                                teamMemberColors={teamMemberColors}
                                activeTeam={activeTeam}
                                currentUser={currentUser}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Detail Modal (Slide over on Mobile) */}
            {selectedTask && (
                <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-[#121212] w-full h-[85vh] sm:h-auto sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-white/10 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <h3 className="font-semibold px-2">Görev Detayı</h3>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>Kapat</Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            <ContentDetailPanel
                                content={{
                                    id: selectedTask.id,
                                    title: selectedTask.title,
                                    brandId: selectedTask.brandId || '',
                                    status: selectedTask.status === 'DONE' ? 'PAYLASILD' : 'PLANLANDI',
                                    type: (selectedTask.contentType as any) || 'OTHER',
                                    notes: selectedTask.notes || selectedTask.description || '',
                                    deliveryDate: selectedTask.dueDate,
                                    assigneeIds: selectedTask.assignees,
                                    assigneeId: selectedTask.assignees[0]
                                }}
                                onClose={() => setSelectedTask(null)}
                                onUpdateStatus={async (id, status) => {
                                    const task = tasks.find(t => t.id === id);
                                    if (task) toggleTaskStatus(task);
                                }}
                                onUpdateNotes={async (id, note) => {
                                    setTasks(prev => prev.map(t => t.id === id ? { ...t, notes: note, description: note } : t));
                                    try { await updateTask(id, { notes: note, description: note }); } catch (e) { }
                                }}
                                onDelete={async (id) => {
                                    const task = tasks.find(t => t.id === id);
                                    if (task) handleDeleteTask(task);
                                }}
                                noteHistory={noteHistory}
                                teamMemberColors={teamMemberColors}
                                activeTeam={activeTeam}
                                currentUser={currentUser}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <NewContentModal
                isOpen={showNewContentModal}
                onClose={() => setShowNewContentModal(false)}
                onSuccess={(newItem: any) => {
                    const newTask: Task = {
                        id: newItem.id,
                        title: newItem.title,
                        description: newItem.notes || '',
                        status: newItem.status === 'PAYLASILD' || newItem.status === 'TESLIM' ? 'DONE' : 'TODO',
                        priority: 'NORMAL',
                        assignees: newItem.assigneeIds || (newItem.assigneeId ? [newItem.assigneeId] : []),
                        project: newItem.brandName || '',
                        dueDate: newItem.deliveryDate || '',
                        tags: [],
                        createdAt: newItem.createdAt || new Date().toISOString(),
                        updatedAt: newItem.updatedAt || new Date().toISOString(),
                        contentType: newItem.type,
                        brandId: newItem.brandId,
                        brandName: newItem.brandName,
                        notes: newItem.notes
                    };
                    setTasks(prev => [newTask, ...prev]);
                }}
            />

            <Modal isOpen={showColorSettings} onClose={() => setShowColorSettings(false)} title="Kişi Renk Ayarları" size="md">
                <div className="space-y-2">
                    <p className="text-xs text-white/50 mb-2">Her takım üyesi için bir renk seçin.</p>
                    {activeTeam.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border-l-4" style={{ borderLeftColor: teamMemberColors[member.name] || '#6B7B80' }}>
                            <span className="font-medium text-sm">{member.name}</span>
                            <ColorPicker value={teamMemberColors[member.name] || '#6B7B80'} onChange={(color) => updateMemberColor(member.name, color)} />
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
