// All available modules in the Jafasol system
const AVAILABLE_MODULES = [
  { key: 'Dashboard', name: 'Dashboard', description: 'Main dashboard and overview' },
  { key: 'User Management', name: 'User Management', description: 'Manage system users and roles' },
  { key: 'Audit Logs', name: 'Audit Logs', description: 'View system activity logs' },
  { key: 'Students', name: 'Students', description: 'Manage student information and records' },
  { key: 'Teachers', name: 'Teachers', description: 'Manage teacher information and assignments' },
  { key: 'Academics', name: 'Academics', description: 'Manage subjects, classes, and curriculum' },
  { key: 'Attendance', name: 'Attendance', description: 'Track student and teacher attendance' },
  { key: 'Timetable', name: 'Timetable', description: 'Manage class schedules and timetables' },
  { key: 'Exams', name: 'Exams', description: 'Manage examinations and results' },
  { key: 'Fees', name: 'Fees', description: 'Manage school fees and payments' },
  { key: 'Communication', name: 'Communication', description: 'Send messages and notifications' },
  { key: 'Library', name: 'Library', description: 'Manage library resources and book loans' },
  { key: 'Learning Resources', name: 'Learning Resources', description: 'Manage educational materials' },
  { key: 'Transport', name: 'Transport', description: 'Manage transport services and routes' },
  { key: 'Documents', name: 'Documents', description: 'Manage student documents and files' },
  { key: 'Reports', name: 'Reports', description: 'Generate and view various reports' }
];

// Default modules for new schools
const DEFAULT_SCHOOL_MODULES = [
  'Dashboard',
  'Students',
  'Teachers',
  'Academics',
  'Attendance',
  'Timetable',
  'Exams',
  'Fees',
  'Communication',
  'Reports'
];

module.exports = {
  AVAILABLE_MODULES,
  DEFAULT_SCHOOL_MODULES
}; 