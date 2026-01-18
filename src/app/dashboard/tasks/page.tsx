'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, CardHeader, CardContent, Button, Badge, Modal, Input, Select, Textarea, MultiSelect, ColorPicker } from '@/components/ui';
import { getTasks, createTask, updateTask, deleteTask as deleteTaskAction, updateTaskStatus } from '@/lib/actions/tasks';
import type { TaskStatus as TaskStatusType, TaskPriority as TaskPriorityType } from '@/lib/actions/tasks';
import { getMemberColors, saveMemberColors } from '@/lib/actions/userSettings';
import { CheckCircle2, Circle, Trash2, Edit, Calendar, User } from 'lucide-react';

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

// Takım üyeleri ve varsayılan renkleri
const defaultMemberColors: Record<string, string> = {
    'Şeyma Bora': '#E91E63',
    'Fatih Ustaosmanoğlu': '#329FF5',
    'Ayşegül Güler': '#00F5B0',
    'Ahmet Gürkan Turhan': '#9C27B0'
};

const teamMembers = Object.keys(defaultMemberColors);

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
    const [teamMemberColors, setTeamMemberColors] = useState<Record<string, string>>(defaultMemberColors);

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
    const filteredTasks = tasks.filter(task => {
        if (filterStatus !== 'ALL' && task.status !== filterStatus) return false;
        if (filterPriority !== 'ALL' && task.priority !== filterPriority) return false;
        if (filterAssignee !== 'ALL' && !task.assignees.includes(filterAssignee)) return false;
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    // İstatistikler
    const stats = {
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'TODO').length,
        done: tasks.filter(t => t.status === 'DONE').length,
        urgent: tasks.filter(t => t.priority === 'URGENT' && t.status === 'TODO').length
    };

    // Tarihe göre sırala (deadline yakın olanlar önce)
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        // Tamamlananlar en sona
        if (a.status === 'DONE' && b.status !== 'DONE') return 1;
        if (a.status !== 'DONE' && b.status === 'DONE') return -1;
        // Tarihe göre sırala
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
    });

    return (
        <>
            <Header
                title="Görevler"
                subtitle="Yapılacaklar Listesi"
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                        {/* Status Filter */}
                        <div style={{
                            display: 'flex',
                            backgroundColor: 'var(--color-surface)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '2px',
                            border: '1px solid var(--color-border)'
                        }}>
                            <Button variant={filterStatus === 'ALL' ? 'primary' : 'ghost'} size="sm" onClick={() => setFilterStatus('ALL')}>
                                Tümü ({stats.total})
                            </Button>
                            <Button variant={filterStatus === 'TODO' ? 'primary' : 'ghost'} size="sm" onClick={() => setFilterStatus('TODO')}>
                                Yapılacak ({stats.todo})
                            </Button>
                            <Button variant={filterStatus === 'DONE' ? 'primary' : 'ghost'} size="sm" onClick={() => setFilterStatus('DONE')}>
                                Tamamlandı ({stats.done})
                            </Button>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setShowColorSettings(true)}>🎨</Button>
                        <Button variant="primary" onClick={openAddModal}>+ Yeni Görev</Button>
                    </div>
                }
            />

            <div style={{ padding: 'var(--space-3)' }}>
                {/* İstatistik Kartları */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-3)'
                }}>
                    <Card>
                        <CardContent>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-primary)' }}>{stats.total}</p>
                                <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>Toplam</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 32, fontWeight: 700, color: '#FF9800' }}>{stats.todo}</p>
                                <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>⏳ Yapılacak</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 32, fontWeight: 700, color: '#00F5B0' }}>{stats.done}</p>
                                <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>✅ Tamamlandı</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card style={{ borderLeft: stats.urgent > 0 ? '3px solid #FF4242' : undefined }}>
                        <CardContent>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: 32, fontWeight: 700, color: stats.urgent > 0 ? '#FF4242' : 'var(--color-muted)' }}>
                                    {stats.urgent}
                                </p>
                                <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>🚨 Acil</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtreler */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="🔍 Görev ara..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            minWidth: 200
                        }}
                    />
                    <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                        <option value="ALL">Tüm Öncelikler</option>
                        {Object.entries(priorityConfig).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                    <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                        <option value="ALL">Tüm Sorumlular</option>
                        {teamMembers.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                {/* Görev Listesi */}
                {loading ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                            <p style={{ color: 'var(--color-muted)' }}>Görevler yükleniyor...</p>
                        </div>
                    </Card>
                ) : sortedTasks.length === 0 ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                            <p style={{ fontSize: '48px', marginBottom: 'var(--space-2)' }}>📋</p>
                            <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Görev bulunamadı</p>
                            <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-2)' }}>
                                {filterStatus !== 'ALL' ? 'Filtre kriterlerini değiştirin' : 'Yeni bir görev ekleyin'}
                            </p>
                            <Button variant="primary" onClick={openAddModal}>+ Yeni Görev</Button>
                        </div>
                    </Card>
                ) : (
                    <Card>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {sortedTasks.map(task => {
                                const priorityColor = priorityConfig[task.priority].color;
                                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status === 'TODO';

                                return (
                                    <div
                                        key={task.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-2)',
                                            padding: 'var(--space-2)',
                                            borderBottom: '1px solid var(--color-border)',
                                            opacity: task.status === 'DONE' ? 0.6 : 1,
                                            backgroundColor: isOverdue ? 'rgba(255, 66, 66, 0.05)' : 'transparent'
                                        }}
                                    >
                                        {/* Checkbox */}
                                        <button
                                            onClick={() => toggleTaskStatus(task)}
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                border: `2px solid ${task.status === 'DONE' ? '#00F5B0' : '#ccc'}`,
                                                backgroundColor: task.status === 'DONE' ? '#00F5B0' : 'transparent',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}
                                        >
                                            {task.status === 'DONE' && <CheckCircle2 size={16} color="white" />}
                                        </button>

                                        {/* İçerik */}
                                        <div
                                            style={{ flex: 1, cursor: 'pointer' }}
                                            onClick={() => openDetailModal(task)}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{
                                                    fontWeight: 600,
                                                    textDecoration: task.status === 'DONE' ? 'line-through' : 'none'
                                                }}>
                                                    {task.title}
                                                </span>
                                                {isOverdue && (
                                                    <Badge style={{ backgroundColor: '#FF4242', color: 'white', fontSize: 10 }}>
                                                        GECİKMİŞ
                                                    </Badge>
                                                )}
                                                {task.priority === 'URGENT' && task.status === 'TODO' && (
                                                    <Badge style={{ backgroundColor: priorityColor, color: 'white', fontSize: 10 }}>
                                                        ACİL
                                                    </Badge>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                                {/* Marka/Proje */}
                                                {task.project && (
                                                    <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                                                        📁 {task.project}
                                                    </span>
                                                )}
                                                {/* Tarih */}
                                                {task.dueDate && (
                                                    <span style={{ fontSize: 12, color: isOverdue ? '#FF4242' : 'var(--color-muted)' }}>
                                                        📅 {new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                )}
                                                {/* Assignees */}
                                                {task.assignees.length > 0 && (
                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                        {task.assignees.slice(0, 2).map(a => {
                                                            const color = teamMemberColors[a] || '#6B7B80';
                                                            return (
                                                                <span key={a} style={{
                                                                    fontSize: 10,
                                                                    padding: '2px 6px',
                                                                    backgroundColor: color + '20',
                                                                    color: color,
                                                                    borderRadius: 8,
                                                                    fontWeight: 500
                                                                }}>
                                                                    {a.split(' ')[0]}
                                                                </span>
                                                            );
                                                        })}
                                                        {task.assignees.length > 2 && (
                                                            <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>
                                                                +{task.assignees.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button
                                                onClick={() => openEditModal(task)}
                                                style={{
                                                    padding: 6,
                                                    backgroundColor: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'var(--color-muted)'
                                                }}
                                            >
                                                <Edit size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}
            </div>

            {/* Görev Ekle/Düzenle Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingTask ? '✏️ Görev Düzenle' : '📋 Yeni Görev'}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
                        <Button variant="primary" onClick={saveTask}>Kaydet</Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <Input label="Başlık *" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Görev adı" />
                    <Textarea label="Açıklama" value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                        <Select
                            label="Öncelik"
                            value={formPriority}
                            onChange={e => setFormPriority(e.target.value as Task['priority'])}
                            options={Object.entries(priorityConfig).map(([k, v]) => ({ value: k, label: v.label }))}
                        />
                        <Input label="Tarih" type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} />
                    </div>
                    <MultiSelect
                        label="Sorumlular"
                        value={formAssignees}
                        onChange={setFormAssignees}
                        options={teamMembers.map(m => ({ value: m, label: m, color: teamMemberColors[m] }))}
                        placeholder="Kişi seçiniz..."
                    />
                    <Input label="Etiketler" value={formTags} onChange={e => setFormTags(e.target.value)} placeholder="virgülle ayırın" />
                </div>
            </Modal>

            {/* Görev Detay Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={selectedTask ? `📋 ${selectedTask.title}` : 'Görev Detayı'}
                size="md"
                footer={
                    <>
                        <Button
                            variant="danger"
                            onClick={() => selectedTask && handleDeleteTask(selectedTask)}
                            style={{ marginRight: 'auto' }}
                        >
                            🗑️ Sil
                        </Button>
                        <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Kapat</Button>
                        <Button variant="primary" onClick={() => { setShowDetailModal(false); selectedTask && openEditModal(selectedTask); }}>
                            Düzenle
                        </Button>
                    </>
                }
            >
                {selectedTask && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {/* Status Banner */}
                        <div style={{
                            padding: 'var(--space-2)',
                            backgroundColor: statusConfig[selectedTask.status].color + '20',
                            borderRadius: 'var(--radius-md)',
                            borderLeft: `4px solid ${statusConfig[selectedTask.status].color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <span style={{ fontWeight: 600 }}>
                                {selectedTask.status === 'DONE' ? '✅ Tamamlandı' : '⏳ Yapılacak'}
                            </span>
                            <Button
                                variant={selectedTask.status === 'TODO' ? 'success' : 'secondary'}
                                size="sm"
                                onClick={() => {
                                    toggleTaskStatus(selectedTask);
                                    setSelectedTask({ ...selectedTask, status: selectedTask.status === 'TODO' ? 'DONE' : 'TODO' });
                                }}
                            >
                                {selectedTask.status === 'TODO' ? '✓ Tamamla' : '↩ Geri Al'}
                            </Button>
                        </div>

                        {/* Detaylar */}
                        {selectedTask.description && (
                            <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>📝 Açıklama</p>
                                <p>{selectedTask.description}</p>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                            <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>🎯 Öncelik</p>
                                <Badge style={{ backgroundColor: priorityConfig[selectedTask.priority].color, color: 'white' }}>
                                    {priorityConfig[selectedTask.priority].label}
                                </Badge>
                            </div>
                            <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                                <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>📅 Tarih</p>
                                <p style={{ fontWeight: 600 }}>
                                    {selectedTask.dueDate
                                        ? new Date(selectedTask.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                                        : 'Belirlenmedi'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Sorumlular */}
                        <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
                            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 8 }}>👤 Sorumlular</p>
                            {selectedTask.assignees.length > 0 ? (
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {selectedTask.assignees.map(a => {
                                        const color = teamMemberColors[a] || '#6B7B80';
                                        return (
                                            <span key={a} style={{
                                                padding: '4px 12px',
                                                backgroundColor: color + '20',
                                                color: color,
                                                borderRadius: 16,
                                                fontWeight: 500
                                            }}>
                                                {a}
                                            </span>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--color-muted)' }}>Atanmamış</p>
                            )}
                        </div>

                        {/* İçerik Bilgileri (varsa) */}
                        {(selectedTask.brandName || selectedTask.notes) && (
                            <div style={{
                                padding: 'var(--space-2)',
                                backgroundColor: 'rgba(50, 159, 245, 0.1)',
                                borderRadius: 'var(--radius-sm)',
                                borderLeft: '4px solid var(--color-primary)'
                            }}>
                                <p style={{ fontSize: 11, color: 'var(--color-primary)', marginBottom: 8 }}>📱 İçerik Bilgileri</p>
                                {selectedTask.brandName && (
                                    <p><strong>Marka:</strong> {selectedTask.brandName}</p>
                                )}
                                {selectedTask.contentType && (
                                    <p><strong>Tür:</strong> {selectedTask.contentType}</p>
                                )}
                                {selectedTask.notes && (
                                    <p style={{ marginTop: 8 }}>{selectedTask.notes}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Renk Ayarları Modal */}
            <Modal
                isOpen={showColorSettings}
                onClose={() => setShowColorSettings(false)}
                title="🎨 Kişi Renk Ayarları"
                size="md"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-muted)', marginBottom: 8 }}>
                        Her takım üyesi için bir renk seçin. Değişiklikler otomatik kaydedilir.
                    </p>
                    {teamMembers.map(member => (
                        <div
                            key={member}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                backgroundColor: 'var(--color-surface)',
                                borderRadius: 'var(--radius-sm)',
                                borderLeft: `4px solid ${teamMemberColors[member] || '#6B7B80'}`
                            }}
                        >
                            <span style={{ fontWeight: 500 }}>{member}</span>
                            <ColorPicker
                                value={teamMemberColors[member] || '#6B7B80'}
                                onChange={(color) => updateMemberColor(member, color)}
                            />
                        </div>
                    ))}
                </div>
            </Modal>
        </>
    );
}
