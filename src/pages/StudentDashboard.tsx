import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  BrainCircuit,
  Shield,
  Building,
  Award,
  User,
  Settings,
  LogOut,
  Bell,
  CheckCircle2,
  Activity,
  ArrowRight,
  AlertTriangle,
  Phone,
  FileText,
  Backpack,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

interface UserSession {
  name: string;
  email: string;
  role: 'student' | 'teacher';
}

const STORAGE_KEYS = {
  USER: 'readysphere_user',
  KIT: 'prepare_kit_checked_v1',
  GOBAG: 'prepare_gobag_checked_v1',
  PLAN: 'prepare_plan_data_v1',
  REVIEW: 'prepare_review_checked_v1',
  QUIZ: 'readysphere_quiz_scores_v1',
};

export function StudentDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'achievements' | 'advisories'>('dashboard');

  const [prepStats, setPrepStats] = useState({
    kitCount: 0,
    gobagCount: 0,
    hasPlan: false,
    reviewCount: 0,
    quizzesCompleted: 0,
    overallScore: 0,
  });

  // Role Protection: If teacher, redirect to /teacher
  useEffect(() => {
    if (!user) return;
    if (user.role === 'teacher') {
      navigate('/teacher', { replace: true });
    }
  }, [user, navigate]);

  // Calculate Preparedness Stats
  useEffect(() => {
    try {
      const kitStr = localStorage.getItem(STORAGE_KEYS.KIT);
      const gobagStr = localStorage.getItem(STORAGE_KEYS.GOBAG);
      const planStr = localStorage.getItem(STORAGE_KEYS.PLAN);
      const reviewStr = localStorage.getItem(STORAGE_KEYS.REVIEW);
      const quizStr = localStorage.getItem(STORAGE_KEYS.QUIZ);

      const kitChecked = kitStr ? JSON.parse(kitStr) : {};
      const gobagChecked = gobagStr ? JSON.parse(gobagStr) : {};
      const planData = planStr ? JSON.parse(planStr) : null;
      const reviewChecked = reviewStr ? JSON.parse(reviewStr) : {};
      const quizScores = quizStr ? JSON.parse(quizStr) : {};

      const kitCount = Object.values(kitChecked).filter(Boolean).length;
      const gobagCount = Object.values(gobagChecked).filter(Boolean).length;
      const reviewCount = Object.values(reviewChecked).filter(Boolean).length;
      const quizzesCompleted = Object.keys(quizScores).length;

      const hasPlan = Boolean(
        planData && (planData.primaryContact?.name || planData.outOfAreaContact?.name || planData.primaryMeeting),
      );

      const kitPct = (kitCount / 23) * 35;
      const gobagPct = (gobagCount / 10) * 25;
      const planPct = hasPlan ? 25 : 0;
      const reviewPct = (reviewCount / 6) * 15;
      const overallScore = Math.min(100, Math.round(kitPct + gobagPct + planPct + reviewPct));

      setPrepStats({
        kitCount,
        gobagCount,
        hasPlan,
        reviewCount,
        quizzesCompleted,
        overallScore,
      });
    } catch {
      // Ignore
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
    navigate('/');
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <GlassCard className="p-10 md:p-14">
          <Shield className="mx-auto mb-4 h-16 w-16 text-cyan-400" />
          <h1 className="font-[Inter] text-3xl font-normal tracking-tight text-white">Student Portal Access</h1>
          <p className="mt-3 text-sm text-white/70">
            Please log in as a student to access your DisasterIQ safety dashboard.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-8 rounded-full bg-cyan-400 px-8 py-3 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-cyan-300"
          >
            Go to Login
          </button>
        </GlassCard>
      </div>
    );
  }

  const sidebarItems = [
    { label: 'Dashboard', icon: LayoutDashboard, action: () => setActiveTab('dashboard'), active: activeTab === 'dashboard' },
    { label: 'Learn Modules', icon: BookOpen, action: () => navigate('/learn') },
    { label: 'Quizzes', icon: BrainCircuit, action: () => navigate('/quiz') },
    { label: 'Prepare & Kit', icon: Shield, action: () => navigate('/prepare') },
    { label: 'Campus Safety', icon: Building, action: () => navigate('/campus') },
    { label: 'Achievements', icon: Award, action: () => setActiveTab('achievements'), active: activeTab === 'achievements' },
    { label: 'Profile', icon: User, action: () => navigate('/profile') },
    { label: 'Settings', icon: Settings, action: () => navigate('/profile') },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8 md:px-10">
      <div className="grid gap-8 lg:grid-cols-12">
        {/* SIDEBAR */}
        <aside className="lg:col-span-3">
          <GlassCard className="sticky top-28 p-5">
            {/* Student User Card */}
            <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-950/60 text-cyan-300">
                <span className="font-bold text-sm uppercase">{user.name.charAt(0)}</span>
              </div>
              <div>
                <h3 className="truncate text-sm font-semibold text-white">{user.name}</h3>
                <span className="inline-block rounded bg-cyan-400/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                  Student Portal
                </span>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                      item.active
                        ? 'bg-cyan-400 text-black shadow-md font-semibold'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                onClick={handleLogout}
                className="mt-4 flex w-full items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-300 transition-all hover:bg-red-500/20"
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </nav>
          </GlassCard>
        </aside>

        {/* MAIN DASHBOARD CONTENT AREA */}
        <main className="lg:col-span-9">
          {/* WELCOME BANNER */}
          <GlassCard className="mb-8 p-6 md:p-8 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-black">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-400">
                  Student Operations Dashboard
                </span>
                <h1 className="mt-1 font-[Inter] text-3xl font-normal tracking-tight text-white md:text-4xl">
                  Welcome back, {user.name} 👋
                </h1>
                <p className="mt-2 text-xs text-white/70">
                  Track your disaster preparedness score, complete safety modules, and update your emergency plan.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/prepare')}
                  className="flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400 px-5 py-2.5 text-xs font-semibold text-black transition-all hover:bg-cyan-300"
                >
                  <span>Update Go-Bag</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </GlassCard>

          {/* METRICS GRID */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* OVERALL SCORE */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Readiness Score</span>
                <Activity size={18} className="text-cyan-400" />
              </div>
              <div className="mt-3 font-[Inter] text-3xl font-normal text-white">{prepStats.overallScore}%</div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${prepStats.overallScore}%` }} />
              </div>
            </GlassCard>

            {/* EMERGENCY KIT */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Emergency Kit</span>
                <Shield size={18} className="text-emerald-400" />
              </div>
              <div className="mt-3 font-[Inter] text-3xl font-normal text-white">
                {prepStats.kitCount} <span className="text-xs text-white/50">/ 23 Items</span>
              </div>
              <p className="mt-1 text-[11px] text-white/60">
                {Math.round((prepStats.kitCount / 23) * 100)}% Essential supplies ready
              </p>
            </GlassCard>

            {/* GO-BAG */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">72-Hr Go-Bag</span>
                <Backpack size={18} className="text-amber-400" />
              </div>
              <div className="mt-3 font-[Inter] text-3xl font-normal text-white">
                {prepStats.gobagCount} <span className="text-xs text-white/50">/ 10 Items</span>
              </div>
              <p className="mt-1 text-[11px] text-white/60">Evacuation bag readiness</p>
            </GlassCard>

            {/* QUIZZES PASSED */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Quizzes Passed</span>
                <BrainCircuit size={18} className="text-purple-400" />
              </div>
              <div className="mt-3 font-[Inter] text-3xl font-normal text-white">
                {prepStats.quizzesCompleted}
              </div>
              <p className="mt-1 text-[11px] text-white/60">Safety knowledge verified</p>
            </GlassCard>
          </div>

          {/* MAIN TWO-COLUMN LAYOUT */}
          <div className="grid gap-8 lg:grid-cols-12">
            {/* LEFT COLUMN: COURSES & ACTION ITEMS */}
            <div className="space-y-8 lg:col-span-7">
              {/* SAFETY COURSES */}
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-cyan-400" />
                    <h2 className="font-[Inter] text-base font-normal text-white">Recommended Safety Modules</h2>
                  </div>
                  <button onClick={() => navigate('/learn')} className="text-xs text-cyan-400 hover:underline">
                    View All →
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { title: 'Earthquake Survival Protocol', time: '12 mins', tag: 'High Priority', desc: 'Drop, Cover, and Hold On procedures in campus buildings.' },
                    { title: 'Flash Flood & Storm Readiness', time: '15 mins', tag: 'Seasonal', desc: 'Evacuation routes and flood safety zone guidelines.' },
                    { title: 'Fire Safety & Smoke Evacuation', time: '10 mins', tag: 'Essential', desc: 'R.A.C.E protocol and extinguisher operations.' },
                  ].map((course, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3.5 transition-all hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-semibold text-white">{course.title}</h3>
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">
                            {course.tag}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-white/60">{course.desc}</p>
                      </div>
                      <button
                        onClick={() => navigate('/learn')}
                        className="rounded-full border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-300 hover:bg-cyan-400 hover:text-black"
                      >
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* EMERGENCY PLAN STATUS */}
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-emerald-400" />
                    <h2 className="font-[Inter] text-base font-normal text-white">Personal Emergency Plan</h2>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      prepStats.hasPlan
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {prepStats.hasPlan ? 'Plan Configured' : 'Incomplete'}
                  </span>
                </div>

                <p className="text-xs text-white/70">
                  {prepStats.hasPlan
                    ? 'Your primary meeting locations and emergency out-of-area contacts are saved.'
                    : 'Configure your primary meeting spot and emergency contact directory to complete your safety plan.'}
                </p>

                <button
                  onClick={() => navigate('/prepare')}
                  className="mt-4 flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10"
                >
                  <span>Edit Emergency Plan</span>
                  <ArrowRight size={14} />
                </button>
              </GlassCard>
            </div>

            {/* RIGHT COLUMN: ADVISORIES & CAMPUS NOTIFICATIONS */}
            <div className="space-y-8 lg:col-span-5">
              {/* NOTIFICATIONS & DRILLS */}
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                  <Bell size={18} className="text-amber-400" />
                  <h2 className="font-[Inter] text-base font-normal text-white">Campus Safety Advisories</h2>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                      <AlertTriangle size={14} />
                      <span>Upcoming Campus Fire Drill</span>
                    </div>
                    <p className="mt-1 text-[11px] text-white/70">
                      Scheduled for Thursday, 10:00 AM across all academic buildings.
                    </p>
                  </div>

                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                      <CheckCircle2 size={14} />
                      <span>Monsoonal Weather Advisory</span>
                    </div>
                    <p className="mt-1 text-[11px] text-white/70">
                      Heavy rainfall forecasted. Review flood evacuation routes on Campus Safety page.
                    </p>
                  </div>
                </div>
              </GlassCard>

              {/* QUICK HOTLINES */}
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                  <Phone size={18} className="text-red-400" />
                  <h2 className="font-[Inter] text-base font-normal text-white">Campus Emergency Dispatch</h2>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-white/5 p-2.5">
                    <span className="text-white/70">Campus Control Room</span>
                    <span className="font-bold text-red-400">+1 (800) 555-SAFE</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/5 p-2.5">
                    <span className="text-white/70">Medical Response Unit</span>
                    <span className="font-bold text-red-400">+1 (800) 555-MED1</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
