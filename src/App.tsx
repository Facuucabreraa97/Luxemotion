import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { S } from './styles';
import { UserProfile, Talent, GeneratedVideo } from './types';
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

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [influencers, setInfluencers] = useState<Talent[]>([]);
  const [credits, setCredits] = useState(0);
  const [userPlan, setUserPlan] = useState<'starter' | 'creator' | 'agency'>('starter');
  const [toast, setToast] = useState<string|null>(null);
  const [selPlan, setSelPlan] = useState<{key: string, annual: boolean} | null>(null);
  const [profile, setProfile] = useState<UserProfile>({ name: "Agencia", email: "" });

  const notify = (msg: string) => setToast(msg);

  const handleInf = {
      add: (inf:any) => { const n=[...influencers,inf]; setInfluencers(n); localStorage.setItem('lux_inf',JSON.stringify(n)); },
      del: (id:string) => { const n=influencers.filter(i=>i.id!==id); setInfluencers(n); localStorage.setItem('lux_inf',JSON.stringify(n)); }
  };

  useEffect(() => {
    try { const i=localStorage.getItem('lux_inf'); if(i) setInfluencers(JSON.parse(i)); } catch(e){}

    // Initial session check
    supabase.auth.getSession().then(({data:{session}}) => {
      setSession(session);
      if(session) initData(session.user.id);
      else setLoading(false);
    });

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if(session) initData(session.user.id);
      else setLoading(false);
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  const initData = async (uid:string) => {
      // Mock data if table doesn't exist yet or just fallback
      // ideally we should handle error here
      try {
        const { data: p, error: pError } = await supabase.from('profiles').select('*').eq('id', uid).single();
        if(p && !pError) {
            setCredits(p.credits);
            setUserPlan(p.plan);
            setProfile({...p, email: session?.user?.email});
        } else {
             // Fallback/Default for new users if trigger fails
             setCredits(50);
             setUserPlan('starter');
             setProfile({name: "User", email: session?.user?.email || ""});
        }

        const { data: v, error: vError } = await supabase.from('generations').select('*').eq('user_id', uid).order('created_at', {ascending:false});
        if(v && !vError) setVideos(v.map((i:any)=>({id:i.id, url:i.video_url, date:new Date(i.created_at).toLocaleDateString(), aspectRatio:i.aspect_ratio, cost:i.cost, prompt: i.prompt})));
      } catch (err) {
        console.error("Error loading data", err);
      } finally {
        setLoading(false);
      }
  };

  const handleVideoSaved = async (videoData: any) => {
      setVideos(prev => [videoData, ...prev]);
      setCredits(prev => prev - videoData.cost);
  };

  const handleUpdateProfile = (p: UserProfile) => { setProfile(p); };
  const handleLogout = async () => { await supabase.auth.signOut(); };

  if(loading) return <div className="min-h-screen bg-[#030303] flex items-center justify-center"><Loader2 className="w-12 h-12 text-[#C6A649] animate-spin"/></div>;
  if(!session) return <LoginScreen onLogin={() => {}} />;

  return (
    <Router>
      <div className={S.bg}>
        {toast && <Toast msg={toast} onClose={()=>setToast(null)}/>}
        {selPlan && <CheckoutModal planKey={selPlan.key} annual={selPlan.annual} onClose={()=>setSelPlan(null)}/>}

        <Sidebar credits={credits} onLogout={handleLogout} onUp={()=>setSelPlan({key:'creator', annual:true})} />
        <MobileHeader credits={credits} />

        {/* CONTENT */}
        <main className="lg:ml-80 min-h-screen pt-20 lg:pt-0">
            <Routes>
                <Route path="/" element={<StudioPage onGen={handleVideoSaved} influencers={influencers} credits={credits} notify={notify} onUp={()=>setSelPlan({key:'creator', annual:true})} userPlan={userPlan} talents={influencers}/>}/>
                <Route path="/talent" element={<TalentPage list={influencers} add={handleInf.add} del={handleInf.del} notify={notify}/>}/>
                <Route path="/gallery" element={<GalleryPage videos={videos}/>}/>
                <Route path="/billing" element={<BillingPage onSelect={(k:string, a:boolean)=>setSelPlan({key:k, annual:a})}/>}/>
                <Route path="/settings" element={<SettingsPage credits={credits} profile={profile} setProfile={handleUpdateProfile} notify={notify}/>}/>
            </Routes>
        </main>

        <MobileNav />
      </div>
    </Router>
  );
}

export default App;
