import React, { useRef, useState, useEffect, useCallback } from 'react';

interface LazyVideoProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  /** Thumbnail URL — shown instead of video by default */
  poster?: string;
  /** Root margin for IntersectionObserver (default: '200px') */
  rootMargin?: string;
  /** If true, <video> is only injected into DOM on hover (default: true) */
  hoverToPlay?: boolean;
}

/**
 * LazyVideo — Zero-download gallery component (Module 3.19/3.20)
 *
 * STRATEGY: No <video> element exists in the DOM by default.
 * This eliminates ALL network requests from the gallery grid.
 *
 * Flow:
 * 1. DEFAULT: Shows a polished poster or animated gradient placeholder
 * 2. ON HOVER: Mounts <video>, calls .play()
 * 3. ON LEAVE: Unmounts <video> entirely → frees the connection
 * 4. VIEWPORT CHECK: Only enables hover behavior when near viewport
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
  const [isHovering, setIsHovering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Should we mount the <video> element?
  const shouldMountVideo = hoverToPlay
    ? isNearViewport && isHovering
    : isNearViewport && autoPlay;

  // IntersectionObserver: track viewport proximity
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearViewport(entry.isIntersecting);
        if (!entry.isIntersecting) {
          setIsHovering(false);
          setIsPlaying(false);
        }
      },
      { rootMargin, threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  // Auto-play when video element mounts
  useEffect(() => {
    if (videoRef.current && shouldMountVideo) {
      videoRef.current.play().catch(() => {});
    }
  }, [shouldMountVideo]);

  const handleMouseEnter = useCallback(() => {
    if (hoverToPlay && isNearViewport) setIsHovering(true);
  }, [hoverToPlay, isNearViewport]);

  const handleMouseLeave = useCallback(() => {
    if (hoverToPlay) {
      setIsHovering(false);
      setIsPlaying(false);
    }
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
      className={`${className} relative bg-black group/video`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* STATIC POSTER — always visible when video is not playing */}
      {!isPlaying && (
        <div className="absolute inset-0 z-10">
          {poster ? (
            <img src={poster} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0d0d1a] via-[#1a1a2e] to-[#0d0d1a] flex items-center justify-center relative overflow-hidden">
              {/* Animated shimmer line */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(99,102,241,0.15) 45%, rgba(139,92,246,0.1) 50%, transparent 55%)',
                  animation: 'shimmer 3s ease-in-out infinite',
                }}
              />
              {/* Play icon */}
              <div className="text-center z-10 opacity-50 group-hover/video:opacity-80 transition-opacity duration-300">
                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-2 group-hover/video:border-white/40 group-hover/video:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5 text-white/70 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="text-[8px] uppercase font-bold tracking-widest text-gray-500">Hover to preview</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIDEO — only exists in DOM when hovering (or autoPlay+viewport) */}
      {shouldMountVideo && (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-cover"
          muted={muted}
          loop={loop}
          playsInline={playsInline}
          controls={controls}
          preload="auto"
          onPlaying={() => setIsPlaying(true)}
          onError={() => setHasError(true)}
        />
      )}

      {/* Inject shimmer keyframe once */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
