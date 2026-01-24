const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30);

    console.log('Range:', startDate.toISOString().split('T')[0], 'to', weekEnd.toISOString().split('T')[0]);

    const { data, error } = await supabase
        .from('Task')
        .select('id, title, dueDate, status')
        .not('dueDate', 'is', null)
        .gte('dueDate', startDate.toISOString().split('T')[0])
        .lte('dueDate', weekEnd.toISOString().split('T')[0])
        .limit(50);

    if (error) {
        console.error(error);
        return;
    }

    // Sort as per application logic
    const sorted = data.sort((a, b) => {
        const isDoneA = a.status === 'DONE';
        const isDoneB = b.status === 'DONE';
        if (isDoneA && !isDoneB) return 1;
        if (!isDoneA && isDoneB) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    console.log('Result count:', sorted.length);
    sorted.forEach(t => {
        console.log(`[${t.dueDate}] ${t.title} (${t.status})`);
    });
}

main();
