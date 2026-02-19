import React, { useRef, useState, useEffect, useCallback } from 'react';

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
  /** If true, video only plays on hover (default: true for gallery perf) */
  hoverToPlay?: boolean;
}

/**
 * LazyVideo — Hover-to-Play video component.
 * 
 * Performance strategy (Module 3.18):
 * 1. Shows first frame via #t=0.1 trick (no full buffer)
 * 2. Only loads video src when near viewport (IntersectionObserver)
 * 3. Only plays on mouseEnter, pauses on mouseLeave
 * 4. Pauses when scrolled out of viewport
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
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // IntersectionObserver: only render <video> when near viewport
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
          setIsHovering(false);
        }
      },
      { rootMargin, threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  // Play/pause based on hover state (or autoPlay for non-hover mode)
  useEffect(() => {
    if (!videoRef.current || !isVisible || !isLoaded) return;

    const shouldPlay = hoverToPlay ? isHovering : autoPlay;

    if (shouldPlay) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked — silently ignore
      });
    } else {
      videoRef.current.pause();
    }
  }, [isVisible, isLoaded, isHovering, hoverToPlay, autoPlay]);

  const handleMouseEnter = useCallback(() => {
    if (hoverToPlay) setIsHovering(true);
  }, [hoverToPlay]);

  const handleMouseLeave = useCallback(() => {
    if (hoverToPlay) {
      setIsHovering(false);
      // Reset to first frame for clean poster-like appearance
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [hoverToPlay]);

  // Build video src: append #t=0.1 for first-frame poster trick
  const videoSrc = src && !src.includes('#t=') ? `${src}#t=0.1` : src;

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
      {/* Poster / loading state — only show spinner if no poster and not loaded */}
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
          src={videoSrc}
          className="w-full h-full object-cover"
          muted={muted}
          loop={loop}
          playsInline={playsInline}
          controls={controls}
          preload="metadata"
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
};
