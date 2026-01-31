'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout';
import { Button, Badge } from '@/components/ui';
import { smPackages, studioReelsPackages, unitPrices } from './data';
import { MagicBento } from '@/components/react-bits/MagicBento';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { StarBorder } from '@/components/react-bits/StarBorder';
import ShinyText from '@/components/react-bits/ShinyText';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Check, Info, Film, Camera, Mic, Megaphone, Palette, Star } from 'lucide-react';

export function PriceListPageClient() {
    const [activeTab, setActiveTab] = useState<'packages' | 'units' | 'studio'>('packages');

    return (
        <div className="p-4 md:p-8 min-h-screen pt-6 text-white overflow-x-hidden">
            {/* HEADER */}
            <div className="mb-8 md:mb-12 relative">
                <div className="absolute top-0 left-0 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] -z-10 pointer-events-none" />
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">
                    <ShinyText text="Fiyat Listesi" speed={4} />
                </h1>
                <div className="text-white/40 text-sm md:text-base font-medium tracking-wide max-w-2xl">
                    Şeffaf, esnek ve büyüme odaklı paketlerimizi inceleyin.
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex overflow-x-auto pb-4 mb-4 gap-2 no-scrollbar md:justify-start">
                {[
                    { id: 'packages', label: 'Sosyal Medya', icon: <Star size={14} /> },
                    { id: 'studio', label: 'Studio Reels', icon: <Film size={14} /> },
                    { id: 'units', label: 'Birim Fiyatlar', icon: <Palette size={14} /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            whitespace-nowrap px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 border
                            ${activeTab === tab.id
                                ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105'
                                : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:border-white/10 hover:text-white'}
                        `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <MagicBento gap={16}>
                {/* SOSYAL MEDYA PAKETLERİ */}
                {activeTab === 'packages' && (
                    <>
                        {smPackages.map((pkg, index) => (
                            <div key={pkg.id} className={`col-span-12 md:col-span-6 lg:col-span-3 ${pkg.popular ? 'lg:col-span-4' : ''}`}>
                                <div className={`relative h-full group ${pkg.popular ? 'transform md:-translate-y-4' : ''}`}>
                                    {pkg.popular && <StarBorder color={pkg.color} speed="3s" />}

                                    <GlassSurface
                                        className="h-full flex flex-col p-6 md:p-8 relative overflow-hidden"
                                        intensity={pkg.popular ? 'medium' : 'light'}
                                        glowOnHover
                                        glowColor={pkg.id === 'starter' ? 'blue' : pkg.id === 'growth' ? 'green' : pkg.id === 'pro' ? 'purple' : 'blue'}
                                    >
                                        {/* Background Glow */}
                                        <div
                                            className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[60px] opacity-20 transition-opacity duration-500 group-hover:opacity-40"
                                            style={{ backgroundColor: pkg.color }}
                                        />

                                        {pkg.popular && (
                                            <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1">
                                                <Star size={10} fill="black" /> En Popüler
                                            </div>
                                        )}

                                        <div className="mb-6 relative z-10">
                                            <h3 className="text-lg md:text-xl font-bold uppercase tracking-widest mb-2" style={{ color: pkg.color }}>
                                                {pkg.name}
                                            </h3>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl md:text-4xl font-bold text-white tracking-tighter">
                                                    <AnimatedCounter value={pkg.price} prefix="₺" />
                                                </span>
                                                <span className="text-sm text-white/40">/ay</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 flex-grow relative z-10">
                                            {pkg.features.map((feature, i) => (
                                                <div key={i} className="flex items-start gap-3 text-sm md:text-base text-white/80 group-hover:text-white transition-colors">
                                                    <div className="mt-0.5 min-w-[18px]">
                                                        <Check size={16} color={pkg.color} strokeWidth={3} />
                                                    </div>
                                                    <span className="font-medium leading-snug">{feature}</span>
                                                </div>
                                            ))}
                                        </div>


                                    </GlassSurface>
                                </div>
                            </div>
                        ))}

                        <div className="col-span-12 mt-4">
                            <div className="bg-[#111111] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row items-center justify-center gap-3 text-center">
                                <Info size={18} className="text-white/40" />
                                <span className="text-sm text-white/60">
                                    Paketler en az <strong className="text-white">3 ay taahhütlü</strong> anlaşmalarda geçerlidir.
                                </span>
                            </div>
                        </div>
                    </>
                )}

                {/* STUDIO REELS */}
                {activeTab === 'studio' && (
                    <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {studioReelsPackages.map((pkg) => (
                            <GlassSurface key={pkg.id} className="p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden group" intensity="light" glowOnHover>
                                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: '#2997FF' }} />

                                <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                                <div className="text-white/50 text-sm mb-6 font-medium">{pkg.hours} Saat Çekim • {pkg.videos} Video</div>

                                <div className="text-4xl font-bold text-white mb-1"><AnimatedCounter value={pkg.price} prefix="₺" /></div>
                                <div className="text-[10px] text-white/30 uppercase tracking-widest mb-8">+ KDV</div>

                                <div className="grid grid-cols-1 gap-2 w-full mb-8">
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <div className="text-[10px] text-white/40 mb-1">Video Başına</div>
                                        <div className="text-lg font-bold text-[#30D158]"><AnimatedCounter value={pkg.perVideo} prefix="₺" /></div>
                                    </div>
                                </div>


                            </GlassSurface>
                        ))}
                    </div>
                )}

                {/* BİRİM FİYATLAR - MOBILE FRIENDLY TABLES */}
                {activeTab === 'units' && (
                    <div className="col-span-12 flex flex-col gap-6">
                        {[
                            { title: 'Video Prodüksiyon', icon: <Film size={20} className="text-blue-400" />, data: unitPrices.video, color: 'blue' },
                            { title: 'Reklam Yönetimi', icon: <Megaphone size={20} className="text-purple-400" />, data: unitPrices.reklam, color: 'purple' },
                            { title: 'Podcast Stüdyo', icon: <Mic size={20} className="text-orange-400" />, data: unitPrices.podcast, color: 'orange' },
                            { title: 'Fotoğraf Stüdyo', icon: <Camera size={20} className="text-green-400" />, data: unitPrices.foto, color: 'green' },
                            { title: 'Tasarım & Operasyon', icon: <Palette size={20} className="text-pink-400" />, data: unitPrices.tasarim, color: 'pink' },
                        ].map((group, idx) => (
                            <GlassSurface key={idx} className="overflow-hidden rounded-2xl" intensity="light">
                                <div className="p-4 md:p-6 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
                                    <div className={`p-2 rounded-lg bg-${group.color}-500/10`}>
                                        {group.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-white">{group.title}</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[600px] md:min-w-full">
                                        <thead>
                                            <tr className="text-[11px] font-semibold text-white/30 uppercase tracking-wider bg-white/[0.01]">
                                                <th className="p-4">Hizmet</th>
                                                <th className="p-4">Açıklama</th>
                                                <th className="p-4 text-right">Fiyat</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {group.data.map((item: any) => (
                                                <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-4 text-sm font-medium text-white/90">{item.name}</td>
                                                    <td className="p-4 text-sm text-white/50">{item.description || '-'}</td>
                                                    <td className="p-4 text-sm text-right font-bold text-white whitespace-nowrap">
                                                        {item.price > 0 ? (
                                                            <>
                                                                <span className="text-white/40 text-[10px] mr-1">₺</span>
                                                                {new Intl.NumberFormat('tr-TR').format(item.price)}
                                                                <span className="text-white/30 font-normal text-[10px] ml-1">/ {item.unit}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-white/40 italic">Teklif</span>
                                                        )}
                                                        {item.note && <div className="text-[10px] text-yellow-500/80 mt-0.5">{item.note}</div>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassSurface>
                        ))}
                    </div>
                )}
            </MagicBento>
        </div>
    );
}

