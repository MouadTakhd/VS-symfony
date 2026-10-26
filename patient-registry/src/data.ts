// Placeholder content for the UI pass. Swap for the real API later.
//
// Patient records are NOT here: they live in public/data/patients.json and reach
// the UI through src/db.ts, which validates them against src/schema.ts.

export const doctor = {
  name: 'Dr. M. Takhdoukhi',
  role: 'Internal medicine',
  initials: 'MT',
}

export const kpis = [
  {
    label: 'Active patients',
    value: '1,284',
    delta: { text: '4.2%', dir: 'up', good: true, vs: 'vs last month' },
    spark: [38, 41, 40, 44, 43, 47, 46, 52, 50, 55, 58, 61],
  },
  {
    label: 'Appointments today',
    value: '36',
    delta: { text: '6', dir: 'up', good: true, vs: 'vs yesterday' },
    spark: [22, 26, 24, 30, 28, 27, 31, 29, 33, 30, 34, 36],
  },
  {
    label: 'Awaiting lab results',
    value: '18',
    delta: { text: '3', dir: 'down', good: true, vs: 'vs yesterday' },
    spark: [31, 29, 30, 27, 28, 25, 26, 24, 22, 21, 21, 18],
  },
  {
    label: 'Average wait time',
    value: '14 min',
    delta: { text: '2 min', dir: 'up', good: false, vs: 'vs last week' },
    spark: [9, 10, 10, 11, 12, 11, 13, 12, 13, 14, 13, 14],
  },
]

export const wards = [
  { name: 'General medicine', used: 24, total: 30 },
  { name: 'Pediatrics', used: 11, total: 18 },
  { name: 'Maternity', used: 14, total: 16 },
  { name: 'Intensive care', used: 7, total: 8 },
]

export const schedule = [
  { time: '09:00', patient: 'Imane Barada', reason: 'Follow-up · hypertension', room: 'Room 2', state: 'done' },
  { time: '09:40', patient: 'Youssef Amrani', reason: 'Blood panel review', room: 'Room 2', state: 'done' },
  { time: '10:30', patient: 'Nadia Chraibi', reason: 'Post-op check', room: 'Room 5', state: 'now' },
  { time: '11:15', patient: 'Omar Belkacem', reason: 'New intake', room: 'Room 2', state: 'next' },
  { time: '13:00', patient: 'Salma Idrissi', reason: 'ECG results', room: 'Cardio lab', state: 'next' },
  { time: '14:20', patient: 'Hicham Ouazzani', reason: 'Diabetes review', room: 'Room 2', state: 'next' },
]

export const activity = [
  { who: 'Nurse K. Hamdi', what: 'logged vitals for Nadia Chraibi', when: '6 min ago', icon: 'heart' },
  { who: 'Lab', what: 'returned CBC for Youssef Amrani', when: '24 min ago', icon: 'file' },
  { who: 'You', what: 'admitted Omar Belkacem to General medicine', when: '1 h ago', icon: 'building' },
  { who: 'Reception', what: 'rescheduled Salma Idrissi to 13:00', when: '2 h ago', icon: 'calendar' },
  { who: 'Dr. L. Fassi', what: 'added a note to Hicham Ouazzani', when: '3 h ago', icon: 'file' },
]


export const waitingRoom = [
  { name: 'Omar Belkacem', since: '11:02', status: 'observation' },
  { name: 'Lina Benjelloun', since: '11:14', status: 'stable' },
  { name: 'Aya Mansouri', since: '11:21', status: 'stable' },
]
