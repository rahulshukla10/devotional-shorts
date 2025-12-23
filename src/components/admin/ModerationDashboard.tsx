'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Check, X } from 'lucide-react';

interface Video {
    id: string;
    video_url: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
    user_id: string;
}

export default function ModerationDashboard() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchPendingVideos = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching pending videos:', error);
        } else {
            setVideos(data || []);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchPendingVideos();
    }, [fetchPendingVideos]);

    const handleAction = async (videoId: string, action: 'approve' | 'ban') => {
        const status = action === 'approve' ? 'approved' : 'banned';

        // Optimistic update
        setVideos(current => current.filter(v => v.id !== videoId));

        const { error } = await supabase
            .from('videos')
            .update({ status })
            .eq('id', videoId);

        if (error) {
            console.error('Error updating video status:', error);
            alert('Failed to update status');
            // Revert if needed (omitted for simplicity)
            fetchPendingVideos();
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    if (videos.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No pending videos to review.</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
                <div key={video.id} className="bg-card border rounded-lg overflow-hidden shadow-sm">
                    <div className="aspect-[9/16] bg-black relative group">
                        <video
                            src={video.video_url}
                            className="w-full h-full object-contain"
                            controls
                        />
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <h3 className="font-semibold line-clamp-1" title={video.title}>{video.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2" title={video.description}>{video.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Uploaded: {new Date(video.created_at).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleAction(video.id, 'ban')}
                                className="flex-1 flex items-center justify-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20 py-2 rounded-md font-medium transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Ban
                            </button>
                            <button
                                onClick={() => handleAction(video.id, 'approve')}
                                className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 text-green-600 hover:bg-green-500/20 py-2 rounded-md font-medium transition-colors"
                            >
                                <Check className="w-4 h-4" />
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
