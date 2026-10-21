import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json({ limit: '15mb' }));

// Initial genuine seed datasets
interface StudentRecord {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  course: 'B.Tech' | 'M.Tech' | 'BCA' | 'BBA';
  semester: number;
  section: 'A' | 'B' | 'C' | 'D';
  createdAt: string;
}

interface AttendanceEntry {
  id: string;
  studentId: string;
  rollNo: string;
  studentName: string;
  course: string;
  section: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent';
  markedAt: string;
}

interface AssignmentRecord {
  id: string;
  title: string;
  course: string;
  section: string;
  description: string;
  fileName: string;
  fileSize: number; // bytes
  fileType: string;
  fileData?: string; // base64 or preview text
  uploadedAt: string;
}

interface AttendanceAlertRecord {
  id: string;
  studentId: string;
  rollNo: string;
  studentName: string;
  email: string;
  course: string;
  section: string;
  percentage: number;
  message: string;
  sentAt: string;
}

const sentWarnings: AttendanceAlertRecord[] = [];

const students: StudentRecord[] = [
  { id: 'std-1', name: 'Aarav Sharma', rollNo: '2024CS101', email: 'aarav.sharma@campusdesk.edu', course: 'B.Tech', semester: 5, section: 'A', createdAt: '2024-08-15' },
  { id: 'std-2', name: 'Ananya Verma', rollNo: '2024CS102', email: 'ananya.verma@campusdesk.edu', course: 'B.Tech', semester: 5, section: 'A', createdAt: '2024-08-15' },
  { id: 'std-3', name: 'Rohan Deshmukh', rollNo: '2024CS103', email: 'rohan.deshmukh@campusdesk.edu', course: 'B.Tech', semester: 5, section: 'A', createdAt: '2024-08-16' },
  { id: 'std-4', name: 'Ishita Iyer', rollNo: '2024CS104', email: 'ishita.iyer@campusdesk.edu', course: 'B.Tech', semester: 5, section: 'B', createdAt: '2024-08-16' },
  { id: 'std-5', name: 'Vikramaditya Rao', rollNo: '2024CS105', email: 'vikram.rao@campusdesk.edu', course: 'B.Tech', semester: 5, section: 'B', createdAt: '2024-08-17' },
  { id: 'std-6', name: 'Pooja Nair', rollNo: '2024MT201', email: 'pooja.nair@campusdesk.edu', course: 'M.Tech', semester: 3, section: 'A', createdAt: '2024-08-18' },
  { id: 'std-7', name: 'Kabir Sengupta', rollNo: '2024MT202', email: 'kabir.sengupta@campusdesk.edu', course: 'M.Tech', semester: 3, section: 'A', createdAt: '2024-08-18' },
  { id: 'std-8', name: 'Sneha Kulkarni', rollNo: '2024BC301', email: 'sneha.kulkarni@campusdesk.edu', course: 'BCA', semester: 5, section: 'A', createdAt: '2024-08-19' },
  { id: 'std-9', name: 'Tanmay Saxena', rollNo: '2024BC302', email: 'tanmay.saxena@campusdesk.edu', course: 'BCA', semester: 3, section: 'B', createdAt: '2024-08-19' },
  { id: 'std-10', name: 'Divya Malhotra', rollNo: '2024BB401', email: 'divya.malhotra@campusdesk.edu', course: 'BBA', semester: 3, section: 'A', createdAt: '2024-08-20' },
  { id: 'std-11', name: 'Nikhil Mehta', rollNo: '2024BB402', email: 'nikhil.mehta@campusdesk.edu', course: 'BBA', semester: 3, section: 'B', createdAt: '2024-08-20' },
];

