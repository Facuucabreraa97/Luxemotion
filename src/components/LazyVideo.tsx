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
 * LazyVideo — Zero-download gallery component (Module 3.19)
 *
 * STRATEGY: No <video> element exists in the DOM by default.
 * This eliminates ALL network requests from the gallery grid.
 *
 * Flow:
 * 1. DEFAULT: Shows a static poster <img> (or gradient placeholder)
 * 2. ON HOVER: Mounts <video>, calls .play()
 * 3. ON LEAVE: Unmounts <video> entirely → frees the connection
 * 4. VIEWPORT CHECK: Only enables hover behavior when near viewport
 *
 * This guarantees 0 MP4 downloads on page load = instant gallery render.
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
    ? isNearViewport && isHovering   // Hover mode: only on hover + near viewport
    : isNearViewport && autoPlay;    // Legacy mode: on viewport entry

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
      videoRef.current.play().catch(() => {
        // Autoplay blocked — silently ignore
      });
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

  // Poster URL: use provided poster, or use #t=0.1 trick via <img> approach
  // We DON'T use #t=0.1 on a <video> because that still buffers.
  // Instead, we show a static poster image or a gradient placeholder.

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
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          {poster ? (
            <img src={poster} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center opacity-40">
                <span className="text-2xl block">▶</span>
                <span className="text-[8px] uppercase font-bold tracking-wider text-gray-500 mt-1 block">Hover to preview</span>
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
    </div>
  );
};
