import {
  Activity,
  Waves,
  Flame,
  Wind,
  Mountain,
  CloudLightning,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface KitItem {
  id: string;
  name: string;
  category: 'water' | 'food' | 'firstaid' | 'power' | 'communication' | 'hygiene';
  essential?: boolean;
}

export interface GoBagItem {
  id: string;
  name: string;
  description: string;
}

export interface ReviewItem {
  id: string;
  task: string;
  frequency: string;
}

export interface EmergencyPlanData {
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactRelation: string;
  outOfAreaContactName: string;
  outOfAreaContactPhone: string;
  outOfAreaContactRelation: string;
  medicalDoctorName: string;
  medicalDoctorPhone: string;
  primaryMeetingPoint: string;
  secondaryMeetingPoint: string;
  outOfTownMeetingPoint: string;
  specialNeedsNotes: string;
}

export interface DisasterCardData {
  id: string;
  title: string;
  icon: LucideIcon;
  tagline: string;
  riskLevel: 'Severe' | 'High' | 'Critical';
  badgeColor: string;
  immediateActions: string[];
  keyGear: string;
  proTip: string;
}

export const KIT_CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'water', label: '💧 Water & Hydration' },
  { id: 'food', label: '🥫 Food & Rations' },
  { id: 'firstaid', label: '🩹 First Aid & Meds' },
  { id: 'power', label: '⚡ Power & Light' },
  { id: 'communication', label: '📻 Comm & Signal' },
  { id: 'hygiene', label: '📄 Docs & Hygiene' },
] as const;

export const EMERGENCY_KIT_ITEMS: KitItem[] = [
  // Water
  { id: 'k1', name: '3-Day Drinking Water Supply (1 gallon / person / day)', category: 'water', essential: true },
  { id: 'k2', name: 'Water purification tablets or liquid chlorine bleach', category: 'water', essential: true },
  { id: 'k3', name: 'Portable water filtration canteen or gravity filter', category: 'water' },

  // Food
  { id: 'k4', name: '3-Day Non-Perishable Food Supply (canned meats, fruits, stew)', category: 'food', essential: true },
  { id: 'k5', name: 'High-energy protein bars and trail mix packs', category: 'food' },
  { id: 'k6', name: 'Manual can opener and durable eating utensils', category: 'food', essential: true },
  { id: 'k7', name: 'Specialty food (baby formula, pet food, dietary items)', category: 'food' },

  // First Aid
  { id: 'k8', name: 'Comprehensive First-Aid Kit (80+ bandages, gauze, antiseptic)', category: 'firstaid', essential: true },
  { id: 'k9', name: 'Prescription medications (minimum 7-day backup supply)', category: 'firstaid', essential: true },
  { id: 'k10', name: 'Pain relievers, antacids, and anti-histamine allergy pills', category: 'firstaid' },
  { id: 'k11', name: 'Sterile nitrile gloves, medical tape, and fine tweezers', category: 'firstaid' },

  // Power & Light
  { id: 'k12', name: 'High-lumen LED Flashlights (1 per family member)', category: 'power', essential: true },
  { id: 'k13', name: 'Spare battery packs (AA / AAA lithium batteries)', category: 'power', essential: true },
  { id: 'k14', name: 'Solar or hand-crank 20,000mAh emergency power bank', category: 'power' },
  { id: 'k15', name: 'Heavy-duty leather work gloves & safety goggles', category: 'power' },

  // Communication
  { id: 'k16', name: 'NOAA Weather / Emergency radio (battery or hand-crank)', category: 'communication', essential: true },
  { id: 'k17', name: 'Loud emergency whistle (120dB distress signal)', category: 'communication', essential: true },
  { id: 'k18', name: 'Emergency signal flare or high-reflectivity mirror', category: 'communication' },

  // Docs & Hygiene
  { id: 'k19', name: 'Waterproof document pouch (IDs, Passports, Insurance, Deeds)', category: 'hygiene', essential: true },
  { id: 'k20', name: 'Emergency cash reserve ($100-$300 in small $5/$10 bills)', category: 'hygiene', essential: true },
  { id: 'k21', name: 'Sanitation kit (wet wipes, heavy garbage bags, soap)', category: 'hygiene' },
  { id: 'k22', name: 'N95 Respirator dust masks (for ash/smoke/dust filtration)', category: 'hygiene' },
  { id: 'k23', name: 'Thermal Mylar Emergency Blankets (1 per person)', category: 'hygiene', essential: true },
];

