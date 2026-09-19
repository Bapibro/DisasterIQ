import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Building,
  FileText,
  User,
  Settings,
  LogOut,
  Plus,
  Calendar,
  CheckCircle2,
  Shield,
  Search,
  BellRing,
  Download,
  Activity,
  Trash2,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

interface UserSession {
  name: string;
  email: string;
  role: 'student' | 'teacher';
}

interface SafetyAlert {
  id: string;
  title: string;
  severity: 'Critical' | 'Warning' | 'Advisory';
  location: string;
  time: string;
  message: string;
}

interface SafetyDrill {
  id: string;
  type: string;
  date: string;
  time: string;
  location: string;
  coordinator: string;
}

const STORAGE_KEYS = {
  USER: 'readysphere_user',
  ALERTS: 'teacher_safety_alerts_v1',
  DRILLS: 'teacher_safety_drills_v1',
};

const MOCK_STUDENTS = [
  { id: '1', name: 'Alex Vance', dept: 'Computer Science', year: '3rd Year', score: 84, kitStatus: 'Complete', email: 'alex.vance@gmail.com' },
  { id: '2', name: 'Sophia Chen', dept: 'Electrical Eng', year: '2nd Year', score: 92, kitStatus: 'Complete', email: 'sophia.c@nit.edu' },
  { id: '3', name: 'Marcus Johnson', dept: 'Mechanical Eng', year: '4th Year', score: 65, kitStatus: 'Partial', email: 'marcus.j@nit.edu' },
  { id: '4', name: 'Priya Sharma', dept: 'Civil Engineering', year: '1st Year', score: 78, kitStatus: 'Complete', email: 'priya.s@nit.edu' },
  { id: '5', name: 'Ethan Hunt', dept: 'Computer Science', year: '3rd Year', score: 45, kitStatus: 'Incomplete', email: 'ethan.h@nit.edu' },
];

const DEFAULT_ALERTS: SafetyAlert[] = [
  {
    id: 'a1',
    title: 'Monsoon Heavy Rainfall Alert',
    severity: 'Warning',
    location: 'Entire Campus / Low-lying Grounds',
    time: 'Today, 08:30 AM',
    message: 'Avoid underground parking and basement labs due to potential water logging.',
  },
  {
    id: 'a2',
    title: 'Building C Elevator Maintenance Safety Notice',
    severity: 'Advisory',
    location: 'Engineering Block C',
    time: 'Yesterday, 02:00 PM',
    message: 'Use stairwells; elevator 2 undergoing routine brake calibration.',
  },
];

const DEFAULT_DRILLS: SafetyDrill[] = [
  {
    id: 'd1',
    type: 'Earthquake Evacuation Drill',
    date: 'Oct 15, 2026',
    time: '10:00 AM',
    location: 'Main Academic Complex',
    coordinator: 'Prof. Harrison Miller',
  },
  {
    id: 'd2',
    type: 'Campus Fire & Smoke Alarm Simulation',
    date: 'Nov 02, 2026',
    time: '02:30 PM',
    location: 'Science & Lab Block B',
    coordinator: 'Dr. Aris Thorne',
  },
];

