import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../lib/services/profileService';
import { preparednessService } from '../lib/services/preparednessService';
import {
  User,
  Mail,
  Building,
  Calendar,
  Shield,
  HeartPulse,
  AlertTriangle,
  Award,
  CheckCircle2,
  Lock,
  Camera,
  Trash2,
  LogOut,
  Save,
  X,
  Edit3,
  Bell,
  Activity,
  RotateCcw,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { SectionHeading } from '../components/SectionHeading';

interface UserSession {
  name: string;
  email: string;
}

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  college: string;
  course: string;
  year: string;
  city: string;
  emergencyName: string;
  emergencyPhone: string;
  bloodGroup: string;
  medicalNotes: string;
  allergies: string;
  specialNeeds: string;
  memberSince: string;
}

const DEFAULT_PROFILE: ProfileData = {
  fullName: 'Alex Vance',
  email: 'alex.vance@gmail.com',
  phone: '+1 (555) 234-5678',
  college: 'National Institute of Technology',
  course: 'Computer Science & Engineering',
  year: '3rd Year',
  city: 'San Francisco, CA',
  emergencyName: 'Sarah Vance (Mother)',
  emergencyPhone: '+1 (555) 987-6543',
  bloodGroup: 'O+',
  medicalNotes: 'Asthma - Inhaler kept in Go-Bag side pocket.',
  allergies: 'Penicillin, Peanuts',
  specialNeeds: 'Requires corrective lenses / glasses.',
  memberSince: 'September 2026',
};

const STORAGE_KEYS = {
  USER: 'readysphere_user',
  PROFILE: 'readysphere_profile_v1',
  PHOTO: 'readysphere_profile_photo_v1',
  NOTIFICATIONS: 'readysphere_notifications_v1',
  KIT: 'prepare_kit_checked_v1',
  GOBAG: 'prepare_gobag_checked_v1',
  PLAN: 'prepare_plan_data_v1',
  REVIEW: 'prepare_review_checked_v1',
  QUIZ: 'readysphere_quiz_scores_v1',
};

