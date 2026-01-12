import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { S } from './styles';
import { UserProfile, Talent, GeneratedVideo } from './types';
import { LandingPage } from './pages/LandingPage';
import { LoginScreen } from './pages/LoginScreen';
import { StudioPage } from './pages/StudioPage';
import { TalentPage } from './pages/TalentPage';
import { GalleryPage } from './pages/GalleryPage';
import { SettingsPage } from './pages/SettingsPage';
import { BillingPage } from './pages/BillingPage';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { MobileNav } from './components/MobileNav';
import { Toast } from './components/Toast';
import { CheckoutModal } from './components/CheckoutModal';
import { ModeProvider, useMode } from './context/ModeContext';
import './i18n';

function ProtectedLayout({
    session,
    credits,
    handleLogout,
    setSelPlan,
    profile,
    mode,
    toast,
    setToast,
    selPlan,
    notify
}: any) {
    if (!session) return <Navigate to="/login" replace />;

    return (
        <div className={`${mode === 'velvet' ? S.bg : S.bgAgency}`}>
            {toast && <Toast msg={toast} onClose={()=>setToast(null)}/>}
            {selPlan && <CheckoutModal planKey={selPlan.key} annual={selPlan.annual} onClose={()=>setSelPlan(null)}/>}

            <Sidebar
              credits={credits}
              onLogout={handleLogout}
              onUp={()=>setSelPlan({key:'creator', annual:true})}
              userProfile={profile}
              onUpgrade={()=>setSelPlan({key:'creator', annual:true})}
              notify={notify}
            />
            <MobileHeader
              credits={credits}
              userProfile={profile}
              onUpgrade={()=>setSelPlan({key:'creator', annual:true})}
            />

            {/* CONTENT */}
            <main className="lg:ml-80 min-h-screen pt-20 lg:pt-0 transition-colors duration-500">
                <Outlet />
            </main>

            <MobileNav />
        </div>
    );
}

function AppContent() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [influencers, setInfluencers] = useState<Talent[]>([]);
  const [credits, setCredits] = useState(0);
  const [userPlan, setUserPlan] = useState<'starter' | 'creator' | 'agency'>('starter');
  const [toast, setToast] = useState<string|null>(null);
  const [selPlan, setSelPlan] = useState<{key: string, annual: boolean} | null>(null);
  const [profile, setProfile] = useState<UserProfile>({ name: "Agencia", email: "" });

  const { mode } = useMode();

  const notify = (msg: string) => setToast(msg);

  const handleInf = {
      add: async (inf: any) => {
          const user = session?.user;
          if(!user) return;

          // Optimistic update
          const tempId = `temp_${Date.now()}`;
          const newTalent = { ...inf, id: tempId, user_id: user.id };
          setInfluencers([newTalent, ...influencers]);

          const { data, error } = await supabase.from('talents').insert({
              name: inf.name,
              image_url: inf.image_url,
              role: inf.role || 'model',
              dna_prompt: inf.dna_prompt || '',
              user_id: user.id
          }).select().single();

          if(error) {
               console.error("Error adding talent:", error);
               notify("Error adding talent");
               setInfluencers(prev => prev.filter(i => i.id !== tempId));
          } else if (data) {
               setInfluencers(prev => prev.map(i => i.id === tempId ? data : i));
          }
      },
      del: async (id: string) => {
          const old = [...influencers];
          setInfluencers(prev => prev.filter(i => i.id !== id));
          const { error } = await supabase.from('talents').delete().eq('id', id);
          if(error) {
               console.error("Error deleting talent:", error);
               notify("Error deleting");
               setInfluencers(old);
          }
      }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => {
      setSession(session);
      if(session) initData(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if(session) initData(session.user.id);
      else setLoading(false);
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  const initData = async (uid:string) => {
      try {
        const { data: p, error: pError } = await supabase.from('profiles').select('*').eq('id', uid).single();
        if(p && !pError) {
            setCredits(p.credits);
            setUserPlan(p.plan);
            // Ensure we keep existing profile structure but include new fields
            setProfile({...p, email: session?.user?.email});
        } else {
             setCredits(50);
             setUserPlan('starter');
             setProfile({name: "User", email: session?.user?.email || ""});
        }

        const { data: v, error: vError } = await supabase.from('generations').select('*').eq('user_id', uid).order('created_at', {ascending:false});
        if(v && !vError) setVideos(v.map((i:any)=>({id:i.id, url:i.video_url, date:new Date(i.created_at).toLocaleDateString(), aspectRatio:i.aspect_ratio, cost:i.cost, prompt: i.prompt})));

        const { data: t, error: tError } = await supabase.from('talents').select('*').eq('user_id', uid).order('created_at', {ascending:false});
        if(t && !tError) setInfluencers(t);

      } catch (err) {
        console.error("Error loading data", err);
      } finally {
        setLoading(false);
      }
  };

  const handleVideoSaved = async (videoData: any) => {
      setVideos(prev => [videoData, ...prev]);
      if (!profile.is_admin) {
        setCredits(prev => prev - videoData.cost);
      }
  };

  const handleUpdateProfile = (p: UserProfile) => { setProfile(p); };
  const handleLogout = async () => { await supabase.auth.signOut(); };

  if(loading) return <div className="min-h-screen bg-[#030303] flex items-center justify-center"><Loader2 className="w-12 h-12 text-[#C6A649] animate-spin"/></div>;

  return (
    <Router>
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={!session ? <LandingPage /> : <Navigate to="/app" replace />} />
            <Route path="/login" element={!session ? <LoginScreen onLogin={() => {}} /> : <Navigate to="/app" replace />} />

            {/* Protected Routes */}
            <Route path="/app" element={
                <ProtectedLayout
                    session={session}
                    credits={credits}
                    handleLogout={handleLogout}
                    setSelPlan={setSelPlan}
                    profile={profile}
                    mode={mode}
                    toast={toast}
                    setToast={setToast}
                    selPlan={selPlan}
                    notify={notify}
                />
            }>
                <Route index element={<StudioPage onGen={handleVideoSaved} influencers={influencers} credits={credits} notify={notify} onUp={()=>setSelPlan({key:'creator', annual:true})} userPlan={userPlan} talents={influencers} profile={profile}/>}/>
                <Route path="talent" element={<TalentPage list={influencers} add={handleInf.add} del={handleInf.del} notify={notify}/>}/>
                <Route path="gallery" element={<GalleryPage videos={videos}/>}/>
                <Route path="billing" element={<BillingPage onSelect={(k:string, a:boolean)=>setSelPlan({key:k, annual:a})}/>}/>
                <Route path="settings" element={<SettingsPage credits={credits} profile={profile} setProfile={handleUpdateProfile} notify={notify}/>}/>

                {/* Fallback for /app/* */}
                <Route path="*" element={<Navigate to="/app" replace />} />
            </Route>

            {/* Global Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Router>
  );
}

function App() {
  return (
    <ModeProvider>
      <AppContent />
    </ModeProvider>
  );
}

export default App;
