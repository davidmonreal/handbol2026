import { useState } from 'react';
import { useVideoSync, extractVideoId } from '../../context/VideoSyncContext';
import { API_BASE_URL } from '../../config/api';

interface VideoUrlInputProps {
    matchId: string;
}

export const VideoUrlInput = ({ matchId }: VideoUrlInputProps) => {
    const { setVideoUrl } = useVideoSync();
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!url.trim()) {
            setError('Please enter a YouTube URL');
            return;
        }

        // Validate YouTube URL format
        const youtubePatterns = [
            /youtube\.com\/watch\?v=/,
            /youtu\.be\//,
            /youtube\.com\/live\//,
            /youtube\.com\/embed\//,
        ];

        const isValidUrl = youtubePatterns.some(pattern => pattern.test(url));
        if (!isValidUrl) {
            setError('Please enter a valid YouTube URL');
            return;
        }

        // Ensure we can extract a video ID before saving
        const videoId = extractVideoId(url);
        if (!videoId) {
            setError('Could not parse this YouTube URL. Please double-check the link.');
            return;
        }

        // Save URL to backend
        setIsSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/matches/${matchId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoUrl: url }),
            });

            if (!response.ok) {
                let details = '';
                try {
                    const payload = await response.json();
                    details = payload?.error || '';
                } catch {
                    // ignore
                }
                throw new Error(details || 'Failed to save video URL');
            }

            // Set URL in context (this will load the video)
            setVideoUrl(url);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save video URL. Please try again.';
            setError(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Load YouTube Video</h2>
                    <p className="text-sm text-gray-500">Paste a YouTube URL to sync match events with video timestamps</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                    />
                    {error && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Loading...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Load Video
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};
