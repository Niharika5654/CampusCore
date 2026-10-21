import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CampusService, DashboardStats } from '../../../services/campus';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="space-y-8">
      <!-- Page Heading & Context -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Academic Overview</h2>
          <p class="text-sm text-neutral-400 mt-1">
            Real-time enrollment, active curricula assignments, and institutional attendance metrics.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <a
            routerLink="/admin/add-student"
            class="btn-primary-white px-4 py-2.5 text-xs font-semibold"
          >
            <mat-icon class="text-sm">add</mat-icon>
            <span>Register Student</span>
          </a>
          <a
            routerLink="/admin/attendance"
            class="btn-secondary-charcoal px-4 py-2.5 text-xs font-medium"
          >
            <mat-icon class="text-sm">event_available</mat-icon>
            <span>Take Attendance</span>
          </a>
        </div>
      </div>

      <!-- Summary KPI Metrics (Clay Cards) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Metric 1: Total Students -->
        <div class="clay-card p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs uppercase tracking-wider font-semibold text-neutral-400">Total Enrolled</span>
            <div class="w-8 h-8 rounded-lg bg-[#202020] border border-[#333333] flex items-center justify-center">
              <mat-icon class="text-neutral-300 text-base">groups</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
              {{ stats()?.totalStudents ?? 0 }}
            </span>
            <span class="text-xs text-neutral-400">Students</span>
          </div>
          <p class="text-[11px] text-neutral-400 mt-2">Across B.Tech, M.Tech, BCA, BBA</p>
        </div>

        <!-- Metric 2: Attendance Records -->
        <div class="clay-card p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs uppercase tracking-wider font-semibold text-neutral-400">Attendance Logs</span>
            <div class="w-8 h-8 rounded-lg bg-[#202020] border border-[#333333] flex items-center justify-center">
              <mat-icon class="text-neutral-300 text-base">check_circle_outline</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
              {{ stats()?.totalAttendance ?? 0 }}
            </span>
            <span class="text-xs text-neutral-400">Recorded sessions</span>
          </div>
          <p class="text-[11px] text-neutral-400 mt-2">Verified roll call database</p>
        </div>

        <!-- Metric 3: Active Assignments -->
        <div class="clay-card p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs uppercase tracking-wider font-semibold text-neutral-400">Course Work</span>
            <div class="w-8 h-8 rounded-lg bg-[#202020] border border-[#333333] flex items-center justify-center">
              <mat-icon class="text-neutral-300 text-base">description</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
              {{ stats()?.totalAssignments ?? 0 }}
            </span>
            <span class="text-xs text-neutral-400">Assignments</span>
          </div>
          <p class="text-[11px] text-neutral-400 mt-2">Curriculum tasks with attachments</p>
        </div>

        <!-- Metric 4: Today Attendance Rate -->
        <div class="clay-card p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs uppercase tracking-wider font-semibold text-neutral-400">Attendance Index</span>
            <div class="w-8 h-8 rounded-lg bg-[#202020] border border-[#333333] flex items-center justify-center">
              <mat-icon class="text-emerald-400 text-base">insights</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
              {{ stats()?.todayRate ?? 92 }}%
            </span>
            <span class="text-xs text-emerald-400 font-medium">Daily Presence</span>
          </div>
          <p class="text-[11px] text-neutral-400 mt-2">Institution-wide participation</p>
        </div>
      </div>

      <!-- Dashboard Summary Card: Low Attendance Students (Below 75%) -->
      <div class="clay-elevated p-6 border border-red-950/70 bg-[#140b0b] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-red-950/90 border border-red-800/60 flex items-center justify-center shrink-0">
            <mat-icon class="text-red-400 text-2xl">warning_amber</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2.5">
              <h3 class="text-base font-bold text-white tracking-tight">Low Attendance Students Summary</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950 text-red-300 border border-red-800">
                Strictly &lt; 75%
              </span>
            </div>
            <p class="text-xs text-neutral-400 mt-1 max-w-xl">
              Identifies all students whose attendance is strictly below 75% based on actual database session logs.
              Students with exactly 75.0% are compliant.
            </p>

            <div class="flex flex-wrap items-center gap-6 mt-4">
              <div>
                <span class="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold block">Total Below 75%</span>
                <span class="text-2xl font-bold font-mono text-red-400 tabular-nums">
                  {{ stats()?.lowAttendanceCount ?? 0 }} Students
                </span>
              </div>
              <div class="h-8 w-px bg-[#333333] hidden sm:block"></div>
              <div>
                <span class="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold block">Overall Attendance Percentage</span>
                <span class="text-2xl font-bold font-mono text-white tabular-nums">
                  {{ stats()?.overallAverageAttendance ?? 85 }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="shrink-0 flex items-center">
          <a
            routerLink="/admin/low-attendance"
            class="btn-primary-white py-2.5 px-5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md hover:bg-neutral-200 transition-colors"
          >
            <mat-icon class="text-sm">visibility</mat-icon>
            <span>View Low Attendance Students</span>
          </a>
        </div>
      </div>

      <!-- Section: 4 Distinguishable Feature Cards -->
      <div>
        <div class="mb-4">
          <h3 class="text-lg font-bold text-white tracking-tight">Core System Modules</h3>
          <p class="text-xs text-neutral-400">Direct navigation to active administrative operations</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- 1. Add Student -->
          <a
            routerLink="/admin/add-student"
            class="clay-card clay-interactive p-6 flex flex-col justify-between group cursor-pointer block border border-[#333333] hover:border-white/40"
          >
            <div>
              <div class="w-12 h-12 rounded-xl bg-[#202020] border border-[#383838] flex items-center justify-center mb-5 group-hover:bg-[#282828] transition-colors">
                <mat-icon class="text-white text-xl">person_add</mat-icon>
              </div>
              <h4 class="text-base font-bold text-white mb-1.5 group-hover:text-white transition-colors">1. Add Student</h4>
              <p class="text-xs text-neutral-400 leading-relaxed">
                Single registration & transactional bulk import (multiple manual rows or CSV spreadsheet).
              </p>
            </div>
            <div class="mt-6 pt-4 border-t border-[#252525] flex items-center justify-between text-xs font-semibold text-neutral-300">
              <span>Open Single & Bulk Registry</span>
              <mat-icon class="text-xs group-hover:translate-x-1 transition-transform">arrow_forward</mat-icon>
            </div>
          </a>

          <!-- 2. Attendance -->
          <a
            routerLink="/admin/attendance"
            class="clay-card clay-interactive p-6 flex flex-col justify-between group cursor-pointer block border border-[#333333] hover:border-white/40"
          >
            <div>
              <div class="w-12 h-12 rounded-xl bg-[#202020] border border-[#383838] flex items-center justify-center mb-5 group-hover:bg-[#282828] transition-colors">
                <mat-icon class="text-white text-xl">fact_check</mat-icon>
              </div>
              <h4 class="text-base font-bold text-white mb-1.5 group-hover:text-white transition-colors">2. Attendance</h4>
              <p class="text-xs text-neutral-400 leading-relaxed">
                Filter by course & section, mark present/absent roll calls, and commit daily records.
              </p>
            </div>
            <div class="mt-6 pt-4 border-t border-[#252525] flex items-center justify-between text-xs font-semibold text-neutral-300">
              <span>Launch Attendance Roll</span>
              <mat-icon class="text-xs group-hover:translate-x-1 transition-transform">arrow_forward</mat-icon>
            </div>
          </a>

          <!-- 3. Assignment -->
          <a
            routerLink="/admin/assignment"
            class="clay-card clay-interactive p-6 flex flex-col justify-between group cursor-pointer block border border-[#333333] hover:border-white/40"
          >
            <div>
              <div class="w-12 h-12 rounded-xl bg-[#202020] border border-[#383838] flex items-center justify-center mb-5 group-hover:bg-[#282828] transition-colors">
                <mat-icon class="text-white text-xl">assignment</mat-icon>
              </div>
              <h4 class="text-base font-bold text-white mb-1.5 group-hover:text-white transition-colors">3. Assignment</h4>
              <p class="text-xs text-neutral-400 leading-relaxed">
                Publish lab tasks, problem sets, and course syllabus files (PDF, PNG, JPG) with metadata.
              </p>
            </div>
            <div class="mt-6 pt-4 border-t border-[#252525] flex items-center justify-between text-xs font-semibold text-neutral-300">
              <span>Upload Coursework</span>
              <mat-icon class="text-xs group-hover:translate-x-1 transition-transform">arrow_forward</mat-icon>
            </div>
          </a>

          <!-- 4. Delete Student Record -->
          <a
            routerLink="/admin/delete-student"
            class="clay-card clay-interactive p-6 flex flex-col justify-between group cursor-pointer block border border-[#333333] hover:border-red-900/50"
          >
            <div>
              <div class="w-12 h-12 rounded-xl bg-[#202020] border border-[#383838] flex items-center justify-center mb-5 group-hover:bg-[#282828] transition-colors">
                <mat-icon class="text-white text-xl">manage_accounts</mat-icon>
              </div>
              <h4 class="text-base font-bold text-white mb-1.5 group-hover:text-white transition-colors">4. Manage & Edit Students</h4>
              <p class="text-xs text-neutral-400 leading-relaxed">
                Searchable directory to view profiles, edit academic fields (course, semester, section), or safely purge records.
              </p>
            </div>
            <div class="mt-6 pt-4 border-t border-[#252525] flex items-center justify-between text-xs font-semibold text-neutral-300">
              <span>Manage & Edit Records</span>
              <mat-icon class="text-xs group-hover:translate-x-1 transition-transform">arrow_forward</mat-icon>
            </div>
          </a>
        </div>
      </div>

      <!-- Recent Enrollments Database Table -->
      <div class="clay-card p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="text-base font-bold text-white tracking-tight">Recent Student Enrollments</h3>
            <p class="text-xs text-neutral-400">Latest students registered in the academic database</p>
          </div>
          <a
            routerLink="/admin/delete-student"
            class="btn-secondary-charcoal py-1.5 px-3 text-xs"
          >
            <span>View All Students</span>
            <mat-icon class="text-xs">chevron_right</mat-icon>
          </a>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="border-b border-[#2a2a2a] text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                <th class="py-3 px-4">Roll Number</th>
                <th class="py-3 px-4">Student Name</th>
                <th class="py-3 px-4">Email</th>
                <th class="py-3 px-4">Course</th>
                <th class="py-3 px-4">Section</th>
                <th class="py-3 px-4">Enrolled Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#202020]">
              @for (student of stats()?.recentStudents ?? []; track student.id) {
                <tr class="hover:bg-[#202020]/50 transition-colors">
                  <td class="py-3.5 px-4 font-mono font-medium text-white tabular-nums">{{ student.rollNo }}</td>
                  <td class="py-3.5 px-4 font-medium text-neutral-200">{{ student.name }}</td>
                  <td class="py-3.5 px-4 text-neutral-400 text-xs">{{ student.email }}</td>
                  <td class="py-3.5 px-4 text-xs font-medium text-white">{{ student.course }}</td>
                  <td class="py-3.5 px-4 font-mono text-xs text-neutral-300">Sec {{ student.section }}</td>
                  <td class="py-3.5 px-4 text-xs text-neutral-500 font-mono">{{ student.createdAt }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-8 text-center text-xs text-neutral-500">
                    No recent student records found.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private campus = inject(CampusService);
  stats = signal<DashboardStats | null>(null);

  ngOnInit() {
    this.campus.getDashboardStats().subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error(err)
    });
  }
}
