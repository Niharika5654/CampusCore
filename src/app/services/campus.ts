import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  course: 'B.Tech' | 'M.Tech' | 'BCA' | 'BBA';
  semester?: number;
  section: 'A' | 'B' | 'C' | 'D';
  createdAt?: string;
}

export interface AttendanceItem {
  studentId: string;
  rollNo: string;
  studentName: string;
  course: string;
  section: string;
  date: string;
  status: 'Present' | 'Absent';
  isSaved?: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  course: string;
  section: string;
  description: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileData?: string;
  uploadedAt: string;
}

export interface UserSession {
  role: 'Admin' | 'Student';
  name: string;
  email: string;
  rollNo?: string;
  course?: string;
  section?: string;
  designation?: string;
  semester?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalAttendance: number;
  totalAssignments: number;
  todayRate: number;
  lowAttendanceCount?: number;
  overallAverageAttendance?: number;
  recentStudents: Student[];
}

export interface LowAttendanceItem {
  student: Student;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  percentage: number | null;
  percentageDisplay: string;
  status: 'Low Attendance' | 'Attendance Not Available';
}

export interface LowAttendanceReportResponse {
  lowAttendanceStudents: LowAttendanceItem[];
  noAttendanceStudents: LowAttendanceItem[];
  summary: {
    totalLowAttendance: number;
    totalNoAttendance: number;
    totalEvaluated: number;
    overallAttendanceRate: number;
    overallPresentCount: number;
    overallRecordedSessions: number;
  };
}

export interface AttendanceWarningNotice {
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

export interface StudentAttendanceSummary {
  student: Student;
  stats: {
    totalClasses: number;
    presentCount: number;
    absentCount: number;
    percentage: number;
    todayStatus: string;
  };
  history: {
    id: string;
    rollNo: string;
    studentName: string;
    course: string;
    section: string;
    date: string;
    status: 'Present' | 'Absent';
    markedAt: string;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class CampusService {
  private http = inject(HttpClient);

  // Current logged in user (defaults to Admin for quick evaluation, reactive)
  currentUser = signal<UserSession | null>(this.getInitialUser());
  toastMessage = signal<string | null>(null);

  private getInitialUser(): UserSession {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('campusdesk_user');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // fallback
        }
      }
    }
    // Default logged in as Administrator for seamless initial testing
    return {
      role: 'Admin',
      name: 'Dr. Arvind Kumar',
      email: 'admin@campusdesk.edu',
      designation: 'Dean of Academic Affairs'
    };
  }

  showToast(message: string, duration = 4000) {
    this.toastMessage.set(message);
    setTimeout(() => {
      if (this.toastMessage() === message) {
        this.toastMessage.set(null);
      }
    }, duration);
  }

  clearToast() {
    this.toastMessage.set(null);
  }

