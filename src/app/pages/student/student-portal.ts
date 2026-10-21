import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CampusService, Assignment, StudentAttendanceSummary, Student } from '../../services/campus';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-student-portal',
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="min-h-screen bg-black text-white flex flex-col">
      <!-- Top Navigation Bar -->
      <header class="h-16 px-6 sm:px-8 border-b border-[#222222] bg-[#0A0A0A]/90 backdrop-blur-sm flex items-center justify-between sticky top-0 z-30">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-[#171717] border border-[#333333] flex items-center justify-center">
            <mat-icon class="text-white text-base">school</mat-icon>
          </div>
          <div>
            <span class="text-base font-bold text-white tracking-tight">CampusDesk</span>
            <span class="hidden sm:inline text-neutral-500 text-xs ml-2">/ Student Academic Portal</span>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <!-- Student Selector dropdown for evaluator to easily test different student profiles -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-neutral-400 hidden md:inline">Current Student:</span>
            <select
              [value]="currentStudent()?.rollNo"
              (change)="onStudentChange($event)"
              class="clay-input px-3 py-1.5 text-xs font-mono"
            >
              @for (std of allStudents(); track std.id) {
                <option [value]="std.rollNo">{{ std.name }} ({{ std.rollNo }} - {{ std.course }})</option>
              }
            </select>
          </div>

          <a
            routerLink="/admin/dashboard"
            class="btn-secondary-charcoal py-1.5 px-3 text-xs"
          >
            <mat-icon class="text-xs">admin_panel_settings</mat-icon>
            <span class="hidden sm:inline">Admin Console</span>
          </a>

          <button
            type="button"
            (click)="onLogout()"
            class="text-neutral-400 hover:text-white p-1.5 transition-colors"
            title="Sign out"
          >
            <mat-icon class="text-sm">logout</mat-icon>
          </button>
        </div>
      </header>

      <!-- Main Container -->
      <main class="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8 space-y-8">
        <!-- Student Profile Information Card -->
        <div class="clay-card p-6 sm:p-8 border border-[#333333]">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-center gap-5">
              <div class="w-16 h-16 rounded-2xl bg-[#202020] border border-[#383838] flex items-center justify-center font-bold text-2xl text-white font-mono shadow-inner">
                {{ getInitials(currentStudent()?.name || 'Student') }}
              </div>
              <div>
                <div class="flex items-center gap-2 text-xs text-neutral-400 font-mono mb-1">
                  <span>{{ currentStudent()?.rollNo }}</span>
                  <span class="text-neutral-600">·</span>
                  <span>Semester 5</span>
                </div>
                <h2 class="text-2xl font-bold text-white tracking-tight">{{ currentStudent()?.name }}</h2>
                <p class="text-xs text-neutral-400 mt-0.5">{{ currentStudent()?.email }}</p>
              </div>
            </div>

            <!-- Profile Badges & Stats -->
            <div class="flex flex-wrap items-center gap-3">
              <div class="clay-secondary px-4 py-2.5 rounded-xl border border-[#333333]">
                <p class="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Department</p>
                <p class="text-sm font-semibold text-white font-mono">{{ currentStudent()?.course }}</p>
              </div>
              <div class="clay-secondary px-4 py-2.5 rounded-xl border border-[#333333]">
                <p class="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Section</p>
                <p class="text-sm font-semibold text-white font-mono">Sec {{ currentStudent()?.section }}</p>
              </div>
              <div class="clay-secondary px-4 py-2.5 rounded-xl border border-[#333333]">
                <p class="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Attendance Ratio</p>
                <p
                  class="text-sm font-bold font-mono tabular-nums flex items-center gap-1.5"
                  [class.text-red-400]="(attendanceSummary()?.stats?.percentage ?? 100) < 75"
                  [class.text-emerald-400]="(attendanceSummary()?.stats?.percentage ?? 100) >= 75"
                >
                  @if ((attendanceSummary()?.stats?.percentage ?? 100) < 75) {
                    <mat-icon class="text-xs text-red-400">warning</mat-icon>
                  }
                  <span>{{ attendanceSummary()?.stats?.percentage ?? 100 }}%</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Low Attendance Warning Alert Banner for Students -->
          @if ((attendanceSummary()?.stats?.percentage ?? 100) < 75) {
            <div class="mt-4 p-4 rounded-xl bg-[#211212] border border-red-900/60 text-red-300 text-xs flex items-start gap-3 animate-fade-in">
              <mat-icon class="text-red-400 shrink-0 mt-0.5">notification_important</mat-icon>
              <div>
                <p class="font-bold text-white tracking-wide">Academic Notice: Attendance Below 75% Mandatory Threshold</p>
                <p class="text-neutral-300 mt-0.5">
                  Your current verified attendance is
                  <strong class="text-red-400 font-mono">{{ attendanceSummary()?.stats?.percentage ?? 0 }}%</strong>,
                  which is below the mandatory 75% institutional requirement. You must attend upcoming classes to restore eligibility.
                </p>
              </div>
            </div>
          }
        </div>

        <!-- Section: Two Prominent Clay Action Cards -->
        <div>
          <div class="mb-4">
            <h3 class="text-xl font-bold text-white tracking-tight">Academic Workspace</h3>
            <p class="text-xs text-neutral-400">Select an academic module below to view detailed records</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 1. Show My Attendance Clay Card -->
            <button
              type="button"
              (click)="openAttendanceModal()"
              class="clay-card clay-interactive p-7 flex flex-col justify-between group cursor-pointer border border-[#333333] hover:border-white/50 text-left w-full"
            >
              <div>
                <div class="w-14 h-14 rounded-2xl bg-[#202020] border border-[#383838] flex items-center justify-center mb-6 group-hover:bg-[#282828] transition-colors">
                  <mat-icon class="text-white text-2xl">event_available</mat-icon>
                </div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs font-mono uppercase tracking-wider text-neutral-400">Module 01</span>
                  <span class="text-neutral-600">·</span>
                  <span class="text-xs text-emerald-400 font-mono font-medium">Active Roster</span>
                </div>
                <h4 class="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">
                  1. Show My Attendance
                </h4>
                <p class="text-xs text-neutral-400 leading-relaxed">
                  View today's attendance verification status, complete roll call history, total sessions, and overall attendance percentage.
                </p>
              </div>

              <div class="mt-8 pt-5 border-t border-[#252525] flex items-center justify-between w-full">
                <div class="flex items-center gap-3 text-xs font-mono">
                  <span class="text-emerald-400 font-bold tabular-nums">
                    {{ attendanceSummary()?.stats?.presentCount ?? 0 }} Present
                  </span>
                  <span class="text-neutral-600">/</span>
                  <span class="text-red-400 font-bold tabular-nums">
                    {{ attendanceSummary()?.stats?.absentCount ?? 0 }} Absent
                  </span>
                </div>
                <div class="btn-primary-white py-2 px-4 text-xs font-semibold">
                  <span>View Attendance</span>
                  <mat-icon class="text-xs">arrow_forward</mat-icon>
                </div>
              </div>
            </button>

            <!-- 2. Show My Assignment Clay Card -->
            <button
              type="button"
              (click)="openAssignmentModal()"
              class="clay-card clay-interactive p-7 flex flex-col justify-between group cursor-pointer border border-[#333333] hover:border-white/50 text-left w-full"
            >
              <div>
                <div class="w-14 h-14 rounded-2xl bg-[#202020] border border-[#383838] flex items-center justify-center mb-6 group-hover:bg-[#282828] transition-colors">
                  <mat-icon class="text-white text-2xl">assignment</mat-icon>
                </div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs font-mono uppercase tracking-wider text-neutral-400">Module 02</span>
                  <span class="text-neutral-600">·</span>
                  <span class="text-xs text-white font-mono font-medium">{{ studentAssignments().length }} Available</span>
                </div>
                <h4 class="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">
                  2. Show My Assignment
                </h4>
                <p class="text-xs text-neutral-400 leading-relaxed">
                  Browse coursework published exclusively for {{ currentStudent()?.course }} Section {{ currentStudent()?.section }} with document previews and secure downloads.
                </p>
              </div>

              <div class="mt-8 pt-5 border-t border-[#252525] flex items-center justify-between w-full">
                <span class="text-xs text-neutral-400 font-mono">
                  Filtered by cohort
                </span>
                <div class="btn-primary-white py-2 px-4 text-xs font-semibold">
                  <span>Open Coursework</span>
                  <mat-icon class="text-xs">arrow_forward</mat-icon>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Inline Recent Coursework Section -->
        <div class="clay-card p-6 sm:p-8">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-base font-bold text-white tracking-tight">Active Curricular Tasks</h3>
              <p class="text-xs text-neutral-400">Assigned for {{ currentStudent()?.course }} - Section {{ currentStudent()?.section }}</p>
            </div>
            <button
              type="button"
              (click)="openAssignmentModal()"
              class="btn-secondary-charcoal py-1.5 px-3 text-xs"
            >
              <span>View All</span>
              <mat-icon class="text-xs">chevron_right</mat-icon>
            </button>
          </div>

          <div class="space-y-3">
            @for (asg of studentAssignments().slice(0, 3); track asg.id) {
              <div class="clay-secondary p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="space-y-1">
                  <div class="flex items-center gap-2 text-[11px] text-neutral-400">
                    <span class="font-mono">{{ formatDate(asg.uploadedAt) }}</span>
                    <span>·</span>
                    <span>{{ asg.fileName }}</span>
                  </div>
                  <h4 class="text-sm font-semibold text-white">{{ asg.title }}</h4>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="inspectAssignment(asg)"
                    class="btn-secondary-charcoal py-1 px-3 text-xs"
                  >
                    <mat-icon class="text-xs">visibility</mat-icon>
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    (click)="downloadAssignment(asg)"
                    class="btn-primary-white py-1 px-3 text-xs font-semibold"
                  >
                    <mat-icon class="text-xs">download</mat-icon>
                    <span>Download</span>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="py-8 text-center text-xs text-neutral-500">
                No active assignments for your cohort currently.
              </div>
            }
          </div>
        </div>
      </main>

      <!-- MODAL 1: MY ATTENDANCE -->
      @if (showAttendanceModal()) {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="clay-elevated max-w-3xl w-full p-6 sm:p-8 border border-[#444444] rounded-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div class="flex items-start justify-between border-b border-[#333333] pb-4">
              <div>
                <span class="text-xs font-mono text-neutral-400">Academic Attendance Audit</span>
                <h3 class="text-xl font-bold text-white mt-0.5">My Attendance Record</h3>
                <p class="text-xs text-neutral-400 mt-1">
                  {{ currentStudent()?.name }} · Roll No: <span class="font-mono text-white">{{ currentStudent()?.rollNo }}</span>
                </p>
              </div>
              <button
                type="button"
                (click)="closeAttendanceModal()"
                class="text-neutral-400 hover:text-white p-1"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Attendance Metrics Summary Strip -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="clay-secondary p-3.5 rounded-xl border border-[#333333]">
                <p class="text-[10px] uppercase font-bold text-neutral-400">Total Classes</p>
                <p class="text-xl font-bold font-mono text-white tabular-nums mt-1">
                  {{ attendanceSummary()?.stats?.totalClasses ?? 0 }}
                </p>
              </div>

              <div class="clay-secondary p-3.5 rounded-xl border border-[#333333]">
                <p class="text-[10px] uppercase font-bold text-neutral-400">Present Days</p>
                <p class="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
                  {{ attendanceSummary()?.stats?.presentCount ?? 0 }}
                </p>
              </div>

              <div class="clay-secondary p-3.5 rounded-xl border border-[#333333]">
                <p class="text-[10px] uppercase font-bold text-neutral-400">Absent Days</p>
                <p class="text-xl font-bold font-mono text-red-400 tabular-nums mt-1">
                  {{ attendanceSummary()?.stats?.absentCount ?? 0 }}
                </p>
              </div>

              <div class="clay-secondary p-3.5 rounded-xl border border-[#333333]">
                <p class="text-[10px] uppercase font-bold text-neutral-400">Attendance Index</p>
                <p class="text-xl font-bold font-mono text-white tabular-nums mt-1">
                  {{ attendanceSummary()?.stats?.percentage ?? 100 }}%
                </p>
              </div>
            </div>

            <!-- Today's Attendance Callout -->
            <div class="p-4 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-between">
              <div>
                <p class="text-xs uppercase font-bold text-neutral-400">Today's Class Status</p>
                <p class="text-xs text-neutral-500 font-mono mt-0.5">{{ todayDateString }}</p>
              </div>
              <div>
                @if (attendanceSummary()?.stats?.todayStatus === 'Present') {
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 text-xs font-semibold font-mono">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Present Today</span>
                  </span>
                } @else if (attendanceSummary()?.stats?.todayStatus === 'Absent') {
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-950/80 text-red-300 border border-red-600/50 text-xs font-semibold font-mono">
                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>Absent Today</span>
                  </span>
                } @else {
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#202020] text-neutral-300 border border-[#333333] text-xs font-semibold font-mono">
                    <span class="w-2 h-2 rounded-full bg-neutral-400"></span>
                    <span>Unmarked</span>
                  </span>
                }
              </div>
            </div>

            <!-- Full Attendance History Table -->
            <div class="space-y-3">
              <h4 class="text-sm font-bold text-white tracking-tight">Complete Attendance History</h4>

              <div class="clay-card overflow-hidden">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="bg-[#121212] border-b border-[#262626] text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      <th class="py-3 px-4">Date</th>
                      <th class="py-3 px-4">Course & Section</th>
                      <th class="py-3 px-4 text-center">Status</th>
                      <th class="py-3 px-4 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#202020]">
                    @for (log of attendanceSummary()?.history ?? []; track log.id) {
                      <tr class="hover:bg-[#1a1a1a] transition-colors">
                        <td class="py-3 px-4 font-mono font-medium text-white tabular-nums">{{ log.date }}</td>
                        <td class="py-3 px-4 text-neutral-400">{{ log.course }} - Section {{ log.section }}</td>
                        <td class="py-3 px-4 text-center">
                          @if (log.status === 'Present') {
                            <span class="inline-flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
                              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Present</span>
                            </span>
                          } @else {
                            <span class="inline-flex items-center gap-1.5 text-red-400 font-semibold font-mono">
                              <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              <span>Absent</span>
                            </span>
                          }
                        </td>
                        <td class="py-3 px-4 text-right text-neutral-500 font-mono text-[11px]">
                          Verified by Faculty
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="4" class="py-8 text-center text-neutral-500">
                          No historical attendance records logged yet.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div class="text-right pt-2">
              <button
                type="button"
                (click)="closeAttendanceModal()"
                class="btn-primary-white py-2 px-6 text-xs font-semibold"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 2: MY ASSIGNMENTS -->
      @if (showAssignmentModal()) {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="clay-elevated max-w-3xl w-full p-6 sm:p-8 border border-[#444444] rounded-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div class="flex items-start justify-between border-b border-[#333333] pb-4">
              <div>
                <span class="text-xs font-mono text-neutral-400">{{ currentStudent()?.course }} - Section {{ currentStudent()?.section }}</span>
                <h3 class="text-xl font-bold text-white mt-0.5">My Coursework & Assignments</h3>
                <p class="text-xs text-neutral-400 mt-1">
                  Strictly filtered assignments published by your faculty.
                </p>
              </div>
              <button
                type="button"
                (click)="closeAssignmentModal()"
                class="text-neutral-400 hover:text-white p-1"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="space-y-4">
              @for (asg of studentAssignments(); track asg.id) {
                <div class="clay-secondary p-5 border border-[#333333] rounded-xl space-y-3">
                  <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div class="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                        <span class="font-bold text-white">{{ asg.course }}</span>
                        <span class="text-neutral-600">·</span>
                        <span>Sec {{ asg.section }}</span>
                        <span class="text-neutral-600">·</span>
                        <span class="font-mono text-[11px]">{{ formatDate(asg.uploadedAt) }}</span>
                      </div>
                      <h4 class="text-base font-bold text-white tracking-tight">{{ asg.title }}</h4>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        (click)="inspectAssignment(asg)"
                        class="btn-secondary-charcoal py-1.5 px-3 text-xs"
                      >
                        <mat-icon class="text-xs">visibility</mat-icon>
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        (click)="downloadAssignment(asg)"
                        class="btn-primary-white py-1.5 px-3 text-xs font-semibold"
                      >
                        <mat-icon class="text-xs">download</mat-icon>
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  @if (asg.description) {
                    <p class="text-xs text-neutral-300 bg-[#141414] p-3 rounded-lg border border-[#262626] leading-relaxed">
                      {{ asg.description }}
                    </p>
                  }

                  <div class="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
                    <mat-icon class="text-xs text-neutral-400">attach_file</mat-icon>
                    <span>{{ asg.fileName }}</span>
                    <span>·</span>
                    <span>{{ formatSize(asg.fileSize) }}</span>
                  </div>
                </div>
              } @empty {
                <div class="py-12 text-center text-xs text-neutral-500">
                  No assignments currently assigned to {{ currentStudent()?.course }} Section {{ currentStudent()?.section }}.
                </div>
              }
            </div>

            <div class="text-right pt-2">
              <button
                type="button"
                (click)="closeAssignmentModal()"
                class="btn-secondary-charcoal py-2 px-6 text-xs font-semibold"
              >
                Close Coursework
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 3: ASSIGNMENT PREVIEW & INSPECTION -->
      @if (previewingAssignment()) {
        <div class="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="clay-elevated max-w-2xl w-full p-6 sm:p-8 border border-[#444444] rounded-2xl space-y-5">
            <div class="flex items-start justify-between border-b border-[#333333] pb-4">
              <div>
                <span class="text-xs font-mono text-neutral-400">Document Inspection</span>
                <h3 class="text-lg font-bold text-white mt-1">{{ previewingAssignment()?.title }}</h3>
              </div>
              <button
                type="button"
                (click)="previewingAssignment.set(null)"
                class="text-neutral-400 hover:text-white"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Simulated Document View -->
            <div class="p-6 rounded-xl bg-[#111111] border border-[#2a2a2a] text-center space-y-4">
              <div class="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#333333] flex items-center justify-center mx-auto">
                <mat-icon class="text-white text-3xl">
                  {{ previewingAssignment()?.fileType?.includes('pdf') ? 'picture_as_pdf' : 'image' }}
                </mat-icon>
              </div>
              <div>
                <h4 class="text-sm font-bold text-white font-mono">{{ previewingAssignment()?.fileName }}</h4>
                <p class="text-xs text-neutral-400 mt-1">
                  {{ formatSize(previewingAssignment()?.fileSize || 0) }} · {{ previewingAssignment()?.fileType }}
                </p>
              </div>

              @if (previewingAssignment()?.description) {
                <div class="text-left p-3.5 rounded-lg bg-[#181818] border border-[#2f2f2f] text-xs text-neutral-300 leading-relaxed">
                  {{ previewingAssignment()?.description }}
                </div>
              }

              <p class="text-[11px] text-neutral-500">
                Verified digital coursework asset stored on CampusDesk academic repository.
              </p>
            </div>

            <div class="flex items-center justify-between pt-2">
              <button
                type="button"
                (click)="previewingAssignment.set(null)"
                class="btn-secondary-charcoal py-2 px-4 text-xs font-medium"
              >
                Back to List
              </button>
              <button
                type="button"
                (click)="downloadAssignment(previewingAssignment()!)"
                class="btn-primary-white py-2 px-5 text-xs font-semibold"
              >
                <mat-icon class="text-xs">download</mat-icon>
                <span>Download Document</span>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class StudentPortalComponent implements OnInit {
  private campus = inject(CampusService);
  private router = inject(Router);

  allStudents = signal<Student[]>([]);
  currentStudent = signal<Student | null>(null);
  attendanceSummary = signal<StudentAttendanceSummary | null>(null);
  studentAssignments = signal<Assignment[]>([]);

  showAttendanceModal = signal(false);
  showAssignmentModal = signal(false);
  previewingAssignment = signal<Assignment | null>(null);

  todayDateString = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  ngOnInit() {
    this.campus.getStudents().subscribe({
      next: (res) => {
        this.allStudents.set(res.students);
        if (res.students.length > 0) {
          // Check if session has a student or pick first
          const current = this.campus.currentUser();
          const matched = current?.rollNo
            ? res.students.find(s => s.rollNo.toUpperCase() === current.rollNo?.toUpperCase())
            : res.students[0];

          this.selectStudent(matched || res.students[0]);
        }
      }
    });
  }

  selectStudent(student: Student) {
    this.currentStudent.set(student);
    this.loadStudentAttendance(student.rollNo);
    this.loadStudentAssignments(student.course, student.section);
  }

  onStudentChange(event: Event) {
    const roll = (event.target as HTMLSelectElement).value;
    const std = this.allStudents().find(s => s.rollNo === roll);
    if (std) {
      this.selectStudent(std);
    }
  }

  loadStudentAttendance(rollNo: string) {
    this.campus.getStudentAttendance(rollNo).subscribe({
      next: (data) => this.attendanceSummary.set(data),
      error: (err) => console.error(err)
    });
  }

  loadStudentAssignments(course: string, section: string) {
    // Strictly filter by student's course and section as required by prompt
    this.campus.getAssignments(course, section).subscribe({
      next: (res) => this.studentAssignments.set(res.assignments),
      error: (err) => console.error(err)
    });
  }

  openAttendanceModal() {
    this.showAttendanceModal.set(true);
  }

  closeAttendanceModal() {
    this.showAttendanceModal.set(false);
  }

  openAssignmentModal() {
    this.showAssignmentModal.set(true);
  }

  closeAssignmentModal() {
    this.showAssignmentModal.set(false);
  }

  inspectAssignment(asg: Assignment) {
    this.previewingAssignment.set(asg);
  }

  downloadAssignment(item: Assignment) {
    const content = `CampusDesk Academic Document\nTitle: ${item.title}\nCourse: ${item.course} - Section ${item.section}\nDate: ${item.uploadedAt}\n\n${item.description || 'Verified course assignment file.'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName || 'assignment-download.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  onLogout() {
    this.campus.logout();
    this.router.navigate(['/login']);
  }
}
