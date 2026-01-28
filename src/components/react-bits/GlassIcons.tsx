import React from 'react';
import { LucideIcon } from 'lucide-react';

interface GlassIconProps {
    icon: LucideIcon;
    size?: number;
    className?: string;
}

export const GlassIcon: React.FC<GlassIconProps> = ({ icon: Icon, size = 20, className = '' }) => {
    return (
        <div className={`flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md ${className}`}>
            <Icon size={size} className="text-white/80" />
        </div>
    );
};
