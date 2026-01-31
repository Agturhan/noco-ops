/**
 * NOCO Creative - AI Integration (Google Gemini)
 * Provides AI-powered proposal suggestions using Gemini 2.0 Flash
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    SERVICES,
    SM_PACKAGES,
    STUDIO_REELS_PACKAGES,

    PRODUCTION_CAPACITY,
    getCapacityContext,
    getValidServiceIds,
    pickShootPackage,
    getKurguPrice,
    getDurationLabel
} from '@/lib/constants/pricing';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Use Gemini 2.0 Flash (stable, fast, and free in Tier 1)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Build pricing context for AI
function getPricingContext(): string {
    const packages = [
        '## Sosyal Medya Paketleri (Aylık)',
        ...SM_PACKAGES.map(p => `- ${p.name}: ₺${p.price.toLocaleString('tr-TR')} (${p.features.join(', ')})`),
        '',
        '## Studio Reels Paketleri (Tek Seferlik)',
        ...STUDIO_REELS_PACKAGES.map(p => `- ${p.name}: ₺${p.price.toLocaleString('tr-TR')} (${p.hours} saat, ${p.videos} video)`),
        '',
        '## Birim Fiyatlar',
        ...SERVICES.map(s => `- ${s.name}: ₺${s.unitPrice.toLocaleString('tr-TR')}/${s.unit} (${s.category})`),
    ];
    return packages.join('\n');
}

// Type for AI suggestion response
export interface AIProposalSuggestion {
    items: {
        serviceId: string;
        serviceName: string;
        quantity: number;
        unitPrice: number;
        total: number;
        unit: string;
        reasoning?: string;
    }[];
    totalEstimate: number;
    aiNotes: string;
    suggestedDiscount?: number;
}

/**
 * Generate proposal suggestion from natural language input
 * NEW ARCHITECTURE: AI extracts intent → Backend calculates prices deterministically
 */
