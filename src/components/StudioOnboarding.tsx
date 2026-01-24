import React, { useEffect, useState, useRef, useMemo } from 'react'; // Added useMemo
import { createPortal } from 'react-dom';
import { X, ChevronRight, Check } from 'lucide-react';
import { useMode } from '../context/ModeContext';

// Moved STEPS definition inside to allow filtering, or keep static and filter inside. 
// User instruction: "The 'STEPS' constant is currently static. Move it INSIDE the component or wrap it in a useMemo."
// I will keep the raw data outside for cleanliness, but filter inside.

const RAW_STEPS = [
    {
        target: 'studio-source-upload',
        text: "Upload your model's photo here",
        pos: 'right'
    },
    {
        target: 'studio-product-upload',
        text: "Upload what you want to sell here (or leave it empty)",
        pos: 'left'
    },
    {
        id: 'mode-switch',
        text: "Activate this for special modes (Requires a Plan)",
        pos: 'bottom'
    },
    {
        target: 'studio-generate-btn',
        text: "Create your video",
        pos: 'top'
    }
];

export const StudioOnboarding = () => {
    const [step, setStep] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [visible, setVisible] = useState(false);
    const { mode } = useMode();
    const observer = useRef<ResizeObserver | null>(null);

    // Dynamic Steps Logic
    const currentSteps = useMemo(() => {
        return RAW_STEPS.filter(step => {
            // CRITICAL: In Velvet mode, the Product Upload section is hidden.
            // We MUST skip the onboarding step pointing to it to prevent "ghost" tooltips.
            if (mode === 'velvet' && step.target === 'studio-product-upload') return false;
            return true;
        });
    }, [mode]);

    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenStudioOnboarding_v1');
        if (!hasSeen) {
            // Small delay to ensure DOM is ready
            setTimeout(() => setVisible(true), 1000);
        }
    }, []);

    const updateRect = () => {
        const currentStep = currentSteps[step];
        if (!currentStep) return; // Safety check

        let targetId = currentStep.target;

        // Handle dynamic target for mode switch
        if (currentStep.id === 'mode-switch') {
            const sidebar = document.getElementById('sidebar-mode-toggle');
            const mobile = document.getElementById('mobile-mode-toggle');
            // If sidebar is visible (offsetParent is not null), use it. otherwise mobile.
            // Actually, getBoundingClientRect() works even if offscreen, but we want the visible one.
            // Sidebar is hidden on mobile via CSS 'hidden lg:flex'.
            if (sidebar && getComputedStyle(sidebar).display !== 'none') {
                targetId = 'sidebar-mode-toggle';
            } else if (mobile) {
                targetId = 'mobile-mode-toggle';
            }
        }

        if (targetId) {
            const el = document.getElementById(targetId);
            if (el) {
                const r = el.getBoundingClientRect();
                setRect(r);
                return;
            }
        }
        // If element not found, maybe skip or just stay?
        // Let's try to find it on next tick or skip if it persists
    };

    useEffect(() => {
        if (!visible) return;
        updateRect();

        // Update on resize/scroll
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);

        return () => {
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [step, visible]);

    const handleNext = () => {
        if (step < currentSteps.length - 1) {
            setStep(s => s + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setVisible(false);
        localStorage.setItem('hasSeenStudioOnboarding_v1', 'true');
    };

    if (!visible || !rect) return null;

    const currentStep = currentSteps[step];
    if (!currentStep) return null; // Safety

    // Tooltip Position Logic
    const tooltipStyle: React.CSSProperties = {};
    const PADDING = 20;

    // Simple positioning logic
    if (currentStep.pos === 'right') {
        tooltipStyle.left = rect.right + PADDING;
        tooltipStyle.top = rect.top + (rect.height / 2) - 40;
    } else if (currentStep.pos === 'left') {
        tooltipStyle.right = window.innerWidth - rect.left + PADDING;
        tooltipStyle.top = rect.top + (rect.height / 2) - 40;
    } else if (currentStep.pos === 'bottom') {
        tooltipStyle.left = rect.left + (rect.width / 2) - 100;
        tooltipStyle.top = rect.bottom + PADDING;
    } else if (currentStep.pos === 'top') {
        tooltipStyle.left = rect.left + (rect.width / 2) - 100;
        tooltipStyle.bottom = window.innerHeight - rect.top + PADDING;
    }

    // Safety for edges
    if (window.innerWidth < 768) {
        // Mobile override: always bottom or top center
        tooltipStyle.left = 20;
        tooltipStyle.right = 20;
        if (rect.top > window.innerHeight / 2) {
            tooltipStyle.bottom = window.innerHeight - rect.top + 20;
            tooltipStyle.top = 'auto';
        } else {
            tooltipStyle.top = rect.bottom + 20;
            tooltipStyle.bottom = 'auto';
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden">
            {}
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${mode === 'velvet' ? 'text-[#C6A649]' : 'text-blue-600'}`}>
                    Step {step + 1}/{currentSteps.length}
                </span>
                <button onClick={handleClose} className="opacity-50 hover:opacity-100 transition-opacity">
                    <X size={14} />
                </button>
            </div>

            <p className="text-sm font-medium leading-relaxed mb-6">
                {currentStep.text}
            </p>

            <div className="flex justify-end">
                <button
                    onClick={handleNext}
                    className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-transform hover:scale-105
                                ${mode === 'velvet' ? 'bg-[#C6A649] text-black' : 'bg-black text-white'}`}
                >
                    {step === currentSteps.length - 1 ? 'Finish' : 'Next'}
                    {step === currentSteps.length - 1 ? <Check size={12} /> : <ChevronRight size={12} />}
                </button>
            </div>
        </div>,
        document.body
    );
};
