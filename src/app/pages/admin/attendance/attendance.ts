import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CampusService, AttendanceItem } from '../../../services/campus';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-attendance',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <!-- Page Heading & Title -->
      <div class="border-b border-[#222222] pb-5">
        <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Institutional Attendance</h2>
        <p class="text-xs text-neutral-400 mt-1">
          Daily classroom roll call registry, presence verification, and academic compliance records.
        </p>
      </div>

      <!-- Dark Clay Filter Panel -->
      <div class="clay-card p-6">
        <form [formGroup]="filterForm" (ngSubmit)="fetchRecords()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <!-- Course Dropdown -->
          <div>
            <label for="filter-course" class="block text-xs font-bold uppercase tracking-wider text-white mb-2">
              Course
            </label>
            <div class="relative">
              <select
                id="filter-course"
                formControlName="course"
                class="clay-input w-full px-4 py-2.5 text-sm appearance-none pr-10 cursor-pointer"
              >
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="BCA">BCA</option>
                <option value="BBA">BBA</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-400">
                <mat-icon class="text-sm">expand_more</mat-icon>
              </div>
            </div>
          </div>

          <!-- Section Dropdown -->
          <div>
            <label for="filter-section" class="block text-xs font-bold uppercase tracking-wider text-white mb-2">
              Section
            </label>
            <div class="relative">
              <select
                id="filter-section"
                formControlName="section"
                class="clay-input w-full px-4 py-2.5 text-sm appearance-none pr-10 cursor-pointer"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-400">
                <mat-icon class="text-sm">expand_more</mat-icon>
              </div>
            </div>
          </div>

          <!-- Dark-themed Date Picker -->
          <div>
            <label for="filter-date" class="block text-xs font-bold uppercase tracking-wider text-white mb-2">
              Date
            </label>
            <input
              id="filter-date"
              type="date"
              formControlName="date"
              class="clay-input w-full px-4 py-2.5 text-sm font-mono cursor-pointer"
            />
          </div>

          <!-- Filter Submit Button -->
          <div>
            <button
              type="submit"
              [disabled]="isLoading()"
              class="btn-primary-white w-full py-2.5 text-xs font-semibold"
            >
              @if (isLoading()) {
                <span class="inline-block w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                <span>Loading...</span>
              } @else {
                <mat-icon class="text-sm">search</mat-icon>
                <span>Show Student Records</span>
              }
            </button>
          </div>
        </form>
      </div>

      <!-- Action & Summary Ribbon -->
      @if (records().length > 0) {
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-[#141414] border border-[#2a2a2a]">
          <div class="flex items-center gap-4 text-xs">
            <span class="text-neutral-400">Class:</span>
            <span class="font-bold text-white">{{ activeCourse() }} - Section {{ activeSection() }}</span>
            <span class="text-neutral-600">·</span>
            <span class="text-neutral-400 font-mono">{{ activeDate() }}</span>
            <span class="text-neutral-600">·</span>
            <span class="font-mono tabular-nums text-white">{{ records().length }} students listed</span>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="markAll('Present')"
              class="btn-secondary-charcoal py-1.5 px-3 text-xs"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>All Present</span>
            </button>
            <button
              type="button"
              (click)="markAll('Absent')"
              class="btn-secondary-charcoal py-1.5 px-3 text-xs text-red-300"
            >
              <span class="w-2 h-2 rounded-full bg-red-500"></span>
              <span>All Absent</span>
            </button>
          </div>
        </div>
      }

      <!-- Attendance Table (Charcoal Clay surface) -->
      <div class="clay-card overflow-hidden">
        @if (isLoading()) {
          <div class="py-16 text-center space-y-3">
            <div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p class="text-xs text-neutral-400">Loading student attendance roster...</p>
          </div>
        } @else if (records().length === 0) {
          <div class="py-16 text-center space-y-4 px-4">
            <div class="w-12 h-12 rounded-xl bg-[#202020] border border-[#333333] flex items-center justify-center mx-auto text-neutral-500">
              <mat-icon>person_search</mat-icon>
            </div>
            <div>
              <p class="text-sm font-semibold text-white">No Student Records Found</p>
              <p class="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                No students enrolled in {{ activeCourse() }} Section {{ activeSection() }}. Click "Add Student" in the menu to enroll students into this cohort.
              </p>
            </div>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-[#121212] border-b border-[#2a2a2a] text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  <th class="py-3.5 px-5">Roll Number</th>
                  <th class="py-3.5 px-5">Student Name</th>
                  <th class="py-3.5 px-5">Cohort</th>
                  <th class="py-3.5 px-5 text-center">Current Status</th>
                  <th class="py-3.5 px-5 text-right">Attendance Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#202020]">
                @for (item of records(); track item.studentId; let idx = $index) {
                  <tr class="hover:bg-[#1f1f1f]/60 transition-colors">
                    <td class="py-3.5 px-5 font-mono font-medium text-white tabular-nums">
                      {{ item.rollNo }}
                    </td>
                    <td class="py-3.5 px-5 font-medium text-white">
                      {{ item.studentName }}
                    </td>
                    <td class="py-3.5 px-5 text-xs text-neutral-400">
                      {{ item.course }} - Sec {{ item.section }}
                    </td>
                    <td class="py-3.5 px-5 text-center">
                      @if (item.status === 'Present') {
                        <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
                          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Present</span>
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 font-mono">
                          <span class="w-2 h-2 rounded-full bg-red-500"></span>
                          <span>Absent</span>
                        </span>
                      }
                    </td>
                    <td class="py-3.5 px-5 text-right">
                      <div class="inline-flex items-center rounded-lg bg-[#0e0e0e] p-1 border border-[#333333]">
                        <button
                          type="button"
                          (click)="setStatus(idx, 'Present')"
                          [class]="item.status === 'Present' 
                            ? 'px-3 py-1 text-xs font-semibold rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 shadow-sm' 
                            : 'px-3 py-1 text-xs text-neutral-400 hover:text-white transition-colors'"
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          (click)="setStatus(idx, 'Absent')"
                          [class]="item.status === 'Absent' 
                            ? 'px-3 py-1 text-xs font-semibold rounded-md bg-red-950/80 text-red-300 border border-red-600/50 shadow-sm' 
                            : 'px-3 py-1 text-xs text-neutral-400 hover:text-white transition-colors'"
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Table Bottom Bar & Save Attendance Button -->
          <div class="p-5 border-t border-[#262626] bg-[#121212] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-4 text-xs font-mono">
              <span class="text-emerald-400">Present: {{ presentCount() }}</span>
              <span class="text-neutral-600">|</span>
              <span class="text-red-400">Absent: {{ absentCount() }}</span>
              <span class="text-neutral-600">|</span>
              <span class="text-white">Rate: {{ attendanceRate() }}%</span>
            </div>

            <button
              type="button"
              (click)="onSaveAttendance()"
              [disabled]="isSaving() || records().length === 0"
              class="btn-primary-white px-6 py-2.5 text-xs font-semibold"
            >
              @if (isSaving()) {
                <span class="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                <span>Saving Attendance...</span>
              } @else {
                <mat-icon class="text-sm">check_circle</mat-icon>
                <span>Save Attendance</span>
              }
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class AttendanceComponent implements OnInit {
  private campus = inject(CampusService);

  isLoading = signal(false);
  isSaving = signal(false);
  records = signal<AttendanceItem[]>([]);

  activeCourse = signal('B.Tech');
  activeSection = signal('A');
  activeDate = signal(new Date().toISOString().split('T')[0]);

  filterForm = new FormGroup({
    course: new FormControl('B.Tech'),
    section: new FormControl('A'),
    date: new FormControl(new Date().toISOString().split('T')[0]),
  });

  ngOnInit() {
    this.fetchRecords();
  }

  fetchRecords() {
    const { course, section, date } = this.filterForm.value;
    const c = course || 'B.Tech';
    const s = section || 'A';
    const d = date || new Date().toISOString().split('T')[0];

    this.activeCourse.set(c);
    this.activeSection.set(s);
    this.activeDate.set(d);
    this.isLoading.set(true);

    this.campus.getAttendance(c, s, d).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.records.set(res.records);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  setStatus(index: number, status: 'Present' | 'Absent') {
    this.records.update((items) => {
      const copy = [...items];
      copy[index] = { ...copy[index], status };
      return copy;
    });
  }

  markAll(status: 'Present' | 'Absent') {
    this.records.update((items) => items.map(item => ({ ...item, status })));
  }

  presentCount(): number {
    return this.records().filter(r => r.status === 'Present').length;
  }

  absentCount(): number {
    return this.records().filter(r => r.status === 'Absent').length;
  }

  attendanceRate(): number {
    const total = this.records().length;
    if (total === 0) return 0;
    return Math.round((this.presentCount() / total) * 100);
  }

  onSaveAttendance() {
    const list = this.records();
    if (list.length === 0) return;

    this.isSaving.set(true);
    this.campus.saveAttendance(list).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.campus.showToast('Attendance records saved successfully');
      },
      error: () => {
        this.isSaving.set(false);
        this.campus.showToast('Error saving attendance records');
      }
    });
  }
}
