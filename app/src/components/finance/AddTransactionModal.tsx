'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { getFinanceAccounts, getFinanceCategories, addTransaction } from '@/lib/actions/finance';
import { useToast } from '@/components/ui/Toast';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddTransactionModal({ isOpen, onClose, onSuccess }: AddTransactionModalProps) {
    const { success, error } = useToast();
    const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [accountId, setAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                setLoading(true);
                try {
                    const [accs, cats] = await Promise.all([
                        getFinanceAccounts(),
                        getFinanceCategories()
                    ]);
                    setAccounts(accs);
                    setCategories(cats);

                    if (accs.length > 0) setAccountId(accs[0].id);
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!amount || !accountId || !date) {
            error('Hata', 'Lütfen tutar, hesap ve tarih alanlarını doldurun.');
            return;
        }

        setSubmitting(true);
        try {
            const result = await addTransaction({
                accountId,
                categoryId,
                amount: parseFloat(amount),
                description,
                date,
                type
            });

            if (result.success) {
                success('Başarılı', 'İşlem başarıyla eklendi.');
                onSuccess();
                onClose();
                setAmount('');
                setDescription('');
            } else {
                error('Hata', result.error || 'Bir hata oluştu.');
            }
        } catch (e) {
            error('Hata', 'Beklenmeyen bir hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredCategories = categories.filter(c => c.type === type);

    const accountsOptions = accounts.map(acc => ({ value: acc.id, label: `${acc.name} (${acc.currency})` }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={type === 'INCOME' ? 'Gelir Ekle' : 'Gider Ekle'}
            size="md"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        İptal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className={type === 'INCOME' ? 'bg-[#32D74B] text-black hover:bg-[#32D74B]/90' : 'bg-[#FF453A] text-white hover:bg-[#FF453A]/90'}
                        style={{ border: 'none' }}
                    >
                        {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                {/* Type Toggle */}
                <div className="bg-white/5 p-1 rounded-lg flex mb-4">
                    <button
                        onClick={() => { setType('INCOME'); setCategoryId(''); }}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${type === 'INCOME' ? 'bg-[#32D74B] text-black shadow-lg' : 'text-white/50 hover:text-white'}`}
                    >
                        <ArrowUpCircle size={16} /> Gelir
                    </button>
                    <button
                        onClick={() => { setType('EXPENSE'); setCategoryId(''); }}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${type === 'EXPENSE' ? 'bg-[#FF453A] text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                    >
                        <ArrowDownCircle size={16} /> Gider
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Input
                            label="Tutar"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        // autoFocus
                        />
                    </div>

                    <div className="col-span-2">
                        <Input
                            label="Açıklama"
                            placeholder="Örn: Ofis Kirası"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div>
                        <Input
                            label="Tarih"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <Select
                            label="Hesap"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            options={accountsOptions}
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="text-xs text-white/50 mb-1.5 block">Kategori</label>
                        {loading ? <div className="h-10 bg-white/5 animate-pulse rounded" /> : (
                            <div className="flex flex-wrap gap-2">
                                {filteredCategories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategoryId(cat.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${categoryId === cat.id ? 'bg-white text-black border-white' : 'bg-transparent text-white/60 border-white/10 hover:border-white/30'}`}
                                        style={categoryId === cat.id ? { backgroundColor: cat.color, borderColor: cat.color, color: '#000' } : {}}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
