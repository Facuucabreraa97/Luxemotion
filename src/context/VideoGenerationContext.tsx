import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MarketService } from '@/services/market.service';
import { supabase } from '@/lib/supabase';

interface VideoGenerationContextType {
  isGenerating: boolean;
  activeId: string | null;
  startGeneration: (id: string) => void;
}

const VideoGenerationContext = createContext<VideoGenerationContextType | undefined>(undefined);

export const VideoGenerationProvider = ({ children }: { children: ReactNode }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Polling Logic
  const pollStatus = async (id: string) => {
    setIsGenerating(true);
    setActiveId(id);
    let status = 'starting';
    let pollCount = 0;

    try {
      while (status !== 'succeeded' && status !== 'failed' && status !== 'canceled') {
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
          status = data.status;

          if (status === 'succeeded') {
            const resultUrl = Array.isArray(data.output) ? data.output[0] : data.output;
            const metadata = data.lux_metadata || {};

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
            }

            localStorage.removeItem('active_prediction_id');
            setIsGenerating(false);
            setActiveId(null);

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
          } else if (status === 'failed' || status === 'canceled') {
            throw new Error(`Generation ${status}`);
          }
        } catch (networkError) {
          console.warn('Polling glitch:', networkError);
          // Ignore network errors, keep polling
        }
        pollCount++;
      }
    } catch (e) {
      console.error(e);
      localStorage.removeItem('active_prediction_id');
      setIsGenerating(false);
      setActiveId(null);
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
    <VideoGenerationContext.Provider value={{ isGenerating, activeId, startGeneration }}>
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
