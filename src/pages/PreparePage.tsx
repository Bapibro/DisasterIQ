import { useMemo, useState, useEffect } from 'react';
import {
  Check,
  ShieldCheck,
  Printer,
  RotateCcw,
  Backpack,
  Phone,
  MapPin,
  User,
  FileText,
  Sparkles,
  ShieldAlert,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { ProgressBar } from '../components/ProgressBar';
import { SectionHeading } from '../components/SectionHeading';
import {
  EMERGENCY_KIT_ITEMS,
  GOBAG_ITEMS,
  REVIEW_ITEMS,
  DISASTER_CARDS,
  TIMELINE_PHASES,
  KIT_CATEGORIES,
  HOTLINES,
  INITIAL_EMERGENCY_PLAN,
} from './prepareData';
import type { EmergencyPlanData } from './prepareData';

const STORAGE_KEYS = {
  KIT: 'prepare_kit_checked_v1',
  GOBAG: 'prepare_gobag_checked_v1',
  REVIEW: 'prepare_review_checked_v1',
  PLAN: 'prepare_plan_data_v1',
};

export function PreparePage() {
  // --- Local Storage Hydration ---
  const [kitChecked, setKitChecked] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.KIT);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [gobagChecked, setGobagChecked] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOBAG);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [reviewChecked, setReviewChecked] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REVIEW);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [planData, setPlanData] = useState<EmergencyPlanData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAN);
      return saved ? JSON.parse(saved) : INITIAL_EMERGENCY_PLAN;
    } catch {
      return INITIAL_EMERGENCY_PLAN;
    }
  });

  // UI state
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeTimelinePhase, setActiveTimelinePhase] = useState<string>('before');
  const [showResetModal, setShowResetModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const [expandedHazard, setExpandedHazard] = useState<string | null>(null);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KIT, JSON.stringify(kitChecked));
  }, [kitChecked]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GOBAG, JSON.stringify(gobagChecked));
  }, [gobagChecked]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REVIEW, JSON.stringify(reviewChecked));
  }, [reviewChecked]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(planData));
  }, [planData]);

  // --- Handlers ---
  const toggleKitItem = (id: string) => {
    setKitChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGobagItem = (id: string) => {
    setGobagChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleReviewItem = (id: string) => {
    setReviewChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePlanChange = (field: keyof EmergencyPlanData, value: string) => {
    setPlanData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetProgress = () => {
    setKitChecked({});
    setGobagChecked({});
    setReviewChecked({});
    setPlanData(INITIAL_EMERGENCY_PLAN);
    setShowResetModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Score Calculations ---
  const totalKitCount = EMERGENCY_KIT_ITEMS.length;
  const completedKitCount = useMemo(
    () => EMERGENCY_KIT_ITEMS.filter((item) => kitChecked[item.id]).length,
    [kitChecked],
  );

  const totalGobagCount = GOBAG_ITEMS.length;
  const completedGobagCount = useMemo(
    () => GOBAG_ITEMS.filter((item) => gobagChecked[item.id]).length,
    [gobagChecked],
  );

  const totalReviewCount = REVIEW_ITEMS.length;
  const completedReviewCount = useMemo(
    () => REVIEW_ITEMS.filter((item) => reviewChecked[item.id]).length,
    [reviewChecked],
  );

  const planFieldsCount = 10; // 10 main fields
  const completedPlanFields = useMemo(() => {
    let count = 0;
    if (planData.primaryContactName.trim()) count++;
    if (planData.primaryContactPhone.trim()) count++;
    if (planData.outOfAreaContactName.trim()) count++;
    if (planData.outOfAreaContactPhone.trim()) count++;
    if (planData.medicalDoctorName.trim()) count++;
    if (planData.medicalDoctorPhone.trim()) count++;
    if (planData.primaryMeetingPoint.trim()) count++;
    if (planData.secondaryMeetingPoint.trim()) count++;
    if (planData.outOfTownMeetingPoint.trim()) count++;
    if (planData.specialNeedsNotes.trim()) count++;
    return count;
  }, [planData]);

  const preparednessScore = useMemo(() => {
    const kitRatio = completedKitCount / totalKitCount;
    const gobagRatio = completedGobagCount / totalGobagCount;
    const planRatio = completedPlanFields / planFieldsCount;
    const reviewRatio = completedReviewCount / totalReviewCount;

    const weightedScore = Math.round(
      kitRatio * 35 + gobagRatio * 25 + planRatio * 25 + reviewRatio * 15,
    );

    return Math.min(100, Math.max(0, weightedScore));
  }, [completedKitCount, totalKitCount, completedGobagCount, totalGobagCount, completedPlanFields, planFieldsCount, completedReviewCount, totalReviewCount]);

  // Score Status Tiers
  const scoreTier = useMemo(() => {
    if (preparednessScore >= 90) {
      return {
        label: 'Fully Prepared',
        color: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
        description: 'Exceptional level of emergency preparedness! Keep reviewing periodically.',
      };
    }
    if (preparednessScore >= 70) {
      return {
        label: 'Advanced Readiness',
        color: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
        description: 'Great progress! Complete remaining checklists and plan fields to reach 100%.',
      };
    }
    if (preparednessScore >= 40) {
      return {
        label: 'Basic Readiness',
        color: 'text-amber-400',
        badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        description: 'You have started building your safety baseline. Fill out your contacts and go-bag items next.',
      };
    }
    return {
      label: 'Critical Action Needed',
      color: 'text-red-400',
      badgeBg: 'bg-red-500/10 border-red-500/30 text-red-300',
      description: 'Your preparedness score is low. Start by checking off essential supply kit items below.',
    };
  }, [preparednessScore]);

  // Filtered Kit Items
  const filteredKitItems = useMemo(() => {
    if (activeCategory === 'all') return EMERGENCY_KIT_ITEMS;
    return EMERGENCY_KIT_ITEMS.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  return (
    <section className="mx-auto max-w-[1240px] px-4 py-8 md:px-8 md:py-12">
      {/* Print Styles Sheet */}
      <style>{`
        @media print {
          body { background: #ffffff !important; color: #000000 !important; }
          header, footer, nav, button, .no-print { display: none !important; }
          .print-only { display: block !important; }
          .liquid-glass { background: #ffffff !important; border: 1px solid #cccccc !important; color: #000000 !important; box-shadow: none !important; }
          h1, h2, h3, h4, p, span, div, label { color: #000000 !important; }
          .print-break { page-break-before: always; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Header with Title & Action Controls */}
      <div className="no-print mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Disaster Preparedness Center"
          title="Build your emergency readiness before the alert sounds."
          description="A complete crisis management system: dynamic readiness scoring, supply checklists, rapid go-bag kit, and emergency family action plans."
        />

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:border-white/40 hover:bg-white/10 active:scale-95"
            title="Print your customized Emergency Plan"
          >
            <Printer size={15} className="text-cyan-400" />
            <span>Print Emergency Plan</span>
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-red-300 transition-all hover:border-red-500/40 hover:bg-red-500/20 active:scale-95"
            title="Reset all saved progress"
          >
            <RotateCcw size={15} />
            <span>Reset Progress</span>
          </button>
        </div>
      </div>

      {/* --- PRINT ONLY VIEW HEADER --- */}
      <div className="print-only mb-8 border-b-2 border-black pb-4 text-black">
        <h1 className="text-3xl font-bold">PERSONAL EMERGENCY DISASTER PLAN</h1>
        <p className="mt-1 text-sm text-gray-600">Generated from Disaster Preparedness Center • Score: {preparednessScore}% ({scoreTier.label})</p>
      </div>

      {/* --- HERO / SCORE BOARD --- */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="p-6 md:p-8">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
              Readiness Score Index
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${scoreTier.badgeBg}`}>
              <ShieldCheck size={14} />
              {scoreTier.label}
            </span>
          </div>

          <div className="mt-6 flex flex-col items-baseline gap-2 sm:flex-row sm:items-end">
            <span className="font-[Inter] text-6xl font-bold tracking-tight text-white md:text-7xl">
              {preparednessScore}%
            </span>
            <span className="text-sm font-medium text-white/50">Overall Emergency Readiness</span>
          </div>

          <div className="mt-6">
            <ProgressBar value={preparednessScore} />
          </div>

          <p className="mt-4 text-xs leading-relaxed text-white/70">{scoreTier.description}</p>

          {/* Quick Metrics Grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:grid-cols-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
              <span className="text-[10px] uppercase tracking-wider text-white/50">Supply Kit</span>
              <div className="mt-1 text-base font-bold text-white">
                {completedKitCount} <span className="text-xs font-normal text-white/40">/ {totalKitCount}</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
              <span className="text-[10px] uppercase tracking-wider text-white/50">Go-Bag</span>
              <div className="mt-1 text-base font-bold text-white">
                {completedGobagCount} <span className="text-xs font-normal text-white/40">/ {totalGobagCount}</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
              <span className="text-[10px] uppercase tracking-wider text-white/50">Plan Fields</span>
              <div className="mt-1 text-base font-bold text-white">
                {completedPlanFields} <span className="text-xs font-normal text-white/40">/ {planFieldsCount}</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
              <span className="text-[10px] uppercase tracking-wider text-white/50">Reviews</span>
              <div className="mt-1 text-base font-bold text-white">
                {completedReviewCount} <span className="text-xs font-normal text-white/40">/ {totalReviewCount}</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Quick Action Plan Overview Card */}
        <GlassCard className="flex flex-col justify-between p-6 md:p-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              <Sparkles size={16} />
              <span>Priority Action Directive</span>
            </div>
            <h3 className="mt-3 font-[Inter] text-2xl font-medium tracking-tight text-white">
              {preparednessScore < 50
                ? 'Fill out your emergency contacts & key supply checklist.'
                : preparednessScore < 85
                ? 'Complete your 72-hour Go-Bag and verify meeting points.'
                : 'Maintain your readiness: schedule your 6-month review.'}
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-white/60">
              Disasters strike without warning. Keeping your supplies stocked, emergency plan documented, and meeting points agreed upon can save vital minutes during a crisis.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <ShieldAlert size={20} />
              </div>
              <div className="text-xs text-white/80">
                <span className="font-semibold text-white">Automated Storage Active:</span> All checklist edits and emergency contact details are saved locally in your browser.
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* --- SECTION 1: EMERGENCY SUPPLY KIT CHECKLIST --- */}
      <div className="mt-14">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c6d0d0]">Section 01</p>
            <h2 className="mt-1 font-[Inter] text-3xl font-normal tracking-[-0.03em] text-white">
              Emergency Supply Kit Checklist
            </h2>
            <p className="mt-1 text-xs text-white/60">
              Keep supplies stored in portable, easy-to-carry containers in an accessible location.
            </p>
          </div>

          <div className="text-xs font-medium text-white/70">
            Progress: <span className="font-bold text-white">{completedKitCount}</span> of {totalKitCount} items checked
          </div>
        </div>

        {/* Category Tabs Filter */}
        <div className="no-print mb-6 flex scrollbar-none overflow-x-auto gap-2 border-b border-white/10 pb-3">
          {KIT_CATEGORIES.map((cat) => {
            const catItemCount = cat.id === 'all' 
              ? EMERGENCY_KIT_ITEMS.length 
              : EMERGENCY_KIT_ITEMS.filter(i => i.category === cat.id).length;
            const catCompletedCount = cat.id === 'all'
              ? completedKitCount
              : EMERGENCY_KIT_ITEMS.filter(i => i.category === cat.id && kitChecked[i.id]).length;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'border border-white/30 bg-white text-black font-semibold'
                    : 'border border-white/5 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat.label} ({catCompletedCount}/{catItemCount})
              </button>
            );
          })}
        </div>

        <GlassCard className="p-6 md:p-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredKitItems.map((item) => {
              const isChecked = !!kitChecked[item.id];
              return (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                    isChecked
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-white'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleKitItem(item.id)}
                    className="sr-only"
                  />
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                      isChecked
                        ? 'border-emerald-400 bg-emerald-400 text-black'
                        : 'border-white/30 bg-transparent text-transparent'
                    }`}
                  >
                    <Check size={13} strokeWidth={3} />
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs leading-relaxed ${isChecked ? 'text-white font-medium line-through opacity-80' : 'text-white/90'}`}>
                      {item.name}
                    </span>
                    {item.essential && (
                      <span className="w-max rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
                        Essential
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* --- SECTION 2: INTERACTIVE GO-BAG CHECKLIST --- */}
      <div className="mt-14">
        <div className="mb-6 flex flex-col gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c6d0d0]">Section 02</p>
          <div className="flex items-center gap-3">
            <h2 className="font-[Inter] text-3xl font-normal tracking-[-0.03em] text-white">
              Interactive 72-Hour Evacuation Go-Bag
            </h2>
            <span className="flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-xs font-medium text-cyan-300">
              <Backpack size={13} />
              5-Min Grab & Go
            </span>
          </div>
          <p className="text-xs text-white/60">
            A Go-Bag is a light, durable backpack packed with survival essentials ready for instant grab-and-go evacuations.
          </p>
        </div>

        <GlassCard className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
            <div className="text-xs font-medium text-white/70">
              Go-Bag Preparedness: <span className="font-bold text-white">{completedGobagCount} / {totalGobagCount}</span> Packed
            </div>
            <div className="text-xs font-semibold text-cyan-400">
              {Math.round((completedGobagCount / totalGobagCount) * 100)}% Ready
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {GOBAG_ITEMS.map((item) => {
              const isChecked = !!gobagChecked[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleGobagItem(item.id)}
                  className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all ${
                    isChecked
                      ? 'border-cyan-500/40 bg-cyan-500/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                      isChecked
                        ? 'border-cyan-400 bg-cyan-400 text-black'
                        : 'border-white/30 bg-transparent text-transparent'
                    }`}
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <div>
                    <h4 className={`text-sm font-semibold ${isChecked ? 'text-cyan-200 line-through' : 'text-white'}`}>
                      {item.name}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-white/60">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* --- SECTION 3: PERSONAL EMERGENCY PLAN & CONTACT DIRECTORY --- */}
      <div className="mt-14">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c6d0d0]">Section 03</p>
            <h2 className="mt-1 font-[Inter] text-3xl font-normal tracking-[-0.03em] text-white">
              Personal Emergency Plan & Contacts
            </h2>
            <p className="mt-1 text-xs text-white/60">
              Fill in key emergency contacts and designated meeting points. Saved automatically.
            </p>
          </div>

          <button
            onClick={() => setEditingPlan(!editingPlan)}
            className="no-print w-max rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/20"
          >
            {editingPlan ? 'Done Editing' : 'Edit Plan Data'}
          </button>
        </div>

        <GlassCard className="p-6 md:p-8">
          {editingPlan ? (
            /* EDITING FORM VIEW */
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-cyan-400">
                  <Phone size={16} /> Emergency Contacts Directory
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-white/70">Local Primary Contact Name</label>
                  <input
                    type="text"
                    value={planData.primaryContactName}
                    onChange={(e) => handlePlanChange('primaryContactName', e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70">Local Primary Contact Phone</label>
                  <input
                    type="tel"
                    value={planData.primaryContactPhone}
                    onChange={(e) => handlePlanChange('primaryContactPhone', e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70">Out-of-Area Emergency Contact Name</label>
                  <input
                    type="text"
                    value={planData.outOfAreaContactName}
                    onChange={(e) => handlePlanChange('outOfAreaContactName', e.target.value)}
                    placeholder="e.g. Uncle Robert (Out of State)"
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70">Out-of-Area Emergency Phone</label>
                  <input
                    type="tel"
                    value={planData.outOfAreaContactPhone}
                    onChange={(e) => handlePlanChange('outOfAreaContactPhone', e.target.value)}
                    placeholder="e.g. +1 (555) 987-6543"
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70">Primary Family Doctor / Clinic</label>
                  <input
                    type="text"
                    value={planData.medicalDoctorName}
                    onChange={(e) => handlePlanChange('medicalDoctorName', e.target.value)}
                    placeholder="e.g. Dr. Smith / City Health Clinic"
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70">Doctor / Clinic Phone</label>
                  <input
                    type="tel"
                    value={planData.medicalDoctorPhone}
                    onChange={(e) => handlePlanChange('medicalDoctorPhone', e.target.value)}
                    placeholder="e.g. +1 (555) 432-1098"
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-b border-white/10 pb-4 pt-4">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-cyan-400">
                  <MapPin size={16} /> Designated Evacuation Meeting Points
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-white/70">Primary Meeting Point (Near Home)</label>
                  <input
                    type="text"
                    value={planData.primaryMeetingPoint}
                    onChange={(e) => handlePlanChange('primaryMeetingPoint', e.target.value)}
                    placeholder="e.g. Oak Park Fountain"
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70">Secondary Meeting Point (Outside Neighborhood)</label>
                  <input
                    type="text"
                    value={planData.secondaryMeetingPoint}
                    onChange={(e) => handlePlanChange('secondaryMeetingPoint', e.target.value)}
                    placeholder="e.g. Central Library Parking"
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70">Out-of-Town Meeting Location</label>
                  <input
                    type="text"
                    value={planData.outOfTownMeetingPoint}
                    onChange={(e) => handlePlanChange('outOfTownMeetingPoint', e.target.value)}
                    placeholder="e.g. Grandma’s House in Springfield"
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-medium text-white/70">Special Medical Needs, Allergies & Evacuation Notes</label>
                <textarea
                  rows={3}
                  value={planData.specialNeedsNotes}
                  onChange={(e) => handlePlanChange('specialNeedsNotes', e.target.value)}
                  placeholder="e.g. Insulin refrigeration needed for Sam. Pet cat in carrier. Gas main valve located behind garage."
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setEditingPlan(false)}
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/20 px-5 py-2 text-xs font-bold uppercase tracking-wider text-cyan-200 transition-all hover:bg-cyan-500/30"
                >
                  Save & Lock Plan
                </button>
              </div>
            </div>
          ) : (
            /* CARD PREVIEW VIEW */
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Contacts Box */}
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-sm font-semibold text-cyan-400">
                    <User size={16} /> Emergency Contact Directory
                  </div>

                  <div className="mt-4 space-y-4 text-xs">
                    <div>
                      <span className="text-white/50">Local Primary Emergency Contact:</span>
                      <div className="mt-0.5 text-sm font-medium text-white">
                        {planData.primaryContactName || <span className="italic text-white/30">Not specified (Click Edit Plan)</span>}
                        {planData.primaryContactPhone && <span className="ml-2 font-mono text-cyan-300">({planData.primaryContactPhone})</span>}
                      </div>
                    </div>

                    <div>
                      <span className="text-white/50">Out-of-Area Emergency Contact:</span>
                      <div className="mt-0.5 text-sm font-medium text-white">
                        {planData.outOfAreaContactName || <span className="italic text-white/30">Not specified</span>}
                        {planData.outOfAreaContactPhone && <span className="ml-2 font-mono text-cyan-300">({planData.outOfAreaContactPhone})</span>}
                      </div>
                    </div>

                    <div>
                      <span className="text-white/50">Medical Doctor / Clinic:</span>
                      <div className="mt-0.5 text-sm font-medium text-white">
                        {planData.medicalDoctorName || <span className="italic text-white/30">Not specified</span>}
                        {planData.medicalDoctorPhone && <span className="ml-2 font-mono text-cyan-300">({planData.medicalDoctorPhone})</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meeting Points Box */}
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-sm font-semibold text-emerald-400">
                    <MapPin size={16} /> Designated Evacuation Meeting Points
                  </div>

                  <div className="mt-4 space-y-4 text-xs">
                    <div>
                      <span className="text-white/50">Primary Meeting Location (Near Home):</span>
                      <div className="mt-0.5 text-sm font-medium text-white">
                        {planData.primaryMeetingPoint || <span className="italic text-white/30">Not specified</span>}
                      </div>
                    </div>

                    <div>
                      <span className="text-white/50">Secondary Meeting Location (Outside Neighborhood):</span>
                      <div className="mt-0.5 text-sm font-medium text-white">
                        {planData.secondaryMeetingPoint || <span className="italic text-white/30">Not specified</span>}
                      </div>
                    </div>

                    <div>
                      <span className="text-white/50">Out-of-Town Evacuation Meeting Location:</span>
                      <div className="mt-0.5 text-sm font-medium text-white">
                        {planData.outOfTownMeetingPoint || <span className="italic text-white/30">Not specified</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Needs & Notes */}
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-xs">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2 font-semibold text-amber-300">
                  <FileText size={15} /> Special Medical Needs, Allergies & Evacuation Directives
                </div>
                <p className="mt-3 leading-relaxed text-white/80">
                  {planData.specialNeedsNotes || <span className="italic text-white/30">No special medical notes or instructions entered.</span>}
                </p>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* --- SECTION 4: BEFORE / DURING / AFTER TIMELINE --- */}
      <div className="mt-14">
        <div className="mb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c6d0d0]">Section 04</p>
          <h2 className="mt-1 font-[Inter] text-3xl font-normal tracking-[-0.03em] text-white">
            Before / During / After Crisis Timeline
          </h2>
          <p className="mt-1 text-xs text-white/60">
            A three-phase operational timeline for managing disaster risk before, during, and after an event.
          </p>
        </div>

        {/* Phase Selectors */}
        <div className="no-print mb-6 grid grid-cols-3 gap-3">
          {TIMELINE_PHASES.map((p) => {
            const isActive = activeTimelinePhase === p.phase;
            return (
              <button
                key={p.phase}
                onClick={() => setActiveTimelinePhase(p.phase)}
                className={`flex flex-col items-start rounded-2xl border p-4 transition-all text-left ${
                  isActive
                    ? 'border-white bg-white/10 text-white shadow-lg'
                    : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{p.number}</span>
                <span className="mt-1 text-sm font-semibold uppercase tracking-wider">{p.phase}</span>
              </button>
            );
          })}
        </div>

        <GlassCard className="p-6 md:p-8">
          {(() => {
            const currentPhaseData = TIMELINE_PHASES.find((p) => p.phase === activeTimelinePhase)!;
            return (
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-extrabold text-white/20">{currentPhaseData.number}</span>
                  <div>
                    <h3 className="font-[Inter] text-2xl font-normal text-white">{currentPhaseData.title}</h3>
                    <p className="mt-1 text-xs text-white/60">{currentPhaseData.description}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
                  {currentPhaseData.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <span className="text-xs leading-relaxed text-white/80">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </GlassCard>
      </div>

      {/* --- SECTION 5: DISASTER PREPARATION CARDS (6 HAZARDS) --- */}
      <div className="mt-14">
        <div className="mb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c6d0d0]">Section 05</p>
          <h2 className="mt-1 font-[Inter] text-3xl font-normal tracking-[-0.03em] text-white">
            Hazard-Specific Preparation Protocols
          </h2>
          <p className="mt-1 text-xs text-white/60">
            Action protocols tailored for Earthquake, Flood, Fire, Cyclone, Landslide, and Lightning.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DISASTER_CARDS.map((card) => {
            const IconComponent = card.icon;
            const isExpanded = expandedHazard === card.id;

            return (
              <GlassCard key={card.id} className="flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white">
                        <IconComponent size={20} />
                      </div>
                      <h3 className="font-[Inter] text-xl font-medium text-white">{card.title}</h3>
                    </div>

                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${card.badgeColor}`}>
                      {card.riskLevel} Risk
                    </span>
                  </div>

                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-white/80">
                    {card.tagline}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Immediate Action Steps:</span>
                    {card.immediateActions.slice(0, isExpanded ? card.immediateActions.length : 2).map((action, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-white/70">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="text-[11px] text-white/60">
                    <strong className="text-white">Key Gear:</strong> {card.keyGear}
                  </div>

                  <div className="mt-2 rounded-xl border border-white/5 bg-black/40 p-2.5 text-[11px] text-white/70">
                    <span className="font-semibold text-amber-300">Pro Tip: </span>
                    {card.proTip}
                  </div>

                  <button
                    onClick={() => setExpandedHazard(isExpanded ? null : card.id)}
                    className="no-print mt-3 flex items-center gap-1 text-xs font-medium text-cyan-400 hover:underline"
                  >
                    {isExpanded ? (
                      <>Show Less <ChevronUp size={14} /></>
                    ) : (
                      <>Read Full Protocol <ChevronDown size={14} /></>
                    )}
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* --- SECTION 6: PREPAREDNESS REVIEW CHECKLIST --- */}
      <div className="mt-14">
        <div className="mb-6 flex flex-col gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c6d0d0]">Section 06</p>
          <h2 className="font-[Inter] text-3xl font-normal tracking-[-0.03em] text-white">
            Periodic Maintenance Review Checklist
          </h2>
          <p className="text-xs text-white/60">
            Emergency readiness requires regular maintenance. Perform these scheduled upkeep tasks to keep kits fresh.
          </p>
        </div>

        <GlassCard className="p-6 md:p-8">
          <div className="mb-4 text-xs text-white/60">
            Completed: <span className="font-bold text-white">{completedReviewCount}</span> of {totalReviewCount} maintenance tasks
          </div>

          <div className="space-y-3">
            {REVIEW_ITEMS.map((item) => {
              const isChecked = !!reviewChecked[item.id];
              return (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${
                    isChecked
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleReviewItem(item.id)}
                      className="sr-only"
                    />
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                        isChecked
                          ? 'border-emerald-400 bg-emerald-400 text-black'
                          : 'border-white/30 bg-transparent text-transparent'
                      }`}
                    >
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className={`text-xs ${isChecked ? 'text-white line-through opacity-70' : 'text-white/90'}`}>
                      {item.task}
                    </span>
                  </div>

                  <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white/60">
                    <Clock size={11} className="mr-1 inline text-cyan-400" />
                    {item.frequency}
                  </span>
                </label>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* --- SECTION 7: SAFETY TIPS & CRISIS DIRECTORY --- */}
      <div className="mt-14">
        <div className="mb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c6d0d0]">Section 07</p>
          <h2 className="mt-1 font-[Inter] text-3xl font-normal tracking-[-0.03em] text-white">
            Essential Safety Rules & Emergency Hotlines
          </h2>
          <p className="mt-1 text-xs text-white/60">
            Keep these universal crisis hotlines and survival rules memorized.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Hotlines Grid */}
          <GlassCard className="p-6">
            <h3 className="flex items-center gap-2 border-b border-white/10 pb-3 text-sm font-bold uppercase tracking-wider text-red-400">
              <Phone size={16} /> National Emergency Hotlines
            </h3>
            <div className="mt-4 space-y-3">
              {HOTLINES.map((h) => (
                <div key={h.name} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div>
                    <div className="text-xs font-semibold text-white">{h.name}</div>
                    <div className="text-[10px] text-white/50">{h.desc}</div>
                  </div>
                  <div className="font-mono text-sm font-bold text-red-400">{h.number}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Survival Rules */}
          <GlassCard className="p-6">
            <h3 className="flex items-center gap-2 border-b border-white/10 pb-3 text-sm font-bold uppercase tracking-wider text-cyan-400">
              <ShieldCheck size={16} /> Critical Survival Rules
            </h3>
            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="font-bold text-amber-300">The 3-3-3 Survival Rule</div>
                <div className="mt-1 text-white/70">You can survive 3 minutes without air, 3 days without water, and 3 weeks without food. Prioritize breathing air & shelter first!</div>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="font-bold text-cyan-300">Universal Whistle Distress Signal</div>
                <div className="mt-1 text-white/70">Blow 3 short whistle blasts, pause 5 seconds, repeat. Rescuers recognize 3 blasts as a universal SOS call.</div>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="font-bold text-emerald-300">Lockscreen ICE Setup</div>
                <div className="mt-1 text-white/70">Add 'In Case of Emergency' medical ID to your smartphone lockscreen so first responders can identify blood type & emergency contacts.</div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* --- RESET MODAL --- */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-[#0d1313] p-6 text-white shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">Reset All Preparedness Progress?</h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/70">
              This will erase all checked items in your Emergency Kit, Go-Bag, Review list, and clear your saved Personal Emergency Contact Plan. This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleResetProgress}
                className="rounded-xl border border-red-500/40 bg-red-500/20 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/30"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
