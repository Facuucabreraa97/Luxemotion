import React from 'react';
import BottomNav from '../components/MobileNav'; // Importing the BottomNav we just updated

export default function MobileLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-black text-white relative">
            {}
            {}
            {}
            <main className="w-full max-w-md mx-auto pb-40 px-0 sm:px-5 pt-0 overflow-x-hidden">
                {children}
            </main>

            <BottomNav />
        </div>
    );
}
