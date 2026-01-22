'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select, Textarea, MultiSelect, ColorPicker } from '@/components/ui';
import { getTasks, createTask, updateTask, deleteTask as deleteTaskAction, updateTaskStatus } from '@/lib/actions/tasks';
import type { TaskStatus as TaskStatusType, TaskPriority as TaskPriorityType } from '@/lib/actions/tasks';
import { getMemberColors, saveMemberColors } from '@/lib/actions/userSettings';
import { CheckCircle2, Circle, Trash2, Edit, Calendar, User as UserIcon } from 'lucide-react';
import { ContentDetailPanel } from '@/components/content/ContentDetailPanel';
import { getActiveTeamMembers, User as DBUser } from '@/lib/actions/users';

// ===== TİPLER =====
interface Task {
    id: string;
    title: string;
    description: string;
    status: 'TODO' | 'DONE';  // Sadeleştirilmiş: 2 status
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    assignees: string[];
    project: string;
    dueDate: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    // Content bilgileri (İş Yönetimi bağlantısı)
    contentType?: string;
    brandId?: string;
    brandName?: string;
    notes?: string;
}

// Sadeleştirilmiş Status Config (2 adet)
const statusConfig = {
    TODO: { label: 'Yapılacak', color: '#FF9800', icon: Circle },
    DONE: { label: 'Tamamlandı', color: '#00F5B0', icon: CheckCircle2 },
};

const priorityConfig = {
    LOW: { label: 'Düşük', color: '#6B7B80' },
    NORMAL: { label: 'Normal', color: '#329FF5' },
    HIGH: { label: 'Yüksek', color: '#F6D73C' },
    URGENT: { label: 'Acil', color: '#FF4242' },
};

