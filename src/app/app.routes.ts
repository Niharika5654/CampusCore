import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginPage),
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-layout').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard/dashboard').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'add-student',
        loadComponent: () => import('./pages/admin/add-student/add-student').then(m => m.AddStudentComponent),
      },
      {
        path: 'attendance',
        loadComponent: () => import('./pages/admin/attendance/attendance').then(m => m.AttendanceComponent),
      },
      {
        path: 'assignment',
        loadComponent: () => import('./pages/admin/assignment/assignment').then(m => m.AssignmentComponent),
      },
      {
        path: 'delete-student',
        loadComponent: () => import('./pages/admin/delete-student/delete-student').then(m => m.DeleteStudentComponent),
      },
      {
        path: 'manage-students',
        loadComponent: () => import('./pages/admin/delete-student/delete-student').then(m => m.DeleteStudentComponent),
      },
      {
        path: 'low-attendance',
        loadComponent: () => import('./pages/admin/low-attendance/low-attendance').then(m => m.LowAttendanceComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'student/portal',
    loadComponent: () => import('./pages/student/student-portal').then(m => m.StudentPortalComponent),
  },
  {
    path: 'student',
    redirectTo: 'student/portal',
    pathMatch: 'full',
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
