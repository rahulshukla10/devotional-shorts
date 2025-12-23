import { createClient } from '@/lib/supabase/server';
import VideoPlayer from '@/components/feed/VideoPlayer';
import ClientFeed from '@/components/feed/ClientFeed';

export default async function FeedPage() {
  const supabase = await createClient();

  // Fetch approved videos
  const { data: videos, error } = await supabase
    .from('videos')
    .select(`
      *,
      profiles (
        username,
        avatar_url
      )
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching videos:', error);
    // return <div className="p-8 text-center text-red-500">Failed to load feed.</div>;
    // For demo purposes with mock keys, we might get an error.
    // We'll proceed with empty or mock data if error, to show UI.
  }

  // If no videos (or error/placeholder), show a placeholder or empty state
  if (!videos || videos.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="text-center space-y-4">
          <p>No videos yet.</p>
          <a href="/upload" className="inline-block bg-primary text-black px-4 py-2 rounded-full font-bold">
            Upload First Video
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen w-full bg-black overflow-hidden relative">
      <ClientFeed initialVideos={videos} />

      {/* Absolute Header for Nav */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <h1 className="text-xl font-bold text-white drop-shadow-md pointer-events-auto">Devotional</h1>
        <a href="/upload" className="pointer-events-auto text-white font-semibold hover:text-primary transition-colors">
          Upload
        </a>
      </div>
    </main>
  );
}