let attendanceRecords: AttendanceEntry[] = [
  // Aarav Sharma (std-1, 2024CS101) - 6 sessions, 5 Present, 1 Absent = 83.33% (>75%)
  { id: 'att-1', studentId: 'std-1', rollNo: '2024CS101', studentName: 'Aarav Sharma', course: 'B.Tech', section: 'A', date: '2026-10-20', status: 'Present', markedAt: '2026-10-20T09:00:00Z' },
  { id: 'att-hist-1', studentId: 'std-1', rollNo: '2024CS101', studentName: 'Aarav Sharma', course: 'B.Tech', section: 'A', date: '2026-10-19', status: 'Present', markedAt: '2026-10-19T09:15:00Z' },
  { id: 'att-hist-2', studentId: 'std-1', rollNo: '2024CS101', studentName: 'Aarav Sharma', course: 'B.Tech', section: 'A', date: '2026-10-18', status: 'Present', markedAt: '2026-10-18T09:12:00Z' },
  { id: 'att-hist-3', studentId: 'std-1', rollNo: '2024CS101', studentName: 'Aarav Sharma', course: 'B.Tech', section: 'A', date: '2026-10-17', status: 'Absent', markedAt: '2026-10-17T09:20:00Z' },
  { id: 'att-hist-4', studentId: 'std-1', rollNo: '2024CS101', studentName: 'Aarav Sharma', course: 'B.Tech', section: 'A', date: '2026-10-16', status: 'Present', markedAt: '2026-10-16T09:10:00Z' },
  { id: 'att-hist-5', studentId: 'std-1', rollNo: '2024CS101', studentName: 'Aarav Sharma', course: 'B.Tech', section: 'A', date: '2026-10-15', status: 'Present', markedAt: '2026-10-15T09:11:00Z' },

  // Ananya Verma (std-2, 2024CS102) - 4 sessions, 3 Present, 1 Absent = EXACTLY 75.0% (Must NOT be in below 75% list!)
  { id: 'att-2', studentId: 'std-2', rollNo: '2024CS102', studentName: 'Ananya Verma', course: 'B.Tech', section: 'A', date: '2026-10-20', status: 'Present', markedAt: '2026-10-20T09:00:00Z' },
  { id: 'att-an-1', studentId: 'std-2', rollNo: '2024CS102', studentName: 'Ananya Verma', course: 'B.Tech', section: 'A', date: '2026-10-19', status: 'Present', markedAt: '2026-10-19T09:00:00Z' },
  { id: 'att-an-2', studentId: 'std-2', rollNo: '2024CS102', studentName: 'Ananya Verma', course: 'B.Tech', section: 'A', date: '2026-10-18', status: 'Present', markedAt: '2026-10-18T09:00:00Z' },
  { id: 'att-an-3', studentId: 'std-2', rollNo: '2024CS102', studentName: 'Ananya Verma', course: 'B.Tech', section: 'A', date: '2026-10-17', status: 'Absent', markedAt: '2026-10-17T09:00:00Z' },

  // Rohan Deshmukh (std-3, 2024CS103) - 5 sessions, 2 Present, 3 Absent = 40.0% (<75% LOW ATTENDANCE)
  { id: 'att-3', studentId: 'std-3', rollNo: '2024CS103', studentName: 'Rohan Deshmukh', course: 'B.Tech', section: 'A', date: '2026-10-20', status: 'Absent', markedAt: '2026-10-20T09:00:00Z' },
  { id: 'att-ro-1', studentId: 'std-3', rollNo: '2024CS103', studentName: 'Rohan Deshmukh', course: 'B.Tech', section: 'A', date: '2026-10-19', status: 'Present', markedAt: '2026-10-19T09:00:00Z' },
  { id: 'att-ro-2', studentId: 'std-3', rollNo: '2024CS103', studentName: 'Rohan Deshmukh', course: 'B.Tech', section: 'A', date: '2026-10-18', status: 'Absent', markedAt: '2026-10-18T09:00:00Z' },
  { id: 'att-ro-3', studentId: 'std-3', rollNo: '2024CS103', studentName: 'Rohan Deshmukh', course: 'B.Tech', section: 'A', date: '2026-10-17', status: 'Present', markedAt: '2026-10-17T09:00:00Z' },
  { id: 'att-ro-4', studentId: 'std-3', rollNo: '2024CS103', studentName: 'Rohan Deshmukh', course: 'B.Tech', section: 'A', date: '2026-10-16', status: 'Absent', markedAt: '2026-10-16T09:00:00Z' },

  // Ishita Iyer (std-4, 2024CS104) - 6 sessions, 4 Present, 2 Absent = 66.67% (<75% LOW ATTENDANCE)
  { id: 'att-is-1', studentId: 'std-4', rollNo: '2024CS104', studentName: 'Ishita Iyer', course: 'B.Tech', section: 'B', date: '2026-10-20', status: 'Absent', markedAt: '2026-10-20T09:00:00Z' },
  { id: 'att-is-2', studentId: 'std-4', rollNo: '2024CS104', studentName: 'Ishita Iyer', course: 'B.Tech', section: 'B', date: '2026-10-19', status: 'Present', markedAt: '2026-10-19T09:00:00Z' },
  { id: 'att-is-3', studentId: 'std-4', rollNo: '2024CS104', studentName: 'Ishita Iyer', course: 'B.Tech', section: 'B', date: '2026-10-18', status: 'Present', markedAt: '2026-10-18T09:00:00Z' },
  { id: 'att-is-4', studentId: 'std-4', rollNo: '2024CS104', studentName: 'Ishita Iyer', course: 'B.Tech', section: 'B', date: '2026-10-17', status: 'Absent', markedAt: '2026-10-17T09:00:00Z' },
  { id: 'att-is-5', studentId: 'std-4', rollNo: '2024CS104', studentName: 'Ishita Iyer', course: 'B.Tech', section: 'B', date: '2026-10-16', status: 'Present', markedAt: '2026-10-16T09:00:00Z' },
  { id: 'att-is-6', studentId: 'std-4', rollNo: '2024CS104', studentName: 'Ishita Iyer', course: 'B.Tech', section: 'B', date: '2026-10-15', status: 'Present', markedAt: '2026-10-15T09:00:00Z' },

  // Pooja Nair (std-6, 2024MT201) - 4 sessions, 4 Present, 0 Absent = 100.0% (>75%)
  { id: 'att-po-1', studentId: 'std-6', rollNo: '2024MT201', studentName: 'Pooja Nair', course: 'M.Tech', section: 'A', date: '2026-10-20', status: 'Present', markedAt: '2026-10-20T09:00:00Z' },
  { id: 'att-po-2', studentId: 'std-6', rollNo: '2024MT201', studentName: 'Pooja Nair', course: 'M.Tech', section: 'A', date: '2026-10-19', status: 'Present', markedAt: '2026-10-19T09:00:00Z' },
  { id: 'att-po-3', studentId: 'std-6', rollNo: '2024MT201', studentName: 'Pooja Nair', course: 'M.Tech', section: 'A', date: '2026-10-18', status: 'Present', markedAt: '2026-10-18T09:00:00Z' },
  { id: 'att-po-4', studentId: 'std-6', rollNo: '2024MT201', studentName: 'Pooja Nair', course: 'M.Tech', section: 'A', date: '2026-10-17', status: 'Present', markedAt: '2026-10-17T09:00:00Z' },
];

