import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles, ChevronDown } from 'lucide-react';
import { S } from '../styles';

// Using the same video as LoginScreen for consistency
const LANDING_VID = "https://videos.pexels.com/video-files/3205917/3205917-hd_1920_1080_25fps.mp4";

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-black min-h-screen text-white font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#C6A649]/10 rounded-lg flex items-center justify-center border border-[#C6A649]/20">
                <Play fill="#C6A649" className="text-[#C6A649] w-4 h-4 ml-0.5"/>
            </div>
            <div>
                <h1 className="text-sm font-bold tracking-widest text-[#C6A649]">LUXE</h1>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <button
                onClick={() => navigate('/login')}
                className="text-xs uppercase tracking-widest text-white/70 hover:text-white transition-colors"
            >
                Log In
            </button>
            <button
                onClick={() => navigate('/login?mode=register')}
                className="bg-[#C6A649] text-black text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full hover:bg-[#D4B355] transition-colors"
            >
                Get Started
            </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video with Overlay */}
        <div className="absolute inset-0 z-0">
            <video
                src={LANDING_VID}
                autoPlay
                loop
                muted
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 text-center mt-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
                <Sparkles size={12} className="text-[#C6A649]" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#C6A649]">The Future of Content</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium text-white mb-6 leading-tight">
                Luxe<span className="text-[#C6A649] italic">Motion</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
                From Ecommerce to Velvet: Create Viral Content in Seconds.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <button
                    onClick={() => navigate('/login?mode=register')}
                    className={`px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest ${S.btnGold} min-w-[200px]`}
                >
                    Get Started for Free
                </button>
                <button
                    className="px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm min-w-[200px]"
                    onClick={() => document.getElementById('velvet-teaser')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    View Demo
                </button>
            </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="text-white/30" />
        </div>
      </section>

      {/* Velvet Teaser Section */}
      <section id="velvet-teaser" className="py-32 relative overflow-hidden bg-black">
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#C6A649]/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-3xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white mb-8">
                Unlock the power of <br/>
                <span className="italic text-purple-400">unrestricted content</span>
            </h2>

            <p className="text-white/50 max-w-lg mx-auto mb-12 leading-loose">
                Experience the Velvet Mode. Designed for creators who demand freedom and elegance.
                Generate high-end aesthetics without boundaries.
            </p>

            <div className="relative inline-block group cursor-pointer">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#C6A649] to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <button
                    onClick={() => navigate('/login?mode=register')}
                    className="relative px-8 py-4 bg-black border border-white/10 rounded-lg leading-none flex items-center divide-x divide-gray-600"
                >
                    <span className="flex items-center space-x-5">
                        <span className="pr-6 text-gray-100 uppercase tracking-widest text-xs">Access Velvet Mode</span>
                    </span>
                    <span className="pl-6 text-purple-400 group-hover:text-purple-300 transition duration-200">
                        &rarr;
                    </span>
                </button>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/5 text-center text-white/20 text-[10px] uppercase tracking-widest">
        <p>&copy; {new Date().getFullYear()} LuxeMotion. All rights reserved.</p>
      </footer>
    </div>
  );
};
