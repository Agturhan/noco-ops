'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select, Textarea } from '@/components/ui';
import { getTasks, createTask, updateTask, deleteTask as deleteTaskAction, updateTaskStatus } from '@/lib/actions/tasks';
import type { TaskStatus as TaskStatusType, TaskPriority as TaskPriorityType } from '@/lib/actions/tasks';

// ===== TİPLER =====
interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

interface Task {
    id: string;
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    assignee: string;
    project: string;
    dueDate: string;
    subtasks: Subtask[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

interface HistoryEntry {
    date: string;
    action: string;
    from?: string;
    to?: string;
    user: string;
}

// Merkezi görev kaynağından import
import { getTasksForKanban } from '@/lib/sharedTasks';

// İlk veriler - merkezi kaynaktan (senkronize kalması için)
const initialTasks: Task[] = getTasksForKanban();

const statusConfig = {
    TODO: { label: 'Yapılacak', color: '#6B7B80', icon: '📋' },
    IN_PROGRESS: { label: 'Devam Ediyor', color: '#329FF5', icon: '🔄' },
    IN_REVIEW: { label: 'İncelemede', color: '#F6D73C', icon: '👀' },
    DONE: { label: 'Tamamlandı', color: '#00F5B0', icon: '✅' },
    BLOCKED: { label: 'Engellendi', color: '#FF4242', icon: '🚫' },
};

const priorityConfig = {
    LOW: { label: 'Düşük', color: '#6B7B80' },
    NORMAL: { label: 'Normal', color: '#329FF5' },
    HIGH: { label: 'Yüksek', color: '#F6D73C' },
    URGENT: { label: 'Acil', color: '#FF4242' },
};

const teamMembers = ['Ahmet', 'Mehmet', 'Ali', 'Zeynep', 'Ayşe', 'Şeyma Bora', 'Fatih Ustaosmanoğlu', 'Ayşegül Güler', 'Ahmet Gürkan Turhan'];

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [filterPriority, setFilterPriority] = useState<string>('ALL');
    const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formPriority, setFormPriority] = useState<Task['priority']>('NORMAL');
    const [formAssignee, setFormAssignee] = useState('');
    const [formProject, setFormProject] = useState('');
    const [formDueDate, setFormDueDate] = useState('');
    const [formTags, setFormTags] = useState('');

    const [nextId, setNextId] = useState(100);
    const getId = () => { const id = nextId; setNextId(nextId + 1); return id.toString(); };

