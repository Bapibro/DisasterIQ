import {
  AlertTriangle,
  CloudRain,
  Flame,
  House,
  TentTree,
  Waves,
  Wind,
} from 'lucide-react';

export type DisasterInfo = {
  slug: string;
  name: string;
  short: string;
  description: string;
  icon: typeof House;
  warningSigns: string[];
  before: string[];
  during: string[];
  after: string[];
  safetyTips: string[];
};

export const disasters: DisasterInfo[] = [
  {
    slug: 'earthquake',
    name: 'Earthquake',
    short: 'Drop, cover, and hold on.',
    description: 'Stay low, protect yourself, and wait for the shaking to stop before moving.',
    icon: House,
    warningSigns: ['Sudden shaking', 'Falling objects', 'Rumbling sounds'],
    before: ['Secure heavy furniture and shelves', 'Identify safe places under sturdy tables', 'Prepare emergency supplies and routes'],
    during: ['Drop to the ground', 'Cover your head and neck', 'Hold on until the shaking stops'],
    after: ['Check for injuries', 'Be alert for aftershocks', 'Avoid damaged buildings and fallen debris'],
    safetyTips: ['Stay away from windows and glass', 'Do not use elevators', 'Follow official instructions'],
  },
  {
    slug: 'flood',
    name: 'Flood',
    short: 'Move early and stay informed.',
    description: 'Act early, move uphill, and never underestimate moving water.',
    icon: Waves,
    warningSigns: ['Heavy rain', 'Rising water levels', 'Blocked drains'],
    before: ['Know evacuation routes', 'Keep emergency kits ready', 'Store important documents high up'],
    during: ['Move to higher ground', 'Avoid flooded roads and drainage channels', 'Turn off electricity if safe'],
    after: ['Beware of contamination', 'Clean and inspect areas carefully', 'Avoid electrical hazards'],
    safetyTips: ['Never drive through moving water', 'Avoid riverbanks during heavy rain', 'Listen to official warnings'],
  },
  {
    slug: 'fire',
    name: 'Fire',
    short: 'Recognize danger and leave quickly.',
    description: 'Respond fast with clear exits, cool thinking, and a safe evacuation plan.',
    icon: Flame,
    warningSigns: ['Smoke', 'Burning smell', 'Overheated wires'],
    before: ['Check alarms and exits', 'Keep fire extinguishers accessible', 'Create a fire exit plan'],
    during: ['Raise the alarm and leave immediately', 'Stay low under smoke', 'Use the nearest safe exit'],
    after: ['Call emergency services', 'Check for injuries', 'Do not re-enter the building'],
    safetyTips: ['Never use lifts during a fire', 'Do not open doors without checking', 'Leave belongings behind'],
  },
  {
    slug: 'cyclone',
    name: 'Cyclone',
    short: 'Prepare before the storm arrives.',
    description: 'Secure your surroundings and shelter in a protected interior area.',
    icon: Wind,
    warningSigns: ['Very high winds', 'Rapid cloud build-up', 'Storm warnings'],
    before: ['Secure loose objects', 'Prepare emergency supplies', 'Identify a safe room away from windows'],
    during: ['Stay indoors', 'Avoid windows and open areas', 'Listen to official updates'],
    after: ['Inspect for damage', 'Avoid fallen power lines', 'Wait for clearance before leaving shelter'],
    safetyTips: ['Do not travel during the storm', 'Keep drinking water available', 'Protect important records'],
  },
  {
    slug: 'landslide',
    name: 'Landslide',
    short: 'Know the warning signs and move away.',
    description: 'Recognize unstable slopes and move away from steep terrain when warnings rise.',
    icon: TentTree,
    warningSigns: ['Ground cracks', 'Tilting trees', 'Sudden water flow'],
    before: ['Avoid high-risk slopes', 'Monitor local news and alerts', 'Plan evacuation paths'],
    during: ['Move away from slopes immediately', 'Avoid rivers and roads near unstable ground', 'Listen to warnings'],
    after: ['Avoid damaged roads', 'Check for trapped people', 'Watch for secondary slope failures'],
    safetyTips: ['Avoid construction on unstable ground', 'Be alert during rain', 'Keep to official safe routes'],
  },
  {
    slug: 'lightning',
    name: 'Lightning',
    short: 'When thunder is near, safety comes first.',
    description: 'Seek enclosed shelter and avoid exposed ridges or tall isolated objects.',
    icon: CloudRain,
    warningSigns: ['Dark clouds', 'Thunder nearby', 'Static or buzzing air'],
    before: ['Monitor weather alerts', 'Identify safe indoor shelter', 'Plan outdoor timing carefully'],
    during: ['Move indoors', 'Avoid open fields and water', 'Stay away from metal objects'],
    after: ['Check for injuries', 'Wait 30 minutes after the last thunder', 'Avoid risky outdoor movement'],
    safetyTips: ['Do not stand under isolated trees', 'Stay away from water', 'Avoid electrical appliances outdoors'],
  },
];

export const disasterMap = Object.fromEntries(disasters.map((d) => [d.slug, d]));

export const emergencyNumbers = [
  { label: 'National Emergency', number: '112', icon: AlertTriangle },
  { label: 'Fire', number: '101', icon: Flame },
  { label: 'Police', number: '100', icon: House },
  { label: 'Ambulance', number: '108', icon: AlertTriangle },
  { label: 'Disaster Management', number: '1078', icon: CloudRain },
];