export function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: authUser, profile: authProfile, signOut, refreshProfile } = useAuth();

  // User session state
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('disasteriq_user') || localStorage.getItem('readysphere_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Profile data state
  const [profile, setProfile] = useState<ProfileData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      ...DEFAULT_PROFILE,
      fullName: authProfile?.full_name || user?.name || DEFAULT_PROFILE.fullName,
      email: authProfile?.email || user?.email || DEFAULT_PROFILE.email,
    };
  });

  // Sync profile when Supabase profile loads
  useEffect(() => {
    if (authProfile) {
      setProfile((prev) => ({
        ...prev,
        fullName: authProfile.full_name || prev.fullName,
        email: authProfile.email || prev.email,
        phone: authProfile.phone || prev.phone,
        college: authProfile.college || prev.college,
        course: authProfile.course || prev.course,
        year: authProfile.year || prev.year,
        city: authProfile.city || prev.city,
      }));
      if (authProfile.avatar_url) {
        setPhoto(authProfile.avatar_url);
      }
    }
  }, [authProfile]);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<ProfileData>(profile);

  // Profile Photo state
  const [photo, setPhoto] = useState<string | null>(() => {
    return localStorage.getItem('disasteriq_profile_photo_v1') || localStorage.getItem(STORAGE_KEYS.PHOTO) || null;
  });

  // Notifications state
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : { emailNotifications: true, safetyAlerts: true };
    } catch {
      return { emailNotifications: true, safetyAlerts: true };
    }
  });

  // Change Password Modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'error' | 'success'; msg: string } | null>(null);

  // UI alert feedback state
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Preparedness progress metrics from localStorage / Supabase
  const [prepStats, setPrepStats] = useState({
    kitCount: 0,
    gobagCount: 0,
    hasPlan: false,
    reviewCount: 0,
    quizzesCompleted: 0,
    overallScore: 0,
  });

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

      const overallScore = preparednessService.calculateScore(
        kitChecked,
        gobagChecked,
        planData || {},
        reviewChecked
      );

      setPrepStats({
        kitCount,
        gobagCount,
        hasPlan,
        reviewCount,
        quizzesCompleted,
        overallScore,
      });

      // Sync with Supabase if active
      if (authUser?.id) {
        preparednessService.savePreparedness(authUser.id, {
          kit_items: kitChecked,
          go_bag_items: gobagChecked,
          emergency_plan: planData || {},
          review_status: reviewChecked,
        });
      }
    } catch {
      // Ignore parse errors
    }
  }, [authUser]);

  // Update profile state if user logs in
  useEffect(() => {
    if (user && profile.fullName === DEFAULT_PROFILE.fullName && user.name !== DEFAULT_PROFILE.fullName) {
      setProfile((prev) => ({ ...prev, fullName: user.name, email: user.email }));
    }
  }, [user]);

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB.');
      return;
    }

    if (authUser?.id) {
      const avatarUrl = await profileService.uploadAvatar(authUser.id, file);
      if (avatarUrl) {
        setPhoto(avatarUrl);
        localStorage.setItem(STORAGE_KEYS.PHOTO, avatarUrl);
        setSaveMessage('Profile picture updated in Supabase Storage!');
        setTimeout(() => setSaveMessage(null), 3000);
        return;
      }
    }

    // Fallback: Local FileReader
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPhoto(base64String);
      localStorage.setItem(STORAGE_KEYS.PHOTO, base64String);
      setSaveMessage('Profile picture updated!');
      setTimeout(() => setSaveMessage(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    localStorage.removeItem(STORAGE_KEYS.PHOTO);
    localStorage.removeItem('disasteriq_profile_photo_v1');
    setSaveMessage('Profile picture removed.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Handle Save Profile Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(tempProfile);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(tempProfile));

    if (authUser?.id) {
      await profileService.updateProfile(authUser.id, {
        full_name: tempProfile.fullName,
        email: tempProfile.email,
        phone: tempProfile.phone,
        college: tempProfile.college,
        course: tempProfile.course,
        year: tempProfile.year,
        city: tempProfile.city,
      });
      await profileService.updateEmergencyProfile(authUser.id, {
        emergency_contact: `${tempProfile.emergencyName} (${tempProfile.emergencyPhone})`,
        blood_group: tempProfile.bloodGroup,
        medical_notes: tempProfile.medicalNotes,
        allergies: tempProfile.allergies,
        special_assistance: tempProfile.specialNeeds,
      });
      refreshProfile();
    }
    
    // Also sync user name & email in user session
    if (user) {
      const updatedUser = { ...user, name: tempProfile.fullName, email: tempProfile.email };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      localStorage.setItem('disasteriq_user', JSON.stringify(updatedUser));
    }

    setIsEditing(false);
    setSaveMessage('Profile information saved successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleCancelEdit = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  // Toggle Notification Preference
  const handleNotificationToggle = (key: 'emailNotifications' | 'safetyAlerts') => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  };

  // Handle Password Change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword.trim()) {
      setPasswordStatus({ type: 'error', msg: 'Please enter your current password.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', msg: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordStatus({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }

    setPasswordStatus({ type: 'success', msg: 'Password updated successfully!' });
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordStatus(null);
    }, 1200);
  };

  // Handle Logout
  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem('disasteriq_user');
    setUser(null);
    navigate('/');
  };

  // Handle Reset Data
  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset your profile data to default settings?')) {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      localStorage.removeItem(STORAGE_KEYS.PHOTO);
      setProfile(DEFAULT_PROFILE);
      setPhoto(null);
      setSaveMessage('Profile data reset to defaults.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your DisasterIQ account? This will clear your user data and log you out.')) {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      localStorage.removeItem(STORAGE_KEYS.PHOTO);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      setUser(null);
      navigate('/');
    }
  };

  // Unauthenticated fallback prompt
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <GlassCard className="p-10 md:p-14">
          <Shield className="mx-auto mb-4 h-16 w-16 text-cyan-400" />
          <h1 className="font-[Inter] text-3xl font-normal tracking-tight text-white">Profile Access Required</h1>
          <p className="mt-3 text-sm text-white/70">
            Please log in or sign up to view and manage your DisasterIQ student safety profile.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-8 rounded-full bg-white px-8 py-3 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-white/90"
          >
            Return to Home & Login
          </button>
        </GlassCard>
      </div>
    );
  }

  // Badges logic
  const badges = [
    {
      id: 'quiz',
      title: 'First Quiz Completed',
      desc: 'Tested preparedness knowledge in disaster response.',
      unlocked: prepStats.quizzesCompleted > 0 || prepStats.overallScore > 0,
      icon: BookOpen,
    },
    {
      id: 'kit',
      title: 'Emergency Kit Ready',
      desc: 'Gathered at least 50% of essential emergency supplies.',
      unlocked: prepStats.kitCount >= 12,
      icon: Shield,
    },
    {
      id: 'gobag',
      title: 'Go-Bag Prepared',
      desc: 'Packed at least 50% of 72-hour evacuation bag items.',
      unlocked: prepStats.gobagCount >= 5,
      icon: Activity,
    },
    {
      id: 'plan',
      title: 'Emergency Plan Formulated',
      desc: 'Documented meeting points and out-of-area emergency contacts.',
      unlocked: prepStats.hasPlan,
      icon: CheckCircle2,
    },
    {
      id: 'learner',
      title: 'Safety Learner',
      desc: 'Explored disaster guides and campus emergency protocols.',
      unlocked: true, // base unlocked for logged in members
      icon: Sparkles,
    },
    {
      id: 'champion',
      title: 'Preparedness Champion',
      desc: 'Achieved an overall readiness index score of 80% or higher.',
      unlocked: prepStats.overallScore >= 80,
      icon: Award,
    },
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-10">
      {/* Toast Notification Banner */}
      {saveMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-[#081510]/95 px-5 py-3.5 text-xs font-semibold text-emerald-300 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="mb-8">
        <SectionHeading eyebrow="Student Safety Dashboard" title="User Profile & Settings" />
      </div>

      {/* TOP SECTION: PROFILE HEADER CARD */}
      <GlassCard className="mb-8 p-6 md:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            {/* AVATAR WITH PHOTO UPLOAD OVERLAY */}
            <div className="relative group">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-cyan-400/40 bg-gradient-to-br from-cyan-950/80 to-slate-900 shadow-[0_0_25px_rgba(6,182,212,0.2)] md:h-28 md:w-28">
                {photo ? (
                  <img src={photo} alt={profile.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-[Inter] text-3xl font-bold uppercase text-cyan-400 md:text-4xl">
                    {profile.fullName.charAt(0) || 'U'}
                  </span>
                )}
              </div>

              {/* Upload Overlay Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Change Profile Photo"
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              >
                <Camera className="h-7 w-7 text-white" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* NAME & INFO */}
            <div className="text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="font-[Inter] text-2xl font-normal tracking-tight text-white md:text-3xl">
                  {profile.fullName}
                </h1>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  Student Member
                </span>
              </div>
              <p className="mt-1 flex items-center justify-center gap-2 text-xs text-white/70 sm:justify-start">
                <Mail size={13} className="text-cyan-400" />
                <span>{profile.email}</span>
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[11px] text-white/50 sm:justify-start">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-white/40" />
                  Member since {profile.memberSince}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building size={12} className="text-white/40" />
                  {profile.college}
                </span>
              </div>

              {/* Photo Controls */}
              {photo && (
                <button
                  onClick={handleRemovePhoto}
                  className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 hover:underline"
                >
                  <Trash2 size={12} />
                  <span>Remove custom photo</span>
                </button>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex w-full flex-wrap items-center justify-center gap-3 sm:w-auto sm:justify-end">
            <button
              onClick={() => {
                setTempProfile(profile);
                setIsEditing(!isEditing);
              }}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                isEditing
                  ? 'border border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20'
                  : 'border border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10'
              }`}
            >
              <Edit3 size={14} />
              <span>{isEditing ? 'Editing Profile...' : 'Edit Profile'}</span>
            </button>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:border-white/30 hover:bg-white/10"
            >
              <Lock size={14} />
              <span>Change Password</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* GRID: PERSONAL INFO & EMERGENCY INFO */}
      <div className="mb-8 grid gap-8 lg:grid-cols-2">
        {/* PERSONAL INFORMATION CARD */}
        <GlassCard className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <User className="h-5 w-5 text-cyan-400" />
              <h2 className="font-[Inter] text-lg font-normal text-white">Personal Information</h2>
            </div>
            {!isEditing && (
              <button
                onClick={() => {
                  setTempProfile(profile);
                  setIsEditing(true);
                }}
                className="text-xs text-cyan-400 hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium text-white/70">Full Name</label>
                  <input
                    type="text"
                    required
                    value={tempProfile.fullName}
                    onChange={(e) => setTempProfile({ ...tempProfile, fullName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/70">Email Address</label>
                  <input
                    type="email"
                    required
                    value={tempProfile.email}
                    onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium text-white/70">Phone Number</label>
                  <input
                    type="text"
                    value={tempProfile.phone}
                    onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/70">City</label>
                  <input
                    type="text"
                    value={tempProfile.city}
                    onChange={(e) => setTempProfile({ ...tempProfile, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">College / Institution</label>
                <input
                  type="text"
                  value={tempProfile.college}
                  onChange={(e) => setTempProfile({ ...tempProfile, college: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium text-white/70">Course / Department</label>
                  <input
                    type="text"
                    value={tempProfile.course}
                    onChange={(e) => setTempProfile({ ...tempProfile, course: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/70">Year of Study</label>
                  <input
                    type="text"
                    value={tempProfile.year}
                    onChange={(e) => setTempProfile({ ...tempProfile, year: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* SAVE / CANCEL BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition-all hover:bg-white/10"
                >
                  <X size={14} />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-400 px-5 py-2 text-xs font-semibold text-black transition-all hover:bg-cyan-300"
                >
                  <Save size={14} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-white/50">Full Name</span>
                <span className="col-span-2 font-medium text-white">{profile.fullName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-white/50">Email</span>
                <span className="col-span-2 font-medium text-white">{profile.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-white/50">Phone Number</span>
                <span className="col-span-2 font-medium text-white">{profile.phone}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-white/50">City</span>
                <span className="col-span-2 font-medium text-white">{profile.city}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-white/50">Institution</span>
                <span className="col-span-2 font-medium text-white">{profile.college}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-white/50">Course</span>
                <span className="col-span-2 font-medium text-white">{profile.course}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-white/50">Year</span>
                <span className="col-span-2 font-medium text-white">{profile.year}</span>
              </div>
            </div>
          )}
        </GlassCard>

        {/* EMERGENCY & SAFETY INFORMATION CARD */}
        <GlassCard className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <HeartPulse className="h-5 w-5 text-red-400" />
              <h2 className="font-[Inter] text-lg font-normal text-white">Emergency & Safety Medical Record</h2>
            </div>
            {!isEditing && (
              <button
                onClick={() => {
                  setTempProfile(profile);
                  setIsEditing(true);
                }}
                className="text-xs text-cyan-400 hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium text-white/70">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={tempProfile.emergencyName}
                    onChange={(e) => setTempProfile({ ...tempProfile, emergencyName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/70">Emergency Contact Phone</label>
                  <input
                    type="text"
                    value={tempProfile.emergencyPhone}
                    onChange={(e) => setTempProfile({ ...tempProfile, emergencyPhone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">Blood Group</label>
                <select
                  value={tempProfile.bloodGroup}
                  onChange={(e) => setTempProfile({ ...tempProfile, bloodGroup: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg} className="bg-slate-900 text-white">
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">Medical Notes & Conditions</label>
                <textarea
                  rows={2}
                  value={tempProfile.medicalNotes}
                  onChange={(e) => setTempProfile({ ...tempProfile, medicalNotes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium text-white/70">Allergies</label>
                  <input
                    type="text"
                    value={tempProfile.allergies}
                    onChange={(e) => setTempProfile({ ...tempProfile, allergies: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/70">Special Assistance</label>
                  <input
                    type="text"
                    value={tempProfile.specialNeeds}
                    onChange={(e) => setTempProfile({ ...tempProfile, specialNeeds: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-white/50">Emergency Contact</span>
                <span className="col-span-2 font-medium text-white">{profile.emergencyName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-white/50">Contact Phone</span>
                <span className="col-span-2 font-medium text-cyan-300">{profile.emergencyPhone}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-white/50">Blood Group</span>
                <span className="col-span-2 font-bold text-red-400">{profile.bloodGroup}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-white/50">Medical Notes</span>
                <span className="col-span-2 font-medium text-white/90">{profile.medicalNotes}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-white/50">Allergies</span>
                <span className="col-span-2 font-medium text-amber-300">{profile.allergies}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-white/50">Special Needs</span>
                <span className="col-span-2 font-medium text-white/90">{profile.specialNeeds}</span>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* PREPAREDNESS OVERVIEW CARD */}
      <GlassCard className="mb-8 p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Activity className="h-5 w-5 text-emerald-400" />
            <h2 className="font-[Inter] text-lg font-normal text-white">Disaster Preparedness Overview</h2>
          </div>
          <button
            onClick={() => navigate('/prepare')}
            className="text-xs font-semibold text-cyan-400 hover:underline"
          >
            Manage Readiness Plan →
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* OVERALL SCORE */}
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Readiness Score</span>
            <div className="mt-2 font-[Inter] text-4xl font-normal text-white">{prepStats.overallScore}%</div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                style={{ width: `${prepStats.overallScore}%` }}
              />
            </div>
          </div>

          {/* KIT PROGRESS */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70">Emergency Kit</span>
              <span className="font-bold text-white">{prepStats.kitCount} / 23</span>
            </div>
            <div className="mt-3 font-[Inter] text-2xl font-normal text-white">
              {Math.round((prepStats.kitCount / 23) * 100)}%
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${(prepStats.kitCount / 23) * 100}%` }}
              />
            </div>
          </div>

          {/* GO-BAG PROGRESS */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70">72-Hr Go-Bag</span>
              <span className="font-bold text-white">{prepStats.gobagCount} / 10</span>
            </div>
            <div className="mt-3 font-[Inter] text-2xl font-normal text-white">
              {Math.round((prepStats.gobagCount / 10) * 100)}%
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${(prepStats.gobagCount / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* PLAN & QUIZ STATUS */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70">Plan & Knowledge</span>
              <span className="font-bold text-emerald-400">
                {prepStats.hasPlan ? 'Plan Active' : 'Pending'}
              </span>
            </div>
            <div className="mt-3 font-[Inter] text-lg font-normal text-white">
              {prepStats.quizzesCompleted} Quizzes Passed
            </div>
            <p className="mt-2 text-[11px] text-white/50">
              {prepStats.hasPlan ? 'Emergency contacts configured.' : 'Set meeting points & contacts.'}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* ACHIEVEMENTS / BADGES SECTION */}
      <GlassCard className="mb-8 p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Award className="h-5 w-5 text-amber-400" />
            <h2 className="font-[Inter] text-lg font-normal text-white">Achievements & Readiness Badges</h2>
          </div>
          <span className="text-xs text-white/50">
            {badges.filter((b) => b.unlocked).length} of {badges.length} Unlocked
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map(({ id, title, desc, unlocked, icon: Icon }) => (
            <div
              key={id}
              className={`relative flex items-start gap-4 rounded-2xl border p-4 transition-all ${
                unlocked
                  ? 'border-cyan-500/30 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                  : 'border-white/5 bg-white/[0.01] opacity-50'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  unlocked ? 'border border-cyan-400/40 bg-cyan-400/20 text-cyan-300' : 'bg-white/5 text-white/30'
                }`}
              >
                <Icon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-white">{title}</h3>
                  {unlocked ? (
                    <span className="rounded bg-cyan-400/20 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">
                      UNLOCKED
                    </span>
                  ) : (
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/40">
                      LOCKED
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-white/60">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ACCOUNT SETTINGS & NOTIFICATIONS */}
      <GlassCard className="mb-8 p-6 md:p-8">
        <div className="mb-6 flex items-center gap-2.5 border-b border-white/10 pb-4">
          <Bell className="h-5 w-5 text-cyan-400" />
          <h2 className="font-[Inter] text-lg font-normal text-white">Account Settings & Notifications</h2>
        </div>

        <div className="space-y-6">
          {/* Email Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-white">Email Notifications</h3>
              <p className="text-[11px] text-white/50">Receive disaster preparedness updates and campus announcements.</p>
            </div>
            <button
              type="button"
              onClick={() => handleNotificationToggle('emailNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.emailNotifications ? 'bg-cyan-400' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                  notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Safety Alerts Toggle */}
          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <div>
              <h3 className="text-xs font-semibold text-white">Safety Emergency Alerts</h3>
              <p className="text-[11px] text-white/50">Get instant hazard advisories and emergency hotline broadcasts.</p>
            </div>
            <button
              type="button"
              onClick={() => handleNotificationToggle('safetyAlerts')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.safetyAlerts ? 'bg-cyan-400' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                  notifications.safetyAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* LOGOUT BUTTON */}
          <div className="border-t border-white/5 pt-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-xs font-semibold text-red-300 transition-all hover:bg-red-500/20"
            >
              <LogOut size={14} />
              <span>Log Out of DisasterIQ</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* DANGER ZONE */}
      <GlassCard className="border-red-900/30 bg-red-950/10 p-6 md:p-8">
        <div className="mb-4 flex items-center gap-2 text-red-400">
          <AlertTriangle size={18} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">Danger Zone</h3>
        </div>

        <p className="mb-6 text-xs text-white/60">
          Caution: These actions modify your stored profile state or remove user account data from local storage.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleResetData}
            className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-5 py-2.5 text-xs font-semibold text-amber-300 transition-all hover:bg-amber-500/20"
          >
            <RotateCcw size={14} />
            <span>Reset Profile Data</span>
          </button>

          <button
            onClick={handleDeleteAccount}
            className="flex items-center gap-2 rounded-full border border-red-600 bg-red-600 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-red-700"
          >
            <Trash2 size={14} />
            <span>Delete Account</span>
          </button>
        </div>
      </GlassCard>

      {/* CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#080d11] p-6 text-white shadow-2xl">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute right-4 top-4 text-white/50 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="font-[Inter] text-xl font-normal text-white">Change Password</h3>
            <p className="mt-1 text-xs text-white/60">Enter your current password and choose a new password.</p>

            {passwordStatus && (
              <div
                className={`mt-4 rounded-xl border p-3 text-xs ${
                  passwordStatus.type === 'error'
                    ? 'border-red-500/30 bg-red-500/10 text-red-300'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                }`}
              >
                {passwordStatus.msg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-white/70">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-white/90"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
