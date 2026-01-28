import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MarketService } from '@/services/market.service';
import { supabase } from '@/lib/supabase';

export type GenerationStatus =
  | 'idle'
  | 'starting'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled';

interface VideoGenerationContextType {
  isGenerating: boolean;
  activeId: string | null;
  status: GenerationStatus;
  lastGeneratedUrl: string | null;
  startGeneration: (id: string) => void;
}

const VideoGenerationContext = createContext<VideoGenerationContextType | undefined>(undefined);

export const VideoGenerationProvider = ({ children }: { children: ReactNode }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  // Polling Logic
  const pollStatus = async (id: string) => {
    setIsGenerating(true);
    setActiveId(id);
    setStatus('starting');
    setLastGeneratedUrl(null); // Reset previous result

    let currentStatus: GenerationStatus = 'starting';
    let pollCount = 0;

    try {
      while (
        currentStatus !== 'succeeded' &&
        currentStatus !== 'failed' &&
        currentStatus !== 'canceled'
      ) {
        if (pollCount > 200) throw new Error('Timeout'); // ~10 mins

        await new Promise((r) => setTimeout(r, 3000));

        try {
          // Get session for auth
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const headers: HeadersInit = session
            ? { Authorization: `Bearer ${session.access_token}` }
            : {};

          // Using existing endpoint /api/generate?id=...
          const res = await fetch(`/api/generate?id=${id}`, { headers });
          if (!res.ok) throw new Error('Network error');

          const data = await res.json();
          currentStatus = data.status || 'processing';
          setStatus(currentStatus);

          if (currentStatus === 'succeeded') {
            const resultUrl = Array.isArray(data.output) ? data.output[0] : data.output;
            const metadata = data.lux_metadata || {};
            setLastGeneratedUrl(resultUrl);

            // AUTO-SAVE to DB
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              await MarketService.saveDraft(
                {
                  name:
                    metadata.prompt_structure?.user_prompt?.substring(0, 30) || 'Untitled Video',
                  description: metadata.prompt_structure?.user_prompt || 'AI Generated Video',
                  image_url: 'https://via.placeholder.com/1080x1920?text=Video+Asset', // Fallback cover
                  video_url: resultUrl,
                  price: 0,
                  supply_total: 1,
                  royalty_percent: 5,
                  seed: metadata.seed,
                  generation_config: metadata.generation_config,
                  prompt_structure: metadata.prompt_structure,
                },
                user.id
              );

              // Update 'generations' table status (Optional but good for history)
              await supabase
                .from('generations')
                .update({
                  status: 'succeeded',
                  image_url: resultUrl,
                  progress: 100,
                })
                .eq('replicate_id', id);
            }

            localStorage.removeItem('active_prediction_id');
            setIsGenerating(false);
            setActiveId(null);
            // Keep status as succeeded for a moment so UI can show success state logic

            toast.success(
              (t) => (
                <span className="flex flex-col gap-2">
                  Video ready!
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      navigate('/app/gallery');
                    }}
                    className="bg-white text-black px-2 py-1 rounded text-xs font-bold"
                  >
                    View in Gallery
                  </button>
                </span>
              ),
              { duration: 6000 }
            );
            return;
          } else if (currentStatus === 'failed' || currentStatus === 'canceled') {
            // Update 'generations' table status
            await supabase
              .from('generations')
              .update({ status: currentStatus })
              .eq('replicate_id', id);
            throw new Error(`Generation ${currentStatus}`);
          }
        } catch (networkError) {
          console.warn('Polling glitch:', networkError);
          // If we hit too many network errors (e.g., 500s from server), abort to prevent infinite loop
          if (pollCount > 10) {
            throw new Error('Too many network errors. Aborting.');
          }
        }
        pollCount++;
      }
    } catch (e) {
      console.error(e);
      localStorage.removeItem('active_prediction_id');
      setIsGenerating(false);
      setActiveId(null);
      setStatus('failed');
      toast.error('There was a problem with the generation. Please try again.');
    }
  };

  const startGeneration = (id: string) => {
    localStorage.setItem('active_prediction_id', id);
    pollStatus(id);
  };

  // Restore on mount
  useEffect(() => {
    const savedId = localStorage.getItem('active_prediction_id');
    if (savedId) {
      console.log('Restoring global generation:', savedId);
      pollStatus(savedId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <VideoGenerationContext.Provider
      value={{ isGenerating, activeId, status, lastGeneratedUrl, startGeneration }}
    >
      {children}
    </VideoGenerationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useVideoGeneration = () => {
  const context = useContext(VideoGenerationContext);
  if (!context) throw new Error('useVideoGeneration must be used within a VideoGenerationProvider');
  return context;
};
