import React, { useRef, useState, useEffect, useCallback } from 'react';

interface LazyVideoProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  /** Thumbnail URL shown as poster */
  poster?: string;
  /** Root margin for IntersectionObserver (default: '200px') */
  rootMargin?: string;
  /** If true, video plays on hover instead of auto-playing (default: true) */
  hoverToPlay?: boolean;
}

/**
 * LazyVideo — Reliable gallery component (Module 3.19 fix)
 *
 * STRATEGY: <video> exists in DOM with preload="metadata" to show the
 * first frame as a natural poster. On hover → .play(). On leave → .pause().
 * IntersectionObserver gates the `src` attribute to prevent off-screen downloads.
 *
 * This is the middle-ground approach: first-frame visible instantly,
 * no full MP4 download until hover, reliable across all browsers.
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

  // The src we actually pass to <video> — only set when near viewport
  // Append #t=0.1 to trigger first-frame render with preload="metadata"
  const activeSrc = isNearViewport ? `${src}#t=0.1` : undefined;

  // IntersectionObserver: gate src assignment
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          // Once near viewport, no need to unset — keep the metadata loaded
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  // Auto-play mode (non-hover): play when visible
  useEffect(() => {
    if (!hoverToPlay && autoPlay && isNearViewport && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [hoverToPlay, autoPlay, isNearViewport]);

  const handleMouseEnter = useCallback(() => {
    if (!hoverToPlay || !videoRef.current) return;
    videoRef.current.play().catch(() => {});
  }, [hoverToPlay]);

  const handleMouseLeave = useCallback(() => {
    if (!hoverToPlay || !videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  }, [hoverToPlay]);

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
      <video
        ref={videoRef}
        src={activeSrc}
        poster={poster || undefined}
        className="w-full h-full object-cover"
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        controls={controls}
        preload="metadata"
        onError={() => {
          // Only set error if we actually had a src (not just missing viewport)
          if (activeSrc) setHasError(true);
        }}
      />

      {/* Subtle play indicator (no hover) */}
      <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-70 group-hover:opacity-0 transition-opacity pointer-events-none">
        <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
};
