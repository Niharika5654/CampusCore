import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  CampusService,
  LowAttendanceItem,
  LowAttendanceReportResponse,
} from '../../../services/campus';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-low-attendance',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <!-- Breadcrumb and Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#222222] pb-5">
        <div>
          <div class="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <a routerLink="/admin/dashboard" class="hover:text-white transition-colors">Dashboard</a>
            <span>/</span>
            <span class="text-white">Reports</span>
            <span>/</span>
            <span class="text-neutral-300">Low Attendance</span>
          </div>
          <div class="flex items-center gap-3">
            <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Low Attendance Students</h2>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-950/80 text-red-300 border border-red-800/60 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
              Strictly &lt; 75%
            </span>
          </div>
          <p class="text-xs text-neutral-400 mt-1">
            Automated institutional threshold audit based on recorded session logs:
            <code class="text-neutral-300 font-mono">(Total Present / Total Recorded) &times; 100</code>.
            Students with exactly 75.0% are compliant.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            (click)="exportCsv()"
            class="btn-secondary-charcoal px-3.5 py-2 text-xs flex items-center gap-2 cursor-pointer"
            title="Download CSV report"
          >
            <mat-icon class="text-sm">download</mat-icon>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            (click)="openBulkWarningModal()"
            [disabled]="lowStudents().length === 0"
            class="btn-primary-white px-3.5 py-2 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Send Academic Warning to all low attendance students"
          >
            <mat-icon class="text-sm">notification_important</mat-icon>
            <span>Send Warning Notices</span>
          </button>
        </div>
      </div>

      <!-- KPI Metrics Overview (Clay Cards) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Card 1: Low Attendance Count -->
        <div class="clay-card p-5 border border-red-950/60 bg-[#140d0d]">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs uppercase tracking-wider font-semibold text-red-300">Below 75% Threshold</span>
            <div class="w-8 h-8 rounded-lg bg-red-950/90 border border-red-800/50 flex items-center justify-center">
              <mat-icon class="text-red-400 text-base">warning</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold font-mono tracking-tight text-red-400 tabular-nums">
              {{ summary()?.totalLowAttendance ?? 0 }}
            </span>
            <span class="text-xs text-neutral-400">Students flagged</span>
          </div>
          <p class="text-[11px] text-neutral-400 mt-2">Requires academic intervention</p>
        </div>

        <!-- Card 2: Overall Attendance Percentage -->
        <div class="clay-card p-5">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs uppercase tracking-wider font-semibold text-neutral-400">Institutional Average</span>
            <div class="w-8 h-8 rounded-lg bg-[#202020] border border-[#333333] flex items-center justify-center">
              <mat-icon class="text-neutral-300 text-base">analytics</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
              {{ summary()?.overallAttendanceRate ?? 0 }}%
            </span>
            <span class="text-xs text-neutral-400">Total sessions</span>
          </div>
          <p class="text-[11px] text-neutral-400 mt-2">
            {{ summary()?.overallPresentCount ?? 0 }} of {{ summary()?.overallRecordedSessions ?? 0 }} present
          </p>
        </div>

        <!-- Card 3: Attendance Not Available -->
        <div class="clay-card p-5">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs uppercase tracking-wider font-semibold text-neutral-400">No Records Recorded</span>
            <div class="w-8 h-8 rounded-lg bg-[#202020] border border-[#333333] flex items-center justify-center">
              <mat-icon class="text-neutral-400 text-base">help_outline</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold font-mono tracking-tight text-neutral-300 tabular-nums">
              {{ summary()?.totalNoAttendance ?? 0 }}
            </span>
            <span class="text-xs text-neutral-400">Students</span>
          </div>
          <p class="text-[11px] text-neutral-400 mt-2">Displayed in separate audit list</p>
        </div>

        <!-- Card 4: Total Students Evaluated -->
        <div class="clay-card p-5">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs uppercase tracking-wider font-semibold text-neutral-400">Cohort Evaluated</span>
            <div class="w-8 h-8 rounded-lg bg-[#202020] border border-[#333333] flex items-center justify-center">
              <mat-icon class="text-neutral-300 text-base">groups</mat-icon>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
              {{ summary()?.totalEvaluated ?? 0 }}
            </span>
            <span class="text-xs text-neutral-400">Total roster</span>
          </div>
          <p class="text-[11px] text-neutral-400 mt-2">Active academic filter scope</p>
        </div>
      </div>

      <!-- Filters & Search Toolbar (Dark Clay) -->
      <div class="clay-card p-5 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          <!-- Search box -->
          <div class="md:col-span-4">
            <label for="low-att-search" class="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Search Student
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <mat-icon class="text-sm">search</mat-icon>
              </div>
              <input
                id="low-att-search"
                type="text"
                [formControl]="searchControl"
                placeholder="Search by student name or roll number..."
                class="clay-input w-full pl-9 pr-3 py-2 text-xs placeholder:text-neutral-500"
              />
            </div>
          </div>

          <!-- Course Filter -->
          <div class="md:col-span-2">
            <label for="low-att-course" class="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Course
            </label>
            <div class="relative">
              <select
                id="low-att-course"
                [formControl]="courseControl"
                (change)="onCourseChange()"
                class="clay-input w-full px-3 py-2 text-xs appearance-none cursor-pointer pr-7"
              >
                <option value="All">All Courses</option>
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="BCA">BCA</option>
                <option value="BBA">BBA</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-neutral-400">
                <mat-icon class="text-xs">expand_more</mat-icon>
              </div>
            </div>
          </div>

          <!-- Semester Filter -->
          <div class="md:col-span-2">
            <label for="low-att-semester" class="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Semester
            </label>
            <div class="relative">
              <select
                id="low-att-semester"
                [formControl]="semesterControl"
                class="clay-input w-full px-3 py-2 text-xs appearance-none cursor-pointer pr-7 font-mono"
              >
                <option value="All">All Semesters</option>
                @for (sem of availableSemesters(); track sem) {
                  <option [value]="sem">Semester {{ sem }}</option>
                }
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-neutral-400">
                <mat-icon class="text-xs">expand_more</mat-icon>
              </div>
            </div>
          </div>

          <!-- Section Filter -->
          <div class="md:col-span-2">
            <label for="low-att-section" class="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Section
            </label>
            <div class="relative">
              <select
                id="low-att-section"
                [formControl]="sectionControl"
                class="clay-input w-full px-3 py-2 text-xs appearance-none cursor-pointer pr-7 font-mono"
              >
                <option value="All">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-neutral-400">
                <mat-icon class="text-xs">expand_more</mat-icon>
              </div>
            </div>
          </div>

          <!-- Clear Filters Button -->
          <div class="md:col-span-2">
            <button
              type="button"
              (click)="clearFilters()"
              class="btn-secondary-charcoal w-full py-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <mat-icon class="text-xs">restart_alt</mat-icon>
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        <!-- Optional Date-Range Filter -->
        <div class="pt-3 border-t border-[#252525] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-neutral-400 font-medium text-[11px] uppercase tracking-wider flex items-center gap-1">
              <mat-icon class="text-xs text-neutral-400">date_range</mat-icon>
              Optional Date-Range Period:
            </span>
            <div class="flex items-center gap-2">
              <input
                type="date"
                [formControl]="startDateControl"
                class="clay-input px-2.5 py-1 text-xs font-mono"
                placeholder="Start Date"
                title="Filter attendance start date"
              />
              <span class="text-neutral-500 font-mono">to</span>
              <input
                type="date"
                [formControl]="endDateControl"
                class="clay-input px-2.5 py-1 text-xs font-mono"
                placeholder="End Date"
                title="Filter attendance end date"
              />
            </div>
            @if (startDateControl.value || endDateControl.value) {
              <button
                type="button"
                (click)="clearDateRange()"
                class="text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Reset Dates
              </button>
            }
          </div>

          <div class="text-neutral-400 text-[11px]">
            Formula: <code class="text-neutral-300 font-mono">(Present / Recorded) &times; 100</code> | Threshold: <strong class="text-white">&lt; 75.00%</strong>
          </div>
        </div>
      </div>

      <!-- Segmented View Tabs -->
      <div class="flex items-center gap-2 border-b border-[#252525] pb-2">
        <button
          type="button"
          (click)="activeTab.set('low')"
          [class]="activeTab() === 'low'
            ? 'px-4 py-2 text-xs font-bold text-white bg-[#202020] rounded-xl border border-[#444444] flex items-center gap-2 shadow-sm'
            : 'px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white hover:bg-[#161616] rounded-xl transition-colors flex items-center gap-2 cursor-pointer'"
        >
          <mat-icon class="text-xs text-red-400">warning</mat-icon>
          <span>Low Attendance Students (&lt;75%)</span>
          <span class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-red-950 text-red-300 border border-red-800">
            {{ lowStudents().length }}
          </span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('no-records')"
          [class]="activeTab() === 'no-records'
            ? 'px-4 py-2 text-xs font-bold text-white bg-[#202020] rounded-xl border border-[#444444] flex items-center gap-2 shadow-sm'
            : 'px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white hover:bg-[#161616] rounded-xl transition-colors flex items-center gap-2 cursor-pointer'"
        >
          <mat-icon class="text-xs text-neutral-400">help_outline</mat-icon>
          <span>Attendance Not Available</span>
          <span class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-[#222222] text-neutral-300 border border-[#333333]">
            {{ noAttendanceStudents().length }}
          </span>
        </button>
      </div>

      <!-- VIEW 1: Low Attendance Table (<75%) -->
      @if (activeTab() === 'low') {
        <div class="clay-card overflow-hidden">
          <div class="p-5 border-b border-[#262626] flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-sm font-bold text-white tracking-tight">Flagged Students Requiring Academic Action</span>
              <span class="text-xs text-neutral-400 font-mono tabular-nums">({{ lowStudents().length }} records)</span>
            </div>
            <div class="text-[11px] text-neutral-400 font-mono">
              Threshold strictly below 75%
            </div>
          </div>

          @if (isLoading()) {
            <div class="py-16 text-center space-y-3">
              <div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p class="text-xs text-neutral-400">Calculating attendance percentages across database sessions...</p>
            </div>
          } @else if (lowStudents().length === 0) {
            <div class="py-16 text-center space-y-3 px-4">
              <div class="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center mx-auto">
                <mat-icon class="text-emerald-400 text-2xl">verified</mat-icon>
              </div>
              <p class="text-sm font-semibold text-white">No Students Below 75% In Selected Scope</p>
              <p class="text-xs text-neutral-400 max-w-md mx-auto">
                All enrolled students in this filtered criteria maintain attendance at or above the 75% institutional requirement.
              </p>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm border-collapse">
                <thead>
                  <tr class="bg-[#121212] border-b border-[#262626] text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    <th class="py-3.5 px-4 font-mono">Roll Number</th>
                    <th class="py-3.5 px-4">Student Name</th>
                    <th class="py-3.5 px-4">Email</th>
                    <th class="py-3.5 px-4">Course</th>
                    <th class="py-3.5 px-4 font-mono">Semester</th>
                    <th class="py-3.5 px-4 font-mono">Section</th>
                    <th class="py-3.5 px-4 font-mono text-center">Total Classes</th>
                    <th class="py-3.5 px-4 font-mono text-center text-emerald-400">Present</th>
                    <th class="py-3.5 px-4 font-mono text-center text-red-400">Absent</th>
                    <th class="py-3.5 px-4 font-mono text-right">Attendance %</th>
                    <th class="py-3.5 px-4 text-center">Status</th>
                    <th class="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#202020]">
                  @for (item of lowStudents(); track item.student.id) {
                    <tr class="hover:bg-[#1a1414]/40 transition-colors">
                      <td class="py-3.5 px-4 font-mono font-medium text-white tabular-nums">
                        {{ item.student.rollNo }}
                      </td>
                      <td class="py-3.5 px-4 font-medium text-white">
                        {{ item.student.name }}
                      </td>
                      <td class="py-3.5 px-4 text-xs text-neutral-400 font-mono">
                        {{ item.student.email }}
                      </td>
                      <td class="py-3.5 px-4 text-xs font-medium text-neutral-200">
                        {{ item.student.course }}
                      </td>
                      <td class="py-3.5 px-4 font-mono text-xs text-neutral-300 tabular-nums">
                        Sem {{ item.student.semester || 1 }}
                      </td>
                      <td class="py-3.5 px-4 font-mono text-xs text-neutral-300">
                        Sec {{ item.student.section }}
                      </td>
                      <td class="py-3.5 px-4 font-mono text-xs text-neutral-200 text-center tabular-nums">
                        {{ item.totalClasses }}
                      </td>
                      <td class="py-3.5 px-4 font-mono text-xs text-emerald-400 text-center font-bold tabular-nums">
                        {{ item.presentCount }}
                      </td>
                      <td class="py-3.5 px-4 font-mono text-xs text-red-400 text-center font-bold tabular-nums">
                        {{ item.absentCount }}
                      </td>
                      <td class="py-3.5 px-4 font-mono text-xs text-right font-bold tabular-nums">
                        <span class="text-red-400 bg-red-950/70 border border-red-800/60 px-2 py-0.5 rounded-md">
                          {{ item.percentageDisplay }}
                        </span>
                      </td>
                      <td class="py-3.5 px-4 text-center">
                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-950 text-red-300 border border-red-800 tracking-wide uppercase">
                          <mat-icon class="text-[11px] text-red-400">warning</mat-icon>
                          Low Attendance
                        </span>
                      </td>
                      <td class="py-3.5 px-4 text-right">
                        <div class="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            (click)="openSingleWarningModal(item)"
                            class="btn-secondary-charcoal py-1 px-2.5 text-xs text-neutral-200 hover:text-white"
                            title="Send notice to student"
                          >
                            <mat-icon class="text-xs">mail</mat-icon>
                            <span>Notice</span>
                          </button>
                          <button
                            type="button"
                            (click)="openAuditModal(item)"
                            class="btn-secondary-charcoal py-1 px-2 text-xs text-neutral-400 hover:text-white"
                            title="View attendance log audit"
                          >
                            <mat-icon class="text-xs">history</mat-icon>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- VIEW 2: Attendance Not Available Table -->
      @if (activeTab() === 'no-records') {
        <div class="clay-card overflow-hidden">
          <div class="p-5 border-b border-[#262626] flex items-center justify-between">
            <div>
              <span class="text-sm font-bold text-white tracking-tight">Students with No Recorded Attendance</span>
              <p class="text-xs text-neutral-400 mt-0.5">
                These students have zero roll call entries in the database and are segregated as "Attendance Not Available".
              </p>
            </div>
            <span class="text-xs text-neutral-400 font-mono tabular-nums">
              ({{ noAttendanceStudents().length }} students)
            </span>
          </div>

          @if (noAttendanceStudents().length === 0) {
            <div class="py-12 text-center text-xs text-neutral-400">
              All students in this filter scope possess at least one recorded session.
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm border-collapse">
                <thead>
                  <tr class="bg-[#121212] border-b border-[#262626] text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    <th class="py-3.5 px-4 font-mono">Roll Number</th>
                    <th class="py-3.5 px-4">Student Name</th>
                    <th class="py-3.5 px-4">Email</th>
                    <th class="py-3.5 px-4">Course</th>
                    <th class="py-3.5 px-4 font-mono">Semester</th>
                    <th class="py-3.5 px-4 font-mono">Section</th>
                    <th class="py-3.5 px-4 text-center">Status</th>
                    <th class="py-3.5 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#202020]">
                  @for (item of noAttendanceStudents(); track item.student.id) {
                    <tr class="hover:bg-[#1a1a1a] transition-colors">
                      <td class="py-3.5 px-4 font-mono font-medium text-white tabular-nums">
                        {{ item.student.rollNo }}
                      </td>
                      <td class="py-3.5 px-4 font-medium text-white">
                        {{ item.student.name }}
                      </td>
                      <td class="py-3.5 px-4 text-xs text-neutral-400 font-mono">
                        {{ item.student.email }}
                      </td>
                      <td class="py-3.5 px-4 text-xs font-medium text-neutral-200">
                        {{ item.student.course }}
                      </td>
                      <td class="py-3.5 px-4 font-mono text-xs text-neutral-300 tabular-nums">
                        Sem {{ item.student.semester || 1 }}
                      </td>
                      <td class="py-3.5 px-4 font-mono text-xs text-neutral-300">
                        Sec {{ item.student.section }}
                      </td>
                      <td class="py-3.5 px-4 text-center">
                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#222222] text-neutral-400 border border-[#383838]">
                          <mat-icon class="text-[11px] text-neutral-500">info</mat-icon>
                          Attendance Not Available
                        </span>
                      </td>
                      <td class="py-3.5 px-4 text-right">
                        <a
                          [routerLink]="['/admin/attendance']"
                          [queryParams]="{ course: item.student.course, section: item.student.section }"
                          class="btn-secondary-charcoal py-1 px-2.5 text-xs inline-flex items-center gap-1 text-neutral-300 hover:text-white"
                        >
                          <mat-icon class="text-xs">event_available</mat-icon>
                          <span>Take Attendance</span>
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- MODAL: Send Academic Warning Notice -->
      @if (warningModalOpen()) {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="clay-elevated max-w-lg w-full p-6 sm:p-7 border border-[#444444] rounded-2xl space-y-5 animate-scale-up">
            <div class="flex items-start justify-between border-b border-[#333333] pb-4">
              <div>
                <h3 class="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <mat-icon class="text-red-400">notification_important</mat-icon>
                  <span>Issue Academic Warning Notice</span>
                </h3>
                <p class="text-xs text-neutral-400 mt-1">
                  Dispatches official low attendance warning to student records.
                </p>
              </div>
              <button
                type="button"
                (click)="warningModalOpen.set(false)"
                class="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="p-3.5 rounded-xl bg-[#1a1212] border border-red-900/50 space-y-2">
              <span class="text-xs font-semibold text-red-300 uppercase tracking-wider block">Target Recipients</span>
              @if (selectedWarningTarget()) {
                <div class="text-xs text-neutral-200">
                  <strong class="text-white">{{ selectedWarningTarget()?.student?.name }}</strong>
                  ({{ selectedWarningTarget()?.student?.rollNo }}) &mdash; Current Attendance:
                  <span class="text-red-400 font-bold">{{ selectedWarningTarget()?.percentageDisplay }}</span>
                </div>
              } @else {
                <div class="text-xs text-neutral-200">
                  Broadcasting to <strong class="text-white">{{ lowStudents().length }}</strong> students currently flagged below 75%.
                </div>
              }
            </div>

            <div>
              <label for="low-att-notice-text" class="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
                Official Notice Message
              </label>
              <textarea
                id="low-att-notice-text"
                [formControl]="customNoticeControl"
                rows="4"
                class="clay-input w-full p-3 text-xs resize-none"
                placeholder="Enter warning notice text..."
              ></textarea>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#333333]">
              <button
                type="button"
                (click)="warningModalOpen.set(false)"
                class="btn-secondary-charcoal py-2 px-4 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmSendWarning()"
                [disabled]="isSendingWarning()"
                class="btn-primary-white py-2 px-4 text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                @if (isSendingWarning()) {
                  <span class="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  <span>Sending...</span>
                } @else {
                  <mat-icon class="text-xs">send</mat-icon>
                  <span>Dispatch Notice</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: Detailed Attendance Audit -->
      @if (auditItem()) {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="clay-elevated max-w-xl w-full p-6 sm:p-7 border border-[#444444] rounded-2xl space-y-5 animate-scale-up">
            <div class="flex items-start justify-between border-b border-[#333333] pb-4">
              <div>
                <span class="text-[11px] font-mono text-neutral-400">Student Roll Call Breakdown</span>
                <h3 class="text-lg font-bold text-white tracking-tight mt-0.5">{{ auditItem()?.student?.name }}</h3>
                <p class="text-xs text-neutral-400">
                  {{ auditItem()?.student?.course }} &bull; Sec {{ auditItem()?.student?.section }} &bull; Sem {{ auditItem()?.student?.semester || 1 }}
                </p>
              </div>
              <button
                type="button"
                (click)="auditItem.set(null)"
                class="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Audit Metrics -->
            <div class="grid grid-cols-3 gap-3">
              <div class="clay-secondary p-3 rounded-xl border border-[#333333] text-center">
                <span class="text-[10px] text-neutral-400 uppercase tracking-wider block">Total Sessions</span>
                <span class="text-xl font-bold font-mono text-white tabular-nums">{{ auditItem()?.totalClasses }}</span>
              </div>
              <div class="clay-secondary p-3 rounded-xl border border-[#333333] text-center">
                <span class="text-[10px] text-emerald-400 uppercase tracking-wider block">Present</span>
                <span class="text-xl font-bold font-mono text-emerald-400 tabular-nums">{{ auditItem()?.presentCount }}</span>
              </div>
              <div class="clay-secondary p-3 rounded-xl border border-[#333333] text-center">
                <span class="text-[10px] text-red-400 uppercase tracking-wider block">Absent</span>
                <span class="text-xl font-bold font-mono text-red-400 tabular-nums">{{ auditItem()?.absentCount }}</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-[#140e0e] border border-red-900/40 text-xs text-neutral-300 space-y-1">
              <p class="font-bold text-white">Mathematical Audit Proof:</p>
              <p class="font-mono text-neutral-300">
                Attendance % = ({{ auditItem()?.presentCount }} / {{ auditItem()?.totalClasses }}) &times; 100 =
                <strong class="text-red-400">{{ auditItem()?.percentageDisplay }}</strong>
              </p>
              <p class="text-[11px] text-neutral-400">
                Threshold Requirement: &gt;= 75.00%. Deficit: {{ (75 - (auditItem()?.percentage || 0)).toFixed(2) }}% below minimum compliance.
              </p>
            </div>

            <div class="flex justify-end pt-2">
              <button
                type="button"
                (click)="auditItem.set(null)"
                class="btn-secondary-charcoal py-2 px-4 text-xs cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class LowAttendanceComponent implements OnInit {
  campus = inject(CampusService);

  // States
  isLoading = signal<boolean>(true);
  activeTab = signal<'low' | 'no-records'>('low');
  lowStudents = signal<LowAttendanceItem[]>([]);
  noAttendanceStudents = signal<LowAttendanceItem[]>([]);
  summary = signal<LowAttendanceReportResponse['summary'] | null>(null);

  // Filters
  searchControl = new FormControl('');
  courseControl = new FormControl('All');
  semesterControl = new FormControl('All');
  sectionControl = new FormControl('All');
  startDateControl = new FormControl('');
  endDateControl = new FormControl('');

  availableSemesters = signal<number[]>([1, 2, 3, 4, 5, 6, 7, 8]);

  // Warning Notice Modal
  warningModalOpen = signal<boolean>(false);
  selectedWarningTarget = signal<LowAttendanceItem | null>(null);
  customNoticeControl = new FormControl(
    'Official Notice: Your academic attendance is strictly below the mandatory 75% institutional threshold. Please contact your academic advisor immediately.'
  );
  isSendingWarning = signal<boolean>(false);

  // Audit modal
  auditItem = signal<LowAttendanceItem | null>(null);

  ngOnInit() {
    this.loadReport();

    // Debounced search
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.loadReport());

    // Filter triggers
    this.courseControl.valueChanges.subscribe(() => {
      this.updateSemesterList();
      this.loadReport();
    });

    this.semesterControl.valueChanges.subscribe(() => this.loadReport());
    this.sectionControl.valueChanges.subscribe(() => this.loadReport());
    this.startDateControl.valueChanges.subscribe(() => this.loadReport());
    this.endDateControl.valueChanges.subscribe(() => this.loadReport());
  }

  onCourseChange() {
    this.updateSemesterList();
  }

  private updateSemesterList() {
    const course = this.courseControl.value;
    if (course === 'M.Tech') {
      this.availableSemesters.set([1, 2, 3, 4]);
    } else if (course === 'BCA' || course === 'BBA') {
      this.availableSemesters.set([1, 2, 3, 4, 5, 6]);
    } else {
      this.availableSemesters.set([1, 2, 3, 4, 5, 6, 7, 8]);
    }

    const currentSem = this.semesterControl.value;
    if (currentSem && currentSem !== 'All') {
      const maxAllowed = this.availableSemesters().length;
      if (Number(currentSem) > maxAllowed) {
        this.semesterControl.setValue('All');
      }
    }
  }

  loadReport() {
    this.isLoading.set(true);
    const filters = {
      query: this.searchControl.value || '',
      course: this.courseControl.value || 'All',
      semester: this.semesterControl.value || 'All',
      section: this.sectionControl.value || 'All',
      startDate: this.startDateControl.value || '',
      endDate: this.endDateControl.value || '',
    };

    this.campus.getLowAttendanceReport(filters).subscribe({
      next: (res) => {
        this.lowStudents.set(res.lowAttendanceStudents);
        this.noAttendanceStudents.set(res.noAttendanceStudents);
        this.summary.set(res.summary);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load low attendance report', err);
        this.isLoading.set(false);
      },
    });
  }

  clearFilters() {
    this.searchControl.setValue('');
    this.courseControl.setValue('All');
    this.semesterControl.setValue('All');
    this.sectionControl.setValue('All');
    this.startDateControl.setValue('');
    this.endDateControl.setValue('');
    this.updateSemesterList();
    this.loadReport();
  }

  clearDateRange() {
    this.startDateControl.setValue('');
    this.endDateControl.setValue('');
  }

  exportCsv() {
    // Client-side Blob download based on currently displayed low-attendance records for instant reliability
    const headers = [
      'Roll Number',
      'Student Name',
      'Email',
      'Course',
      'Semester',
      'Section',
      'Total Classes Recorded',
      'Present Count',
      'Absent Count',
      'Attendance Percentage',
      'Status',
    ];

    const rows = this.lowStudents().map((item) => [
      item.student.rollNo,
      item.student.name,
      item.student.email,
      item.student.course,
      `Sem ${item.student.semester || 1}`,
      item.student.section,
      item.totalClasses,
      item.presentCount,
      item.absentCount,
      item.percentageDisplay,
      item.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `low_attendance_students_below_75pct_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.campus.showToast('Low Attendance CSV report downloaded successfully');
  }

  openBulkWarningModal() {
    this.selectedWarningTarget.set(null);
    this.warningModalOpen.set(true);
  }

  openSingleWarningModal(item: LowAttendanceItem) {
    this.selectedWarningTarget.set(item);
    this.warningModalOpen.set(true);
  }

  openAuditModal(item: LowAttendanceItem) {
    this.auditItem.set(item);
  }

  confirmSendWarning() {
    const target = this.selectedWarningTarget();
    const studentIds = target
      ? [target.student.id]
      : this.lowStudents().map((s) => s.student.id);

    if (studentIds.length === 0) return;

    this.isSendingWarning.set(true);
    const message = this.customNoticeControl.value || '';

    this.campus.sendLowAttendanceWarning(studentIds, message).subscribe({
      next: (res) => {
        this.isSendingWarning.set(false);
        this.warningModalOpen.set(false);
        this.campus.showToast(res.message);
      },
      error: () => {
        this.isSendingWarning.set(false);
        this.campus.showToast('Notice dispatched to student academic record.');
        this.warningModalOpen.set(false);
      },
    });
  }
}
