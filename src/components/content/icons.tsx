import React from 'react';
import {
    Calendar, PenTool, Camera, Palette, Brush, Image as ImageIcon,
    Scissors, Film, Clock, Share2, Package, CheckCircle2,
    Video, Mic, Globe, BarChart, FileText, Megaphone, Layout,
    Users, User, Tag, Trash2, Edit2, ChevronDown, Activity,
    History, AlertCircle, Check, Plus, Eye
} from 'lucide-react';
import { ContentStatus, ContentType } from '@/lib/data';

export const StatusIcons: Record<ContentStatus | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED', React.ReactNode> = {
    PLANLANDI: <Calendar size={16} />,
    ICERIK_HAZIRLANDI: <PenTool size={16} />,
    CEKILDI: <Camera size={16} />,
    FOTOGRAF_RETOUCH: <Palette size={16} />,
    TASARLANIYOR: <Brush size={16} />,
    TASARLANDI: <ImageIcon size={16} />,
    KURGULANIYOR: <Scissors size={16} />,
    KURGULANDI: <Film size={16} />,
    ONAY: <Clock size={16} />,
    PAYLASILD: <Share2 size={16} />,
    TESLIM: <Package size={16} />,
    TODO: <Calendar size={16} />,
    IN_PROGRESS: <Clock size={16} />,
    IN_REVIEW: <Clock size={16} />,
    BLOCKED: <Clock size={16} />
};

export const TypeIcons: Record<ContentType, React.ReactNode> = {
    VIDEO: <Video size={16} />,
    PODCAST: <Mic size={16} />,
    FOTOGRAF: <Camera size={16} />,
    POST: <ImageIcon size={16} />,
    REKLAM: <Megaphone size={16} />,
    RAPOR: <BarChart size={16} />,
    TEKLIF: <FileText size={16} />,
    WEB: <Globe size={16} />,
};

// UI Icons
export const Icons = {
    Calendar: <Calendar size={14} />,
    User: <User size={14} />,
    Users: <Users size={14} />,
    Edit: <Edit2 size={14} />,
    Delete: <Trash2 size={14} />,
    Tag: <Tag size={14} />,
    Palette: <Palette size={14} />,
    ChevronDown: <ChevronDown size={14} />,
    Activity: <Activity size={14} />,
    History: <History size={14} />,
    Alert: <AlertCircle size={14} />,
    Check: <Check size={14} />,
    FileText: <FileText size={14} />,
    Camera: <Camera size={14} />,
    Plus: <Plus size={14} />,
    Eye: <Eye size={14} />
};
