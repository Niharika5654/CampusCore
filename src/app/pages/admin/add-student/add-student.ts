import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CampusService, Student } from '../../../services/campus';

export interface ManualRow {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  course: 'B.Tech' | 'M.Tech' | 'BCA' | 'BBA';
  section: 'A' | 'B' | 'C' | 'D';
}

export interface CsvPreviewRow {
  id: string;
  rowNumber: number;
  name: string;
  rollNo: string;
  email: string;
  course: string;
  section: string;
  isValid: boolean;
  errors: string[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-add-student',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Breadcrumb and Heading -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#222222] pb-5">
        <div>
          <div class="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <a routerLink="/admin/dashboard" class="hover:text-white transition-colors">Dashboard</a>
            <span>/</span>
            <span class="text-white">Add Student</span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Student Enrollment</h2>
          <p class="text-xs text-neutral-400 mt-1">Register individual candidates or perform transactional bulk student uploads</p>
        </div>

        <a
          routerLink="/admin/dashboard"
          class="btn-secondary-charcoal px-3.5 py-2 text-xs self-start sm:self-auto"
        >
          <mat-icon class="text-sm">arrow_back</mat-icon>
          <span>Back to Dashboard</span>
        </a>
      </div>

      <!-- Segmented Mode Switcher (Clay surface) -->
      <div class="clay-secondary p-1.5 rounded-xl flex flex-wrap gap-1 border border-[#333333]">
        <button
          type="button"
          (click)="setMode('single')"
          [class]="activeMode() === 'single'
            ? 'btn-primary-white py-2 px-4 text-xs font-semibold'
            : 'text-neutral-400 hover:text-white py-2 px-4 text-xs font-medium rounded-lg transition-colors cursor-pointer'"
        >
          <mat-icon class="text-sm">person_add</mat-icon>
          <span>1. Add Single Student</span>
        </button>

        <button
          type="button"
          (click)="setMode('manual-bulk')"
          [class]="activeMode() === 'manual-bulk'
            ? 'btn-primary-white py-2 px-4 text-xs font-semibold'
            : 'text-neutral-400 hover:text-white py-2 px-4 text-xs font-medium rounded-lg transition-colors cursor-pointer'"
        >
          <mat-icon class="text-sm">playlist_add</mat-icon>
          <span>2. Bulk Add (Multiple Rows Manually)</span>
        </button>

        <button
          type="button"
          (click)="setMode('csv-import')"
          [class]="activeMode() === 'csv-import'
            ? 'btn-primary-white py-2 px-4 text-xs font-semibold'
            : 'text-neutral-400 hover:text-white py-2 px-4 text-xs font-medium rounded-lg transition-colors cursor-pointer'"
        >
          <mat-icon class="text-sm">upload_file</mat-icon>
          <span>3. Bulk Import (CSV File)</span>
        </button>
      </div>

      <!-- Global Error / Transaction Conflict Banner -->
      @if (errorMessage()) {
        <div class="p-4 rounded-xl bg-[#211212] border border-red-900/50 text-red-300 text-sm space-y-2">
          <div class="flex items-start gap-3">
            <mat-icon class="text-red-400 shrink-0 mt-0.5">error_outline</mat-icon>
            <div>
              <p class="font-bold text-white tracking-wide">Operation Aborted / Validation Conflict</p>
              <p class="text-xs text-red-300/90 mt-0.5">{{ errorMessage() }}</p>
            </div>
          </div>

          @if (detailedErrors().length > 0) {
            <div class="mt-3 pl-8 text-xs space-y-1 font-mono text-red-300 border-l border-red-900/50">
              @for (err of detailedErrors(); track err) {
                <div>• {{ err }}</div>
              }
            </div>
          }
        </div>
      }

      <!-- SUCCESS MODAL (Reusable for Single and Bulk) -->
      @if (showSuccessModal()) {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="clay-elevated max-w-md w-full p-6 sm:p-8 border border-[#444444] rounded-2xl space-y-5 animate-scale-up">
            <div class="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center mx-auto">
              <mat-icon class="text-emerald-400 text-2xl">check_circle</mat-icon>
            </div>
            <div class="text-center">
              <h3 class="text-lg font-bold text-white tracking-tight">Enrollment Complete</h3>
              <p class="text-sm font-semibold text-emerald-400 mt-2">{{ successMessage() }}</p>
              <p class="text-xs text-neutral-400 mt-1">
                Database transaction committed safely. Students are registered and accessible for attendance & credentials.
              </p>
            </div>
            <div class="flex gap-3 pt-2">
              <button
                type="button"
                (click)="dismissModalAndAddAnother()"
                class="btn-secondary-charcoal flex-1 py-2.5 text-xs font-semibold"
              >
                Add More Students
              </button>
              <button
                type="button"
                (click)="goToDashboard()"
                class="btn-primary-white flex-1 py-2.5 text-xs font-semibold"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      }

      <!-- TAB 1: ADD SINGLE STUDENT -->
      @if (activeMode() === 'single') {
        <div class="clay-card p-6 sm:p-8">
          <div class="mb-6">
            <h3 class="text-base font-bold text-white tracking-tight">Single Student Record</h3>
            <p class="text-xs text-neutral-400">Fill out candidate details for individual registration</p>
          </div>

          <form [formGroup]="studentForm" (ngSubmit)="onSingleSubmit()" class="space-y-6">
            <!-- 1. Student Name -->
            <div>
              <label for="name" class="block text-xs font-bold uppercase tracking-wider text-white mb-2">
                Student Full Name <span class="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                formControlName="name"
                placeholder="e.g. Maya Krishnan"
                class="clay-input w-full px-4 py-3 text-sm placeholder:text-neutral-600"
              />
              @if (studentForm.get('name')?.touched && studentForm.get('name')?.invalid) {
                <p class="text-xs text-red-400 mt-1.5">Student name is required (min 2 characters).</p>
              }
            </div>

            <!-- 2. Roll Number & Email -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label for="rollNo" class="block text-xs font-bold uppercase tracking-wider text-white mb-2">
                  Roll Number <span class="text-red-400">*</span>
                </label>
                <input
                  id="rollNo"
                  type="text"
                  formControlName="rollNo"
                  placeholder="e.g. 2024CS106"
                  class="clay-input w-full px-4 py-3 text-sm font-mono placeholder:text-neutral-600"
                />
                <p class="text-[11px] text-neutral-400 mt-1">Unique institutional academic identifier.</p>
                @if (studentForm.get('rollNo')?.touched && studentForm.get('rollNo')?.invalid) {
                  <p class="text-xs text-red-400 mt-1.5">Valid roll number is required.</p>
                }
              </div>

              <div>
                <label for="email" class="block text-xs font-bold uppercase tracking-wider text-white mb-2">
                  Institutional Email <span class="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  placeholder="e.g. maya.krishnan@campusdesk.edu"
                  class="clay-input w-full px-4 py-3 text-sm placeholder:text-neutral-600"
                />
                <p class="text-[11px] text-neutral-400 mt-1">Used for portal notifications & login.</p>
                @if (studentForm.get('email')?.touched && studentForm.get('email')?.invalid) {
                  <p class="text-xs text-red-400 mt-1.5">Please provide a valid email address.</p>
                }
              </div>
            </div>

            <!-- 3. Course and Section Dropdowns -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label for="course" class="block text-xs font-bold uppercase tracking-wider text-white mb-2">
                  Academic Course <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <select
                    id="course"
                    formControlName="course"
                    class="clay-input w-full px-4 py-3 text-sm appearance-none cursor-pointer pr-10"
                  >
                    <option value="B.Tech">B.Tech (Bachelor of Technology)</option>
                    <option value="M.Tech">M.Tech (Master of Technology)</option>
                    <option value="BCA">BCA (Bachelor of Computer Applications)</option>
                    <option value="BBA">BBA (Bachelor of Business Administration)</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-400">
                    <mat-icon class="text-sm">expand_more</mat-icon>
                  </div>
                </div>
              </div>

              <div>
                <label for="section" class="block text-xs font-bold uppercase tracking-wider text-white mb-2">
                  Section Group <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <select
                    id="section"
                    formControlName="section"
                    class="clay-input w-full px-4 py-3 text-sm appearance-none cursor-pointer pr-10"
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
            </div>

            <!-- Actions -->
            <div class="pt-4 border-t border-[#252525] flex items-center justify-end gap-3">
              <button
                type="button"
                (click)="resetSingleForm()"
                class="btn-secondary-charcoal px-5 py-3 text-xs font-medium"
              >
                Reset Form
              </button>
              <button
                type="submit"
                [disabled]="isSubmitting()"
                class="btn-primary-white px-7 py-3 text-xs font-semibold"
              >
                @if (isSubmitting()) {
                  <span class="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving Record...</span>
                } @else {
                  <mat-icon class="text-sm">save</mat-icon>
                  <span>Save Student</span>
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- TAB 2: BULK ADD (MULTIPLE ROWS MANUALLY) -->
      @if (activeMode() === 'manual-bulk') {
        <div class="clay-card p-6 sm:p-8 space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 class="text-base font-bold text-white tracking-tight">Manual Multi-Row Student Entry</h3>
              <p class="text-xs text-neutral-400">Add or remove candidate rows dynamically before atomic submission</p>
            </div>

            <div class="flex items-center gap-2.5">
              <button
                type="button"
                (click)="addSampleRows()"
                class="btn-secondary-charcoal py-1.5 px-3 text-xs"
              >
                <mat-icon class="text-xs">auto_fix_high</mat-icon>
                <span>Add 3 Sample Rows</span>
              </button>
              <button
                type="button"
                (click)="addManualRow()"
                class="btn-primary-white py-1.5 px-3.5 text-xs font-semibold"
              >
                <mat-icon class="text-xs">add</mat-icon>
                <span>Add Row</span>
              </button>
            </div>
          </div>

          <!-- Dynamic Multi-Row Table -->
          <div class="overflow-x-auto border border-[#333333] rounded-xl bg-[#0f0f0f]">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-[#141414] border-b border-[#282828] text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  <th class="py-3 px-3 w-10 text-center font-mono">#</th>
                  <th class="py-3 px-3 min-w-[180px]">Student Name *</th>
                  <th class="py-3 px-3 min-w-[130px]">Roll Number *</th>
                  <th class="py-3 px-3 min-w-[200px]">Email Address *</th>
                  <th class="py-3 px-3 min-w-[120px]">Course</th>
                  <th class="py-3 px-3 min-w-[90px]">Section</th>
                  <th class="py-3 px-3 w-14 text-center">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#202020]">
                @for (row of manualRows(); track row.id; let idx = $index) {
                  <tr class="hover:bg-[#181818] transition-colors">
                    <td class="py-3 px-3 text-center font-mono text-neutral-500 tabular-nums">
                      {{ idx + 1 }}
                    </td>
                    <td class="py-2.5 px-3">
                      <input
                        type="text"
                        [value]="row.name"
                        (input)="updateManualRow(idx, 'name', $event)"
                        placeholder="e.g. Karan Singhania"
                        class="clay-input w-full px-2.5 py-1.5 text-xs"
                      />
                    </td>
                    <td class="py-2.5 px-3">
                      <input
                        type="text"
                        [value]="row.rollNo"
                        (input)="updateManualRow(idx, 'rollNo', $event)"
                        placeholder="2024CS110"
                        class="clay-input w-full px-2.5 py-1.5 text-xs font-mono uppercase"
                      />
                    </td>
                    <td class="py-2.5 px-3">
                      <input
                        type="email"
                        [value]="row.email"
                        (input)="updateManualRow(idx, 'email', $event)"
                        placeholder="karan@campusdesk.edu"
                        class="clay-input w-full px-2.5 py-1.5 text-xs"
                      />
                    </td>
                    <td class="py-2.5 px-3">
                      <select
                        [value]="row.course"
                        (change)="updateManualRow(idx, 'course', $event)"
                        class="clay-input w-full px-2 py-1.5 text-xs cursor-pointer"
                      >
                        <option value="B.Tech">B.Tech</option>
                        <option value="M.Tech">M.Tech</option>
                        <option value="BCA">BCA</option>
                        <option value="BBA">BBA</option>
                      </select>
                    </td>
                    <td class="py-2.5 px-3">
                      <select
                        [value]="row.section"
                        (change)="updateManualRow(idx, 'section', $event)"
                        class="clay-input w-full px-2 py-1.5 text-xs cursor-pointer font-mono"
                      >
                        <option value="A">Sec A</option>
                        <option value="B">Sec B</option>
                        <option value="C">Sec C</option>
                        <option value="D">Sec D</option>
                      </select>
                    </td>
                    <td class="py-2.5 px-3 text-center">
                      @if (manualRows().length > 1) {
                        <button
                          type="button"
                          (click)="removeManualRow(idx)"
                          class="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Remove row"
                        >
                          <mat-icon class="text-sm">delete</mat-icon>
                        </button>
                      } @else {
                        <span class="text-neutral-600 text-xs">—</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Summary & Transaction Submit Ribbon -->
          <div class="clay-secondary p-5 rounded-xl border border-[#333333] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4 text-xs font-mono">
              <span class="text-white font-bold tabular-nums">
                {{ manualRows().length }} Students Prepared
              </span>
              <span class="text-neutral-600">·</span>
              <span class="text-neutral-400">All-or-Nothing Atomic Transaction</span>
            </div>

            <div class="flex items-center gap-3">
              <button
                type="button"
                (click)="addManualRow()"
                class="btn-secondary-charcoal py-2 px-3.5 text-xs"
              >
                <mat-icon class="text-xs">add</mat-icon>
                <span>Add Another Row</span>
              </button>

              <button
                type="button"
                (click)="onSaveAllManualRows()"
                [disabled]="isSubmitting() || manualRows().length === 0"
                class="btn-primary-white py-2 px-6 text-xs font-semibold"
              >
                @if (isSubmitting()) {
                  <span class="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving All Students...</span>
                } @else {
                  <mat-icon class="text-sm">save_all</mat-icon>
                  <span>Save All Students ({{ manualRows().length }})</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- TAB 3: BULK IMPORT (CSV FILE) -->
      @if (activeMode() === 'csv-import') {
        <div class="clay-card p-6 sm:p-8 space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 class="text-base font-bold text-white tracking-tight">Bulk Import via CSV File</h3>
              <p class="text-xs text-neutral-400">Upload structured CSV data with automatic schema validation and instant correction preview</p>
            </div>

            <!-- Download Sample CSV Template button -->
            <button
              type="button"
              (click)="downloadSampleCsv()"
              class="btn-secondary-charcoal py-2 px-4 text-xs shrink-0 self-start sm:self-auto"
            >
              <mat-icon class="text-xs">download</mat-icon>
              <span>Download Sample CSV</span>
            </button>
          </div>

          <!-- CSV Upload Area -->
          <button
            type="button"
            (dragover)="onCsvDragOver($event)"
            (dragleave)="onCsvDragLeave($event)"
            (drop)="onCsvDrop($event)"
            (click)="csvFileInput.click()"
            [class.border-white]="isDraggingCsv()"
            [class.bg-[#1c1c1c]]="isDraggingCsv()"
            aria-label="Upload Student CSV File"
            class="w-full border-2 border-dashed border-[#383838] hover:border-[#555555] rounded-xl p-8 text-center transition-all bg-[#121212]/60 cursor-pointer block"
          >
            <input
              #csvFileInput
              type="file"
              accept=".csv,text/csv"
              (change)="onCsvFileSelected($event)"
              class="hidden"
            />
            <div class="w-12 h-12 rounded-xl bg-[#202020] border border-[#383838] flex items-center justify-center mx-auto mb-3">
              <mat-icon class="text-white text-2xl">file_upload</mat-icon>
            </div>
            <p class="text-sm font-semibold text-white">
              Drag and drop your student CSV file here, or <span class="underline underline-offset-2">browse computer</span>
            </p>
            <p class="text-xs text-neutral-400 mt-1">
              Required Header Schema: <span class="text-white font-mono">StudentName,RollNumber,Email,Course,Section</span>
            </p>
            @if (uploadedFileName()) {
              <div class="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#222222] border border-[#383838] text-xs text-emerald-400 font-mono">
                <mat-icon class="text-xs">check_circle</mat-icon>
                <span>Loaded file: {{ uploadedFileName() }}</span>
              </div>
            }
          </button>

          <!-- CSV Parsed Preview Table -->
          @if (csvPreviewRows().length > 0) {
            <div class="space-y-4">
              <!-- Summary Strip -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#141414] border border-[#2a2a2a]">
                <div class="flex items-center gap-4 text-xs font-mono">
                  <span class="text-white font-bold">{{ csvPreviewRows().length }} Rows Detected</span>
                  <span class="text-neutral-600">·</span>
                  <span class="text-emerald-400 font-bold">{{ validCsvCount() }} Valid</span>
                  <span class="text-neutral-600">·</span>
                  <span [class]="invalidCsvCount() > 0 ? 'text-red-400 font-bold' : 'text-neutral-500'">
                    {{ invalidCsvCount() }} Invalid
                  </span>
                </div>

                <div class="flex items-center gap-2 text-xs">
                  @if (invalidCsvCount() > 0) {
                    <span class="text-red-400 flex items-center gap-1">
                      <mat-icon class="text-xs">warning</mat-icon>
                      <span>Correct or remove invalid rows to proceed</span>
                    </span>
                  } @else {
                    <span class="text-emerald-400 flex items-center gap-1 font-mono">
                      <mat-icon class="text-xs">task_alt</mat-icon>
                      <span>All records verified and ready for commit</span>
                    </span>
                  }
                </div>
              </div>

              <!-- Records Table with inline editing & validation messages -->
              <div class="overflow-x-auto border border-[#333333] rounded-xl bg-[#0f0f0f]">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="bg-[#141414] border-b border-[#282828] text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      <th class="py-3 px-3 w-10 text-center font-mono">#</th>
                      <th class="py-3 px-3">Student Name</th>
                      <th class="py-3 px-3">Roll Number</th>
                      <th class="py-3 px-3">Email Address</th>
                      <th class="py-3 px-3">Course</th>
                      <th class="py-3 px-3">Section</th>
                      <th class="py-3 px-3">Validation Status</th>
                      <th class="py-3 px-3 w-14 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#202020]">
                    @for (row of csvPreviewRows(); track row.id; let idx = $index) {
                      <tr [class]="row.isValid ? 'hover:bg-[#181818]' : 'bg-[#221313]/40 hover:bg-[#281616]/60'">
                        <td class="py-3 px-3 text-center font-mono text-neutral-500 tabular-nums">
                          {{ row.rowNumber }}
                        </td>
                        <td class="py-2 px-3">
                          <input
                            type="text"
                            [value]="row.name"
                            (input)="updateCsvRow(idx, 'name', $event)"
                            class="clay-input w-full px-2 py-1 text-xs"
                          />
                        </td>
                        <td class="py-2 px-3">
                          <input
                            type="text"
                            [value]="row.rollNo"
                            (input)="updateCsvRow(idx, 'rollNo', $event)"
                            class="clay-input w-full px-2 py-1 text-xs font-mono uppercase"
                          />
                        </td>
                        <td class="py-2 px-3">
                          <input
                            type="email"
                            [value]="row.email"
                            (input)="updateCsvRow(idx, 'email', $event)"
                            class="clay-input w-full px-2 py-1 text-xs"
                          />
                        </td>
                        <td class="py-2 px-3">
                          <select
                            [value]="row.course"
                            (change)="updateCsvRow(idx, 'course', $event)"
                            class="clay-input w-full px-2 py-1 text-xs cursor-pointer"
                          >
                            <option value="B.Tech">B.Tech</option>
                            <option value="M.Tech">M.Tech</option>
                            <option value="BCA">BCA</option>
                            <option value="BBA">BBA</option>
                          </select>
                        </td>
                        <td class="py-2 px-3">
                          <select
                            [value]="row.section"
                            (change)="updateCsvRow(idx, 'section', $event)"
                            class="clay-input w-full px-2 py-1 text-xs cursor-pointer font-mono"
                          >
                            <option value="A">Sec A</option>
                            <option value="B">Sec B</option>
                            <option value="C">Sec C</option>
                            <option value="D">Sec D</option>
                          </select>
                        </td>
                        <td class="py-2 px-3">
                          @if (row.isValid) {
                            <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 font-mono">
                              <mat-icon class="text-xs">check</mat-icon>
                              <span>Ready</span>
                            </span>
                          } @else {
                            <div class="text-[11px] text-red-400 space-y-0.5">
                              @for (err of row.errors; track err) {
                                <div>• {{ err }}</div>
                              }
                            </div>
                          }
                        </td>
                        <td class="py-2 px-3 text-center">
                          <button
                            type="button"
                            (click)="removeCsvRow(idx)"
                            class="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                            title="Remove row"
                          >
                            <mat-icon class="text-sm">delete</mat-icon>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- CSV Submit Action -->
              <div class="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  (click)="clearCsv()"
                  class="btn-secondary-charcoal py-2.5 px-4 text-xs font-medium"
                >
                  Clear Import
                </button>
                <button
                  type="button"
                  (click)="onCommitCsvRows()"
                  [disabled]="isSubmitting() || invalidCsvCount() > 0 || csvPreviewRows().length === 0"
                  class="btn-primary-white py-2.5 px-6 text-xs font-semibold"
                >
                  @if (isSubmitting()) {
                    <span class="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving Records to Database...</span>
                  } @else {
                    <mat-icon class="text-sm">cloud_upload</mat-icon>
                    <span>Save All Valid Students ({{ validCsvCount() }})</span>
                  }
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AddStudentComponent implements OnInit {
  private campus = inject(CampusService);
  private router = inject(Router);

  activeMode = signal<'single' | 'manual-bulk' | 'csv-import'>('single');
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  detailedErrors = signal<string[]>([]);
  showSuccessModal = signal(false);
  successMessage = signal('Student record saved successfully');

  // Existing DB students for client-side pre-validation
  existingStudents = signal<Student[]>([]);

  // 1. Single form
  studentForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    rollNo: new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]+$/)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    course: new FormControl<'B.Tech' | 'M.Tech' | 'BCA' | 'BBA'>('B.Tech', [Validators.required]),
    section: new FormControl<'A' | 'B' | 'C' | 'D'>('A', [Validators.required]),
  });

  // 2. Manual bulk rows
  manualRows = signal<ManualRow[]>([
    { id: 'row-1', name: '', rollNo: '', email: '', course: 'B.Tech', section: 'A' },
    { id: 'row-2', name: '', rollNo: '', email: '', course: 'B.Tech', section: 'A' },
  ]);

  // 3. CSV Import state
  isDraggingCsv = signal(false);
  uploadedFileName = signal<string | null>(null);
  csvPreviewRows = signal<CsvPreviewRow[]>([]);

  ngOnInit() {
    this.refreshExistingStudents();
  }

  setMode(mode: 'single' | 'manual-bulk' | 'csv-import') {
    this.activeMode.set(mode);
    this.errorMessage.set(null);
    this.detailedErrors.set([]);
  }

  refreshExistingStudents() {
    this.campus.getStudents().subscribe({
      next: (res) => this.existingStudents.set(res.students),
      error: (err) => console.error(err)
    });
  }

  // --- SINGLE STUDENT LOGIC ---
  resetSingleForm() {
    this.studentForm.reset({
      name: '',
      rollNo: '',
      email: '',
      course: 'B.Tech',
      section: 'A',
    });
    this.errorMessage.set(null);
    this.detailedErrors.set([]);
  }

  onSingleSubmit() {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    const val = this.studentForm.value;
    if (!val.name || !val.rollNo || !val.email || !val.course || !val.section) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.detailedErrors.set([]);

    this.campus.addStudent({
      name: val.name,
      rollNo: val.rollNo,
      email: val.email,
      course: val.course,
      section: val.section,
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Student record saved successfully');
        this.showSuccessModal.set(true);
        this.campus.showToast('Student record saved successfully');
        this.refreshExistingStudents();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to save student record.');
      }
    });
  }

  // --- MANUAL MULTI-ROW LOGIC ---
  addManualRow() {
    this.manualRows.update(rows => [
      ...rows,
      {
        id: 'row-' + Date.now() + Math.random().toString(36).substring(2, 5),
        name: '',
        rollNo: '',
        email: '',
        course: 'B.Tech',
        section: 'A'
      }
    ]);
  }

  addSampleRows() {
    const base = Date.now().toString().slice(-3);
    const samples: ManualRow[] = [
      { id: 'sample-1-' + base, name: 'Aditya Kashyap', rollNo: `2024CS${base}1`, email: `aditya.${base}@campusdesk.edu`, course: 'B.Tech', section: 'A' },
      { id: 'sample-2-' + base, name: 'Bhavna Menon', rollNo: `2024CS${base}2`, email: `bhavna.${base}@campusdesk.edu`, course: 'B.Tech', section: 'B' },
      { id: 'sample-3-' + base, name: 'Chirag Parekh', rollNo: `2024MT${base}1`, email: `chirag.${base}@campusdesk.edu`, course: 'M.Tech', section: 'A' },
    ];
    this.manualRows.set(samples);
    this.errorMessage.set(null);
    this.detailedErrors.set([]);
  }

  removeManualRow(index: number) {
    this.manualRows.update(rows => rows.filter((_, i) => i !== index));
  }

  updateManualRow(index: number, field: keyof ManualRow, event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const value = target.value;
    this.manualRows.update(rows => {
      const copy = [...rows];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  onSaveAllManualRows() {
    const rows = this.manualRows();
    const errors: string[] = [];
    const seenRolls = new Set<string>();
    const seenEmails = new Set<string>();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const dbStudents = this.existingStudents();

    if (rows.length === 0) {
      this.errorMessage.set('Please add at least one student row before saving.');
      return;
    }

    rows.forEach((r, idx) => {
      const rowNum = idx + 1;
      const cleanName = r.name.trim();
      const cleanRoll = r.rollNo.trim().toUpperCase();
      const cleanEmail = r.email.trim().toLowerCase();

      if (!cleanName) {
        errors.push(`Row ${rowNum}: Student Name is missing.`);
      }
      if (!cleanRoll) {
        errors.push(`Row ${rowNum}: Roll Number is missing.`);
      } else {
        if (seenRolls.has(cleanRoll)) {
          errors.push(`Row ${rowNum}: Duplicate roll number "${cleanRoll}" in the list.`);
        } else {
          seenRolls.add(cleanRoll);
        }
        if (dbStudents.some(s => s.rollNo.toUpperCase() === cleanRoll)) {
          errors.push(`Row ${rowNum}: Roll number "${cleanRoll}" already exists in institutional database.`);
        }
      }

      if (!cleanEmail) {
        errors.push(`Row ${rowNum}: Email address is missing.`);
      } else if (!emailRegex.test(cleanEmail)) {
        errors.push(`Row ${rowNum}: Invalid email format "${cleanEmail}".`);
      } else {
        if (seenEmails.has(cleanEmail)) {
          errors.push(`Row ${rowNum}: Duplicate email "${cleanEmail}" in the list.`);
        } else {
          seenEmails.add(cleanEmail);
        }
        if (dbStudents.some(s => s.email.toLowerCase() === cleanEmail)) {
          errors.push(`Row ${rowNum}: Email "${cleanEmail}" already exists in database.`);
        }
      }
    });

    if (errors.length > 0) {
      this.errorMessage.set(`Validation failed across ${errors.length} item(s). Transaction cancelled. Please fix all issues before saving.`);
      this.detailedErrors.set(errors);
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.detailedErrors.set([]);

    const payload = rows.map(r => ({
      name: r.name.trim(),
      rollNo: r.rollNo.trim().toUpperCase(),
      email: r.email.trim().toLowerCase(),
      course: r.course,
      section: r.section,
    }));

    this.campus.bulkAddStudents(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set(`${res.count} student records saved successfully`);
        this.showSuccessModal.set(true);
        this.campus.showToast(`${res.count} student records saved successfully`);
        this.refreshExistingStudents();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const serverError = err.error?.error || 'Bulk operation failed on server.';
        this.errorMessage.set(serverError);
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          this.detailedErrors.set(err.error.errors.map((e: { message: string }) => e.message));
        }
      }
    });
  }

  // --- CSV BULK IMPORT LOGIC ---
  downloadSampleCsv() {
    const csvContent =
      'StudentName,RollNumber,Email,Course,Section\n' +
      'Kavya Sharma,2024CS110,kavya.sharma@campusdesk.edu,B.Tech,A\n' +
      'Dev Patel,2024CS111,dev.patel@campusdesk.edu,B.Tech,B\n' +
      'Priyanka Rao,2024MT205,priyanka.rao@campusdesk.edu,M.Tech,A\n' +
      'Siddharth Joshi,2024BC305,siddharth.j@campusdesk.edu,BCA,A\n' +
      'Ananya Reddy,2024BB405,ananya.r@campusdesk.edu,BBA,B\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'campusdesk_students_sample.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  onCsvDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDraggingCsv.set(true);
  }

  onCsvDragLeave(e: DragEvent) {
    e.preventDefault();
    this.isDraggingCsv.set(false);
  }

  onCsvDrop(e: DragEvent) {
    e.preventDefault();
    this.isDraggingCsv.set(false);
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this.parseCsvFile(e.dataTransfer.files[0]);
    }
  }

  onCsvFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.parseCsvFile(input.files[0]);
    }
  }

  parseCsvFile(file: File) {
    // Validate file type
    const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
    if (!isCsv) {
      this.errorMessage.set('Unsupported file format. Please upload a valid .csv file.');
      return;
    }

    this.uploadedFileName.set(file.name);
    this.errorMessage.set(null);
    this.detailedErrors.set([]);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      this.processCsvText(text);
    };
    reader.onerror = () => {
      this.errorMessage.set('Failed to read the uploaded CSV file.');
    };
    reader.readAsText(file);
  }

  processCsvText(text: string) {
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length <= 1) {
      this.errorMessage.set('The uploaded CSV file is empty or missing data rows.');
      this.csvPreviewRows.set([]);
      return;
    }

    // Verify Header Schema
    const headerLine = lines[0].replace(/["']/g, '');
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
    const expected = ['studentname', 'rollnumber', 'email', 'course', 'section'];

    const hasExpectedHeaders = expected.every(exp => headers.some(h => h.replace(/[\s_-]/g, '') === exp));
    if (!hasExpectedHeaders) {
      this.errorMessage.set(
        'Invalid CSV Header Schema. Expected columns: StudentName, RollNumber, Email, Course, Section.'
      );
      this.csvPreviewRows.set([]);
      return;
    }

    const rows: CsvPreviewRow[] = [];
    const seenRolls = new Set<string>();
    const seenEmails = new Set<string>();
    const validCourses = ['B.Tech', 'M.Tech', 'BCA', 'BBA'];
    const validSections = ['A', 'B', 'C', 'D'];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const dbStudents = this.existingStudents();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      const rowNum = i;

      const name = cols[0] || '';
      const rollNo = (cols[1] || '').toUpperCase();
      const email = (cols[2] || '').toLowerCase();
      const course = cols[3] || 'B.Tech';
      const section = (cols[4] || 'A').toUpperCase();

      const errors: string[] = [];

      if (!name) errors.push('Missing Student Name');
      if (!rollNo) {
        errors.push('Missing Roll Number');
      } else {
        if (seenRolls.has(rollNo)) {
          errors.push(`Duplicate roll number ${rollNo} in CSV`);
        } else {
          seenRolls.add(rollNo);
        }
        if (dbStudents.some(s => s.rollNo.toUpperCase() === rollNo)) {
          errors.push(`Roll ${rollNo} already in database`);
        }
      }

      if (!email) {
        errors.push('Missing Email');
      } else if (!emailRegex.test(email)) {
        errors.push('Invalid Email Format');
      } else {
        if (seenEmails.has(email)) {
          errors.push(`Duplicate email in CSV`);
        } else {
          seenEmails.add(email);
        }
        if (dbStudents.some(s => s.email.toLowerCase() === email)) {
          errors.push('Email already in database');
        }
      }

      if (!validCourses.includes(course)) {
        errors.push(`Invalid Course "${course}"`);
      }
      if (!validSections.includes(section)) {
        errors.push(`Invalid Section "${section}"`);
      }

      rows.push({
        id: 'csv-row-' + i,
        rowNumber: rowNum,
        name,
        rollNo,
        email,
        course,
        section,
        isValid: errors.length === 0,
        errors,
      });
    }

    this.csvPreviewRows.set(rows);
  }

  updateCsvRow(index: number, field: 'name' | 'rollNo' | 'email' | 'course' | 'section', event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const value = target.value;

    this.csvPreviewRows.update(rows => {
      const copy = [...rows];
      const updated = { ...copy[index], [field]: value };
      copy[index] = updated;

      // Re-validate all rows to ensure uniqueness
      return this.revalidateCsvRows(copy);
    });
  }

  removeCsvRow(index: number) {
    this.csvPreviewRows.update(rows => {
      const remaining = rows.filter((_, i) => i !== index);
      return this.revalidateCsvRows(remaining);
    });
  }

  private revalidateCsvRows(rows: CsvPreviewRow[]): CsvPreviewRow[] {
    const seenRolls = new Set<string>();
    const seenEmails = new Set<string>();
    const validCourses = ['B.Tech', 'M.Tech', 'BCA', 'BBA'];
    const validSections = ['A', 'B', 'C', 'D'];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const dbStudents = this.existingStudents();

    return rows.map((r, i) => {
      const errors: string[] = [];
      const cleanName = r.name.trim();
      const cleanRoll = r.rollNo.trim().toUpperCase();
      const cleanEmail = r.email.trim().toLowerCase();
      const cleanCourse = r.course.trim();
      const cleanSection = r.section.trim().toUpperCase();

      if (!cleanName) errors.push('Missing Student Name');
      if (!cleanRoll) {
        errors.push('Missing Roll Number');
      } else {
        if (seenRolls.has(cleanRoll)) {
          errors.push(`Duplicate roll number ${cleanRoll}`);
        } else {
          seenRolls.add(cleanRoll);
        }
        if (dbStudents.some(s => s.rollNo.toUpperCase() === cleanRoll)) {
          errors.push(`Roll ${cleanRoll} exists in database`);
        }
      }

      if (!cleanEmail) {
        errors.push('Missing Email');
      } else if (!emailRegex.test(cleanEmail)) {
        errors.push('Invalid Email Format');
      } else {
        if (seenEmails.has(cleanEmail)) {
          errors.push(`Duplicate email in list`);
        } else {
          seenEmails.add(cleanEmail);
        }
        if (dbStudents.some(s => s.email.toLowerCase() === cleanEmail)) {
          errors.push('Email exists in database');
        }
      }

      if (!validCourses.includes(cleanCourse)) errors.push(`Invalid Course`);
      if (!validSections.includes(cleanSection)) errors.push(`Invalid Section`);

      return {
        ...r,
        rowNumber: i + 1,
        name: cleanName,
        rollNo: cleanRoll,
        email: cleanEmail,
        course: cleanCourse,
        section: cleanSection,
        isValid: errors.length === 0,
        errors,
      };
    });
  }

  validCsvCount(): number {
    return this.csvPreviewRows().filter(r => r.isValid).length;
  }

  invalidCsvCount(): number {
    return this.csvPreviewRows().filter(r => !r.isValid).length;
  }

  clearCsv() {
    this.csvPreviewRows.set([]);
    this.uploadedFileName.set(null);
    this.errorMessage.set(null);
    this.detailedErrors.set([]);
  }

  onCommitCsvRows() {
    const rows = this.csvPreviewRows();
    if (rows.length === 0 || this.invalidCsvCount() > 0) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.detailedErrors.set([]);

    const payload = rows.map(r => ({
      name: r.name,
      rollNo: r.rollNo,
      email: r.email,
      course: r.course as 'B.Tech' | 'M.Tech' | 'BCA' | 'BBA',
      section: r.section as 'A' | 'B' | 'C' | 'D',
    }));

    this.campus.bulkAddStudents(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set(`${res.count} student records saved successfully`);
        this.showSuccessModal.set(true);
        this.campus.showToast(`${res.count} student records saved successfully`);
        this.clearCsv();
        this.refreshExistingStudents();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const serverError = err.error?.error || 'Bulk CSV save failed on server.';
        this.errorMessage.set(serverError);
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          this.detailedErrors.set(err.error.errors.map((e: { message: string }) => e.message));
        }
      }
    });
  }

  dismissModalAndAddAnother() {
    this.showSuccessModal.set(false);
    this.resetSingleForm();
    this.manualRows.set([
      { id: 'row-1', name: '', rollNo: '', email: '', course: 'B.Tech', section: 'A' },
      { id: 'row-2', name: '', rollNo: '', email: '', course: 'B.Tech', section: 'A' },
    ]);
  }

  goToDashboard() {
    this.showSuccessModal.set(false);
    this.router.navigate(['/admin/dashboard']);
  }
}
