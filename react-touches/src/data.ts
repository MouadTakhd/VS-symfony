// Placeholder content for the home page. Swap for API data as each section gets a backend.

export const doctor = {
  name: 'Dr. M. Takhdoukhi',
  role: 'Internal medicine',
  initials: 'MT',
}

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
