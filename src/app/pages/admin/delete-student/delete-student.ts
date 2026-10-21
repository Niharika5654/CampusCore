import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CampusService, Student, StudentAttendanceSummary } from '../../../services/campus';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-delete-student',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <!-- Heading -->
      <div class="border-b border-[#222222] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Manage Student Directory</h2>
          <p class="text-xs text-neutral-400 mt-1">
            Search, filter, view profile, edit academic records, or safely purge student profiles with full database integrity.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-mono text-neutral-400">Total Enrolled:</span>
          <span class="text-xs font-mono font-bold text-white bg-[#1a1a1a] px-2.5 py-1 rounded-md border border-[#333333] tabular-nums">
            {{ students().length }} Students
          </span>
        </div>
      </div>

      <!-- Filter Mismatch Notification Banner -->
      @if (filterMismatchNotice()) {
        <div class="p-4 rounded-xl bg-[#14181f] border border-blue-900/40 text-blue-200 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div class="flex items-center gap-2.5">
            <mat-icon class="text-blue-400 text-sm">info</mat-icon>
            <span>{{ filterMismatchNotice() }}</span>
          </div>
          <button
            type="button"
            (click)="clearFilters()"
            class="underline text-blue-300 hover:text-white font-medium cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      }

      <!-- Search and Filter Toolbar (Dark Clay) -->
      <div class="clay-card p-5 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
          <!-- Live Search Input -->
          <div class="relative md:col-span-5">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <mat-icon class="text-sm">search</mat-icon>
            </div>
            <input
              type="text"
              [formControl]="searchControl"
              placeholder="Search by student name, roll number, or email..."
              class="clay-input w-full pl-10 pr-4 py-2 text-xs placeholder:text-neutral-500"
            />
          </div>

          <!-- Course Filter Dropdown -->
          <div class="md:col-span-3">
            <div class="relative">
              <select
                [formControl]="courseFilterControl"
                class="clay-input w-full px-3 py-2 text-xs appearance-none cursor-pointer pr-8"
              >
                <option value="All">All Courses (B.Tech, M.Tech, BCA, BBA)</option>
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="BCA">BCA</option>
                <option value="BBA">BBA</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-neutral-400">
                <mat-icon class="text-xs">expand_more</mat-icon>
              </div>
            </div>
          </div>

          <!-- Semester Filter Dropdown -->
          <div class="md:col-span-2">
            <div class="relative">
              <select
                [formControl]="semesterFilterControl"
                class="clay-input w-full px-3 py-2 text-xs appearance-none cursor-pointer pr-8 font-mono"
              >
                <option value="All">All Semesters</option>
                <option value="1">Sem 1</option>
                <option value="2">Sem 2</option>
                <option value="3">Sem 3</option>
                <option value="4">Sem 4</option>
                <option value="5">Sem 5</option>
                <option value="6">Sem 6</option>
                <option value="7">Sem 7</option>
                <option value="8">Sem 8</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-neutral-400">
                <mat-icon class="text-xs">expand_more</mat-icon>
              </div>
            </div>
          </div>

          <!-- Section Filter Dropdown -->
          <div class="md:col-span-2">
            <div class="relative">
              <select
                [formControl]="sectionFilterControl"
                class="clay-input w-full px-3 py-2 text-xs appearance-none cursor-pointer pr-8 font-mono"
              >
                <option value="All">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-neutral-400">
                <mat-icon class="text-xs">expand_more</mat-icon>
              </div>
            </div>
          </div>
        </div>

        @if (isFiltered()) {
          <div class="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-[#252525]">
            <span>Showing {{ filteredStudents().length }} of {{ students().length }} students matching active filters</span>
            <button
              type="button"
              (click)="clearFilters()"
              class="text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <mat-icon class="text-xs">close</mat-icon>
              <span>Reset Filters</span>
            </button>
          </div>
        }
      </div>

      <!-- Student Records Table (Charcoal Clay) -->
      <div class="clay-card overflow-hidden">
        <div class="p-5 border-b border-[#262626] flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-white tracking-tight">Student Roster Directory</span>
            <span class="text-xs text-neutral-400 font-mono tabular-nums">({{ filteredStudents().length }} displayed)</span>
          </div>
          <span class="text-xs text-neutral-500 font-mono">Database Master Table</span>
        </div>

        @if (isLoading()) {
          <div class="py-16 text-center space-y-3">
            <div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p class="text-xs text-neutral-400">Loading student records from database...</p>
          </div>
        } @else if (filteredStudents().length === 0) {
          <div class="py-16 text-center space-y-3 px-4">
            <mat-icon class="text-neutral-500 text-3xl">search_off</mat-icon>
            <p class="text-sm font-semibold text-white">No Matching Students Found</p>
            <p class="text-xs text-neutral-400 max-w-sm mx-auto">
              No active students match your search criteria. Try modifying your query or resetting filters.
            </p>
            <button
              type="button"
              (click)="clearFilters()"
              class="btn-secondary-charcoal py-1.5 px-3 text-xs mt-2"
            >
              Clear Search & Filters
            </button>
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
                  <th class="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#202020]">
                @for (student of filteredStudents(); track student.id) {
                  <tr class="hover:bg-[#1a1a1a] transition-colors">
                    <td class="py-3.5 px-4 font-mono font-medium text-white tabular-nums">
                      {{ student.rollNo }}
                    </td>
                    <td class="py-3.5 px-4 font-medium text-white">
                      {{ student.name }}
                    </td>
                    <td class="py-3.5 px-4 text-xs text-neutral-400 font-mono">
                      {{ student.email }}
                    </td>
                    <td class="py-3.5 px-4 text-xs font-medium text-neutral-200">
                      {{ student.course }}
                    </td>
                    <td class="py-3.5 px-4 font-mono text-xs text-neutral-300 tabular-nums">
                      Sem {{ student.semester || 1 }}
                    </td>
                    <td class="py-3.5 px-4 font-mono text-xs text-neutral-300">
                      Sec {{ student.section }}
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <div class="inline-flex items-center gap-1.5">
                        <!-- 1. Edit Button -->
                        <button
                          type="button"
                          (click)="openEditModal(student)"
                          class="btn-secondary-charcoal py-1 px-2.5 text-xs text-white hover:border-white/50"
                          title="Edit student record"
                        >
                          <mat-icon class="text-xs">edit</mat-icon>
                          <span>Edit</span>
                        </button>

                        <!-- 2. View Profile Button -->
                        <button
                          type="button"
                          (click)="openProfileModal(student)"
                          class="btn-secondary-charcoal py-1 px-2.5 text-xs text-neutral-300 hover:text-white"
                          title="View student profile & attendance audit"
                        >
                          <mat-icon class="text-xs">visibility</mat-icon>
                          <span class="hidden sm:inline">Profile</span>
                        </button>

                        <!-- 3. Delete Record Button -->
                        <button
                          type="button"
                          (click)="promptDelete(student)"
                          class="btn-destructive py-1 px-2.5 text-xs"
                          title="Delete student record"
                        >
                          <mat-icon class="text-xs">delete</mat-icon>
                          <span class="hidden sm:inline">Delete</span>
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

      <!-- MODAL 1: EDIT STUDENT (Dedicated Claymorphism Form) -->
      @if (editingStudent()) {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="clay-elevated max-w-xl w-full p-6 sm:p-8 border border-[#444444] rounded-2xl space-y-6 animate-scale-up">
            <!-- Modal Header -->
            <div class="flex items-start justify-between border-b border-[#333333] pb-4">
              <div>
                <span class="text-xs font-mono text-neutral-400">Database ID: {{ editingStudent()?.id }}</span>
                <h3 class="text-xl font-bold text-white tracking-tight mt-0.5">Edit Student Record</h3>
                <p class="text-xs text-neutral-400 mt-1">
                  Updating profile for <span class="text-white font-medium">{{ editingStudent()?.name }}</span>
                </p>
              </div>
              <button
                type="button"
                (click)="closeEditModal()"
                [disabled]="isUpdating()"
                class="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Error Banner -->
            @if (editError()) {
              <div class="p-3.5 rounded-xl bg-[#211212] border border-red-900/50 text-red-300 text-xs flex items-start gap-2.5">
                <mat-icon class="text-red-400 shrink-0 text-sm mt-0.5">error_outline</mat-icon>
                <span>{{ editError() }}</span>
              </div>
            }

            <!-- Edit Form -->
            <form [formGroup]="editForm" (ngSubmit)="onSaveEdit()" class="space-y-4">
              <!-- Student Name -->
              <div>
                <label for="edit-name" class="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
                  Student Full Name <span class="text-red-400">*</span>
                </label>
                <input
                  id="edit-name"
                  type="text"
                  formControlName="name"
                  class="clay-input w-full px-3.5 py-2.5 text-sm"
                  placeholder="e.g. Aarav Sharma"
                />
                @if (editForm.get('name')?.touched && editForm.get('name')?.invalid) {
                  <p class="text-xs text-red-400 mt-1">Student name must be at least 2 characters long.</p>
                }
              </div>

              <!-- Roll Number and Email -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="edit-roll" class="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
                    Roll Number <span class="text-red-400">*</span>
                  </label>
                  <input
                    id="edit-roll"
                    type="text"
                    formControlName="rollNo"
                    class="clay-input w-full px-3.5 py-2.5 text-sm font-mono uppercase"
                    placeholder="2024CS101"
                  />
                  <p class="text-[10px] text-neutral-400 mt-1">Must be unique across all students.</p>
                  @if (editForm.get('rollNo')?.touched && editForm.get('rollNo')?.invalid) {
                    <p class="text-xs text-red-400 mt-1">Valid roll number is required.</p>
                  }
                </div>

                <div>
                  <label for="edit-email" class="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
                    Email Address <span class="text-red-400">*</span>
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    formControlName="email"
                    class="clay-input w-full px-3.5 py-2.5 text-sm font-mono"
                    placeholder="student@campusdesk.edu"
                  />
                  <p class="text-[10px] text-neutral-400 mt-1">Primary institutional contact email.</p>
                  @if (editForm.get('email')?.touched && editForm.get('email')?.invalid) {
                    <p class="text-xs text-red-400 mt-1">Valid email format required.</p>
                  }
                </div>
              </div>

              <!-- Course, Semester, and Section -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label for="edit-course" class="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
                    Course <span class="text-red-400">*</span>
                  </label>
                  <div class="relative">
                    <select
                      id="edit-course"
                      formControlName="course"
                      (change)="onCourseChange()"
                      class="clay-input w-full px-3 py-2.5 text-xs appearance-none cursor-pointer pr-8"
                    >
                      <option value="B.Tech">B.Tech</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="BCA">BCA</option>
                      <option value="BBA">BBA</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-neutral-400">
                      <mat-icon class="text-xs">expand_more</mat-icon>
                    </div>
                  </div>
                </div>

                <div>
                  <label for="edit-semester" class="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
                    Semester <span class="text-red-400">*</span>
                  </label>
                  <div class="relative">
                    <select
                      id="edit-semester"
                      formControlName="semester"
                      class="clay-input w-full px-3 py-2.5 text-xs appearance-none cursor-pointer pr-8 font-mono"
                    >
                      @for (sem of availableSemesters(); track sem) {
                        <option [value]="sem">Semester {{ sem }}</option>
                      }
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-neutral-400">
                      <mat-icon class="text-xs">expand_more</mat-icon>
                    </div>
                  </div>
                </div>

                <div>
                  <label for="edit-section" class="block text-xs font-bold uppercase tracking-wider text-white mb-1.5">
                    Section <span class="text-red-400">*</span>
                  </label>
                  <div class="relative">
                    <select
                      id="edit-section"
                      formControlName="section"
                      class="clay-input w-full px-3 py-2.5 text-xs appearance-none cursor-pointer pr-8 font-mono"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-neutral-400">
                      <mat-icon class="text-xs">expand_more</mat-icon>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center justify-end gap-3 pt-5 border-t border-[#333333]">
                <button
                  type="button"
                  (click)="closeEditModal()"
                  [disabled]="isUpdating()"
                  class="btn-secondary-charcoal py-2 px-4 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="isUpdating()"
                  class="btn-primary-white py-2 px-6 text-xs font-semibold"
                >
                  @if (isUpdating()) {
                    <span class="inline-block w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving Changes...</span>
                  } @else {
                    <mat-icon class="text-xs">check</mat-icon>
                    <span>Save Changes</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL 2: VIEW PROFILE (Comprehensive Audit Modal) -->
      @if (profileStudent()) {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="clay-elevated max-w-2xl w-full p-6 sm:p-8 border border-[#444444] rounded-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div class="flex items-start justify-between border-b border-[#333333] pb-4">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-[#202020] border border-[#383838] flex items-center justify-center font-bold text-white font-mono text-base shadow-inner">
                  {{ profileStudent()?.name?.substring(0, 2)?.toUpperCase() }}
                </div>
                <div>
                  <h3 class="text-lg font-bold text-white tracking-tight">{{ profileStudent()?.name }}</h3>
                  <p class="text-xs text-neutral-400 font-mono">{{ profileStudent()?.rollNo }} · {{ profileStudent()?.email }}</p>
                </div>
              </div>
              <button
                type="button"
                (click)="profileStudent.set(null)"
                class="text-neutral-400 hover:text-white"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <!-- Profile Parameters Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="clay-secondary p-3 rounded-xl border border-[#333333]">
                <p class="text-[10px] uppercase font-bold text-neutral-400">Department</p>
                <p class="text-xs font-semibold text-white font-mono mt-0.5">{{ profileStudent()?.course }}</p>
              </div>
              <div class="clay-secondary p-3 rounded-xl border border-[#333333]">
                <p class="text-[10px] uppercase font-bold text-neutral-400">Semester</p>
                <p class="text-xs font-semibold text-white font-mono mt-0.5">Sem {{ profileStudent()?.semester || 1 }}</p>
              </div>
              <div class="clay-secondary p-3 rounded-xl border border-[#333333]">
                <p class="text-[10px] uppercase font-bold text-neutral-400">Cohort</p>
                <p class="text-xs font-semibold text-white font-mono mt-0.5">Section {{ profileStudent()?.section }}</p>
              </div>
              <div class="clay-secondary p-3 rounded-xl border border-[#333333]">
                <p class="text-[10px] uppercase font-bold text-neutral-400">Enrolled</p>
                <p class="text-xs font-semibold text-neutral-300 font-mono mt-0.5">{{ profileStudent()?.createdAt || '2024-08-15' }}</p>
              </div>
            </div>

            <!-- Attendance Stats Strip -->
            @if (profileAttendance()) {
              <div class="clay-card p-4 space-y-2 border border-[#333333]">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Academic Attendance Index</span>
                  <span class="text-emerald-400 font-bold font-mono tabular-nums">
                    {{ profileAttendance()?.stats?.percentage }}% Present
                  </span>
                </div>
                <div class="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                  <div class="text-neutral-300">Total: {{ profileAttendance()?.stats?.totalClasses }} sessions</div>
                  <div class="text-emerald-400">Present: {{ profileAttendance()?.stats?.presentCount }}</div>
                  <div class="text-red-400">Absent: {{ profileAttendance()?.stats?.absentCount }}</div>
                </div>
              </div>
            }

            <!-- Bottom Actions -->
            <div class="flex items-center justify-between pt-2">
              <button
                type="button"
                (click)="openEditModalFromProfile(profileStudent()!)"
                class="btn-primary-white py-2 px-4 text-xs font-semibold"
              >
                <mat-icon class="text-xs">edit</mat-icon>
                <span>Edit This Student Record</span>
              </button>

              <button
                type="button"
                (click)="profileStudent.set(null)"
                class="btn-secondary-charcoal py-2 px-5 text-xs font-medium"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 3: DELETE CONFIRMATION -->
      @if (pendingStudent()) {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="clay-elevated max-w-md w-full p-6 sm:p-8 border border-red-900/50 rounded-2xl space-y-5 animate-scale-up">
            <div class="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center mx-auto text-red-400">
              <mat-icon class="text-2xl">warning</mat-icon>
            </div>

            <div class="text-center space-y-2">
              <h3 class="text-lg font-bold text-white tracking-tight">Confirm Student Record Deletion</h3>
              <p class="text-xs text-neutral-400">
                Are you sure you want to permanently delete student
                <span class="text-white font-semibold">{{ pendingStudent()?.name }}</span>
                (Roll Number: <span class="text-white font-mono font-medium">{{ pendingStudent()?.rollNo }}</span>)?
              </p>
              <div class="p-3 bg-[#171212] rounded-xl border border-red-900/30 text-[11px] text-red-300/90 text-left mt-3">
                This action will permanently purge the student record and their associated attendance logs from the CampusDesk database.
              </div>
            </div>

            <div class="flex items-center gap-3 pt-3">
              <button
                type="button"
                (click)="cancelDelete()"
                [disabled]="isDeleting()"
                class="btn-secondary-charcoal flex-1 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmDelete()"
                [disabled]="isDeleting()"
                class="btn-destructive flex-1 py-2.5 text-xs font-semibold"
              >
                @if (isDeleting()) {
                  <span class="inline-block w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></span>
                  <span>Deleting...</span>
                } @else {
                  <mat-icon class="text-sm">delete_forever</mat-icon>
                  <span>Confirm Delete</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class DeleteStudentComponent implements OnInit {
  private campus = inject(CampusService);

  isLoading = signal(false);
  isDeleting = signal(false);
  isUpdating = signal(false);

  students = signal<Student[]>([]);
  pendingStudent = signal<Student | null>(null);

  // Edit Student state
  editingStudent = signal<Student | null>(null);
  editError = signal<string | null>(null);
  filterMismatchNotice = signal<string | null>(null);

  // Profile View state
  profileStudent = signal<Student | null>(null);
  profileAttendance = signal<StudentAttendanceSummary | null>(null);

  searchControl = new FormControl('');
  courseFilterControl = new FormControl('All');
  semesterFilterControl = new FormControl('All');
  sectionFilterControl = new FormControl('All');

  editForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    rollNo: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    course: new FormControl<'B.Tech' | 'M.Tech' | 'BCA' | 'BBA'>('B.Tech', [Validators.required]),
    semester: new FormControl<number>(1, [Validators.required]),
    section: new FormControl<'A' | 'B' | 'C' | 'D'>('A', [Validators.required]),
  });

  ngOnInit() {
    this.loadStudents();

    this.searchControl.valueChanges.subscribe(() => {
      this.filterMismatchNotice.set(null);
    });
    this.courseFilterControl.valueChanges.subscribe(() => {
      this.filterMismatchNotice.set(null);
    });
    this.semesterFilterControl.valueChanges.subscribe(() => {
      this.filterMismatchNotice.set(null);
    });
    this.sectionFilterControl.valueChanges.subscribe(() => {
      this.filterMismatchNotice.set(null);
    });
  }

  loadStudents() {
    this.isLoading.set(true);
    this.campus.getStudents().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.students.set(res.students);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  isFiltered(): boolean {
    return Boolean(
      (this.searchControl.value && this.searchControl.value.trim().length > 0) ||
      (this.courseFilterControl.value && this.courseFilterControl.value !== 'All') ||
      (this.semesterFilterControl.value && this.semesterFilterControl.value !== 'All') ||
      (this.sectionFilterControl.value && this.sectionFilterControl.value !== 'All')
    );
  }

  clearFilters() {
    this.searchControl.setValue('');
    this.courseFilterControl.setValue('All');
    this.semesterFilterControl.setValue('All');
    this.sectionFilterControl.setValue('All');
    this.filterMismatchNotice.set(null);
  }

  filteredStudents(): Student[] {
    const q = (this.searchControl.value || '').toLowerCase().trim();
    const c = this.courseFilterControl.value || 'All';
    const sem = this.semesterFilterControl.value || 'All';
    const sec = this.sectionFilterControl.value || 'All';

    return this.students().filter(s => {
      const matchCourse = c === 'All' || s.course === c;
      const matchSection = sec === 'All' || s.section === sec;
      const matchSemester = sem === 'All' || String(s.semester || 1) === String(sem);
      const matchQuery = !q ||
        s.name.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q);

      return matchCourse && matchSection && matchSemester && matchQuery;
    });
  }

  // --- EDIT MODAL LOGIC ---
  openEditModal(student: Student) {
    // Identify student using database ID, not editable roll number
    this.campus.getStudentById(student.id).subscribe({
      next: (res) => {
        const fresh = res.student;
        this.editingStudent.set(fresh);
        this.editError.set(null);

        this.editForm.reset({
          name: fresh.name,
          rollNo: fresh.rollNo,
          email: fresh.email,
          course: fresh.course,
          semester: fresh.semester || 1,
          section: fresh.section,
        });
      },
      error: () => {
        // Fallback to local reference
        this.editingStudent.set(student);
        this.editError.set(null);
        this.editForm.reset({
          name: student.name,
          rollNo: student.rollNo,
          email: student.email,
          course: student.course,
          semester: student.semester || 1,
          section: student.section,
        });
      }
    });
  }

  openEditModalFromProfile(student: Student) {
    this.profileStudent.set(null);
    this.openEditModal(student);
  }

  closeEditModal() {
    this.editingStudent.set(null);
    this.editError.set(null);
  }

  availableSemesters(): number[] {
    const course = this.editForm.get('course')?.value || 'B.Tech';
    const maxSemesters: Record<string, number> = {
      'B.Tech': 8,
      'M.Tech': 4,
      'BCA': 6,
      'BBA': 6
    };
    const max = maxSemesters[course] || 8;
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  onCourseChange() {
    const currentSem = this.editForm.get('semester')?.value || 1;
    const max = this.availableSemesters().length;
    if (currentSem > max) {
      this.editForm.patchValue({ semester: max });
    }
  }

  onSaveEdit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const current = this.editingStudent();
    if (!current) return;

    const val = this.editForm.value;
    if (!val.name || !val.rollNo || !val.email || !val.course || !val.section) {
      return;
    }

    this.isUpdating.set(true);
    this.editError.set(null);

    const updatePayload: Partial<Student> = {
      name: val.name.trim(),
      rollNo: val.rollNo.trim().toUpperCase(),
      email: val.email.trim().toLowerCase(),
      course: val.course,
      semester: Number(val.semester) || 1,
      section: val.section,
    };

    // Update using database ID
    this.campus.updateStudent(current.id, updatePayload).subscribe({
      next: (res) => {
        this.isUpdating.set(false);
        const updated = res.student;

        // Exact feedback confirmation
        this.campus.showToast('Student record updated successfully.');

        // Refresh list
        this.students.update(list => {
          const index = list.findIndex(s => s.id === current.id);
          if (index !== -1) {
            const copy = [...list];
            copy[index] = updated;
            return copy;
          }
          return list;
        });

        // Check if student still matches active search and filters
        const cFilter = this.courseFilterControl.value || 'All';
        const semFilter = this.semesterFilterControl.value || 'All';
        const secFilter = this.sectionFilterControl.value || 'All';
        const qFilter = (this.searchControl.value || '').toLowerCase().trim();

        const matchCourse = cFilter === 'All' || updated.course === cFilter;
        const matchSec = secFilter === 'All' || updated.section === secFilter;
        const matchSem = semFilter === 'All' || String(updated.semester || 1) === String(semFilter);
        const matchQ = !qFilter ||
          updated.name.toLowerCase().includes(qFilter) ||
          updated.rollNo.toLowerCase().includes(qFilter) ||
          updated.email.toLowerCase().includes(qFilter);

        if (!matchCourse || !matchSec || !matchSem || !matchQ) {
          this.filterMismatchNotice.set(
            `Student record for "${updated.name}" (${updated.rollNo}) was updated successfully, but is no longer visible under the current active filter settings.`
          );
        } else {
          this.filterMismatchNotice.set(null);
        }

        this.closeEditModal();
        this.loadStudents();
      },
      error: (err) => {
        this.isUpdating.set(false);
        // Do not lose user's entered form values
        this.editError.set(err.error?.error || 'Failed to update student record. Please verify fields and try again.');
      }
    });
  }

  // --- PROFILE MODAL LOGIC ---
  openProfileModal(student: Student) {
    this.profileStudent.set(student);
    this.profileAttendance.set(null);

    this.campus.getStudentAttendance(student.rollNo).subscribe({
      next: (summary) => this.profileAttendance.set(summary),
      error: (err) => console.error(err)
    });
  }

  // --- DELETE MODAL LOGIC ---
  promptDelete(student: Student) {
    this.pendingStudent.set(student);
  }

  cancelDelete() {
    this.pendingStudent.set(null);
  }

  confirmDelete() {
    const student = this.pendingStudent();
    if (!student) return;

    this.isDeleting.set(true);

    this.campus.deleteStudent(student.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.pendingStudent.set(null);
        // Exact message output as specified in prompt
        this.campus.showToast('Student data deleted successfully');
        this.loadStudents();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.campus.showToast(err.error?.error || 'Failed to delete student record');
      }
    });
  }
}
