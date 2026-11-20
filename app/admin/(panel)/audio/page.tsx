import { AudioAdmin } from '@/components/admin/AudioAdmin';

export default function AdminAudioPage() {
  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold tracking-tight">Audio</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-ink">
        Meditation, sleep and daily motivation tracks for the bot. Upload the file to the <code>audio</code> bucket in Supabase Storage
        (Storage → audio → Upload), copy its public URL and add it here. Until a track exists the bot sends text instead.
      </p>
      <AudioAdmin />
    </div>
  );
}
