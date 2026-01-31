'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Header } from '@/components/layout';
import { Button, Modal, ColorPicker, Drawer } from '@/components/ui';
import { getTasks, updateTask, deleteTask as deleteTaskAction, updateTaskStatus } from '@/lib/actions/tasks';
import type { TaskStatus as TaskStatusType } from '@/lib/actions/tasks';
import { getMemberColors, saveMemberColors } from '@/lib/actions/userSettings';
import { FolderOpen, Clock, Plus, User as UserIcon } from 'lucide-react';
import { ContentDetailPanel } from '@/components/content/ContentDetailPanel';
import { NewContentModal } from '@/components/content/NewContentModal';
import { ContentFilterBar } from '@/components/content/ContentFilterBar'; // Import Filter Bar
import { getActiveTeamMembers, User as DBUser } from '@/lib/actions/users';

// ===== TİPLER =====
interface Task {
    id: string;
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'IN_REVIEW' | 'BLOCKED';
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

const KANBAN_COLUMNS = [
    { id: 'TODO', label: 'Yapılacaklar', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.05)' },
    { id: 'IN_PROGRESS', label: 'Devam Ediyor', color: '#2196F3', bg: 'rgba(33, 150, 243, 0.05)' },
    { id: 'DONE', label: 'Tamamlandı', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.05)' }
];

const priorityConfig = {
    LOW: { label: 'Düşük', color: '#9E9E9E', bg: '#f5f5f5' },
    NORMAL: { label: 'Normal', color: '#2196F3', bg: '#e3f2fd' },
    HIGH: { label: 'Yüksek', color: '#FF9800', bg: '#fff3e0' },
    URGENT: { label: 'Acil', color: '#F44336', bg: '#ffebee' },
};

export function TasksPageClient() {
    const [tasks, setTasks] = useState<Task[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loading, setLoading] = useState(true);
    const [showNewContentModal, setShowNewContentModal] = useState(false);
    const [showColorSettings, setShowColorSettings] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [teamMemberColors, setTeamMemberColors] = useState<Record<string, string>>({});
    const [currentUser, setCurrentUser] = useState<{ name: string; id: string } | null>(null);
    const [activeTeam, setActiveTeam] = useState<DBUser[]>([]);

    // Filters managed by FilterBar
    const [filterAssignee, setFilterAssignee] = useState<string>('all');
    const [filterBrand, setFilterBrand] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Load data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [dbTasks, colors, team] = await Promise.all([
                    getTasks(),
                    getMemberColors(),
                    getActiveTeamMembers()
                ]);

                const userStr = localStorage.getItem('currentUser');
                if (userStr) setCurrentUser(JSON.parse(userStr));

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const formattedTasks: Task[] = dbTasks.map((t: any) => ({
                    id: t.id,
                    title: t.title,
                    description: t.description || '',
                    status: t.status,
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
                setActiveTeam(team);
            } catch (error) {
                console.error('Data loading error:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) return;

        const newStatus = destination.droppableId as Task['status'];
        const taskToUpdate = tasks.find(t => t.id === draggableId);

        if (taskToUpdate) {
            const updatedTasks = tasks.map(t =>
                t.id === draggableId ? { ...t, status: newStatus } : t
            );
            setTasks(updatedTasks);

            try {
                await updateTaskStatus(draggableId, newStatus as TaskStatusType);
            } catch (error) {
                console.error('Failed to update task status:', error);
                setTasks(tasks);
                alert('Durum güncellenemedi.');
            }
        }
    };

    const updateMemberColor = async (member: string, color: string) => {
        const newColors = { ...teamMemberColors, [member]: color };
        setTeamMemberColors(newColors);
        await saveMemberColors(newColors).catch(console.error);
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

    const filteredTasks = tasks.filter(task => {
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterAssignee !== 'all' && !task.assignees.includes(filterAssignee)) return false;
        if (filterBrand !== 'all' && task.brandId !== filterBrand) return false;
        // Status filter is applied via columns, but can be used for extra filtering if needed
        return true;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Header
                title="Görevler"
                subtitle="İş akışı ve proje takibi"
                actions={
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Button variant="secondary" onClick={() => setShowColorSettings(true)}>
                            Renk Ayarları
                        </Button>
                        <Button variant="primary" onClick={() => setShowNewContentModal(true)}>
                            <Plus size={16} />
                            Yeni Görev
                        </Button>
                    </div>
                }
            />

            {/* Filter Bar with Navigation */}
            <div style={{ marginBottom: 'var(--space-2)' }}>
                <ContentFilterBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filterBrand={filterBrand}
                    onFilterBrandChange={setFilterBrand}
                    filterStatus={filterStatus}
                    onFilterStatusChange={setFilterStatus}
                    filterAssignee={filterAssignee}
                    onFilterAssigneeChange={setFilterAssignee}
                    viewMode="tasks"
                    onViewModeChange={() => { }} // Internal Nav
                    activeTeam={activeTeam}
                />
            </div>

            {/* Kanban Board */}
            <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '0 var(--space-3) var(--space-3) var(--space-3)' }}>
                <DragDropContext onDragEnd={onDragEnd}>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', height: '100%', minWidth: '100%' }}>
                        {KANBAN_COLUMNS.map(column => {
                            const columnTasks = filteredTasks.filter(t =>
                                column.id === 'TODO' ? (t.status === 'TODO' || t.status === 'BLOCKED') :
                                    column.id === 'IN_PROGRESS' ? (t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW') :
                                        t.status === 'DONE'
                            );

                            return (
                                <div key={column.id} style={{
                                    flex: '1 0 300px',
                                    maxWidth: '400px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    background: 'var(--color-surface-2)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--color-border)',
                                    height: '100%'
                                }}>
                                    {/* Column Header */}
                                    <div style={{
                                        padding: 'var(--space-3)',
                                        borderBottom: '1px solid var(--color-divider)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: column.color }} />
                                            <span style={{ fontWeight: 600, fontSize: 'var(--text-body)' }}>{column.label}</span>
                                            <span style={{
                                                fontSize: '10px',
                                                background: 'var(--color-surface-3)',
                                                padding: '2px 6px',
                                                borderRadius: '10px',
                                                color: 'var(--color-muted)'
                                            }}>
                                                {columnTasks.length}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Droppable Area */}
                                    <Droppable droppableId={column.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                style={{
                                                    flex: 1,
                                                    padding: 'var(--space-2)',
                                                    overflowY: 'auto',
                                                    background: snapshot.isDraggingOver ? 'var(--color-surface-hover)' : 'transparent',
                                                    transition: 'background 0.2s ease',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    // gap: 'var(--space-2)' - Removed to prevent dnd jump, using marginBottom on items instead
                                                }}
                                            >
                                                {columnTasks.map((task, index) => (
                                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                                        {(provided, snapshot) => {
                                                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
                                                            const priority = priorityConfig[task.priority];

                                                            return (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    onClick={() => setSelectedTask(task)}
                                                                    style={{
                                                                        background: 'var(--color-surface)',
                                                                        borderRadius: 'var(--radius-md)',
                                                                        border: '1px solid var(--color-border)',
                                                                        padding: 'var(--space-3)',
                                                                        boxShadow: snapshot.isDragging ? 'var(--shadow-z3)' : 'none',
                                                                        cursor: 'grab',
                                                                        opacity: snapshot.isDragging ? 0.9 : 1,
                                                                        position: 'relative',
                                                                        marginBottom: 'var(--space-2)',
                                                                        // IMPORTANT: Spread library styles LAST to ensure position: fixed/transform takes precedence during drag
                                                                        ...provided.draggableProps.style,
                                                                    }}
                                                                >
                                                                    {/* Task Content */}
                                                                    <div style={{ marginBottom: '8px' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                                                                            {/* Priority - Minimalist Dot */}
                                                                            <div
                                                                                title={`Öncelik: ${priority.label}`}
                                                                                style={{
                                                                                    width: '8px',
                                                                                    height: '8px',
                                                                                    borderRadius: '50%',
                                                                                    marginTop: '5px',
                                                                                    flexShrink: 0,
                                                                                    backgroundColor: isOverdue ? '#F44336' : priority.color,
                                                                                    opacity: 0.8
                                                                                }}
                                                                            />
                                                                            <h4 style={{ margin: 0, fontSize: 'var(--text-body-sm)', fontWeight: 500, lineHeight: '1.4', flex: 1 }}>
                                                                                {task.title}
                                                                            </h4>
                                                                        </div>
                                                                        {task.brandName && (
                                                                            <p style={{ fontSize: '11px', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '16px' }}>
                                                                                <FolderOpen size={10} /> {task.brandName}
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    {/* Footer */}
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingLeft: '16px' }}>
                                                                        {/* Assignees - Simplified Stack */}
                                                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                            {task.assignees.length > 0 ? (
                                                                                task.assignees.map((assigneeId, i) => {
                                                                                    if (i > 2) return null;
                                                                                    if (i === 2) return <span key="more" style={{ fontSize: '10px', color: 'var(--color-muted)', marginLeft: '4px' }}>+{task.assignees.length - 2}</span>;

                                                                                    const user = activeTeam.find(u => u.id === assigneeId);
                                                                                    return (
                                                                                        <div key={assigneeId} style={{
                                                                                            width: '20px',
                                                                                            height: '20px',
                                                                                            borderRadius: '50%',
                                                                                            background: 'var(--color-surface-3)',
                                                                                            border: '1px solid var(--color-background)',
                                                                                            marginLeft: i > 0 ? '-6px' : '0',
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            justifyContent: 'center',
                                                                                            color: 'var(--color-muted)',
                                                                                            fontSize: '9px',
                                                                                            fontWeight: 600,
                                                                                            textTransform: 'uppercase'
                                                                                        }} title={user?.name}>
                                                                                            {user?.name?.substring(0, 1) || '?'}
                                                                                        </div>
                                                                                    );
                                                                                })
                                                                            ) : (
                                                                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px dashed var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                    <UserIcon size={10} color="var(--color-muted)" />
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Date */}
                                                                        {task.dueDate && (
                                                                            <span style={{
                                                                                fontSize: '10px',
                                                                                color: isOverdue ? '#F44336' : 'var(--color-muted)',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '3px'
                                                                            }}>
                                                                                <Clock size={10} />
                                                                                {new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>

            {/* Task Detail Drawer */}
            <Drawer
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                title={selectedTask?.title || 'Görev Detayı'}
                width="500px"
            >
                {selectedTask && (
                    <ContentDetailPanel
                        content={{
                            id: selectedTask.id,
                            title: selectedTask.title,
                            brandId: selectedTask.brandId || '',
                            status: selectedTask.status === 'DONE' ? 'PAYLASILD' : 'PLANLANDI',
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            type: (selectedTask.contentType as any) || 'OTHER',
                            notes: selectedTask.notes || selectedTask.description || '',
                            deliveryDate: selectedTask.dueDate,
                            assigneeIds: selectedTask.assignees,
                            assigneeId: selectedTask.assignees[0]
                        }}
                        onClose={() => setSelectedTask(null)}
                        onUpdateStatus={async (id, status) => {
                            let newStatus: TaskStatusType = 'TODO';
                            if (status === 'PAYLASILD' || status === 'TESLIM') newStatus = 'DONE';
                            else if (status === 'REVİZE') newStatus = 'IN_REVIEW';
                            else newStatus = 'IN_PROGRESS';

                            const task = tasks.find(t => t.id === id);
                            if (task) {
                                setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
                                await updateTaskStatus(id, newStatus);
                            }
                        }}
                        onUpdateNotes={async (id, note) => {
                            setTasks(prev => prev.map(t => t.id === id ? { ...t, notes: note, description: note } : t));
                            try { await updateTask(id, { notes: note, description: note }); } catch { }
                        }}
                        onDelete={async (id) => {
                            const task = tasks.find(t => t.id === id);
                            if (task) handleDeleteTask(task);
                        }}
                        noteHistory={[]}
                        teamMemberColors={teamMemberColors}
                        activeTeam={activeTeam}
                        currentUser={currentUser}
                    />
                )}
            </Drawer>

            {/* New Task Modal */}
            <NewContentModal
                isOpen={showNewContentModal}
                onClose={() => setShowNewContentModal(false)}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

            {/* Color Settings Modal */}
            <Modal isOpen={showColorSettings} onClose={() => setShowColorSettings(false)} title="Takım Renkleri" size="sm">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {activeTeam.map(member => (
                        <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                            <span>{member.name}</span>
                            <ColorPicker value={teamMemberColors[member.name] || '#6B7B80'} onChange={(color) => updateMemberColor(member.name, color)} />
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
