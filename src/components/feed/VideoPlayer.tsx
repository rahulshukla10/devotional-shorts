'use client';

import { useRef, useState, useEffect } from 'react';
import { Heart, MessageCircle, Download, Flag, Play, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Video {
    id: string;
    video_url: string;
    description: string;
    title: string;
    user_id: string;
    created_at: string;
    profiles?: {
        username: string;
        avatar_url: string | null;
    };
    likes_count: number;
}

export default function VideoPlayer({ video, isActive }: { video: Video; isActive: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false); // Default unmuted? Mobile usually requires muted for autoplay, but user gesture allows unmuted.
    const [liked, setLiked] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (isActive) {
            // Small promise refinement to handle play interruptions
            const playPromise = videoRef.current?.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setPlaying(true))
                    .catch((err) => {
                        console.log('Autoplay blocked', err);
                        setPlaying(false);
                    });
            }
        } else {
            videoRef.current?.pause();
            setPlaying(false);
        }
    }, [isActive]);

    const togglePlay = () => {
        if (videoRef.current?.paused) {
            videoRef.current.play();
            setPlaying(true);
        } else {
            videoRef.current?.pause();
            setPlaying(false);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setMuted(videoRef.current.muted);
        }
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setDownloading(true);
        try {
            const response = await fetch(video.video_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `devotional-${video.title || 'video'}.mp4`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // Increment download count (optional, fire and forget)
            // await supabase.rpc('increment_download', { video_id: video.id });
        } catch (err) {
            console.error('Download failed', err);
            alert('Failed to download video.');
        } finally {
            setDownloading(false);
        }
    };

    const handleReport = () => {
        // Future: Open report modal
        alert("Reported for review.");
        // Logic to insert into reports table
    };

    return (
        <div className="relative h-[calc(100vh-0px)] w-full max-w-md mx-auto bg-black flex items-center justify-center snap-start shrink-0">
            {/* Video Element */}
            <video
                ref={videoRef}
                src={video.video_url}
                className="h-full w-full object-cover"
                loop
                playsInline
                onClick={togglePlay}
            />

            {/* Play/Pause Overlay Icon (optional, fades out) */}
            {!playing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                    <Play className="w-16 h-16 text-white/80" fill="currentColor" />
                </div>
            )}

            {/* Right Sidebar Actions */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-10">
                <button className="flex flex-col items-center gap-1" onClick={() => setLiked(!liked)}>
                    <div className={cn("p-2 rounded-full bg-black/40 backdrop-blur-sm transition-transform active:scale-90", liked && "bg-red-500/20")}>
                        <Heart className={cn("w-8 h-8", liked ? "text-red-500 fill-red-500" : "text-white")} />
                    </div>
                    <span className="text-white text-xs font-semibold shadow-black drop-shadow-md">{video.likes_count + (liked ? 1 : 0)}</span>
                </button>

                <button className="flex flex-col items-center gap-1">
                    <div className="p-2 rounded-full bg-black/40 backdrop-blur-sm">
                        <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-white text-xs font-semibold shadow-black drop-shadow-md">0</span>
                </button>

                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex flex-col items-center gap-1"
                >
                    <div className={cn("p-2 rounded-full bg-black/40 backdrop-blur-sm", downloading && "animate-pulse")}>
                        <Download className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-white text-xs font-semibold shadow-black drop-shadow-md">Save</span>
                </button>

                <button onClick={handleReport} className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100">
                    <div className="p-2 rounded-full bg-black/40 backdrop-blur-sm">
                        <Flag className="w-6 h-6 text-white" />
                    </div>
                </button>
            </div>

            {/* Bottom Info Section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20">
                <div className="flex items-end justify-between">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gray-600 border border-white overflow-hidden">
                                {/* Avatar placeholder */}
                                {video.profiles?.avatar_url ? (
                                    <img src={video.profiles.avatar_url} alt={video.profiles.username} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary text-black font-bold uppercase">
                                        {video.profiles?.username?.[0] || 'U'}
                                    </div>
                                )}
                            </div>
                            <span className="text-white font-bold text-shadow-sm">@{video.profiles?.username || 'devotee'}</span>
                            <button className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-md font-semibold">
                                Follow
                            </button>
                        </div>
                        <p className="text-white text-sm line-clamp-2 md:w-3/4 text-shadow-sm">
                            {video.description}
                        </p>
                        <h3 className="text-white/90 font-semibold text-lg flex items-center gap-2">
                            {video.title}
                        </h3>
                    </div>

                    {/* Mute Control (Bottom Right relative to text) */}
                    <button onClick={toggleMute} className="p-2 mb-1 rounded-full bg-black/40 text-white hover:bg-black/60">
                        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