export const GOBAG_ITEMS: GoBagItem[] = [
  { id: 'g1', name: 'Tactical Evacuation Backpack (30-40L)', description: 'Durable, water-resistant pack kept in easy reach near exit.' },
  { id: 'g2', name: 'Waterproof Document Pouch', description: 'Copies of ID cards, passports, insurance policies & house keys.' },
  { id: 'g3', name: 'Emergency Cash ($100+ in small bills)', description: 'Paper cash when ATMs and digital card machines fail.' },
  { id: 'g4', name: '72-Hour Survival Rations', description: 'High-calorie emergency food bars & sealed pouch water.' },
  { id: 'g5', name: 'Compact First-Aid & RX Meds', description: 'Bandages, antiseptic wipes, 7-day prescription meds.' },
  { id: 'g6', name: 'LED Headlamp + Fresh Batteries', description: 'Frees hands for carrying gear and navigation in darkness.' },
  { id: 'g7', name: 'Thermal Mylar Blanket & Raincoat', description: 'Protects against hypothermia, shock, and heavy rain.' },
  { id: 'g8', name: 'Emergency Whistle & Swiss Multi-Tool', description: '120dB whistle for signaling rescuers + utility knife.' },
  { id: 'g9', name: 'Personal Hygiene & Microfiber Towel', description: 'Hand sanitizer, disinfectant wipes, compact fast-dry towel.' },
  { id: 'g10', name: 'Family Emergency Contact Card', description: 'Laminated card with out-of-area phone numbers & meeting points.' },
];

export const REVIEW_ITEMS: ReviewItem[] = [
  { id: 'r1', task: 'Inspect & rotate canned food and bottled water expiration dates', frequency: 'Every 6 Months' },
  { id: 'r2', task: 'Test LED flashlights & install fresh batteries in emergency radio', frequency: 'Every 6 Months' },
  { id: 'r3', task: 'Check first-aid kit expiration dates & replace used bandages', frequency: 'Every 6 Months' },
  { id: 'r4', task: 'Verify & update out-of-area emergency contact phone numbers', frequency: 'Annually' },
  { id: 'r5', task: 'Practice home evacuation route walk & test primary meeting point', frequency: 'Every 6 Months' },
  { id: 'r6', task: 'Update encrypted USB flash drive backup of vital records & photos', frequency: 'Annually' },
  { id: 'r7', task: 'Inspect home fire extinguisher pressure gauges & smoke alarms', frequency: 'Monthly' },
];

export const DISASTER_CARDS: DisasterCardData[] = [
  {
    id: 'earthquake',
    title: 'Earthquake',
    icon: Activity,
    tagline: 'Drop, Cover, Hold On!',
    riskLevel: 'High',
    badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    immediateActions: [
      'DROP onto your hands and knees immediately to prevent being knocked down.',
      'COVER your head and neck under a sturdy table or desk. If no shelter is near, cover face with arms next to an interior wall.',
      'HOLD ON to your shelter until all shaking stops completely.',
      'If outdoors, move to an open area away from buildings, power lines, and tall trees.',
    ],
    keyGear: 'Sturdy leather boots, hard hat/helmet, high-lumen headlamp',
    proTip: 'Do NOT stand in doorways. Modern interior doorways are no stronger than standard walls and leave you exposed to falling debris.',
  },
  {
    id: 'flood',
    title: 'Flood',
    icon: Waves,
    tagline: 'Move to High Ground & Turn Around!',
    riskLevel: 'Severe',
    badgeColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
    immediateActions: [
      'Evacuate immediately if advised by authorities or if rising waters threaten your location.',
      'Never walk, swim, or drive through floodwaters—6 inches of moving water can knock an adult off their feet.',
      'Disconnect main electrical breaker and gas lines if safe before water reaches your home.',
      'Move essential documents, electronics, and medicine to upper levels or roof access if trapped.',
    ],
    keyGear: 'Waterproof tall boots, Coast-Guard approved life vest, sealed document pouch',
    proTip: 'Vehicles can be swept away in just 12 inches of fast-flowing water. Turn Around, Don’t Drown!',
  },
  {
    id: 'fire',
    title: 'Fire',
    icon: Flame,
    tagline: 'Get Out, Stay Out & Stay Low!',
    riskLevel: 'Critical',
    badgeColor: 'border-red-500/30 bg-red-500/10 text-red-400',
    immediateActions: [
      'Crawl low on hands and knees under smoke to reach the nearest safe exit.',
      'Test door handles and door cracks with the back of your hand—if hot, do NOT open; use secondary exit.',
      'Once outside, stay out! Never re-enter a burning structure for pets or property.',
      'Call emergency response (112 / 911) immediately from a safe distance.',
    ],
    keyGear: 'Class ABC Fire Extinguisher, fire blanket, N95 smoke filter mask',
    proTip: 'Identify at least TWO escape routes out of every room in your residence.',
  },
  {
    id: 'cyclone',
    title: 'Cyclone',
    icon: Wind,
    tagline: 'Secure Exterior & Shelter Indoors!',
    riskLevel: 'Severe',
    badgeColor: 'border-teal-500/30 bg-teal-500/10 text-teal-400',
    immediateActions: [
      'Board up windows or close heavy storm shutters securely.',
      'Shelter in a small interior room, hallway, or closet on the lowest floor away from glass windows.',
      'Monitor NOAA emergency weather radio for storm eye announcements and evacuation orders.',
      'Beware of the Eye of the Cyclone—calm conditions are temporary before winds reverse violently.',
    ],
    keyGear: 'Emergency crank weather radio, solar charging station, heavy tarps',
    proTip: 'Secure or bring indoors all outdoor patio furniture, potted plants, and loose debris before storm winds hit.',
  },
  {
    id: 'landslide',
    title: 'Landslide',
    icon: Mountain,
    tagline: 'Watch Ground Signs & Move Perpendicular!',
    riskLevel: 'High',
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    immediateActions: [
      'Watch for warning signs: tilting telephone poles, cracking pavement, or sudden muddy creek flows.',
      'If you hear a roaring sound or feel ground tremors, run PERPENDICULAR to the slide path immediately.',
      'If escape is impossible, curl into a tight ball and protect your head with your arms.',
      'Stay clear of the slide zone after movement stops—secondary slides often occur.',
    ],
    keyGear: '120dB emergency whistle, emergency locator beacon, rugged outdoor boots',
    proTip: 'Landslides occur most frequently during or immediately following intense rainfall on sloped terrain.',
  },
  {
    id: 'lightning',
    title: 'Lightning',
    icon: CloudLightning,
    tagline: 'When Thunder Roars, Go Indoors!',
    riskLevel: 'Severe',
    badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    immediateActions: [
      'Seek shelter inside a substantial enclosed building or hard-topped metal vehicle right away.',
      'Avoid open athletic fields, hilltops, tall solitary trees, bodies of water, and metal fences.',
      'Unplug high-value electronics and avoid using corded phones or plumbing during electrical storms.',
      'Observe the 30/30 Rule: Wait 30 minutes after the last clap of thunder before returning outdoors.',
    ],
    keyGear: 'Surge protectors, indoor LED lanterns',
    proTip: 'If caught in an open field with no shelter, crouch low on the balls of your feet with heels touching—do NOT lie flat on the ground!',
  },
];

