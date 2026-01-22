const { createClient } = require('@supabase/supabase-js');
const process = require('process');

// Env variables (hardcoded for this script only based on previous context if needed, or rely on .env)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wqcwlspeipxquslbxpmz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxY3dsc3BlaXB4cXVzbGJ4cG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjE2OTI3OSwiZXhwIjoyMDUxNzQ1Mjc5fQ.dP1cXDMp3AV-H-Y2WOr2i5d7g2FcO0bRd3LPaK-QxPU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkData() {
    console.log('Checking Task table data...');
    const { data, error } = await supabase
        .from('Task')
        .select('id, title, dueDate, sourceType, status, assigned_to:assigneeId, assignees:assigneeIds')
        .not('dueDate', 'is', null)
        .order('dueDate', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} tasks with due dates.`);
    data.forEach(t => {
        console.log(`ID: ${t.id} | Title: ${t.title} | Due: ${t.dueDate} | Type: ${t.sourceType} | Status: ${t.status}`);
    });
}

checkData();