export function TeacherDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Active Tab: 'overview' | 'students' | 'alerts' | 'drills' | 'resources'
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'alerts' | 'drills' | 'resources'>('overview');

  // Search query for student roster
  const [searchQuery, setSearchQuery] = useState('');

  // Safety Alerts state
  const [alerts, setAlerts] = useState<SafetyAlert[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ALERTS);
      return saved ? JSON.parse(saved) : DEFAULT_ALERTS;
    } catch {
      return DEFAULT_ALERTS;
    }
  });

  // Safety Drills state
  const [drills, setDrills] = useState<SafetyDrill[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DRILLS);
      return saved ? JSON.parse(saved) : DEFAULT_DRILLS;
    } catch {
      return DEFAULT_DRILLS;
    }
  });

  // Alert Modal / Form
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertSeverity, setNewAlertSeverity] = useState<'Critical' | 'Warning' | 'Advisory'>('Warning');
  const [newAlertLocation, setNewAlertLocation] = useState('');
  const [newAlertMessage, setNewAlertMessage] = useState('');

  // Drill Modal / Form
  const [isDrillModalOpen, setIsDrillModalOpen] = useState(false);
  const [newDrillType, setNewDrillType] = useState('Earthquake Drill');
  const [newDrillDate, setNewDrillDate] = useState('');
  const [newDrillTime, setNewDrillTime] = useState('');
  const [newDrillLocation, setNewDrillLocation] = useState('');

  // Feedback Toast
  const [feedback, setFeedback] = useState<string | null>(null);

  // Role Protection: If student, redirect to /student
  useEffect(() => {
    if (!user) return;
    if (user.role === 'student') {
      navigate('/student', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
    navigate('/');
  };

  // Broadcast Alert
  const handleBroadcastAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertTitle.trim() || !newAlertMessage.trim()) return;

    const alertItem: SafetyAlert = {
      id: `a_${Date.now()}`,
      title: newAlertTitle,
      severity: newAlertSeverity,
      location: newAlertLocation || 'Entire Campus',
      time: 'Just now',
      message: newAlertMessage,
    };

    const updated = [alertItem, ...alerts];
    setAlerts(updated);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(updated));

    setIsAlertModalOpen(false);
    setNewAlertTitle('');
    setNewAlertLocation('');
    setNewAlertMessage('');
    setFeedback('Emergency alert broadcasted to campus network!');
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDeleteAlert = (id: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(updated));
  };

  // Schedule Drill
  const handleScheduleDrill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrillDate || !newDrillTime) return;

    const drillItem: SafetyDrill = {
      id: `d_${Date.now()}`,
      type: newDrillType,
      date: newDrillDate,
      time: newDrillTime,
      location: newDrillLocation || 'Campus Quad',
      coordinator: user?.name || 'Faculty Committee',
    };

    const updated = [...drills, drillItem];
    setDrills(updated);
    localStorage.setItem(STORAGE_KEYS.DRILLS, JSON.stringify(updated));

    setIsDrillModalOpen(false);
    setNewDrillDate('');
    setNewDrillTime('');
    setNewDrillLocation('');
    setFeedback('Safety drill scheduled successfully!');
    setTimeout(() => setFeedback(null), 3500);
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <GlassCard className="p-10 md:p-14">
          <Shield className="mx-auto mb-4 h-16 w-16 text-amber-400" />
          <h1 className="font-[Inter] text-3xl font-normal tracking-tight text-white">Faculty Portal Access</h1>
          <p className="mt-3 text-sm text-white/70">
            Please log in as a Faculty / Teacher member to access DisasterIQ safety operations.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-8 rounded-full bg-amber-400 px-8 py-3 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-amber-300"
          >
            Go to Login
          </button>
        </GlassCard>
      </div>
    );
  }

  // Filtered Students
  const filteredStudents = MOCK_STUDENTS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const sidebarItems = [
    { label: 'Overview', icon: LayoutDashboard, action: () => setActiveTab('overview'), active: activeTab === 'overview' },
    { label: 'Students Roster', icon: Users, action: () => setActiveTab('students'), active: activeTab === 'students' },
    { label: 'Safety Alerts', icon: AlertTriangle, action: () => setActiveTab('alerts'), active: activeTab === 'alerts' },
    { label: 'Emergency Drills', icon: Calendar, action: () => setActiveTab('drills'), active: activeTab === 'drills' },
    { label: 'Campus Safety', icon: Building, action: () => navigate('/campus') },
    { label: 'Resources & SOPs', icon: FileText, action: () => setActiveTab('resources'), active: activeTab === 'resources' },
    { label: 'Profile', icon: User, action: () => navigate('/profile') },
    { label: 'Settings', icon: Settings, action: () => navigate('/profile') },
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-10">
      {/* Toast Notification Banner */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-[#120e06]/95 px-5 py-3.5 text-xs font-semibold text-amber-300 shadow-2xl backdrop-blur-md animate-in fade-in">
          <CheckCircle2 size={18} className="text-amber-400" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* FACULTY SIDEBAR */}
        <aside className="lg:col-span-3">
          <GlassCard className="sticky top-28 p-5">
            {/* Faculty User Info */}
            <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-950/60 text-amber-300">
                <span className="font-bold text-sm uppercase">{user.name.charAt(0)}</span>
              </div>
              <div>
                <h3 className="truncate text-sm font-semibold text-white">{user.name}</h3>
                <span className="inline-block rounded bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                  Faculty Operations
                </span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                      item.active
                        ? 'bg-amber-400 text-black shadow-md font-semibold'
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

        {/* MAIN FACULTY CONTENT */}
        <main className="lg:col-span-9">
          {/* WELCOME HEADER */}
          <GlassCard className="mb-8 p-6 md:p-8 bg-gradient-to-r from-amber-950/30 via-slate-900/80 to-black">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-400">
                  Faculty Safety Command & Operations
                </span>
                <h1 className="mt-1 font-[Inter] text-3xl font-normal tracking-tight text-white md:text-4xl">
                  {user.name}
                </h1>
                <p className="mt-2 text-xs text-white/70">
                  Monitor student disaster readiness index, dispatch emergency alerts, and schedule safety drills.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsAlertModalOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/20 px-4 py-2.5 text-xs font-semibold text-red-300 transition-all hover:bg-red-500/30"
                >
                  <BellRing size={14} />
                  <span>Broadcast Alert</span>
                </button>

                <button
                  onClick={() => setIsDrillModalOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400 px-4 py-2.5 text-xs font-semibold text-black transition-all hover:bg-amber-300"
                >
                  <Plus size={14} />
                  <span>Schedule Drill</span>
                </button>
              </div>
            </div>
          </GlassCard>

          {/* TOP METRICS */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Students Monitored</span>
                <Users size={18} className="text-amber-400" />
              </div>
              <div className="mt-3 font-[Inter] text-3xl font-normal text-white">248</div>
              <p className="mt-1 text-[11px] text-white/60">Across 5 departments</p>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Avg Preparedness</span>
                <Activity size={18} className="text-cyan-400" />
              </div>
              <div className="mt-3 font-[Inter] text-3xl font-normal text-white">78%</div>
              <p className="mt-1 text-[11px] text-emerald-400">↑ 6% increase this term</p>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Active Alerts</span>
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <div className="mt-3 font-[Inter] text-3xl font-normal text-white">{alerts.length}</div>
              <p className="mt-1 text-[11px] text-white/60">Broadcast to campus</p>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Scheduled Drills</span>
                <Calendar size={18} className="text-purple-400" />
              </div>
              <div className="mt-3 font-[Inter] text-3xl font-normal text-white">{drills.length}</div>
              <p className="mt-1 text-[11px] text-white/60">Upcoming this quarter</p>
            </GlassCard>
          </div>

          {/* TAB 1: OVERVIEW & STUDENTS ROSTER */}
          {(activeTab === 'overview' || activeTab === 'students') && (
            <GlassCard className="mb-8 p-6 md:p-8">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-white/10 pb-4">
                <div>
                  <h2 className="font-[Inter] text-lg font-normal text-white">Student Preparedness Roster</h2>
                  <p className="text-xs text-white/60">View real-time safety readiness metrics by student</p>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-3 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search student or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 rounded-xl border border-white/15 bg-black/60 py-2 pl-9 pr-3 text-xs text-white placeholder-white/40 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* ROSTER TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/50">
                    <tr>
                      <th className="pb-3">Student Name</th>
                      <th className="pb-3">Department</th>
                      <th className="pb-3">Year</th>
                      <th className="pb-3">Preparedness Score</th>
                      <th className="pb-3">Kit Status</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {filteredStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-medium text-white">
                          <div>{st.name}</div>
                          <div className="text-[10px] text-white/40">{st.email}</div>
                        </td>
                        <td className="py-3 text-white/70">{st.dept}</td>
                        <td className="py-3 text-white/70">{st.year}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold ${
                                st.score >= 80
                                  ? 'text-emerald-400'
                                  : st.score >= 60
                                  ? 'text-amber-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {st.score}%
                            </span>
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                              <div
                                className={`h-full rounded-full ${
                                  st.score >= 80 ? 'bg-emerald-400' : st.score >= 60 ? 'bg-amber-400' : 'bg-red-400'
                                }`}
                                style={{ width: `${st.score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                              st.kitStatus === 'Complete'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : st.kitStatus === 'Partial'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {st.kitStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => alert(`Contacting ${st.name} (${st.email})...`)}
                            className="text-cyan-400 hover:underline"
                          >
                            Send Nudge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}

          {/* TAB 2: ACTIVE SAFETY ALERTS */}
          {(activeTab === 'overview' || activeTab === 'alerts') && (
            <GlassCard className="mb-8 p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <h2 className="font-[Inter] text-lg font-normal text-white">Campus Emergency Alerts</h2>
                </div>
                <button
                  onClick={() => setIsAlertModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:underline"
                >
                  <Plus size={14} />
                  <span>Broadcast Alert</span>
                </button>
              </div>

              <div className="space-y-4">
                {alerts.map((al) => (
                  <div
                    key={al.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-start"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                            al.severity === 'Critical'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : al.severity === 'Warning'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          }`}
                        >
                          {al.severity}
                        </span>
                        <h3 className="text-xs font-semibold text-white">{al.title}</h3>
                      </div>
                      <p className="mt-1 text-xs text-white/70">{al.message}</p>
                      <div className="mt-2 flex items-center gap-4 text-[10px] text-white/40">
                        <span>Location: {al.location}</span>
                        <span>Time: {al.time}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAlert(al.id)}
                      title="Dismiss Alert"
                      className="text-white/40 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* TAB 3: EMERGENCY DRILLS */}
          {(activeTab === 'overview' || activeTab === 'drills') && (
            <GlassCard className="mb-8 p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  <h2 className="font-[Inter] text-lg font-normal text-white">Scheduled Safety Drills</h2>
                </div>
                <button
                  onClick={() => setIsDrillModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:underline"
                >
                  <Plus size={14} />
                  <span>Schedule Drill</span>
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {drills.map((dr) => (
                  <div
                    key={dr.id}
                    className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-purple-300">{dr.type}</span>
                      <span className="rounded bg-purple-400/20 px-2 py-0.5 text-[9px] font-bold text-purple-200">
                        SCHEDULED
                      </span>
                    </div>
                    <div className="text-xs font-medium text-white">{dr.location}</div>
                    <div className="flex items-center justify-between text-[11px] text-white/50 pt-2 border-t border-white/5">
                      <span>Date: {dr.date} ({dr.time})</span>
                      <span>Coordinator: {dr.coordinator}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* TAB 4: RESOURCES & SOPS */}
          {(activeTab === 'overview' || activeTab === 'resources') && (
            <GlassCard className="p-6 md:p-8">
              <div className="mb-6 flex items-center gap-2.5 border-b border-white/10 pb-4">
                <FileText className="h-5 w-5 text-cyan-400" />
                <h2 className="font-[Inter] text-lg font-normal text-white">Faculty Emergency Resources & SOPs</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { title: 'Faculty Evacuation Leader SOP', size: '1.2 MB PDF' },
                  { title: 'Classroom Emergency Response Guide', size: '850 KB PDF' },
                  { title: 'Campus First Aid & AED Station Map', size: '2.4 MB PDF' },
                ].map((doc, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs">
                    <h3 className="font-semibold text-white">{doc.title}</h3>
                    <p className="mt-1 text-[10px] text-white/50">{doc.size}</p>
                    <button
                      onClick={() => alert(`Downloading ${doc.title}...`)}
                      className="mt-3 flex items-center gap-1.5 text-cyan-400 hover:underline"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </main>
      </div>

      {/* BROADCAST ALERT MODAL */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#080d11] p-6 text-white shadow-2xl">
            <h3 className="font-[Inter] text-xl font-normal text-white">Broadcast Emergency Alert</h3>
            <p className="mt-1 text-xs text-white/60">Dispatch a safety alert notification to all students.</p>

            <form onSubmit={handleBroadcastAlert} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-white/70">Alert Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Heavy Rainfall Weather Warning"
                  value={newAlertTitle}
                  onChange={(e) => setNewAlertTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-white/70">Severity Level</label>
                  <select
                    value={newAlertSeverity}
                    onChange={(e) => setNewAlertSeverity(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Warning" className="bg-slate-900">Warning</option>
                    <option value="Critical" className="bg-slate-900">Critical</option>
                    <option value="Advisory" className="bg-slate-900">Advisory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/70">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Science Block"
                    value={newAlertLocation}
                    onChange={(e) => setNewAlertLocation(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">Message Details</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide instructions or hazard information..."
                  value={newAlertMessage}
                  onChange={(e) => setNewAlertMessage(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAlertModalOpen(false)}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-amber-400 px-5 py-2 text-xs font-semibold text-black hover:bg-amber-300"
                >
                  Broadcast Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE DRILL MODAL */}
      {isDrillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#080d11] p-6 text-white shadow-2xl">
            <h3 className="font-[Inter] text-xl font-normal text-white">Schedule Safety Drill</h3>
            <p className="mt-1 text-xs text-white/60">Configure an upcoming emergency evacuation drill.</p>

            <form onSubmit={handleScheduleDrill} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-white/70">Drill Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Earthquake Evacuation Drill"
                  value={newDrillType}
                  onChange={(e) => setNewDrillType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-white/70">Date</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oct 20, 2026"
                    value={newDrillDate}
                    onChange={(e) => setNewDrillDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/70">Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 11:00 AM"
                    value={newDrillTime}
                    onChange={(e) => setNewDrillTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">Target Building / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Main Quad & Science Block"
                  value={newDrillLocation}
                  onChange={(e) => setNewDrillLocation(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDrillModalOpen(false)}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-purple-400 px-5 py-2 text-xs font-semibold text-black hover:bg-purple-300"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
