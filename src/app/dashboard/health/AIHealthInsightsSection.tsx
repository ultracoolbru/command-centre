import { useAuth } from '@/lib/auth-context';
import { useMemo } from 'react';
import AIHealthInsights from './AIHealthInsights';

export default function AIHealthInsightsSection({ date }: { date: Date | null }) {
    const { user } = useAuth();
    // Compute the start of the week (Sunday) for the selected date
    const weekStartDate = useMemo(() => {
        if (!date) return null;
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - d.getDay());
        return d.toISOString();
    }, [date]);

    if (!user?.uid || !weekStartDate) return null;
    return <AIHealthInsights userId={user.uid} weekStartDate={weekStartDate} />;
}
