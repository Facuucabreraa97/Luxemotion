import React, { useRef, useState, useEffect, useCallback } from 'react';

interface LazyVideoProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  poster?: string;
  rootMargin?: string;
  hoverToPlay?: boolean;
}

/**
 * LazyVideo — Reliable gallery video component
 *
 * APPROACH:
 * - <video> is ALWAYS in the DOM with preload="metadata"
 * - IntersectionObserver gates the `src` so only viewport-near cards load
 * - The browser renders the first frame natively as the video poster
 * - On hover → .play(), on leave → .pause() + seek to 0
 * - If a poster prop is provided, it's shown as an <img> overlay until
 *   the video gets a frame loaded (covers the black-before-load flash)
 */
export const LazyVideo: React.FC<LazyVideoProps> = ({
  src,
  className = '',
  autoPlay = false,
  muted = true,
  loop = true,
  playsInline = true,
  controls = false,
  poster,
  rootMargin = '200px',
  hoverToPlay = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasLoadedFrame, setHasLoadedFrame] = useState(false);

  // Only assign src when near viewport
  const activeSrc = isNearViewport ? src : undefined;

  // IntersectionObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsNearViewport(true);
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  // Seek to 0.1s once metadata loads to show first frame
  const handleLoadedData = useCallback(() => {
    if (videoRef.current && !isPlaying) {
      videoRef.current.currentTime = 0.1;
    }
    setHasLoadedFrame(true);
  }, [isPlaying]);

  const handleMouseEnter = useCallback(() => {
    if (!hoverToPlay || !videoRef.current) return;
    videoRef.current.play().catch(() => {});
  }, [hoverToPlay]);

  const handleMouseLeave = useCallback(() => {
    if (!hoverToPlay || !videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0.1;
    setIsPlaying(false);
  }, [hoverToPlay]);

  // Auto-play mode
  useEffect(() => {
    if (!hoverToPlay && autoPlay && isNearViewport && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [hoverToPlay, autoPlay, isNearViewport]);

  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800`}>
        <div className="text-center">
          <span className="text-3xl block mb-1">🎬</span>
          <span className="text-[10px] text-gray-500 uppercase font-bold">Video unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${className} relative bg-black`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* THE VIDEO — always in DOM, shows first frame natively */}
      <video
        ref={videoRef}
        src={activeSrc}
        className="w-full h-full object-cover"
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        controls={controls}
        preload="metadata"
        onLoadedData={handleLoadedData}
        onPlaying={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => { if (activeSrc) setHasError(true); }}
      />

      {/* POSTER OVERLAY — covers the black flash while video metadata loads */}
      {!hasLoadedFrame && !isPlaying && poster && (
        <div className="absolute inset-0 z-10">
          <img src={poster} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      {/* FALLBACK PLACEHOLDER — shown when no poster and no video frame yet */}
      {!hasLoadedFrame && !isPlaying && !poster && (
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#0d0d1a] via-[#1a1a2e] to-[#0d0d1a] flex items-center justify-center">
          <div className="text-center opacity-50">
            <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-white/70 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-[8px] uppercase font-bold tracking-widest text-gray-500">Hover to play</span>
          </div>
        </div>
      )}

      {/* Small play badge — visible when poster/frame is shown */}
      {hasLoadedFrame && !isPlaying && (
        <div className="absolute bottom-2 right-2 z-20 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}
    </div>
  );
};