const assignments: AssignmentRecord[] = [
  {
    id: 'asg-1',
    title: 'Advanced Data Structures - Balanced Trees Implementation',
    course: 'B.Tech',
    section: 'A',
    description: 'Implement AVL and Red-Black tree insertion with balancing verification algorithms. Submit executable code and benchmark report.',
    fileName: 'BTech_CS_Lab_Assignment_04.pdf',
    fileSize: 428000,
    fileType: 'application/pdf',
    uploadedAt: '2026-10-18T10:30:00Z'
  },
  {
    id: 'asg-2',
    title: 'Database Normalization & BCNF Decomposition Problem Set',
    course: 'B.Tech',
    section: 'A',
    description: 'Solve the relational schema dependency exercises 1 through 8. Provide functional dependency closures and 3NF/BCNF proofs.',
    fileName: 'DBMS_Normalization_ProblemSet.pdf',
    fileSize: 312000,
    fileType: 'application/pdf',
    uploadedAt: '2026-10-16T14:20:00Z'
  },
  {
    id: 'asg-3',
    title: 'Computer Networks - Packet Routing Flowchart Architecture',
    course: 'B.Tech',
    section: 'B',
    description: 'High-level diagram and analysis of BGP vs OSPF convergence protocols under link failure conditions.',
    fileName: 'Network_Topology_Routing.png',
    fileSize: 685000,
    fileType: 'image/png',
    uploadedAt: '2026-10-17T11:00:00Z'
  },
  {
    id: 'asg-4',
    title: 'Distributed Systems Consensus Algorithms Literature Review',
    course: 'M.Tech',
    section: 'A',
    description: 'Comparative study on Raft, Paxos, and Byzantine fault tolerance in modern blockchain validators.',
    fileName: 'MTech_Distributed_Consensus_Review.pdf',
    fileSize: 840000,
    fileType: 'application/pdf',
    uploadedAt: '2026-10-15T16:00:00Z'
  },
  {
    id: 'asg-5',
    title: 'Business Analytics - Financial Portfolio Forecasting Model',
    course: 'BBA',
    section: 'A',
    description: 'Develop multivariate regression models on Q3 enterprise quarterly filings and outline risk exposures.',
    fileName: 'BBA_Portfolio_Forecast_Analysis.pdf',
    fileSize: 512000,
    fileType: 'application/pdf',
    uploadedAt: '2026-10-14T09:45:00Z'
  }
];

// --- REST API ROUTES ---

