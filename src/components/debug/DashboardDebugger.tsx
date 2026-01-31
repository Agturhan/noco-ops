'use client';

import React, { useState, useEffect } from 'react';
import { getUserTodayTasks } from '@/lib/actions/userDashboard';

export function DashboardDebugger() {
    const [debugData, setDebugData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string>('');

    useEffect(() => {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserId(user.id);
            getUserTodayTasks(user.id)
                .then(data => setDebugData(data))
                .catch(err => setError(err.message));
        } else {
            setError('No user in localStorage');
        }
    }, []);

    if (!debugData) return <div className="p-4 bg-red-900/50 text-white rounded mt-4">Loading Debug Data...</div>;

    return (
        <div className="p-4 bg-black/80 text-green-400 font-mono text-xs rounded mt-4 border border-green-500 overflow-auto max-h-96">
            <h3 className="font-bold mb-2">DASHBOARD DEBUGGER</h3>
            <div>User ID: {userId}</div>
            <div>Tasks Found: {debugData.length}</div>
            {error && <div className="text-red-500">Error: {error}</div>}
            <pre>{JSON.stringify(debugData, null, 2)}</pre>
        </div>
    );
}