// Takım üyeleri (Dinamik yükleniyor)
// const defaultMemberColors... (Removed)
// const teamMembers... (Removed)

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showColorSettings, setShowColorSettings] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'TODO' | 'DONE'>('ALL');
    const [filterPriority, setFilterPriority] = useState<string>('ALL');
    const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Kişi renkleri state
    // Kişi renkleri state
    const [teamMemberColors, setTeamMemberColors] = useState<Record<string, string>>({});
    const [currentUser, setCurrentUser] = useState<{ name: string; id: string } | null>(null);
    const [noteHistory, setNoteHistory] = useState<any[]>([]); // Tasks için basitleştirilmiş history

    // Kullanıcıyı yükle
    useEffect(() => {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }
    }, []);

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formPriority, setFormPriority] = useState<Task['priority']>('NORMAL');
    const [formAssignees, setFormAssignees] = useState<string[]>([]);
    const [formProject, setFormProject] = useState('');
    const [formDueDate, setFormDueDate] = useState('');
    const [formTags, setFormTags] = useState('');

    // Load tasks from database
    useEffect(() => {
        const loadTasks = async () => {
            try {
                setLoading(true);
                const dbTasks = await getTasks();

                // DB'deki tüm status'ları TODO veya DONE'a mapla
                const formattedTasks: Task[] = dbTasks.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    description: t.description || '',
                    // Status mapping: DONE kalır, diğer her şey TODO olur
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
            } catch (error) {
                console.error('Görevler yüklenirken hata:', error);
            } finally {
                setLoading(false);
            }
        };
        loadTasks();

        // Renkleri yükle
        const loadColors = async () => {
            try {
                const colors = await getMemberColors();
                setTeamMemberColors(colors);
            } catch (e) {
                console.error('Renkler yüklenemedi:', e);
            }
        };
        loadColors();
    }, []);

    // Renk değiştiğinde kaydet
    const updateMemberColor = async (member: string, color: string) => {
        const newColors = { ...teamMemberColors, [member]: color };
        setTeamMemberColors(newColors);
        try {
            await saveMemberColors(newColors);
        } catch (e) {
            console.error('Renk kaydedilemedi:', e);
        }
    };

    // Görev tamamla/geri al toggle
    const toggleTaskStatus = async (task: Task) => {
        const newStatus = task.status === 'TODO' ? 'DONE' : 'TODO';

        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
        ));

        // DB'ye kaydet
        try {
            await updateTaskStatus(task.id, newStatus as TaskStatusType);
        } catch (error) {
            console.error('Status güncellenirken hata:', error);
            // Rollback
            setTasks(prev => prev.map(t =>
                t.id === task.id ? { ...t, status: task.status } : t
            ));
        }
    };

    // Görev sil
    const handleDeleteTask = async (task: Task) => {
        if (!confirm(`"${task.title}" görevini silmek istediğinize emin misiniz?`)) return;

        try {
            await deleteTaskAction(task.id);
            setTasks(prev => prev.filter(t => t.id !== task.id));
            setShowDetailModal(false);
        } catch (error) {
            console.error('Görev silinirken hata:', error);
            alert('Görev silinirken bir hata oluştu');
        }
    };

    // Modal işlemleri
    const openAddModal = () => {
        setEditingTask(null);
        setFormTitle('');
        setFormDescription('');
        setFormPriority('NORMAL');
        setFormAssignees([]);
        setFormProject('');
        setFormDueDate('');
        setFormTags('');
        setShowModal(true);
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setFormTitle(task.title);
        setFormDescription(task.description);
        setFormPriority(task.priority);
        setFormAssignees(task.assignees);
        setFormProject(task.project);
        setFormDueDate(task.dueDate);
        setFormTags(task.tags.join(', '));
        setShowModal(true);
    };

    const openDetailModal = (task: Task) => {
        setSelectedTask(task);
        setShowDetailModal(true);
    };

    const saveTask = async () => {
        if (!formTitle) return;

        const today = new Date().toISOString().split('T')[0];
        const tags = formTags.split(',').map(t => t.trim()).filter(t => t);

        try {
            if (editingTask) {
                await updateTask(editingTask.id, {
                    title: formTitle,
                    description: formDescription,
                    priority: formPriority as TaskPriorityType,
                    dueDate: formDueDate || null,
                    assigneeIds: formAssignees,
                    assigneeId: formAssignees[0] || null,
                });
                setTasks(prev => prev.map(t => t.id === editingTask.id ? {
                    ...t,
                    title: formTitle,
                    description: formDescription,
                    priority: formPriority,
                    assignees: formAssignees,
                    project: formProject,
                    dueDate: formDueDate,
                    tags,
                    updatedAt: today
                } : t));
            } else {
                const newTask = await createTask({
                    title: formTitle,
                    description: formDescription,
                    priority: formPriority as TaskPriorityType,
                    dueDate: formDueDate || undefined,
                    assigneeIds: formAssignees,
                    assigneeId: formAssignees[0] || undefined,
                });
                setTasks(prev => [...prev, {
                    id: newTask.id,
                    title: formTitle,
                    description: formDescription,
                    status: 'TODO',
                    priority: formPriority,
                    assignees: formAssignees,
                    project: formProject,
                    dueDate: formDueDate,
                    tags,
                    createdAt: today,
                    updatedAt: today
                }]);
            }
            setShowModal(false);
        } catch (error) {
            console.error('Görev kaydedilemedi:', error);
            alert('Görev kaydedilirken bir hata oluştu');
        }
    };

    // Filtreleme
    const filteredTasks = React.useMemo(() => tasks.filter(task => {
        if (filterStatus !== 'ALL' && task.status !== filterStatus) return false;
        if (filterPriority !== 'ALL' && task.priority !== filterPriority) return false;
        if (filterAssignee !== 'ALL' && !task.assignees.includes(filterAssignee)) return false;
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    }), [tasks, filterStatus, filterPriority, filterAssignee, searchQuery]);

    // İstatistikler
    const stats = React.useMemo(() => ({
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'TODO').length,
        done: tasks.filter(t => t.status === 'DONE').length,
        urgent: tasks.filter(t => t.priority === 'URGENT' && t.status === 'TODO').length
    }), [tasks]);

    // Tarihe göre sırala (deadline yakın olanlar önce)
    const sortedTasks = React.useMemo(() => [...filteredTasks].sort((a, b) => {
        // Tamamlananlar en sona
        if (a.status === 'DONE' && b.status !== 'DONE') return 1;
        if (a.status !== 'DONE' && b.status === 'DONE') return -1;
        // Tarihe göre sırala
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
    }), [filteredTasks]);

    // Panel state
    // Panel state
    const [activeTeam, setActiveTeam] = useState<DBUser[]>([]);

    useEffect(() => {
        getActiveTeamMembers().then(setActiveTeam);
    }, []);

    // Not güncelleme handler 
    // Not güncelleme handler 
    const handleUpdateNotes = async (id: string, note: string) => {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, notes: note, description: note } : t));

        // Log to local history for UI
        const timestamp = new Date().toISOString();
        if (currentUser) {
            setNoteHistory(prev => [...prev, {
                id: Date.now().toString(),
                contentId: id,
                user: currentUser.name,
                action: 'Not güncelledi',
                note: note,
                timestamp
            }]);
        }

        try {
            await updateTask(id, { notes: note, description: note });
        } catch (error) {
            console.error('Not güncellenemedi:', error);
        }
    };

    // Status update handler for Panel
    const handlePanelStatusUpdate = async (id: string, status: any) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const newStatus = status === 'PAYLASILD' || status === 'TESLIM' ? 'DONE' : 'TODO';
            if (task.status !== newStatus) {
                await toggleTaskStatus(task);
            }
        }
    };



    // ... (rest of the component logic)

    return (
        <>
            <Header
                title="Görevler"
                subtitle="İş Takibi ve Yönetimi"
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                        <div style={{
                            display: 'flex',
                            backgroundColor: 'var(--color-surface)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '2px',
                            border: '1px solid var(--color-border)'
                        }}>
                            {/* Stats removed from header to keep simple or keep them if needed */}
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setShowColorSettings(true)}>🎨</Button>
                        <Button variant="primary" onClick={openAddModal}>+ Yeni Görev</Button>
                    </div>
                }
            />

            <div style={{ padding: 'var(--space-3)', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
                {/* 2 Column Grid + Detail Panel */}
                <div style={{ display: 'grid', gridTemplateColumns: selectedTask ? '1fr 1fr 400px' : '1fr 1fr', gap: 'var(--space-3)', height: '100%' }}>

                    {/* SOL SÜTUN: HAZIRLANANLAR (TODO) */}
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: 'var(--space-2)', backgroundColor: 'rgba(255, 152, 0, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 152, 0, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#FF9800', display: 'flex', alignItems: 'center', gap: 8 }}>
                                ⏳ Hazırlananlar <Badge style={{ backgroundColor: '#FF9800', color: 'white' }}>{stats.todo}</Badge>
                            </h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {sortedTasks.filter(t => t.status === 'TODO').map(task => {
                                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status === 'TODO';
                                const isSelected = selectedTask?.id === task.id;
                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => setSelectedTask(task)}
                                        style={{
                                            padding: 'var(--space-2)',
                                            backgroundColor: 'var(--color-surface)',
                                            borderRadius: 'var(--radius-sm)',
                                            borderTop: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                            borderRight: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                            borderBottom: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            borderLeft: isOverdue ? '4px solid #FF4242' : `4px solid ${priorityConfig[task.priority].color}`
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }}
                                                style={{
                                                    marginTop: 2,
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: '50%',
                                                    border: '2px solid #ccc',
                                                    backgroundColor: 'transparent',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: 600, marginBottom: 4, color: isOverdue ? '#D32F2F' : 'inherit' }}>{task.title}</p>
                                                {task.project && (
                                                    <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>📁 {task.project}</p>
                                                )}

                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                    {task.dueDate && (
                                                        <span style={{ fontSize: 11, padding: '2px 6px', backgroundColor: 'var(--color-background)', borderRadius: 4, color: isOverdue ? '#D32F2F' : 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                                                            📅 {new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    )}
                                                    {task.assignees.slice(0, 3).map(a => (
                                                        <span key={a} style={{ fontSize: 10, padding: '2px 6px', backgroundColor: (teamMemberColors[a] || '#6B7B80') + '20', color: teamMemberColors[a] || '#6B7B80', borderRadius: 10 }}>
                                                            {a.split(' ')[0]}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* SAĞ SÜTUN: TAMAMLANANLAR (DONE) */}
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: 'var(--space-2)', backgroundColor: 'rgba(0, 245, 176, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 245, 176, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#00F5B0', display: 'flex', alignItems: 'center', gap: 8 }}>
                                ✅ Tamamlananlar <Badge style={{ backgroundColor: '#00F5B0', color: 'white' }}>{stats.done}</Badge>
                            </h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {sortedTasks.filter(t => t.status === 'DONE').map(task => {
                                const isSelected = selectedTask?.id === task.id;
                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => setSelectedTask(task)}
                                        style={{
                                            padding: 'var(--space-2)',
                                            backgroundColor: 'var(--color-surface)',
                                            borderRadius: 'var(--radius-sm)',
                                            border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                            opacity: 0.6,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }}
                                                style={{
                                                    marginTop: 2,
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: '50%',
                                                    border: '2px solid #00F5B0',
                                                    backgroundColor: '#00F5B0',
                                                    cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <CheckCircle2 size={12} color="white" />
                                            </button>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: 600, marginBottom: 4, textDecoration: 'line-through', color: 'var(--color-muted)' }}>{task.title}</p>
                                                <p style={{ fontSize: 11, color: '#00F5B0' }}>Tamamlandı: {new Date(task.updatedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* DETAY PANELİ */}
                    {selectedTask && (
                        <ContentDetailPanel
                            content={{
                                id: selectedTask.id,
                                title: selectedTask.title,
                                brandId: selectedTask.brandId || '',
                                status: selectedTask.status === 'DONE' ? 'PAYLASILD' : 'PLANLANDI', // Mapping issue here
                                type: (selectedTask.contentType as any) || 'OTHER',
                                notes: selectedTask.notes || selectedTask.description || '',
                                deliveryDate: selectedTask.dueDate,
                                assigneeIds: selectedTask.assignees,
                                assigneeId: selectedTask.assignees[0]
                            }}
                            onClose={() => setSelectedTask(null)}
                            onUpdateStatus={handlePanelStatusUpdate}
                            onUpdateNotes={handleUpdateNotes}
                            noteHistory={noteHistory}
                            teamMemberColors={teamMemberColors}
                            activeTeam={activeTeam}
                            currentUser={currentUser}
                        />
                    )}
                </div>
            </div>

            {/* Modals ... (keep existing modals logic) */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTask ? '✏️ Görev Düzenle' : '📋 Yeni Görev'} size="md" footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button><Button variant="primary" onClick={saveTask}>Kaydet</Button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <Input label="Başlık *" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Görev adı" />
                    <Textarea label="Açıklama" value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <Select label="Öncelik" value={formPriority} onChange={e => setFormPriority(e.target.value as any)} options={Object.entries(priorityConfig).map(([k, v]) => ({ value: k, label: v.label }))} />
                        <Input label="Tarih" type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} />
                    </div>
                    <MultiSelect label="Sorumlular" value={formAssignees} onChange={setFormAssignees} options={activeTeam.map(m => ({ value: m.name, label: m.name, color: teamMemberColors[m.name] }))} placeholder="Kişi seçiniz..." />
                    <Input label="Etiketler" value={formTags} onChange={e => setFormTags(e.target.value)} placeholder="virgülle ayırın" />
                </div>
            </Modal>

            {/* Color Settings Modal */}
            <Modal isOpen={showColorSettings} onClose={() => setShowColorSettings(false)} title="🎨 Kişi Renk Ayarları" size="md">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: 8 }}>Her takım üyesi için bir renk seçin.</p>
                    {activeTeam.map(member => (
                        <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', borderLeft: `4px solid ${teamMemberColors[member.name] || '#6B7B80'}` }}>
                            <span style={{ fontWeight: 500 }}>{member.name}</span>
                            <ColorPicker value={teamMemberColors[member.name] || '#6B7B80'} onChange={(color) => updateMemberColor(member.name, color)} />
                        </div>
                    ))}
                </div>
            </Modal>
        </>
    );
}