// 1. Dashboard summary stats
app.get('/api/stats/dashboard', (req, res) => {
  const totalStudents = students.length;
  const totalAttendance = attendanceRecords.length;
  const totalAssignments = assignments.length;
  
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter(r => r.date === today);
  const todayPresents = todayRecords.filter(r => r.status === 'Present').length;
  const todayRate = todayRecords.length > 0 ? Math.round((todayPresents / todayRecords.length) * 100) : 92;

  // Calculate institutional low-attendance (<75%) count across database
  let lowAttendanceCount = 0;
  students.forEach(student => {
    const logs = attendanceRecords.filter(a => a.studentId === student.id || a.rollNo.toUpperCase() === student.rollNo.toUpperCase());
    if (logs.length > 0) {
      const pres = logs.filter(l => l.status === 'Present').length;
      const pct = (pres / logs.length) * 100;
      if (pct < 75.0) {
        lowAttendanceCount++;
      }
    }
  });

  const allPresents = attendanceRecords.filter(r => r.status === 'Present').length;
  const overallAverageAttendance = attendanceRecords.length > 0 
    ? Math.round((allPresents / attendanceRecords.length) * 100)
    : 85;

  return res.json({
    totalStudents,
    totalAttendance,
    totalAssignments,
    todayRate,
    lowAttendanceCount,
    overallAverageAttendance,
    recentStudents: students.slice(-5).reverse()
  });
});

// Low attendance report API endpoint
app.get('/api/reports/low-attendance', (req, res) => {
  const { query, course, semester, section, startDate, endDate } = req.query;

  // 1. Filter students
  let filtered = [...students];
  if (course && course !== 'All') {
    filtered = filtered.filter(s => s.course === course);
  }
  if (section && section !== 'All') {
    filtered = filtered.filter(s => s.section === section);
  }
  if (semester && semester !== 'All') {
    const sem = Number(semester);
    if (!isNaN(sem)) {
      filtered = filtered.filter(s => s.semester === sem);
    }
  }
  if (query) {
    const q = String(query).toLowerCase().trim();
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.rollNo.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  }

  // 2. Compute attendance percentage per student with date range
  interface EvaluatedStudent {
    student: StudentRecord;
    totalClasses: number;
    presentCount: number;
    absentCount: number;
    percentage: number | null;
    percentageDisplay: string;
    status: 'Low Attendance' | 'Attendance Not Available';
  }

  const lowAttendanceStudents: EvaluatedStudent[] = [];
  const noAttendanceStudents: EvaluatedStudent[] = [];

  let overallPresentCount = 0;
  let overallRecordedSessions = 0;

  filtered.forEach(student => {
    let studentLogs = attendanceRecords.filter(a =>
      a.studentId === student.id || a.rollNo.toUpperCase() === student.rollNo.toUpperCase()
    );

    if (startDate) {
      studentLogs = studentLogs.filter(a => a.date >= String(startDate));
    }
    if (endDate) {
      studentLogs = studentLogs.filter(a => a.date <= String(endDate));
    }

    const totalSessions = studentLogs.length;

    if (totalSessions === 0) {
      noAttendanceStudents.push({
        student,
        totalClasses: 0,
        presentCount: 0,
        absentCount: 0,
        percentage: null,
        percentageDisplay: 'N/A',
        status: 'Attendance Not Available'
      });
      return;
    }

    const presentCount = studentLogs.filter(l => l.status === 'Present').length;
    const absentCount = totalSessions - presentCount;
    // Formula: (Total Present / Total Recorded Attendance Sessions) * 100
    const rawPct = (presentCount / totalSessions) * 100;
    const percentage = Number(rawPct.toFixed(2));

    overallPresentCount += presentCount;
    overallRecordedSessions += totalSessions;

    // Strictly below 75%: 74.99% or lower. Exactly 75.0% must NOT be included.
    if (percentage < 75.0) {
      lowAttendanceStudents.push({
        student,
        totalClasses: totalSessions,
        presentCount,
        absentCount,
        percentage,
        percentageDisplay: `${percentage.toFixed(1)}%`,
        status: 'Low Attendance'
      });
    }
  });

  const overallAttendanceRate = overallRecordedSessions > 0
    ? Number(((overallPresentCount / overallRecordedSessions) * 100).toFixed(1))
    : 0;

  return res.json({
    lowAttendanceStudents,
    noAttendanceStudents,
    summary: {
      totalLowAttendance: lowAttendanceStudents.length,
      totalNoAttendance: noAttendanceStudents.length,
      totalEvaluated: filtered.length,
      overallAttendanceRate,
      overallPresentCount,
      overallRecordedSessions
    }
  });
});