export const TIMELINE_PHASES = [
  {
    phase: 'before',
    number: '01',
    label: 'BEFORE (Preparation & Mitigation)',
    title: 'Build your defense before emergency alerts sound.',
    description: 'Proactive mitigation reduces disaster impact by up to 80%. Prepare kits, map routes, and secure your living space.',
    steps: [
      'Assemble emergency kit & 72-hour go-bag for rapid deployment.',
      'Formulate family emergency plan & designate primary and secondary meeting points.',
      'Secure heavy furniture, TV monitors, and gas appliances to wall studs.',
      'Digitize vital records (IDs, deeds, medical history) to waterproof storage & encrypted cloud.',
      'Enroll in local community emergency alert broadcasting systems.',
    ],
  },
  {
    phase: 'during',
    number: '02',
    label: 'DURING (Immediate Crisis Action)',
    title: 'Execute survival protocols without hesitation.',
    description: 'Stay calm, act decisively according to the specific hazard, and prioritize human safety above material goods.',
    steps: [
      'Execute hazard protocol immediately (Drop/Cover/Hold for quakes; High ground for floods; Stay low for fires).',
      'Keep emergency go-bag within immediate reach.',
      'Listen to official broadcast instructions via hand-crank emergency radio.',
      'Avoid touching downed electrical power cables or wading in standing water.',
      'Send SMS text messages to emergency contacts instead of voice calls to keep lines open.',
    ],
  },
  {
    phase: 'after',
    number: '03',
    label: 'AFTER (Recovery & Safety Assessment)',
    title: 'Assess risks before returning or re-entering structures.',
    description: 'Secondary hazards like gas leaks, aftershocks, and structural collapse are common after primary disasters.',
    steps: [
      'Check yourself and family members for injuries; apply emergency first-aid.',
      'Inspect home for gas smells, electrical sparking, or structural wall cracks.',
      'If you smell gas, shut off main valve from outside immediately and evacuate.',
      'Re-enter damaged buildings ONLY after structural safety clearance by emergency personnel.',
      'Document property damage with photographs for insurance and relief claims.',
    ],
  },
];

export const INITIAL_EMERGENCY_PLAN: EmergencyPlanData = {
  primaryContactName: '',
  primaryContactPhone: '',
  primaryContactRelation: 'Family Member',
  outOfAreaContactName: '',
  outOfAreaContactPhone: '',
  outOfAreaContactRelation: 'Out-of-State Relative',
  medicalDoctorName: '',
  medicalDoctorPhone: '',
  primaryMeetingPoint: '',
  secondaryMeetingPoint: '',
  outOfTownMeetingPoint: '',
  specialNeedsNotes: '',
};

export const HOTLINES = [
  { name: 'National Emergency', number: '112 / 911', desc: 'Unified Emergency Services' },
  { name: 'Disaster Response (NDRF)', number: '011-24363260', desc: 'National Disaster Response' },
  { name: 'Ambulance Service', number: '102 / 108', desc: 'Medical Emergencies' },
  { name: 'Fire Department', number: '101', desc: 'Fire & Evacuation' },
  { name: 'Police Assistance', number: '100', desc: 'Law & Safety' },
];
