import { Flame, House, Sun, Waves, Wind, Zap, type LucideIcon } from 'lucide-react';

export interface OfflineEmergencyGuide {
  id: string;
  name: string;
  summary: string;
  icon: LucideIcon;
  immediate: string[];
  avoid: string[];
  before: string[];
  during: string[];
  after: string[];
}

export const offlineEmergencyGuides: OfflineEmergencyGuide[] = [
  {
    id: 'earthquake',
    name: 'Earthquake',
    summary: 'Protect your head and neck until the shaking stops.',
    icon: House,
    immediate: [
      'Drop to your hands and knees before the shaking knocks you down.',
      'Cover your head and neck under a sturdy table or desk if one is nearby.',
      'Hold on to your shelter and stay there until the shaking stops.',
      'If outdoors, move to an open area away from buildings, trees, poles, and overhead wires.',
    ],
    avoid: [
      'Do not run outside while the ground is shaking.',
      'Do not use lifts or elevators.',
      'Do not stand in doorways or beside glass, windows, and tall furniture.',
    ],
    before: [
      'Secure heavy furniture, water heaters, and tall shelves.',
      'Identify safe spots under sturdy furniture in each room.',
      'Plan evacuation routes and an outdoor meeting point.',
      'Keep shoes, a torch, water, and essential medication accessible.',
    ],
    during: [
      'Protect your head and neck and stay away from anything that can fall.',
      'If in bed, stay there and cover your head and neck with a pillow.',
      'If driving, pull over safely away from bridges, overpasses, and trees; remain in the vehicle.',
      'If trapped, use a whistle, torch, or phone signal to alert rescuers.',
    ],
    after: [
      'Expect aftershocks and repeat drop, cover, and hold on.',
      'Check yourself and others for injuries; call 112 for urgent help.',
      'Leave a damaged building and move to a clear assembly area.',
      'Avoid fallen wires, damaged walls, and suspected gas leaks.',
    ],
  },
  {
    id: 'flood',
    name: 'Flood',
    summary: 'Move to higher ground early and never enter moving water.',
    icon: Waves,
    immediate: [
      'Move to higher ground, away from rivers, drains, canals, and low-lying roads.',
      'Keep away from floodwater and do not attempt to cross it on foot or in a vehicle.',
      'If trapped by rising water, call 112 and share your location clearly.',
    ],
    avoid: [
      'Never walk, swim, or drive through moving floodwater.',
      'Do not touch electrical equipment while standing in water.',
      'Do not drink floodwater or eat food that has contacted it.',
    ],
    before: [
      'Know higher ground and evacuation routes near your home, school, or workplace.',
      'Keep an emergency kit, drinking water, torch, and charged phone ready.',
      'Store important documents and electrical items above likely flood levels.',
      'Check official warnings when an internet or radio connection is available.',
    ],
    during: [
      'Follow evacuation instructions from local authorities and move early.',
      'Keep away from bridges, riverbanks, drainage channels, and damaged roads.',
      'Switch off electricity only if the area is dry, it is safe to reach, and authorities advise it.',
      'Keep your phone charged and conserve battery for emergency communication.',
    ],
    after: [
      'Return only when authorities say the area is safe.',
      'Treat drinking water and avoid contact with contaminated floodwater.',
      'Inspect buildings for electrical, structural, and sewage hazards before entering.',
      'Wear protective footwear during cleanup and seek care for wounds or illness.',
    ],
  },
  {
    id: 'fire',
    name: 'Fire',
    summary: 'Raise the alarm, leave immediately, and stay low in smoke.',
    icon: Flame,
    immediate: [
      'Raise the alarm and alert people nearby.',
      'Leave by the nearest safe exit; do not stop to collect belongings.',
      'Stay low if smoke is present and cover your nose and mouth if possible.',
      'Call 112 from a safe place and state the exact location of the fire.',
    ],
    avoid: [
      'Do not use elevators during a fire.',
      'Do not open a door that is hot or has smoke coming through it.',
      'Do not re-enter the building until emergency services declare it safe.',
      'Do not use water on electrical, oil, or grease fires.',
    ],
    before: [
      'Learn at least two exits from places you regularly use.',
      'Test smoke alarms and keep extinguishers accessible.',
      'Agree on an outdoor assembly point and check that everyone reaches it.',
      'Keep corridors, stairways, and exits unobstructed.',
    ],
    during: [
      'Crawl low under smoke and use stairs instead of lifts.',
      'Close doors behind you if it is safe, without delaying escape.',
      'If clothing catches fire, stop, drop to the ground, and roll to smother the flames.',
      'Go to the assembly point and tell responders if anyone is missing.',
    ],
    after: [
      'Call emergency services even if the fire appears to be out.',
      'Check for burns and smoke inhalation; seek urgent medical help when needed.',
      'Stay away from the building until fire officials permit re-entry.',
      'Do not reconnect electricity or gas until a qualified person has checked it.',
    ],
  },
  {
    id: 'lightning',
    name: 'Lightning',
    summary: 'When thunder is heard, go inside a substantial shelter.',
    icon: Zap,
    immediate: [
      'Move inside a substantial building or an enclosed hard-topped vehicle.',
      'Leave open fields, hilltops, water, and exposed rooftops immediately.',
      'If someone is struck, call 112; lightning victims do not retain an electrical charge.',
    ],
    avoid: [
      'Do not shelter under an isolated tree or in an open pavilion.',
      'Do not lie flat on the ground or hold metal objects overhead.',
      'Do not use corded phones or handle connected electrical equipment during the storm.',
    ],
    before: [
      'Check weather warnings when a connection is available.',
      'Identify a substantial indoor shelter before outdoor activities.',
      'Secure loose outdoor items and plan to postpone exposed activities.',
    ],
    during: [
      'Stay inside and keep away from windows, doors, and plumbing.',
      'Unplug sensitive electronics only if it is safe to do so before the storm arrives.',
      'Wait at least 30 minutes after the last thunder before going outdoors.',
      'Monitor battery-powered radio or official updates when available.',
    ],
    after: [
      'Check for injuries and call 112 for anyone unresponsive or seriously injured.',
      'Begin CPR if trained and the person is not breathing normally.',
      'Avoid fallen power lines, damaged trees, and flooded electrical areas.',
      'Report hazards to local authorities without approaching them.',
    ],
  },
  {
    id: 'cyclone',
    name: 'Cyclone',
    summary: 'Shelter in a strong interior room away from windows.',
    icon: Wind,
    immediate: [
      'Move indoors to a small, windowless interior room on the lowest safe floor.',
      'Stay away from windows, exterior doors, and loose outdoor objects.',
      'If officials issue an evacuation order, leave early by the advised route.',
    ],
    avoid: [
      'Do not go outside during a lull or the eye of the storm.',
      'Do not stand near windows or attempt to secure objects in high winds.',
      'Do not touch fallen power lines or drive through floodwater.',
    ],
    before: [
      'Secure or move loose outdoor items before winds become dangerous.',
      'Stock drinking water, food, medicines, a torch, batteries, and a radio.',
      'Charge phones and protect important documents in waterproof storage.',
      'Identify a sturdy shelter and follow official evacuation guidance when online.',
    ],
    during: [
      'Remain in the sheltered room and keep away from glass.',
      'Listen to battery radio or official updates when a connection is available.',
      'Conserve phone battery and avoid unnecessary travel.',
      'Move to higher ground if flooding threatens your shelter.',
    ],
    after: [
      'Wait for an official all-clear before leaving shelter.',
      'Watch for broken glass, unstable structures, fallen wires, and floodwater.',
      'Use treated drinking water and discard food that may have spoiled.',
      'Help only when it is safe and report damage to local authorities.',
    ],
  },
  {
    id: 'heatwave',
    name: 'Heatwave',
    summary: 'Cool the body, rest, and recognize heat emergency signs.',
    icon: Sun,
    immediate: [
      'Move to a cool shaded or air-conditioned place and rest.',
      'Loosen clothing and cool the skin with wet cloths or a cool shower.',
      'Sip cool water or oral rehydration solution if the person is fully alert.',
      'Call 112 for confusion, fainting, seizures, very hot skin, or loss of consciousness.',
    ],
    avoid: [
      'Do not give fluids to someone who is unconscious or confused.',
      'Do not leave children, older adults, or animals in parked vehicles.',
      'Avoid alcohol, strenuous activity, and direct midday heat.',
    ],
    before: [
      'Plan access to a cool shelter and reliable drinking water.',
      'Check heat advisories when an internet or radio connection is available.',
      'Prepare cooling supplies and identify people who may need extra help.',
    ],
    during: [
      'Stay indoors during the hottest hours when possible.',
      'Wear loose, lightweight clothing and take frequent rest breaks.',
      'Drink water regularly; use oral rehydration solution after heavy sweating.',
      'Check on children, older adults, outdoor workers, and people living alone.',
    ],
    after: [
      'Continue resting and rehydrating until fully recovered.',
      'Cool the body and seek urgent medical help if symptoms persist or worsen.',
      'Move the person to medical care if heat stroke is suspected; do not leave them alone.',
      'Review cooling plans and check on vulnerable people after the event.',
    ],
  },
];