// Export Low Attendance Report as CSV
app.get('/api/reports/low-attendance/export-csv', (req, res) => {
  const { query, course, semester, section, startDate, endDate } = req.query;

  let filtered = [...students];
  if (course && course !== 'All') filtered = filtered.filter(s => s.course === course);
  if (section && section !== 'All') filtered = filtered.filter(s => s.section === section);
  if (semester && semester !== 'All') {
    const sem = Number(semester);
    if (!isNaN(sem)) filtered = filtered.filter(s => s.semester === sem);
  }
  if (query) {
    const q = String(query).toLowerCase().trim();
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.rollNo.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  }

  const rows: string[] = [
    'Roll Number,Student Name,Email,Course,Semester,Section,Total Classes Recorded,Present Count,Absent Count,Attendance Percentage,Status'
  ];

  filtered.forEach(student => {
    let studentLogs = attendanceRecords.filter(a =>
      a.studentId === student.id || a.rollNo.toUpperCase() === student.rollNo.toUpperCase()
    );

    if (startDate) studentLogs = studentLogs.filter(a => a.date >= String(startDate));
    if (endDate) studentLogs = studentLogs.filter(a => a.date <= String(endDate));

    const totalSessions = studentLogs.length;
    if (totalSessions === 0) {
      rows.push(`"${student.rollNo}","${student.name}","${student.email}","${student.course}","Sem ${student.semester || 1}","${student.section}",0,0,0,"N/A","Attendance Not Available"`);
      return;
    }

    const presentCount = studentLogs.filter(l => l.status === 'Present').length;
    const absentCount = totalSessions - presentCount;
    const rawPct = (presentCount / totalSessions) * 100;
    const percentage = Number(rawPct.toFixed(2));

    if (percentage < 75.0) {
      rows.push(`"${student.rollNo}","${student.name}","${student.email}","${student.course}","Sem ${student.semester || 1}","${student.section}",${totalSessions},${presentCount},${absentCount},"${percentage.toFixed(1)}%","Low Attendance"`);
    }
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="low_attendance_students_below_75pct.csv"');
  return res.status(200).send(rows.join('\r\n'));
});

// Send Academic Attendance Warning Notice to Student(s)
app.post('/api/reports/low-attendance/send-warning', (req, res) => {
  const { studentIds, message } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: 'Please select at least one student to issue a warning notice.' });
  }

  const dispatched: AttendanceAlertRecord[] = [];
  const defaultNotice = 'Official Notice: Your academic attendance is below the mandatory 75% institutional threshold. Please contact your academic advisor immediately.';

  studentIds.forEach(id => {
    const student = students.find(s => s.id === id || s.rollNo.toUpperCase() === String(id).toUpperCase());
    if (student) {
      const logs = attendanceRecords.filter(a => a.studentId === student.id || a.rollNo.toUpperCase() === student.rollNo.toUpperCase());
      const pres = logs.filter(l => l.status === 'Present').length;
      const pct = logs.length > 0 ? Number(((pres / logs.length) * 100).toFixed(1)) : 0;

      const record: AttendanceAlertRecord = {
        id: 'alt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        studentId: student.id,
        rollNo: student.rollNo,
        studentName: student.name,
        email: student.email,
        course: student.course,
        section: student.section,
        percentage: pct,
        message: message ? String(message).trim() : defaultNotice,
        sentAt: new Date().toISOString()
      };

      sentWarnings.unshift(record);
      dispatched.push(record);
    }
  });

  return res.json({
    message: `Academic warning notification sent to ${dispatched.length} student(s) successfully.`,
    count: dispatched.length,
    notices: dispatched
  });
});

// View dispatched warnings
app.get('/api/reports/low-attendance/warnings', (req, res) => {
  return res.json({ warnings: sentWarnings });
});

// 2. Authentication
app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please enter your email/roll number and password.' });
  }

  const cleanId = String(identifier).trim().toLowerCase();
  
  // Admin Check
  if (cleanId === 'admin' || cleanId === 'admin@campusdesk.edu') {
    if (password === 'admin123' || password === 'admin') {
      return res.json({
        user: {
          role: 'Admin',
          name: 'Dr. Arvind Kumar',
          email: 'admin@campusdesk.edu',
          designation: 'Dean of Academic Affairs & Systems'
        }
      });
    } else {
      return res.status(401).json({ error: 'Invalid password. Try "admin123"' });
    }
  }

  // Student Check
  const student = students.find(s => 
    s.rollNo.toLowerCase() === cleanId || 
    s.email.toLowerCase() === cleanId
  );

  if (student) {
    if (password === 'student123' || password === 'student' || password === student.rollNo.toLowerCase()) {
      return res.json({
        user: {
          role: 'Student',
          id: student.id,
          name: student.name,
          rollNo: student.rollNo,
          email: student.email,
          course: student.course,
          section: student.section,
          semester: '5th Semester'
        }
      });
    } else {
      return res.status(401).json({ error: 'Invalid password. Try "student123"' });
    }
  }

  return res.status(401).json({ error: 'Account not found with this identifier.' });
});

