'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, UploadCloud, AlertTriangle } from 'lucide-react';

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            // Basic client-side validation
            if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
                setError('File size too large. Max 50MB.');
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            // 1. Check Auth
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('You must be logged in to upload.');
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Math.random()}.${fileExt}`;

            // 2. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('videos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('videos')
                .getPublicUrl(fileName);

            // 4. Insert into Database
            const { error: dbError } = await supabase
                .from('videos')
                .insert({
                    user_id: user.id,
                    title,
                    description,
                    video_url: publicUrl,
                    status: 'pending', // Explicitly set pending
                });

            if (dbError) throw dbError;

            // Success
            router.push('/');
            router.refresh();

        } catch (err: unknown) {
            console.error('Upload error:', err);
            setError((err as Error).message || 'An error occurred during upload.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center p-6 bg-background">
            <div className="w-full max-w-lg space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-primary">Share Devotion</h1>
                    <p className="text-muted-foreground">Upload a short video. Inspire others.</p>
                </div>

                {/* Warning Box */}
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex gap-3 text-destructive p-4">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <div className="text-sm">
                        <p className="font-semibold">Strict Content Policy</p>
                        <p>No 18+, nudity, or offensive content. All uploads are moderated. Violators will be banned immediately.</p>
                    </div>
                </div>

                {error && (
                    <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleUpload} className="space-y-6 bg-card p-6 rounded-xl shadow-sm border">

                    {/* File input */}
                    <div className="border-2 border-dashed border-input rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            accept="video/mp4,video/webm"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            required
                        />
                        <div className="flex flex-col items-center gap-2">
                            <UploadCloud className="h-10 w-10 text-muted-foreground" />
                            {file ? (
                                <span className="text-sm font-medium text-primary break-all">{file.name}</span>
                            ) : (
                                <>
                                    <span className="text-sm font-medium">Tap to select video</span>
                                    <span className="text-xs text-muted-foreground">MP4, WebM (Max 50MB)</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Morning Aarti at Varanasi"
                            className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                            required
                            maxLength={50}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add description or mantras..."
                            className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                            maxLength={200}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={uploading || !file}
                        className="w-full rounded-md bg-primary py-3 text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {uploading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Uploading...
                            </div>
                        ) : (
                            'Upload Video'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
