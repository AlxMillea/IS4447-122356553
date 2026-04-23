export type DayEntry = {
  dayKey: string;
  dayLabel: string;
  dayNum: number;
  month: string;
  session: string;
  tags: string[];
  notes: string;
  isRest: boolean;
};

export type Week = {
  num: number;
  title: string;
  dateRange: string;
  weeksOut: string;
  status: "done" | "current" | "upcoming";
  days: DayEntry[];
};

export const WEEKS: Week[] = [
  {
    num: 1, title: "Foundation", dateRange: "7 Apr – 13 Apr", weeksOut: "~7 weeks out", status: "done",
    days: [
      { dayKey: "2026-04-07", dayLabel: "Tue", dayNum: 7, month: "Apr", session: "Push", tags: ["cramps from sauna"], notes: "Cable fly, incline DB 48kg, bench barbell 70kg. First session back — good pump but sauna day before caused forearm cramps.", isRest: false },
      { dayKey: "2026-04-08", dayLabel: "Wed", dayNum: 8, month: "Apr", session: "Arms", tags: [], notes: "Cable bicep curl, tricep pushdown, spider curl, incline curl. Good arm pump.", isRest: false },
      { dayKey: "2026-04-09", dayLabel: "Thu", dayNum: 9, month: "Apr", session: "Pull + shoulders", tags: ["PR"], notes: "Lat pulldown 100kg, pull ups, straight arm pulldown, laterals 32kg. Leg press 230kg volume PR.", isRest: false },
      { dayKey: "2026-04-10", dayLabel: "Fri", dayNum: 10, month: "Apr", session: "Push", tags: ["sauna damage"], notes: "Bench DB 60kg, barbell 75kg, cable fly. Forearms rock hard from 2 saunas — cramps throughout.", isRest: false },
      { dayKey: "2026-04-11", dayLabel: "Sat", dayNum: 11, month: "Apr", session: "2km run", tags: [], notes: "Active recovery. Good call after back-to-back heavy days.", isRest: false },
      { dayKey: "2026-04-12", dayLabel: "Sun", dayNum: 12, month: "Apr", session: "Legs + abs", tags: [], notes: "First dedicated leg session. Squat 90kg, leg press 230kg, RDL 90kg, hip thrust 110kg, cable crunch.", isRest: false },
      { dayKey: "2026-04-13", dayLabel: "Mon", dayNum: 13, month: "Apr", session: "Push", tags: ["3 PRs"], notes: "Incline barbell 80kg, shoulder press 36kg, lateral raise 8.75kg. Best push session of the block.", isRest: false },
    ],
  },
  {
    num: 2, title: "Progressive overload", dateRange: "14 Apr – 20 Apr", weeksOut: "~6 weeks out", status: "done",
    days: [
      { dayKey: "2026-04-14", dayLabel: "Tue", dayNum: 14, month: "Apr", session: "Pull", tags: [], notes: "Lat pulldown 100kg, T-bar row (first time), dumbbell row 36kg, spider curl, cable curl 28.75kg, shrugs 60kg. Swim post session.", isRest: false },
      { dayKey: "2026-04-15", dayLabel: "Wed", dayNum: 15, month: "Apr", session: "Legs + abs", tags: ["2 PRs"], notes: "Squat 95kg, leg press 240kg, hip thrust 120kg. Leg curl added for first time. Last gym session before trip away.", isRest: false },
      { dayKey: "2026-04-16", dayLabel: "Thu", dayNum: 16, month: "Apr", session: "away — rest", tags: [], notes: "", isRest: true },
      { dayKey: "2026-04-17", dayLabel: "Fri", dayNum: 17, month: "Apr", session: "away — rest", tags: [], notes: "", isRest: true },
      { dayKey: "2026-04-18", dayLabel: "Sat", dayNum: 18, month: "Apr", session: "Home — full upper", tags: [], notes: "12.5kg DBs + press up bars + pull ups outdoors. High volume tempo work — 3 sec eccentric every rep. Adapted to available equipment.", isRest: false },
      { dayKey: "2026-04-19", dayLabel: "Sun", dayNum: 19, month: "Apr", session: "rest", tags: [], notes: "", isRest: true },
      { dayKey: "2026-04-20", dayLabel: "Mon", dayNum: 20, month: "Apr", session: "Home — legs + abs", tags: [], notes: "Resistance bands + 10kg DBs. Band squat, RDL, Bulgarian split squat, band hip thrust, lunges, decline crunches.", isRest: false },
    ],
  },
  {
    num: 3, title: "Push intensity", dateRange: "21 Apr – 27 Apr", weeksOut: "~5 weeks out", status: "current",
    days: [
      { dayKey: "2026-04-21", dayLabel: "Tue", dayNum: 21, month: "Apr", session: "Push", tags: ["2 PRs", "shoulder click"], notes: "Cable fly 27.5kg PR, chest fly machine 45kg PR. Bench barbell 70kg. Shoulder click at 30kg DB press — monitor next session.", isRest: false },
      { dayKey: "2026-04-22", dayLabel: "Wed", dayNum: 22, month: "Apr", session: "Pull", tags: ["forearm fatigue"], notes: "Forearm tightening mid-session — grip failing before back. Straps recommended.", isRest: false },
      { dayKey: "2026-04-23", dayLabel: "Thu", dayNum: 23, month: "Apr", session: "rest", tags: [], notes: "", isRest: true },
      { dayKey: "2026-04-24", dayLabel: "Fri", dayNum: 24, month: "Apr", session: "Legs + abs", tags: ["planned"], notes: "Squat target 100kg. Leg press 245kg. Hip thrust 125kg. Keep building.", isRest: false },
      { dayKey: "2026-04-25", dayLabel: "Sat", dayNum: 25, month: "Apr", session: "Upper — push or arms", tags: ["planned"], notes: "Chest 4 days out, arms 5+ days. Good push session or dedicated arms day.", isRest: false },
      { dayKey: "2026-04-26", dayLabel: "Sun", dayNum: 26, month: "Apr", session: "rest", tags: [], notes: "", isRest: true },
      { dayKey: "2026-04-27", dayLabel: "Mon", dayNum: 27, month: "Apr", session: "Pull", tags: ["planned"], notes: "Buy straps before this session. T-bar row, lat pulldown, rows, bicep work.", isRest: false },
    ],
  },
  {
    num: 4, title: "Peak volume", dateRange: "28 Apr – 4 May", weeksOut: "~4 weeks out", status: "upcoming",
    days: [
      { dayKey: "2026-04-28", dayLabel: "Mon", dayNum: 28, month: "Apr", session: "Push", tags: ["planned"], notes: "Incline DB target 52kg. Shoulder press — drop to 28kg, monitor click. Cable fly target 30kg.", isRest: false },
      { dayKey: "2026-04-29", dayLabel: "Tue", dayNum: 29, month: "Apr", session: "Pull", tags: ["planned"], notes: "T-bar row push. Lat pulldown target 105kg. Dumbbell row target 38kg. Use straps throughout.", isRest: false },
      { dayKey: "2026-04-30", dayLabel: "Wed", dayNum: 30, month: "Apr", session: "rest / football", tags: [], notes: "", isRest: true },
      { dayKey: "2026-05-01", dayLabel: "Thu", dayNum: 1, month: "May", session: "Legs", tags: ["planned"], notes: "Squat target 102.5kg. Leg press 250kg. RDL 95kg. Leg curl progress.", isRest: false },
      { dayKey: "2026-05-02", dayLabel: "Fri", dayNum: 2, month: "May", session: "rest", tags: [], notes: "", isRest: true },
      { dayKey: "2026-05-03", dayLabel: "Sat", dayNum: 3, month: "May", session: "Upper — arms + shoulders", tags: ["planned"], notes: "Arms focus — spider curl, cable curl, single arm curl away. Full shoulder volume.", isRest: false },
      { dayKey: "2026-05-04", dayLabel: "Sun", dayNum: 4, month: "May", session: "rest", tags: [], notes: "", isRest: true },
    ],
  },
  {
    num: 5, title: "Hardest week", dateRange: "5 May – 11 May", weeksOut: "~3 weeks out", status: "upcoming",
    days: [
      { dayKey: "2026-05-05", dayLabel: "Mon", dayNum: 5, month: "May", session: "Push — failure sets", tags: ["planned"], notes: "Introduce failure sets on isolation work. One superset per session. Highest volume push of the block.", isRest: false },
      { dayKey: "2026-05-06", dayLabel: "Tue", dayNum: 6, month: "May", session: "Pull — failure sets", tags: ["planned"], notes: "Failure on spider curls, cable curls. T-bar row maximum weight attempt.", isRest: false },
      { dayKey: "2026-05-07", dayLabel: "Wed", dayNum: 7, month: "May", session: "rest / football", tags: [], notes: "", isRest: true },
      { dayKey: "2026-05-08", dayLabel: "Thu", dayNum: 8, month: "May", session: "Legs — hardest session", tags: ["planned"], notes: "Squat push to 107.5kg. Leg press 255kg+. This is the peak legs session before taper.", isRest: false },
      { dayKey: "2026-05-09", dayLabel: "Fri", dayNum: 9, month: "May", session: "rest", tags: [], notes: "", isRest: true },
      { dayKey: "2026-05-10", dayLabel: "Sat", dayNum: 10, month: "May", session: "Upper — full volume", tags: ["planned"], notes: "Every upper muscle group. Supersets. Last truly hard session before deload begins.", isRest: false },
      { dayKey: "2026-05-11", dayLabel: "Sun", dayNum: 11, month: "May", session: "rest — mandatory", tags: [], notes: "", isRest: true },
    ],
  },
  {
    num: 6, title: "Deload", dateRange: "12 May – 18 May", weeksOut: "~2 weeks out", status: "upcoming",
    days: [
      { dayKey: "2026-05-12", dayLabel: "Mon", dayNum: 12, month: "May", session: "Push — 70% volume", tags: ["planned"], notes: "Same weights as week 5, drop sets by 30%. Body adapts during deload not during hard weeks.", isRest: false },
      { dayKey: "2026-05-13", dayLabel: "Tue", dayNum: 13, month: "May", session: "Pull — 70% volume", tags: ["planned"], notes: "Light lat work, controlled rows. Bicep volume reduced. Focus on feel not load.", isRest: false },
      { dayKey: "2026-05-14", dayLabel: "Wed", dayNum: 14, month: "May", session: "rest", tags: [], notes: "", isRest: true },
      { dayKey: "2026-05-15", dayLabel: "Thu", dayNum: 15, month: "May", session: "Legs — 70% volume", tags: ["planned"], notes: "Squat stays same weight, 2 sets not 4. Leg press reduced. Let the legs recover fully.", isRest: false },
      { dayKey: "2026-05-16", dayLabel: "Fri", dayNum: 16, month: "May", session: "rest — sleep priority", tags: [], notes: "", isRest: true },
      { dayKey: "2026-05-17", dayLabel: "Sat", dayNum: 17, month: "May", session: "Light upper", tags: ["planned"], notes: "Optional — pump session only. Light weight, high rep. Just to stay active.", isRest: false },
      { dayKey: "2026-05-18", dayLabel: "Sun", dayNum: 18, month: "May", session: "rest — sleep 8h+", tags: [], notes: "", isRest: true },
    ],
  },
  {
    num: 7, title: "Final week", dateRange: "19 May – 25 May", weeksOut: "~1 week out", status: "upcoming",
    days: [
      { dayKey: "2026-05-19", dayLabel: "Mon", dayNum: 19, month: "May", session: "Light push", tags: ["planned"], notes: "Keep it easy. Maintain muscle, no fatigue going into Chicago.", isRest: false },
      { dayKey: "2026-05-20", dayLabel: "Tue", dayNum: 20, month: "May", session: "rest", tags: [], notes: "", isRest: true },
      { dayKey: "2026-05-21", dayLabel: "Wed", dayNum: 21, month: "May", session: "Light pull", tags: ["planned"], notes: "Easy rows and lat work. Stay loose.", isRest: false },
      { dayKey: "2026-05-22", dayLabel: "Thu", dayNum: 22, month: "May", session: "rest", tags: [], notes: "", isRest: true },
      { dayKey: "2026-05-23", dayLabel: "Fri", dayNum: 23, month: "May", session: "rest — travel prep", tags: [], notes: "", isRest: true },
      { dayKey: "2026-05-24", dayLabel: "Sat", dayNum: 24, month: "May", session: "rest — travel day", tags: [], notes: "", isRest: true },
      { dayKey: "2026-05-25", dayLabel: "Sun", dayNum: 25, month: "May", session: "Chicago", tags: ["Chicago"], notes: "Departure day.", isRest: false },
    ],
  },
];

export function gymSessionsLeft(): number {
  const today = new Date().toISOString().split("T")[0];
  let count = 0;
  for (const week of WEEKS) {
    for (const day of week.days) {
      if (!day.isRest && day.dayKey >= today) count++;
    }
  }
  return count;
}
