import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ModerationDashboard from '@/components/admin/ModerationDashboard';

export default async function AdminPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Check admin status
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile || !profile.is_admin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="max-w-md text-center space-y-4">
                    <h1 className="text-2xl font-bold text-primary">Restricted Access</h1>
                    <p className="text-muted-foreground">You do not have permission to view this page.</p>
                    <Link href="/" className="inline-block text-sm underline hover:text-primary">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-primary">Moderation Dashboard</h1>
                    <div className="text-sm text-muted-foreground">
                        Logged in as Admin
                    </div>
                </div>

                <ModerationDashboard />
            </div>
        </div>
    );
}
