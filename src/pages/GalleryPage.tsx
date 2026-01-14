import React, { useState } from 'react';
import { Download, Globe, Loader2 } from 'lucide-react';
import { S } from '../styles';
import { useMode } from '../context/ModeContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';

export const GalleryPage = ({ videos }: any) => {
  const { mode } = useMode();
  const { showToast } = useToast();
  const [publishing, setPublishing] = useState<string | null>(null);

  const togglePublish = async (video: any) => {
    setPublishing(video.id);
    try {
        // Toggle (optimistic UI could be implemented if videos state was managed here more deeply, but for now we call API)
        const isPublic = !video.is_public; // Needs video to have is_public prop.
        // NOTE: 'videos' prop comes from App.tsx, which maps backend data. We need to ensure 'is_public' is passed down.
        // Assuming the parent component passes is_public.

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
                is_public: isPublic // Toggle to the new state
            })
        });

        if (res.ok) {
            showToast(isPublic ? t('gallery.published') : t('gallery.unpublished'), 'success');
            // Optimistically update the UI by reloading the page or ideally updating state from parent.
            // For now, we force a reload to reflect state if we don't have a state setter passed down.
            // A better approach in a larger app would be to use a callback prop "onUpdate".
            window.location.reload();
        } else {
             throw new Error("Failed");
        }
    } catch (e) {
        showToast('Error updating status', 'error');
    } finally {
        setPublishing(null);
    }
  };

  const { t } = useTranslation();

  return (
  <div className={`p-6 lg:p-12 pb-32 animate-in fade-in ${mode==='velvet'?'':'bg-gray-50'}`}>
    <h2 className={`text-4xl font-bold uppercase tracking-[0.2em] mb-12 border-b pb-8 ${mode==='velvet'?'text-white border-white/10':'text-gray-900 border-gray-200'}`}>{t('gallery.title')}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {videos.map((v:any) => (
            <div key={v.id} className={`rounded-[30px] overflow-hidden group relative hover:-translate-y-2 transition-all ${mode==='velvet'?S.panel:'bg-white shadow-lg border border-gray-100'}`}>
                <video src={v.url} className="aspect-[9/16] object-cover w-full" controls/>
                <div className={`p-5 flex justify-between items-center ${mode==='velvet'?'bg-[#0a0a0a]':'bg-white'}`}>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${mode==='velvet'?'text-white/40':'text-gray-400'}`}>{v.date}</span>
                    <div className="flex gap-2">
                         <button
                            onClick={() => togglePublish(v)}
                            disabled={publishing === v.id}
                            className={`p-2 rounded-full transition-all
                                ${mode==='velvet'
                                    ? (v.is_public ? 'bg-[#C6A649] text-black hover:bg-white hover:text-black' : 'bg-white/5 text-gray-400 hover:text-[#C6A649]')
                                    : (v.is_public ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-100 text-gray-500 hover:text-black')}`}
                            title={v.is_public ? t('gallery.unpublish_from_explore') : t('gallery.publish_to_explore')}
                         >
                            {publishing === v.id ? <Loader2 size={14} className="animate-spin"/> : <Globe size={14}/>}
                         </button>
                         <a href={v.url} download className={`p-2 rounded-full transition-all ${mode==='velvet'?'bg-white/5 text-[#C6A649] hover:bg-[#C6A649] hover:text-black':'bg-gray-100 text-black hover:bg-black hover:text-white'}`}>
                            <Download size={14}/>
                         </a>
                    </div>
                </div>
            </div>
        ))}
        {videos.length===0 && <div className={`col-span-full text-center py-32 uppercase text-xs tracking-[0.4em] ${mode==='velvet'?'text-white/20':'text-gray-400'}`}>{t('gallery.empty')}</div>}
    </div>
  </div>
  );
};
