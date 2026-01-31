'use client';

import React, { useState } from 'react';
import { updateClientFinancials } from '@/lib/actions/finance-clients';
import { Instagram, Edit2, Save, X } from 'lucide-react';

interface Client {
    id: string;
    name: string;
    category: string;
    monthlyFee: number;
    contractType: string;
    instagramHandle?: string;
    color: string;
}

export function ClientFinancialsList({ clients }: { clients: Client[] }) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Client>>({});

    const handleEdit = (client: Client) => {
        setEditingId(client.id);
        setEditForm({
            monthlyFee: client.monthlyFee,
            contractType: client.contractType,
            instagramHandle: client.instagramHandle
        });
    };

    const handleSave = async (clientId: string) => {
        if (!editForm.monthlyFee && editForm.monthlyFee !== 0) return;

        await updateClientFinancials(clientId, {
            monthlyFee: Number(editForm.monthlyFee),
            contractType: editForm.contractType || 'RETAINER',
            instagramHandle: editForm.instagramHandle
        });
        setEditingId(null);
    };

    return (
        <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 bg-white dark:bg-white/[0.02] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none backdrop-blur-xl transition-all duration-300">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                        <th className="px-5 py-4 font-semibold text-gray-500 dark:text-white/40 tracking-tight">Marka</th>
                        <th className="px-5 py-4 font-semibold text-gray-500 dark:text-white/40 tracking-tight">Kategori</th>
                        <th className="px-5 py-4 font-semibold text-gray-500 dark:text-white/40 tracking-tight">Sözleşme</th>
                        <th className="px-5 py-4 font-semibold text-gray-500 dark:text-white/40 tracking-tight">Aylık Gelir</th>
                        <th className="px-5 py-4 text-right font-semibold text-gray-500 dark:text-white/40 tracking-tight">İşlem</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {clients.map(client => {
                        const isEditing = editingId === client.id;

                        return (
                            <tr key={client.id} className="group hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors">
                                {/* Name & Instagram */}
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm" style={{ backgroundColor: client.color }}>
                                            {client.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">{client.name}</div>
                                            {isEditing ? (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Instagram size={12} className="text-gray-400" />
                                                    <input
                                                        value={editForm.instagramHandle || ''}
                                                        onChange={e => setEditForm({ ...editForm, instagramHandle: e.target.value })}
                                                        className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-1.5 py-0.5 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                                        placeholder="@username"
                                                    />
                                                </div>
                                            ) : (
                                                client.instagramHandle && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-white/40 mt-0.5">
                                                        <Instagram size={12} />
                                                        {client.instagramHandle}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {/* Category */}
                                <td className="px-5 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/70 border border-gray-200 dark:border-white/5">
                                        {client.category}
                                    </span>
                                </td>

                                {/* Contract Type */}
                                <td className="px-5 py-4">
                                    {isEditing ? (
                                        <select
                                            value={editForm.contractType}
                                            onChange={e => setEditForm({ ...editForm, contractType: e.target.value })}
                                            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500/50"
                                        >
                                            <option value="RETAINER">Retainer (Aylık)</option>
                                            <option value="PROJECT">Proje Bazlı</option>
                                            <option value="HOURLY">Saatlik</option>
                                        </select>
                                    ) : (
                                        <span className={`text-xs font-semibold px-2 py-1 rounded inline-flex items-center ${client.contractType === 'RETAINER'
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                                            : 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'
                                            }`}>
                                            {client.contractType === 'RETAINER' ? 'AYLIK (RETAINER)' : 'PROJE BAZLI'}
                                        </span>
                                    )}
                                </td>

                                {/* Monthly Fee */}
                                <td className="px-5 py-4">
                                    {isEditing ? (
                                        <div className="relative">
                                            <span className="absolute left-2 top-1.5 text-gray-400 dark:text-white/30">₺</span>
                                            <input
                                                type="number"
                                                value={editForm.monthlyFee}
                                                onChange={e => setEditForm({ ...editForm, monthlyFee: Number(e.target.value) })}
                                                className="pl-6 pr-2 py-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white font-medium w-32 focus:outline-none focus:border-blue-500/50"
                                            />
                                        </div>
                                    ) : (
                                        <div className="group/fee flex items-center gap-2">
                                            <span className={`text-base font-semibold tabular-nums ${client.monthlyFee > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white/30'}`}>
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(client.monthlyFee || 0)}
                                            </span>
                                            {client.monthlyFee === 0 && <span className="text-[10px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">GİRİLMEMİŞ</span>}
                                        </div>
                                    )}
                                </td>

                                {/* Actions */}
                                <td className="px-5 py-4 text-right">
                                    {isEditing ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleSave(client.id)}
                                                className="p-1.5 text-green-600 hover:bg-green-500/10 rounded-lg transition-colors"
                                            >
                                                <Save size={16} />
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleEdit(client)}
                                            className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
