'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Save, X, Edit2, AlertCircle, User as UserIcon } from 'lucide-react';
import { updateUserCost } from '@/lib/actions/finance-team';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    hourlyCost: number;
    currency: 'TRY' | 'USD' | 'EUR' | 'GBP';
    lastUpdated: string | null;
}

interface TeamCostListProps {
    data: TeamMember[];
}

export default function TeamCostList({ data }: TeamCostListProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ hourlyCost: string; currency: string }>({
        hourlyCost: '',
        currency: 'TRY'
    });
    const [isLoading, setIsLoading] = useState(false);

    const filteredData = data.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditClick = (user: TeamMember) => {
        setEditingId(user.id);
        setEditForm({
            hourlyCost: user.hourlyCost.toString(),
            currency: user.currency
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({ hourlyCost: '', currency: 'TRY' });
    };

    const handleSave = async (userId: string) => {
        setIsLoading(true);
        try {
            const result = await updateUserCost(
                userId,
                parseFloat(editForm.hourlyCost) || 0,
                editForm.currency as any
            );

            if (result.success) {
                setEditingId(null);
                router.refresh();
            } else {
                alert('Hata oluştu: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert('Bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
                <input
                    type="text"
                    placeholder="Personel ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-sm dark:shadow-none"
                />
            </div>

            {/* List */}
            <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 bg-white dark:bg-white/[0.02] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none backdrop-blur-xl transition-all duration-300">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                            <th className="px-5 py-4 text-left font-semibold text-gray-500 dark:text-white/40 tracking-tight">Personel</th>
                            <th className="px-5 py-4 text-left font-semibold text-gray-500 dark:text-white/40 tracking-tight">Rol</th>
                            <th className="px-5 py-4 text-right font-semibold text-gray-500 dark:text-white/40 tracking-tight">Saatlik Maliyet</th>
                            <th className="px-5 py-4 text-right font-semibold text-gray-500 dark:text-white/40 tracking-tight">Son Güncelleme</th>
                            <th className="px-5 py-4 w-[100px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {filteredData.map((user) => (
                            <tr key={user.id} className="group hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shadow-sm">
                                            <UserIcon size={14} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-white/40">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70">
                                        {user.role}
                                    </span>
                                </td>

                                <td className="px-5 py-4 text-right">
                                    {editingId === user.id ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <input
                                                type="number"
                                                value={editForm.hourlyCost}
                                                onChange={(e) => setEditForm({ ...editForm, hourlyCost: e.target.value })}
                                                className="w-24 px-2 py-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-right text-gray-900 dark:text-white focus:outline-none focus:border-blue-500/50"
                                                placeholder="0.00"
                                            />
                                            <select
                                                value={editForm.currency}
                                                onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                                                className="px-2 py-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500/50"
                                            >
                                                <option value="TRY">TRY</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                                <option value="GBP">GBP</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <span className={`font-semibold tabular-nums ${user.hourlyCost > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-white/30'}`}>
                                            {user.hourlyCost > 0 ? formatCurrency(user.hourlyCost, user.currency) : '-'}
                                        </span>
                                    )}
                                </td>

                                <td className="px-5 py-4 text-right text-gray-500 dark:text-white/40 text-xs">
                                    {user.lastUpdated ? new Date(user.lastUpdated).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : '-'}
                                </td>

                                <td className="px-5 py-4 text-right">
                                    {editingId === user.id ? (
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleSave(user.id)}
                                                disabled={isLoading}
                                                className="p-1.5 text-green-600 hover:bg-green-500/10 rounded-lg transition-colors"
                                            >
                                                <Save size={16} />
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                disabled={isLoading}
                                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleEditClick(user)}
                                            className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}

                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-gray-400 dark:text-white/30 text-sm">
                                    Personel bulunamadı.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-start gap-3 text-xs text-gray-500 dark:text-white/40 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 p-4 rounded-xl">
                <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">Maliyet Hesaplama Hakkında</p>
                    <p className="leading-relaxed">Girilen saatlik maliyetler, bugünden itibaren yapılacak işlerde (Time Log) kullanılır. Geçmiş kayıtlar, o günkü maliyet üzerinden korunur.</p>
                </div>
            </div>
        </div>
    );
}