    // Load tasks from database
    useEffect(() => {
        const loadTasks = async () => {
            try {
                setLoading(true);
                const data = await getTasks();
                // Transform DB data to local Task format
                const formattedTasks: Task[] = data.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    description: t.description || '',
                    status: t.status,
                    priority: t.priority,
                    assignee: t.assignee?.name || '',
                    project: t.project?.name || '',
                    dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
                    subtasks: [],
                    tags: [],
                    createdAt: t.createdAt?.split('T')[0] || '',
                    updatedAt: t.updatedAt?.split('T')[0] || ''
                }));
                // Fallback to initialTasks if DB is empty
                setTasks(formattedTasks.length > 0 ? formattedTasks : initialTasks);
            } catch (error) {
                console.error('Görevler yüklenirken hata:', error);
                // Use initialTasks on error
                setTasks(initialTasks);
            } finally {
                setLoading(false);
            }
        };
        loadTasks();
    }, []);

    // Tasks değiştiğinde localStorage'a kaydet
    React.useEffect(() => {
        if (tasks.length > 0 && !loading) {
            localStorage.setItem('noco_tasks', JSON.stringify(tasks));
        }
    }, [tasks, loading]);

    // Filtrelenmiş görevler
    const filteredTasks = tasks.filter(task => {
        if (filterPriority !== 'ALL' && task.priority !== filterPriority) return false;
        if (filterAssignee !== 'ALL' && task.assignee !== filterAssignee) return false;
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    // ===== DRAG & DROP =====
    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = 'move';
        const target = e.target as HTMLElement;
        target.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.target as HTMLElement;
        target.style.opacity = '1';
        setDraggedTask(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetStatus: Task['status']) => {
        e.preventDefault();
        if (draggedTask && draggedTask.status !== targetStatus) {
            // Store previous state for rollback
            const previousTasks = [...tasks];
            const previousStatus = draggedTask.status;

            // Optimistic update
            setTasks(tasks.map(t =>
                t.id === draggedTask.id
                    ? { ...t, status: targetStatus, updatedAt: new Date().toISOString().split('T')[0] }
                    : t
            ));

            // Persist to database
            try {
                await updateTaskStatus(draggedTask.id, targetStatus);
            } catch (error) {
                console.error('Durum güncellenirken hata:', error);
                // Rollback on error - restore previous state
                setTasks(previousTasks);
                alert('Görev durumu güncellenirken hata oluştu. Lütfen tekrar deneyin.');
            }
        }
    };

    // ===== MODAL İŞLEMLERİ =====
    const openAddModal = (status?: Task['status']) => {
        setEditingTask(null);
        setFormTitle('');
        setFormDescription('');
        setFormPriority('NORMAL');
        setFormAssignee('');
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
        setFormAssignee(task.assignee);
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
                // Update existing task
                await updateTask(editingTask.id, {
                    title: formTitle,
                    description: formDescription,
                    priority: formPriority as TaskPriorityType,
                    dueDate: formDueDate || null,
                });
                setTasks(tasks.map(t => t.id === editingTask.id ? {
                    ...t,
                    title: formTitle,
                    description: formDescription,
                    priority: formPriority,
                    assignee: formAssignee,
                    project: formProject,
                    dueDate: formDueDate,
                    tags,
                    updatedAt: today
                } : t));
            } else {
                // Create new task
                const newTask = await createTask({
                    title: formTitle,
                    description: formDescription,
                    priority: formPriority as TaskPriorityType,
                    dueDate: formDueDate || undefined,
                });
                setTasks([...tasks, {
                    id: newTask.id,
                    title: formTitle,
                    description: formDescription,
                    status: 'TODO',
                    priority: formPriority,
                    assignee: formAssignee,
                    project: formProject,
                    dueDate: formDueDate,
                    subtasks: [],
                    tags,
                    createdAt: today,
                    updatedAt: today
                }]);
            }
            setShowModal(false);
        } catch (error) {
            console.error('Görev kaydedilirken hata:', error);
            alert('Görev kaydedilirken bir hata oluştu');
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
            try {
                await deleteTaskAction(id);
                setTasks(tasks.filter(t => t.id !== id));
            } catch (error) {
                console.error('Görev silinirken hata:', error);
                alert('Görev silinirken bir hata oluştu');
            }
        }
    };

    const toggleSubtask = (taskId: string, subtaskId: string) => {
        setTasks(tasks.map(t => t.id === taskId ? {
            ...t,
            subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
        } : t));
    };

    const addSubtask = (taskId: string, title: string) => {
        if (!title) return;
        setTasks(tasks.map(t => t.id === taskId ? {
            ...t,
            subtasks: [...t.subtasks, { id: getId(), title, completed: false }]
        } : t));
    };

    // İstatistikler
    const stats = {
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'TODO').length,
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        inReview: tasks.filter(t => t.status === 'IN_REVIEW').length,
        done: tasks.filter(t => t.status === 'DONE').length,
        blocked: tasks.filter(t => t.status === 'BLOCKED').length,
    };

    return (
        <>
            <Header
                title="Görev Takibi"
                subtitle="Kanban Board - Sürükle & Bırak"
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                        <Input
                            placeholder="🔍 Görev ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: 200 }}
                        />
                        <Select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            options={[
                                { value: 'ALL', label: 'Tüm Öncelikler' },
                                ...Object.entries(priorityConfig).map(([k, v]) => ({ value: k, label: v.label }))
                            ]}
                        />
                        <Select
                            value={filterAssignee}
                            onChange={(e) => setFilterAssignee(e.target.value)}
                            options={[
                                { value: 'ALL', label: 'Tüm Kişiler' },
                                ...teamMembers.map(m => ({ value: m, label: m }))
                            ]}
                        />
                        <Button variant="primary" onClick={() => openAddModal()}>+ Yeni Görev</Button>
                    </div>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* İstatistikler */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-3)',
                    flexWrap: 'wrap'
                }}>
                    {Object.entries(statusConfig).map(([key, config]) => (
                        <div key={key} style={{
                            padding: 'var(--space-2)',
                            backgroundColor: 'var(--color-card)',
                            borderRadius: 'var(--radius-sm)',
                            minWidth: 120,
                            textAlign: 'center',
                            borderBottom: `3px solid ${config.color}`
                        }}>
                            <span style={{ fontSize: '24px' }}>{config.icon}</span>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: config.color }}>
                                {stats[key.toLowerCase().replace('_', '') as keyof typeof stats] || 0}
                            </p>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>{config.label}</p>
                        </div>
                    ))}
                </div>

                {/* Kanban Board */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 'var(--space-2)',
                    minHeight: 500
                }}>
                    {Object.entries(statusConfig).map(([status, config]) => (
                        <div
                            key={status}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, status as Task['status'])}
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-2)',
                                minHeight: 400
                            }}
                        >
                            {/* Kolon Başlığı */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 'var(--space-2)',
                                paddingBottom: 'var(--space-1)',
                                borderBottom: `2px solid ${config.color}`
                            }}>
                                <span style={{ fontWeight: 600 }}>
                                    {config.icon} {config.label}
                                </span>
                                <Badge style={{ backgroundColor: config.color, color: 'white' }}>
                                    {filteredTasks.filter(t => t.status === status).length}
                                </Badge>
                            </div>

                            {/* Görev Kartları */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                {filteredTasks.filter(t => t.status === status).map(task => (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => openDetailModal(task)}
                                        style={{
                                            backgroundColor: 'var(--color-card)',
                                            borderRadius: 'var(--radius-sm)',
                                            padding: 'var(--space-2)',
                                            cursor: 'grab',
                                            borderLeft: `3px solid ${priorityConfig[task.priority].color}`,
                                            transition: 'transform 0.2s, box-shadow 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.target as HTMLElement).style.transform = 'translateY(-2px)';
                                            (e.target as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.target as HTMLElement).style.transform = 'none';
                                            (e.target as HTMLElement).style.boxShadow = 'none';
                                        }}
                                    >
                                        {/* Öncelik Badge */}
                                        {task.priority === 'URGENT' && (
                                            <span style={{ fontSize: '12px' }}>🔴</span>
                                        )}
                                        {task.priority === 'HIGH' && (
                                            <span style={{ fontSize: '12px' }}>🟠</span>
                                        )}

                                        <p style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', marginBottom: '4px' }}>
                                            {task.title}
                                        </p>

                                        {task.project && (
                                            <p style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                                                📁 {task.project}
                                            </p>
                                        )}

                                        {/* Alt görevler progress */}
                                        {task.subtasks.length > 0 && (
                                            <div style={{ marginBottom: '8px' }}>
                                                <div style={{
                                                    height: 4,
                                                    backgroundColor: 'var(--color-border)',
                                                    borderRadius: 2,
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%`,
                                                        backgroundColor: 'var(--color-success)',
                                                        transition: 'width 0.3s'
                                                    }} />
                                                </div>
                                                <p style={{ fontSize: '10px', color: 'var(--color-muted)', marginTop: '2px' }}>
                                                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} alt görev
                                                </p>
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                                                👤 {task.assignee}
                                            </span>
                                            {task.dueDate && (
                                                <span style={{
                                                    fontSize: '10px',
                                                    padding: '2px 6px',
                                                    backgroundColor: new Date(task.dueDate) < new Date() ? '#FFEBEE' : 'var(--color-surface)',
                                                    color: new Date(task.dueDate) < new Date() ? '#C62828' : 'var(--color-muted)',
                                                    borderRadius: 4
                                                }}>
                                                    📅 {new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                </span>
                                            )}
                                        </div>

                                        {/* Tags */}
                                        {task.tags.length > 0 && (
                                            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                                                {task.tags.map(tag => (
                                                    <span key={tag} style={{
                                                        fontSize: '10px',
                                                        padding: '2px 6px',
                                                        backgroundColor: 'var(--color-primary)',
                                                        color: 'white',
                                                        borderRadius: 10
                                                    }}>
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ===== YENİ/DÜZENLE MODAL ===== */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingTask ? `✏️ Görevi Düzenle` : '📋 Yeni Görev'}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
                        <Button variant="primary" onClick={saveTask}>Kaydet</Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <Input label="Görev Başlığı *" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required />
                    <Textarea label="Açıklama" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <Select
                            label="Öncelik"
                            value={formPriority}
                            onChange={(e) => setFormPriority(e.target.value as Task['priority'])}
                            options={Object.entries(priorityConfig).map(([k, v]) => ({ value: k, label: v.label }))}
                        />
                        <Select
                            label="Atanan Kişi"
                            value={formAssignee}
                            onChange={(e) => setFormAssignee(e.target.value)}
                            options={[{ value: '', label: 'Seçiniz...' }, ...teamMembers.map(m => ({ value: m, label: m }))]}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <Input label="Proje" value={formProject} onChange={(e) => setFormProject(e.target.value)} />
                        <Input label="Bitiş Tarihi" type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
                    </div>
                    <Input label="Etiketler (virgülle ayırın)" value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="tasarım, logo, sosyal medya" />
                </div>
            </Modal>

            {/* ===== DETAY MODAL ===== */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={selectedTask ? `📋 ${selectedTask.title}` : 'Görev Detayı'}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Kapat</Button>
                        <Button variant="danger" onClick={() => { handleDeleteTask(selectedTask!.id); setShowDetailModal(false); }}>Sil</Button>
                        <Button variant="primary" onClick={() => { openEditModal(selectedTask!); setShowDetailModal(false); }}>Düzenle</Button>
                    </>
                }
            >
                {selectedTask && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                            <Badge style={{ backgroundColor: priorityConfig[selectedTask.priority].color, color: 'white' }}>
                                {priorityConfig[selectedTask.priority].label}
                            </Badge>
                            <Badge style={{ backgroundColor: statusConfig[selectedTask.status].color, color: 'white' }}>
                                {statusConfig[selectedTask.status].label}
                            </Badge>
                        </div>

                        {/* Açıklama */}
                        <div>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Açıklama</p>
                            <p>{selectedTask.description || 'Açıklama yok'}</p>
                        </div>

                        {/* Info Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
                            <div>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Proje</p>
                                <p>📁 {selectedTask.project || '-'}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Atanan</p>
                                <p>👤 {selectedTask.assignee || '-'}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Bitiş Tarihi</p>
                                <p>📅 {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString('tr-TR') : '-'}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)' }}>Son Güncelleme</p>
                                <p>🕐 {selectedTask.updatedAt}</p>
                            </div>
                        </div>

                        {/* Alt Görevler */}
                        <div>
                            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '8px' }}>
                                Alt Görevler ({selectedTask.subtasks.filter(s => s.completed).length}/{selectedTask.subtasks.length})
                            </p>
                            {selectedTask.subtasks.map(subtask => (
                                <div
                                    key={subtask.id}
                                    onClick={() => toggleSubtask(selectedTask.id, subtask.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px',
                                        backgroundColor: 'var(--color-surface)',
                                        borderRadius: 'var(--radius-sm)',
                                        marginBottom: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span>{subtask.completed ? '☑️' : '⬜'}</span>
                                    <span style={{ textDecoration: subtask.completed ? 'line-through' : 'none', color: subtask.completed ? 'var(--color-muted)' : 'inherit' }}>
                                        {subtask.title}
                                    </span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <Input
                                    placeholder="Yeni alt görev..."
                                    id="newSubtask"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            addSubtask(selectedTask.id, (e.target as HTMLInputElement).value);
                                            (e.target as HTMLInputElement).value = '';
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Etiketler */}
                        {selectedTask.tags.length > 0 && (
                            <div>
                                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: '8px' }}>Etiketler</p>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {selectedTask.tags.map(tag => (
                                        <Badge key={tag} variant="info">#{tag}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}