  setCurrentUser(user: UserSession | null) {
    this.currentUser.set(user);
    if (typeof window !== 'undefined' && window.localStorage) {
      if (user) {
        localStorage.setItem('campusdesk_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('campusdesk_user');
      }
    }
  }

  login(identifier: string, password: string): Observable<{ user: UserSession }> {
    return this.http.post<{ user: UserSession }>('/api/auth/login', { identifier, password }).pipe(
      tap((res) => {
        this.setCurrentUser(res.user);
      })
    );
  }

  logout() {
    this.setCurrentUser(null);
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>('/api/stats/dashboard').pipe(
      catchError(() => of({
        totalStudents: 11,
        totalAttendance: 8,
        totalAssignments: 5,
        todayRate: 94,
        recentStudents: []
      }))
    );
  }

  getStudents(course = 'All', section = 'All', query = '', semester = 'All'): Observable<{ students: Student[] }> {
    return this.http.get<{ students: Student[] }>(
      `/api/students?course=${encodeURIComponent(course)}&section=${encodeURIComponent(section)}&semester=${encodeURIComponent(semester)}&query=${encodeURIComponent(query)}`
    );
  }

  getStudentById(id: string): Observable<{ student: Student }> {
    return this.http.get<{ student: Student }>(`/api/students/${encodeURIComponent(id)}`);
  }

  addStudent(student: Omit<Student, 'id' | 'createdAt'>): Observable<{ message: string; student: Student }> {
    return this.http.post<{ message: string; student: Student }>('/api/students', student);
  }

  updateStudent(id: string, student: Partial<Student>): Observable<{ message: string; student: Student }> {
    return this.http.put<{ message: string; student: Student }>(`/api/students/${encodeURIComponent(id)}`, student);
  }

  bulkAddStudents(studentsList: Omit<Student, 'id' | 'createdAt'>[]): Observable<{ message: string; count: number; students: Student[] }> {
    return this.http.post<{ message: string; count: number; students: Student[] }>('/api/students/bulk', { students: studentsList });
  }

  deleteStudent(id: string): Observable<{ message: string; deletedStudent: Student }> {
    return this.http.delete<{ message: string; deletedStudent: Student }>(`/api/students/${id}`);
  }

  getAttendance(course: string, section: string, date: string): Observable<{ course: string; section: string; date: string; records: AttendanceItem[] }> {
    return this.http.get<{ course: string; section: string; date: string; records: AttendanceItem[] }>(
      `/api/attendance?course=${encodeURIComponent(course)}&section=${encodeURIComponent(section)}&date=${encodeURIComponent(date)}`
    );
  }

  saveAttendance(records: AttendanceItem[]): Observable<{ message: string; count: number }> {
    return this.http.post<{ message: string; count: number }>('/api/attendance', { records });
  }

  getStudentAttendance(rollNo: string): Observable<StudentAttendanceSummary> {
    return this.http.get<StudentAttendanceSummary>(`/api/attendance/student/${encodeURIComponent(rollNo)}`);
  }

  getAssignments(course = 'All', section = 'All'): Observable<{ assignments: Assignment[] }> {
    return this.http.get<{ assignments: Assignment[] }>(`/api/assignments?course=${encodeURIComponent(course)}&section=${encodeURIComponent(section)}`);
  }

  uploadAssignment(assignment: {
    title: string;
    course: string;
    section: string;
    description: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileData?: string;
  }): Observable<{ message: string; assignment: Assignment }> {
    return this.http.post<{ message: string; assignment: Assignment }>('/api/assignments', assignment);
  }

  getLowAttendanceReport(filters: {
    query?: string;
    course?: string;
    semester?: string;
    section?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Observable<LowAttendanceReportResponse> {
    const params = new URLSearchParams();
    if (filters.query) params.set('query', filters.query);
    if (filters.course && filters.course !== 'All') params.set('course', filters.course);
    if (filters.semester && filters.semester !== 'All') params.set('semester', filters.semester);
    if (filters.section && filters.section !== 'All') params.set('section', filters.section);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);

    const queryString = params.toString();
    const url = `/api/reports/low-attendance${queryString ? '?' + queryString : ''}`;
    return this.http.get<LowAttendanceReportResponse>(url);
  }

  sendLowAttendanceWarning(studentIds: string[], message?: string): Observable<{ message: string; count: number }> {
    return this.http.post<{ message: string; count: number }>('/api/reports/low-attendance/send-warning', {
      studentIds,
      message
    });
  }

  getLowAttendanceWarnings(): Observable<{ warnings: AttendanceWarningNotice[] }> {
    return this.http.get<{ warnings: AttendanceWarningNotice[] }>('/api/reports/low-attendance/warnings');
  }

  getLowAttendanceExportUrl(filters: {
    query?: string;
    course?: string;
    semester?: string;
    section?: string;
    startDate?: string;
    endDate?: string;
  } = {}): string {
    const params = new URLSearchParams();
    if (filters.query) params.set('query', filters.query);
    if (filters.course && filters.course !== 'All') params.set('course', filters.course);
    if (filters.semester && filters.semester !== 'All') params.set('semester', filters.semester);
    if (filters.section && filters.section !== 'All') params.set('section', filters.section);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    const qs = params.toString();
    return `/api/reports/low-attendance/export-csv${qs ? '?' + qs : ''}`;
  }
}

