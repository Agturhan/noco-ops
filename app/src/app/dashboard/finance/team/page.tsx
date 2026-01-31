import { getTeamWithCosts } from '@/lib/actions/finance-team';
import TeamCostList from './TeamCostList';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeamCostsPage() {
    const teamData = await getTeamWithCosts();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Users className="text-[var(--accent)]" />
                        Ekip Maliyetleri
                    </h1>
                    <p className="text-[var(--muted)] mt-1">
                        Personel saatlik maliyetlerini yönetin ve kârlılık raporlarını optimize edin.
                    </p>
                </div>
            </div>

            <TeamCostList data={teamData} />
        </div>
    );
}
