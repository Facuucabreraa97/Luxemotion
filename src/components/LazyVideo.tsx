import React, { useRef, useState, useEffect } from 'react';

interface LazyVideoProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  /** Thumbnail URL — shown before video loads */
  poster?: string;
  /** Root margin for IntersectionObserver (default: '200px') */
  rootMargin?: string;
}

/**
 * LazyVideo — Only loads and plays video when visible in viewport.
 * Prevents mobile browser crashes from simultaneous video decoding.
 * Shows fallback placeholder on load error.
 */
export const LazyVideo: React.FC<LazyVideoProps> = ({
  src,
  className = '',
  autoPlay = true,
  muted = true,
  loop = true,
  playsInline = true,
  controls = false,
  poster,
  rootMargin = '200px',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // IntersectionObserver: only load video when near viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          // Pause video when scrolled away to save resources
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
          }
          setIsVisible(false);
        }
      },
      { rootMargin, threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  // Play/pause based on visibility
  useEffect(() => {
    if (!videoRef.current || !autoPlay) return;
    if (isVisible && isLoaded) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked — silently ignore
      });
    }
  }, [isVisible, isLoaded, autoPlay]);

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
    <div ref={containerRef} className={`${className} relative bg-black`}>
      {/* Poster / loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          {poster ? (
            <img src={poster} alt="" className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          )}
        </div>
      )}

      {/* Only render <video> when near viewport */}
      {isVisible && (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-cover"
          muted={muted}
          loop={loop}
          playsInline={playsInline}
          controls={controls}
          preload="none"
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
};
