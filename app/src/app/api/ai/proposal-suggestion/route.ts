/**
 * API Route: AI Proposal Suggestion
 * POST /api/ai/proposal-suggestion
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateProposalSuggestion, getDefaultServicesForProjectType, AIProposalSuggestion } from '@/lib/ai';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { input, projectType, quantities } = body;

        // If natural language input provided, use AI
        if (input && typeof input === 'string' && input.trim()) {
            const suggestion = await generateProposalSuggestion(input);
            return NextResponse.json({ success: true, suggestion });
        }

        // Otherwise use rule-based fallback
        if (projectType && quantities) {
            const items = getDefaultServicesForProjectType(projectType, quantities);
            const totalEstimate = items.reduce((sum, item) => sum + item.total, 0);

            const suggestion: AIProposalSuggestion = {
                items,
                totalEstimate,
                aiNotes: 'Kural tabanlı öneri (AI kullanılmadı)',
                suggestedDiscount: 0,
            };

            return NextResponse.json({ success: true, suggestion });
        }

        return NextResponse.json(
            { success: false, error: 'Geçersiz istek. "input" veya "projectType" + "quantities" gerekli.' },
            { status: 400 }
        );
    } catch (error) {
        console.error('AI Proposal API Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' },
            { status: 500 }
        );
    }
}
