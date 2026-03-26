import React, { useState } from 'react';
import { Download, Globe, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { S } from '../styles';
import { useMode } from '../context/ModeContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { VideoCard } from '../components/VideoCard';

export const GalleryPage = ({ videos, onVideosChange }: { videos: any[]; onVideosChange?: (videos: any[]) => void }) => {
  const { mode } = useMode();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [publishing, setPublishing] = useState<string | null>(null);

  const togglePublish = async (video: any) => {
    setPublishing(video.id);
    try {
        const isPublic = !video.is_public;

        const { data: { session } } = await supabase.auth.getSession();

        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({
                id: video.id,
                type: 'video',
                is_public: isPublic
            })
        });

        if (res.ok) {
            showToast(isPublic ? t('gallery.published') : t('gallery.unpublished'), 'success');
            // Update local state instead of reloading the page
            const updatedVideos = videos.map(v =>
                v.id === video.id ? { ...v, is_public: isPublic } : v
            );
            if (onVideosChange) {
                onVideosChange(updatedVideos);
            }
        } else {
             throw new Error("Failed");
        }
    } catch (e) {
        showToast('Error updating status', 'error');
    } finally {
        setPublishing(null);
    }
  };

  return (
  <div className={`p-6 lg:p-12 pb-32 animate-in fade-in ${mode==='velvet'?'':'bg-gray-50'}`}>
    <h2 className={`text-4xl font-bold uppercase tracking-[0.2em] mb-12 border-b pb-8 ${mode==='velvet'?'text-white border-white/10':'text-gray-900 border-gray-200'}`}>{t('gallery.title')}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {videos.map((v:any) => (
            <VideoCard
                key={v.id}
                type="video"
                item={v}
                onPublish={togglePublish}
                publishing={publishing === v.id}
                onDownload={(url) => {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'video.mp4';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }}
            />
        ))}
        {videos.length===0 && <div className={`col-span-full text-center py-32 uppercase text-xs tracking-[0.4em] ${mode==='velvet'?'text-white/20':'text-gray-400'}`}>{t('gallery.empty')}</div>}
    </div>
  </div>
  );
};