// 3. Students API
app.get('/api/students', (req, res) => {
  const { query, course, section, semester } = req.query;
  let results = [...students];

  if (course && course !== 'All') {
    results = results.filter(s => s.course === course);
  }
  if (section && section !== 'All') {
    results = results.filter(s => s.section === section);
  }
  if (semester && semester !== 'All') {
    const semNum = Number(semester);
    if (!isNaN(semNum)) {
      results = results.filter(s => s.semester === semNum);
    }
  }
  if (query) {
    const q = String(query).toLowerCase().trim();
    results = results.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.rollNo.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  }

  return res.json({ students: results });
});

app.post('/api/students', (req, res) => {
  const { name, rollNo, email, course, semester, section } = req.body;

  if (!name || !rollNo || !email || !course || !section) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const cleanRoll = rollNo.trim().toUpperCase();
  const cleanEmail = email.trim().toLowerCase();

  // Duplicate checks
  const existingRoll = students.find(s => s.rollNo.toUpperCase() === cleanRoll);
  if (existingRoll) {
    return res.status(409).json({ error: `A student with roll number ${cleanRoll} already exists.` });
  }

  const existingEmail = students.find(s => s.email.toLowerCase() === cleanEmail);
  if (existingEmail) {
    return res.status(409).json({ error: `A student with email ${cleanEmail} already exists.` });
  }

  const semVal = Number(semester) || 1;

  const newStudent: StudentRecord = {
    id: 'std-' + Date.now(),
    name: name.trim(),
    rollNo: cleanRoll,
    email: cleanEmail,
    course,
    semester: semVal,
    section,
    createdAt: new Date().toISOString().split('T')[0]
  };

  students.push(newStudent);
  return res.status(201).json({ message: 'Student record saved successfully', student: newStudent });
});

app.post('/api/students/bulk', (req, res) => {
  const { students: incomingList } = req.body;

  if (!Array.isArray(incomingList) || incomingList.length === 0) {
    return res.status(400).json({ error: 'No student records provided for bulk creation.' });
  }

  const errors: { row: number; rollNo?: string; field?: string; message: string }[] = [];
  const seenRolls = new Set<string>();
  const seenEmails = new Set<string>();
  const validCourses = ['B.Tech', 'M.Tech', 'BCA', 'BBA'];
  const validSections = ['A', 'B', 'C', 'D'];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const sanitizedRecords: StudentRecord[] = [];

  incomingList.forEach((item, idx) => {
    const rowNum = idx + 1;
    const name = item.name ? String(item.name).trim() : '';
    const rollNo = item.rollNo ? String(item.rollNo).trim().toUpperCase() : '';
    const email = item.email ? String(item.email).trim().toLowerCase() : '';
    const course = item.course ? String(item.course).trim() : '';
    const section = item.section ? String(item.section).trim().toUpperCase() : '';

    if (!name) {
      errors.push({ row: rowNum, rollNo, field: 'name', message: `Row ${rowNum}: Student Name is missing.` });
    }
    if (!rollNo) {
      errors.push({ row: rowNum, rollNo, field: 'rollNo', message: `Row ${rowNum}: Roll Number is missing.` });
    } else {
      // Check duplicate within batch
      if (seenRolls.has(rollNo)) {
        errors.push({ row: rowNum, rollNo, field: 'rollNo', message: `Row ${rowNum}: Duplicate roll number ${rollNo} in uploaded batch.` });
      } else {
        seenRolls.add(rollNo);
      }

      // Check duplicate against existing database
      const existingInDb = students.find(s => s.rollNo.toUpperCase() === rollNo);
      if (existingInDb) {
        errors.push({ row: rowNum, rollNo, field: 'rollNo', message: `Row ${rowNum}: Roll number ${rollNo} already exists in database (${existingInDb.name}).` });
      }
    }

    if (!email) {
      errors.push({ row: rowNum, rollNo, field: 'email', message: `Row ${rowNum}: Email is missing.` });
    } else if (!emailRegex.test(email)) {
      errors.push({ row: rowNum, rollNo, field: 'email', message: `Row ${rowNum}: Invalid email format (${email}).` });
    } else {
      if (seenEmails.has(email)) {
        errors.push({ row: rowNum, rollNo, field: 'email', message: `Row ${rowNum}: Duplicate email ${email} in batch.` });
      } else {
        seenEmails.add(email);
      }

      const existingEmail = students.find(s => s.email.toLowerCase() === email);
      if (existingEmail) {
        errors.push({ row: rowNum, rollNo, field: 'email', message: `Row ${rowNum}: Email ${email} already belongs to ${existingEmail.name} in database.` });
      }
    }

    if (!course || !validCourses.includes(course)) {
      errors.push({ row: rowNum, rollNo, field: 'course', message: `Row ${rowNum}: Invalid course "${course}". Must be B.Tech, M.Tech, BCA, or BBA.` });
    }

    if (!section || !validSections.includes(section)) {
      errors.push({ row: rowNum, rollNo, field: 'section', message: `Row ${rowNum}: Invalid section "${section}". Must be A, B, C, or D.` });
    }

    if (name && rollNo && email && validCourses.includes(course) && validSections.includes(section)) {
      sanitizedRecords.push({
        id: 'std-' + (Date.now() + idx),
        name,
        rollNo,
        email,
        course: course as 'B.Tech' | 'M.Tech' | 'BCA' | 'BBA',
        semester: Number(item.semester) || 1,
        section: section as 'A' | 'B' | 'C' | 'D',
        createdAt: new Date().toISOString().split('T')[0]
      });
    }
  });

  // Transactional constraint: If ANY row is invalid, roll back and reject all records
  if (errors.length > 0) {
    return res.status(422).json({
      error: `Bulk registration aborted: ${errors.length} validation error(s) found across ${incomingList.length} rows. No records were committed to the database.`,
      errors,
      totalSubmitted: incomingList.length,
      invalidCount: errors.length
    });
  }

  // Commit all sanitized records atomically
  students.push(...sanitizedRecords);

  return res.status(201).json({
    message: `${sanitizedRecords.length} student records saved successfully`,
    count: sanitizedRecords.length,
    students: sanitizedRecords
  });
});

