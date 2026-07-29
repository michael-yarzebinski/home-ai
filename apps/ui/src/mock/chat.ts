// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const now = new Date();
const minsAgo = (n: number) => new Date(now.getTime() - n * 60_000);
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

export const MOCK_CHAT_SESSIONS: ChatSession[] = [
  {
    id: 'sess_001',
    title: 'Turn off the living room lights',
    createdAt: minsAgo(12),
    updatedAt: minsAgo(11),
    messages: [
      { id: 'm_001a', role: 'user', content: 'Turn off the living room lights', createdAt: minsAgo(12) },
      { id: 'm_001b', role: 'assistant', content: 'Done! The living room lights are now off.', createdAt: minsAgo(11) },
    ],
  },

  {
    id: 'sess_002',
    title: "What's on the calendar today?",
    createdAt: minsAgo(45),
    updatedAt: minsAgo(44),
    messages: [
      { id: 'm_002a', role: 'user', content: "What's on the calendar today?", createdAt: minsAgo(45) },
      {
        id: 'm_002b',
        role: 'assistant',
        content:
          "Here's today's schedule:\n\n• Soccer practice — 4:00 PM (Emma & Liam)\n• Dinner reservation at Mario's — 7:00 PM\n\nAnything else coming up you'd like to know about?",
        createdAt: minsAgo(44),
      },
    ],
  },

  {
    id: 'sess_003',
    title: 'Lock the front door',
    createdAt: minsAgo(120),
    updatedAt: minsAgo(119),
    messages: [
      { id: 'm_003a', role: 'user', content: 'Lock the front door please', createdAt: minsAgo(120) },
      { id: 'm_003b', role: 'assistant', content: 'The front door is locked. All entry points are secure.', createdAt: minsAgo(119) },
    ],
  },

  {
    id: 'sess_004',
    title: 'Set the thermostat to 72',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    messages: [
      { id: 'm_004a', role: 'user', content: 'Set the thermostat to 72 degrees', createdAt: daysAgo(1) },
      {
        id: 'm_004b',
        role: 'assistant',
        content: "Done! The bedroom thermostat is now set to 72°F. It'll reach that temperature in about 10–15 minutes.",
        createdAt: daysAgo(1),
      },
    ],
  },

  {
    id: 'sess_005',
    title: "Find a pasta recipe for tonight",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    messages: [
      { id: 'm_005a', role: 'user', content: 'Find a pasta recipe for tonight', createdAt: daysAgo(1) },
      {
        id: 'm_005b',
        role: 'assistant',
        content:
          "Here are a couple of options from your recipe library:\n\n**Classic Spaghetti Bolognese**\n45 min cook time · serves 4\n\nWould you like me to pull up the full recipe, or is there a different dish you had in mind?",
        createdAt: daysAgo(1),
      },
      { id: 'm_005c', role: 'user', content: "Yes, let's do the Bolognese", createdAt: daysAgo(1) },
      {
        id: 'm_005d',
        role: 'assistant',
        content:
          "Great choice! Here's the quick rundown:\n\n**Ingredients:** Ground beef, canned tomatoes, onion, garlic, celery, carrot, red wine, spaghetti, parmesan.\n\n**Steps:**\n1. Brown the beef with onion, garlic, celery, and carrot.\n2. Add wine and let it reduce for 2 minutes.\n3. Add tomatoes, simmer 30–40 minutes on low.\n4. Cook pasta al dente, combine, and top with parmesan.\n\nEnjoy dinner! 🍝",
        createdAt: daysAgo(1),
      },
    ],
  },

  {
    id: 'sess_006',
    title: 'Send Jane a school pickup reminder',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    messages: [
      { id: 'm_006a', role: 'user', content: 'Send Jane a reminder about school pickup at 3:15', createdAt: daysAgo(2) },
      {
        id: 'm_006b',
        role: 'assistant',
        content: "Done! I've sent Jane a reminder: \"School pickup today at 3:15 PM.\" She'll receive it on her phone.",
        createdAt: daysAgo(2),
      },
    ],
  },

  {
    id: 'sess_007',
    title: 'Morning briefing',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    messages: [
      { id: 'm_007a', role: 'user', content: "Give me a quick morning briefing", createdAt: daysAgo(3) },
      {
        id: 'm_007b',
        role: 'assistant',
        content:
          "Good morning! Here's your briefing:\n\n**Weather:** 68°F, partly cloudy. High of 72°F today.\n\n**Calendar:** Soccer practice at 4 PM, dinner at 7 PM.\n\n**Home:** All doors locked. Garage door is closed.\n\n**Pending:** Emma has 1 pending approval for a calendar event.\n\nHave a great day!",
        createdAt: daysAgo(3),
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Mock AI response generator
// ---------------------------------------------------------------------------

export function generateMockResponse(message: string): string {
  const lower = message.toLowerCase();

  // Lights
  if (lower.match(/\b(light|lamp|lights)\b/)) {
    const action = lower.includes('off') ? 'off' : lower.includes('on') ? 'on' : 'adjusted';
    const room = lower.match(/(living room|kitchen|bedroom|garage|hallway|office)/)?.[1] ?? 'the requested';
    return action === 'adjusted'
      ? `I've adjusted the ${room} lights.`
      : `Done! The ${room} lights are now ${action}.`;
  }

  // Calendar / schedule
  if (lower.match(/\b(calendar|schedule|event|appointment|today|tomorrow)\b/)) {
    return "Here's what's coming up:\n\n• Soccer practice — 4:00 PM (Emma & Liam)\n• Dinner at Mario's — 7:00 PM\n\nWould you like to add or change anything?";
  }

  // Thermostat / temperature
  if (lower.match(/\b(thermostat|heat|cool|temp|degrees?|warm|cold)\b/)) {
    const tempMatch = lower.match(/(\d+)\s*(degrees?|°)?/);
    const temp = tempMatch ? `${tempMatch[1]}°F` : 'the requested temperature';
    return `Done! The thermostat is set to ${temp}. It should reach that in about 10–15 minutes.`;
  }

  // Lock / security
  if (lower.match(/\b(lock|unlock|door|garage|secure)\b/)) {
    return 'All entry points are secured. Front door and garage are locked.';
  }

  // Reminder / notification
  if (lower.match(/\b(remind|reminder|notify|notification|send|message)\b/)) {
    return "Got it! I've sent that notification. They'll receive it shortly.";
  }

  // Recipe / food
  if (lower.match(/\b(recipe|food|cook|dinner|lunch|breakfast|meal|eat)\b/)) {
    return "Here are a few options from your recipe library:\n\n• **Classic Spaghetti Bolognese** — 45 min, serves 4\n• **Chicken Stir Fry** — 35 min, serves 3\n• **Caesar Salad** — 10 min, serves 2\n\nWant the full recipe for any of these?";
  }

  // Weather
  if (lower.match(/\b(weather|forecast|rain|sunny|cloudy)\b/)) {
    return "It's 68°F and partly cloudy right now. Expect a high of 72°F today with a chance of rain this evening around 7 PM.";
  }

  // Greeting
  if (lower.match(/^(hi|hello|hey|good morning|good evening|good afternoon)\b/)) {
    return "Hey! What can I help you with today?";
  }

  // Fallback
  const fallbacks = [
    "I'm on it! Give me just a moment.",
    "Sure, I can handle that for you.",
    "Got it. I'll take care of that right away.",
    "Understood — consider it done.",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// ---------------------------------------------------------------------------
// Group sessions by date bucket
// ---------------------------------------------------------------------------

export function groupSessionsByDate(sessions: ChatSession[]): { label: string; sessions: ChatSession[] }[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const sevenDaysStart = new Date(todayStart.getTime() - 6 * 86_400_000);

  const today: ChatSession[] = [];
  const yesterday: ChatSession[] = [];
  const lastWeek: ChatSession[] = [];
  const older: ChatSession[] = [];

  for (const s of sessions) {
    const d = s.updatedAt;
    if (d >= todayStart) today.push(s);
    else if (d >= yesterdayStart) yesterday.push(s);
    else if (d >= sevenDaysStart) lastWeek.push(s);
    else older.push(s);
  }

  return [
    { label: 'Today', sessions: today },
    { label: 'Yesterday', sessions: yesterday },
    { label: 'Last 7 days', sessions: lastWeek },
    { label: 'Older', sessions: older },
  ].filter((g) => g.sessions.length > 0);
}