export async function generateProposalSuggestion(userInput: string): Promise<AIProposalSuggestion> {
    const pricingContext = getPricingContext();
    const capacityContext = getCapacityContext();
    const validIds = getValidServiceIds().join(', ');

    // STEP 1: AI extracts intent (not prices)
    const intentPrompt = `Sen NOCO Creative ajansının teklif asistanısın. Kullanıcının talebini analiz edip NE İSTEDİĞİNİ çıkar.

## Fiyat Listesi (Referans)
${pricingContext}

${capacityContext}

## Geçerli Hizmet ID'leri
${validIds}

## Kullanıcı Talebi
"${userInput}"

## Senin Görevin
1. Talepteki hizmetleri ve miktarları belirle
2. Video süresi belirtilmemişse 60 saniye (Reels/TikTok) kabul et
3. Her kalem için NEDEN seçildiğini açıkla
4. Ekibe faydalı notlar ekle

## Yanıt Formatı (JSON)
{
    "intent": {
        "reelsCount": 6,
        "videoDurationSeconds": 60,
        "shootingHours": null,
        "months": 1,
        "metaAds": false,
        "photoCount": null,
        "podcastHours": null,
        "packageHint": null
    },
    "items": [
        {
            "serviceId": "kurgu",
            "serviceName": "Video Kurgu",
            "quantity": 6,
            "unit": "VIDEO",
            "reasoning": "6 adet Reels için kurgu gerekli"
        }
    ],
    "aiNotes": "Ekibe not: 6 Reels için 3-4 saat çekim yeterli olacaktır.",
    "suggestedDiscount": 0
}

ÖNEMLİ: unitPrice ve total YAZMA, backend hesaplayacak. SADECE JSON döndür.`;

    try {
        const result = await model.generateContent(intentPrompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI yanıtında JSON bulunamadı');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // STEP 2: Backend validates and calculates prices deterministically
        const validatedItems = validateAndPriceItems(parsed.items || [], parsed.intent);

        // Calculate total
        const totalEstimate = validatedItems.reduce((sum, item) => sum + item.total, 0);

        return {
            items: validatedItems,
            totalEstimate,
            aiNotes: parsed.aiNotes || '',
            suggestedDiscount: parsed.suggestedDiscount || 0
        };
    } catch (error) {
        console.error('AI Proposal Generation Error:', error);
        throw new Error('Yapay zeka önerisi oluşturulamadı. Lütfen tekrar deneyin.');
    }
}

/**
 * Validate AI items and calculate prices deterministically from pricing.ts
 * This ensures AI cannot produce incorrect prices
 */
function validateAndPriceItems(
    aiItems: Array<{ serviceId: string; serviceName: string; quantity: number; unit: string; reasoning?: string }>,
    intent?: { reelsCount?: number; videoDurationSeconds?: number; shootingHours?: number }
): AIProposalSuggestion['items'] {
    const result: AIProposalSuggestion['items'] = [];
    const processedIds = new Set<string>();

    // Auto-add shooting if reels detected but no shooting in items
    if (intent?.reelsCount && !aiItems.some(i => i.serviceId.startsWith('cekim'))) {
        const shootPkg = pickShootPackage(intent.reelsCount);
        result.push({
            serviceId: shootPkg.package.id,
            serviceName: `Çekim (${shootPkg.package.hours} saat)`,
            quantity: shootPkg.quantity,
            unitPrice: shootPkg.package.price,
            total: shootPkg.package.price * shootPkg.quantity,
            unit: shootPkg.quantity > 1 ? 'GÜN' : 'PAKET',
            reasoning: `${intent.reelsCount} Reels için ${shootPkg.package.hours} saat çekim önerildi`
        });
        processedIds.add('shooting');
    }

    for (const item of aiItems) {
        const serviceId = item.serviceId.toLowerCase();
        let unitPrice = 0;
        let serviceName = item.serviceName;

        // Look up price from pricing.ts (NEVER trust AI prices)
        const service = SERVICES.find(s => s.id === serviceId);
        if (service) {
            unitPrice = service.unitPrice;
            serviceName = service.name;
        }

        // Check SM packages
        const smPackage = SM_PACKAGES.find(p => `sm-${p.id}` === serviceId || p.id === serviceId);
        if (smPackage) {
            unitPrice = smPackage.price;
            serviceName = `SM Paket ${smPackage.name}`;
        }

        // Check Studio Reels packages
        const reelsPackage = STUDIO_REELS_PACKAGES.find(p => `reels-${p.id}` === serviceId || p.id === serviceId);
        if (reelsPackage) {
            unitPrice = reelsPackage.price;
            serviceName = `Studio Reels ${reelsPackage.name}`;
        }

        // Check capacity shoots
        const shootCapacity = PRODUCTION_CAPACITY.shoots.find(s => s.id === serviceId);
        if (shootCapacity) {
            unitPrice = shootCapacity.price;
            serviceName = `Çekim (${shootCapacity.hours} saat)`;
        }

        // Handle kurgu with duration multiplier
        if (serviceId === 'kurgu' || serviceId.includes('kurgu')) {
            const durationSec = intent?.videoDurationSeconds || 60;
            unitPrice = getKurguPrice(durationSec);
            const label = getDurationLabel(durationSec);
            serviceName = `Video Kurgu ${label}`;
        }

        // Skip invalid items with no price found
        if (unitPrice === 0) {
            console.warn(`Unknown serviceId: ${serviceId}, skipping`);
            continue;
        }

        const total = unitPrice * item.quantity;

        result.push({
            serviceId: item.serviceId,
            serviceName,
            quantity: item.quantity,
            unitPrice,
            total,
            unit: item.unit,
            reasoning: item.reasoning
        });
    }

    return result;
}

/**
 * Simple project type to services mapping (fallback without AI)
 */
export function getDefaultServicesForProjectType(
    projectType: 'VIDEO' | 'PHOTO' | 'SOCIAL' | 'PODCAST',
    quantities: Record<string, number>
): AIProposalSuggestion['items'] {
    const items: AIProposalSuggestion['items'] = [];

    switch (projectType) {
        case 'VIDEO':
            const videoCount = quantities.videos || 6;
            // Find best matching Reels package
            if (videoCount <= 6) {
                const pkg = STUDIO_REELS_PACKAGES[0]; // BASIC
                items.push({
                    serviceId: `reels-${pkg.id}`,
                    serviceName: `Studio Reels ${pkg.name}`,
                    quantity: 1,
                    unitPrice: pkg.price,
                    total: pkg.price,
                    unit: 'PAKET',
                    reasoning: `${videoCount} video için BASIC paket uygun`,
                });
            } else if (videoCount <= 12) {
                const pkg = STUDIO_REELS_PACKAGES[2]; // DELUXE
                items.push({
                    serviceId: `reels-${pkg.id}`,
                    serviceName: `Studio Reels ${pkg.name}`,
                    quantity: 1,
                    unitPrice: pkg.price,
                    total: pkg.price,
                    unit: 'PAKET',
                    reasoning: `${videoCount} video için DELUXE paket ekonomik`,
                });
            }
            break;

        case 'PHOTO':
            const products = quantities.products || 10;
            const angles = quantities.angles || 5;
            const totalPhotos = products * angles;
            const retouchType = quantities.detailedRetouch ? 'retouch-detay' : 'retouch-basic';
            const retouchService = SERVICES.find(s => s.id === retouchType)!;

            items.push({
                serviceId: retouchType,
                serviceName: retouchService.name,
                quantity: totalPhotos,
                unitPrice: retouchService.unitPrice,
                total: retouchService.unitPrice * totalPhotos,
                unit: retouchService.unit,
                reasoning: `${products} ürün × ${angles} açı = ${totalPhotos} kare`,
            });

            // Add studio if needed
            const studioHours = Math.ceil(totalPhotos / 20); // ~20 photos per hour
            if (studioHours > 0) {
                const studioService = SERVICES.find(s => s.id === 'foto-saat')!;
                items.push({
                    serviceId: 'foto-saat',
                    serviceName: studioService.name,
                    quantity: studioHours,
                    unitPrice: studioService.unitPrice,
                    total: studioService.unitPrice * studioHours,
                    unit: studioService.unit,
                    reasoning: `${totalPhotos} kare için ~${studioHours} saat stüdyo`,
                });
            }

            // Add Operator (with daily limit logic)
            // 1 Operator can shoot max 100 products/day
            const dailyLimit = 100;
            const operatorDays = Math.ceil(products / dailyLimit);
            const operatorService = SERVICES.find(s => s.id === 'foto-operator')!;

            items.push({
                serviceId: 'foto-operator',
                serviceName: operatorService.name,
                quantity: operatorDays,
                unitPrice: operatorService.unitPrice,
                total: operatorService.unitPrice * operatorDays,
                unit: operatorService.unit,
                reasoning: `${products} ürün / ${dailyLimit} (günlük limit) = ${operatorDays} gün operatör`,
            });
            break;

        case 'SOCIAL':
            const monthlyVideos = quantities.videos || 4;
            // Find best SM package
            const matchingPackage = SM_PACKAGES.find(p => (p.videoCount || 0) >= monthlyVideos) || SM_PACKAGES[1];
            items.push({
                serviceId: `sm-${matchingPackage.id}`,
                serviceName: `SM Paket ${matchingPackage.name}`,
                quantity: quantities.months || 1,
                unitPrice: matchingPackage.price,
                total: matchingPackage.price * (quantities.months || 1),
                unit: 'AYLIK',
                reasoning: `Aylık ${monthlyVideos} video için ${matchingPackage.name} paketi`,
            });
            break;

        case 'PODCAST':
            const hours = quantities.hours || 2;
            const studioP = SERVICES.find(s => s.id === 'podcast-studio')!;
            const operator = SERVICES.find(s => s.id === 'podcast-operator')!;

            items.push({
                serviceId: 'podcast-studio',
                serviceName: studioP.name,
                quantity: hours,
                unitPrice: studioP.unitPrice,
                total: studioP.unitPrice * hours,
                unit: studioP.unit,
            });
            items.push({
                serviceId: 'podcast-operator',
                serviceName: operator.name,
                quantity: hours,
                unitPrice: operator.unitPrice,
                total: operator.unitPrice * hours,
                unit: operator.unit,
            });
            break;
    }

    return items;
}