app.get('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const student = students.find(s => s.id === id || s.rollNo.toUpperCase() === id.toUpperCase());
  if (!student) {
    return res.status(404).json({ error: 'Student record not found.' });
  }
  return res.json({ student });
});

app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const { name, rollNo, email, course, semester, section } = req.body;

  const student = students.find(s => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Student record not found. Unable to update nonexistent ID.' });
  }

  if (!name || !rollNo || !email || !course || !section) {
    return res.status(400).json({ error: 'Student Name, Roll Number, Email, Course, and Section are all required.' });
  }

  const cleanName = String(name).trim();
  const cleanRoll = String(rollNo).trim().toUpperCase();
  const cleanEmail = String(email).trim().toLowerCase();
  const validCourses = ['B.Tech', 'M.Tech', 'BCA', 'BBA'];
  const validSections = ['A', 'B', 'C', 'D'];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (cleanName.length < 2) {
    return res.status(400).json({ error: 'Student Name must be at least 2 characters long.' });
  }

  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: `Invalid email address format: "${cleanEmail}".` });
  }

  if (!validCourses.includes(course)) {
    return res.status(400).json({ error: `Invalid course selection. Must be one of: ${validCourses.join(', ')}.` });
  }

  if (!validSections.includes(section)) {
    return res.status(400).json({ error: `Invalid section selection. Must be one of: ${validSections.join(', ')}.` });
  }

  // Course specific semester bounds
  const semNum = Number(semester) || 1;
  const maxSemesters: Record<string, number> = {
    'B.Tech': 8,
    'M.Tech': 4,
    'BCA': 6,
    'BBA': 6
  };
  const maxAllowed = maxSemesters[course] || 8;
  if (semNum < 1 || semNum > maxAllowed) {
    return res.status(400).json({
      error: `Invalid semester ${semNum} for ${course}. Allowed semester range for ${course} is Semester 1 to ${maxAllowed}.`
    });
  }

  // Ensure roll number uniqueness excluding current student's record
  const conflictRoll = students.find(s => s.id !== id && s.rollNo.toUpperCase() === cleanRoll);
  if (conflictRoll) {
    return res.status(409).json({
      error: `Roll Number "${cleanRoll}" is already assigned to student "${conflictRoll.name}". Duplicate roll numbers are prohibited.`
    });
  }

  // Ensure email uniqueness excluding current student's record
  const conflictEmail = students.find(s => s.id !== id && s.email.toLowerCase() === cleanEmail);
  if (conflictEmail) {
    return res.status(409).json({
      error: `Email address "${cleanEmail}" is already registered to student "${conflictEmail.name}".`
    });
  }

  const oldRollNo = student.rollNo;

  // Update existing student record in place
  student.name = cleanName;
  student.rollNo = cleanRoll;
  student.email = cleanEmail;
  student.course = course;
  student.semester = semNum;
  student.section = section;

  // Preserve relational integrity for attendance logs
  attendanceRecords.forEach(att => {
    if (att.studentId === student.id || att.rollNo.toUpperCase() === oldRollNo.toUpperCase()) {
      att.rollNo = cleanRoll;
      att.studentName = cleanName;
      att.course = course;
      att.section = section;
    }
  });

  return res.json({
    message: 'Student record updated successfully.',
    student
  });
});

