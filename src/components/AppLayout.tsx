
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import MobileNav from './MobileNav';

interface LayoutProps {
  session: any;
  credits: number;
  profile: any;
  mode: string;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const AppLayout: React.FC<LayoutProps> = ({ session, credits, profile, mode, notify }) => {
  // Si no hay sesión, mandamos al login
  if (!session) {
      return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black overflow-hidden">
      {/* Sidebar recibe sus props */}
      <Sidebar credits={credits} mode={mode} />
      
      <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">
        <MobileHeader credits={credits} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black w-full relative scrollbar-hide">
          {/* Outlet pasa el contexto a las páginas hijas */}
          <Outlet context={{ credits, profile, notify }} />
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
};

export default AppLayout;