app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const index = students.findIndex(s => s.id === id || s.rollNo.toUpperCase() === id.toUpperCase());

  if (index === -1) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  const deletedStudent = students.splice(index, 1)[0];
  // Also clean up or flag attendance records
  attendanceRecords = attendanceRecords.filter(a => a.studentId !== deletedStudent.id && a.rollNo !== deletedStudent.rollNo);

  return res.json({ message: 'Student data deleted successfully', deletedStudent });
});

// 4. Attendance API
app.get('/api/attendance', (req, res) => {
  const { course, section, date } = req.query;
  const targetDate = date ? String(date) : new Date().toISOString().split('T')[0];

  // Get matching students
  let matchedStudents = students;
  if (course && course !== 'All') {
    matchedStudents = matchedStudents.filter(s => s.course === course);
  }
  if (section && section !== 'All') {
    matchedStudents = matchedStudents.filter(s => s.section === section);
  }

  // Get existing attendance logs for this date
  const existingForDate = attendanceRecords.filter(a => 
    a.date === targetDate && 
    (!course || course === 'All' || a.course === course) &&
    (!section || section === 'All' || a.section === section)
  );

  // Map each student to an attendance status
  const records = matchedStudents.map(student => {
    const existing = existingForDate.find(e => e.studentId === student.id || e.rollNo === student.rollNo);
    return {
      studentId: student.id,
      rollNo: student.rollNo,
      studentName: student.name,
      course: student.course,
      section: student.section,
      date: targetDate,
      status: existing ? existing.status : 'Present', // default to Present for convenience
      isSaved: Boolean(existing)
    };
  });

  return res.json({
    course,
    section,
    date: targetDate,
    records
  });
});

app.post('/api/attendance', (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'No attendance records provided to save.' });
  }

  for (const item of records) {
    const { studentId, rollNo, studentName, course, section, date, status } = item;
    const existingIndex = attendanceRecords.findIndex(a => 
      (a.studentId === studentId || a.rollNo === rollNo) && a.date === date
    );

    if (existingIndex >= 0) {
      attendanceRecords[existingIndex].status = status;
      attendanceRecords[existingIndex].markedAt = new Date().toISOString();
    } else {
      attendanceRecords.push({
        id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        studentId,
        rollNo,
        studentName,
        course,
        section,
        date,
        status: status || 'Present',
        markedAt: new Date().toISOString()
      });
    }
  }

  return res.json({ message: 'Attendance records saved successfully', count: records.length });
});

// Student attendance history & stats
app.get('/api/attendance/student/:rollNo', (req, res) => {
  const { rollNo } = req.params;
  const student = students.find(s => s.rollNo.toUpperCase() === rollNo.toUpperCase());

  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const logs = attendanceRecords
    .filter(a => a.rollNo.toUpperCase() === rollNo.toUpperCase())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalClasses = logs.length;
  const presentCount = logs.filter(l => l.status === 'Present').length;
  const absentCount = logs.filter(l => l.status === 'Absent').length;
  const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = logs.find(l => l.date === today);

  return res.json({
    student,
    stats: {
      totalClasses,
      presentCount,
      absentCount,
      percentage,
      todayStatus: todayEntry ? todayEntry.status : 'Not Marked'
    },
    history: logs
  });
});

// 5. Assignments API
app.get('/api/assignments', (req, res) => {
  const { course, section } = req.query;
  let list = [...assignments];

  if (course && course !== 'All') {
    list = list.filter(a => a.course === course);
  }
  if (section && section !== 'All') {
    list = list.filter(a => a.section === section);
  }

  return res.json({ assignments: list });
});

app.post('/api/assignments', (req, res) => {
  const { title, course, section, description, fileName, fileSize, fileType, fileData } = req.body;

  if (!title || !course || !section || !fileName) {
    return res.status(400).json({ error: 'Title, course, section, and file attachment are required.' });
  }

  const newAssignment: AssignmentRecord = {
    id: 'asg-' + Date.now(),
    title: title.trim(),
    course,
    section,
    description: (description || '').trim(),
    fileName,
    fileSize: fileSize || 256000,
    fileType: fileType || 'application/pdf',
    fileData: fileData || '',
    uploadedAt: new Date().toISOString()
  };

  assignments.unshift(newAssignment);
  return res.status(201).json({ message: 'Assignment saved successfully', assignment: newAssignment });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
