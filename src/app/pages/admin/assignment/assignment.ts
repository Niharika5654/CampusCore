import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CampusService, Assignment } from '../../../services/campus';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-assignment',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="space-y-8 max-w-5xl mx-auto">
      <!-- Heading -->
      <div class="border-b border-[#222222] pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Assignment Management</h2>
          <p class="text-xs text-neutral-400 mt-1">Publish curriculum tasks, course notes, and lab problem sets</p>
        </div>
      </div>

      <!-- Upload Form (Charcoal Clay surface) -->
      <div class="clay-card p-6 sm:p-8">
        <div class="mb-6">
          <h3 class="text-lg font-bold text-white tracking-tight">Publish New Assignment</h3>
          <p class="text-xs text-neutral-400">Fill in assignment parameters and attach the coursework file</p>
        </div>

        @if (errorMessage()) {
          <div class="mb-6 p-4 rounded-xl bg-[#211212] border border-red-900/50 text-red-300 text-sm flex items-center gap-3">
            <mat-icon class="text-red-400 shrink-0">error_outline</mat-icon>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="assignmentForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Title -->
          <div>
            <label for="asg-title" class="block text-xs font-bold uppercase tracking-wider text-white mb-2">
              Assignment Title <span class="text-red-400">*</span>
            </label>
            <input
              id="asg-title"
              type="text"
              formControlName="title"
              placeholder="e.g. Computer Graphics - Ray Tracing Pipeline & Shader Lab"
              class="clay-input w-full px-4 py-3 text-sm placeholder:text-neutral-600"
            />
            @if (assignmentForm.get('title')?.touched && assignmentForm.get('title')?.invalid) {
              <p class="text-xs text-red-400 mt-1.5">Assignment title is required.</p>
            }
          </div>

          <!-- Course & Section -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label for="asg-course" class="block text-xs font-bold uppercase tracking-wider text-white mb-2">
                Target Course <span class="text-red-400">*</span>
              </label>
              <div class="relative">
                <select
                  id="asg-course"
                  formControlName="course"
                  class="clay-input w-full px-4 py-3 text-sm appearance-none cursor-pointer pr-10"
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

            <div>
              <label for="asg-section" class="block text-xs font-bold uppercase tracking-wider text-white mb-2">
                Target Section <span class="text-red-400">*</span>
              </label>
              <div class="relative">
                <select
                  id="asg-section"
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

          <!-- Description (Optional) -->
          <div>
            <label for="asg-desc" class="block text-xs font-bold uppercase tracking-wider text-white mb-2">
              Instructions & Description <span class="text-neutral-500 font-normal">(Optional)</span>
            </label>
            <textarea
              id="asg-desc"
              rows="3"
              formControlName="description"
              placeholder="Outline evaluation rubrics, submission deadlines, or code repository specifications..."
              class="clay-input w-full px-4 py-3 text-sm placeholder:text-neutral-600"
            ></textarea>
          </div>

          <!-- Drag and Drop Upload Area -->
          <div>
            <span class="block text-xs font-bold uppercase tracking-wider text-white mb-2">
              Coursework Document / File Attachment <span class="text-red-400">*</span>
            </span>

            @if (!selectedFile()) {
              <button
                type="button"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDrop($event)"
                (click)="fileInput.click()"
                [class.border-white]="isDragging()"
                [class.bg-[#1e1e1e]]="isDragging()"
                aria-label="Choose coursework file"
                class="w-full border-2 border-dashed border-[#383838] hover:border-[#555555] rounded-xl p-8 text-center transition-all bg-[#121212]/50 cursor-pointer block"
              >
                <input
                  #fileInput
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,image/png,image/jpeg,application/pdf"
                  (change)="onFileSelected($event)"
                  class="hidden"
                />
                <div class="w-12 h-12 rounded-xl bg-[#202020] border border-[#383838] flex items-center justify-center mx-auto mb-3">
                  <mat-icon class="text-neutral-300 text-2xl">upload_file</mat-icon>
                </div>
                <p class="text-sm font-semibold text-white">
                  Drag and drop coursework file here, or <span class="underline underline-offset-2">browse computer</span>
                </p>
                <p class="text-xs text-neutral-400 mt-1.5">
                  Supported extensions: <span class="text-neutral-300 font-mono">PDF, JPG, JPEG, PNG</span> (up to 15MB)
                </p>
              </button>
            } @else {
              <!-- File Details Card with Replace / Remove -->
              <div class="clay-secondary p-4 rounded-xl border border-[#383838] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex items-center gap-3.5">
                  <div class="w-10 h-10 rounded-lg bg-[#141414] border border-[#333333] flex items-center justify-center shrink-0">
                    <mat-icon class="text-white text-xl">
                      {{ selectedFile()?.type?.includes('pdf') ? 'picture_as_pdf' : 'image' }}
                    </mat-icon>
                  </div>
                  <div class="overflow-hidden">
                    <p class="text-sm font-semibold text-white truncate max-w-sm">{{ selectedFile()?.name }}</p>
                    <div class="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                      <span>{{ formatSize(selectedFile()?.size || 0) }}</span>
                      <span aria-hidden="true">·</span>
                      <span class="font-mono uppercase">{{ getFileExtension() }}</span>
                      <span aria-hidden="true">·</span>
                      <span class="text-emerald-400 font-medium">Ready for upload</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    (click)="fileInput2.click()"
                    class="btn-secondary-charcoal py-1.5 px-3 text-xs"
                  >
                    <mat-icon class="text-xs">sync</mat-icon>
                    <span>Replace</span>
                  </button>
                  <input
                    #fileInput2
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,image/png,image/jpeg,application/pdf"
                    (change)="onFileSelected($event)"
                    class="hidden"
                  />
                  <button
                    type="button"
                    (click)="removeSelectedFile()"
                    class="btn-destructive py-1.5 px-3 text-xs"
                  >
                    <mat-icon class="text-xs">delete</mat-icon>
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Form Submit Button -->
          <div class="pt-4 border-t border-[#252525] flex justify-end">
            <button
              type="submit"
              [disabled]="isSubmitting() || !selectedFile()"
              class="btn-primary-white px-8 py-3 text-xs font-semibold"
            >
              @if (isSubmitting()) {
                <span class="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                <span>Uploading Assignment...</span>
              } @else {
                <mat-icon class="text-sm">publish</mat-icon>
                <span>Save Assignment</span>
              }
            </button>
          </div>
        </form>
      </div>

      <!-- Published Assignments List -->
      <div class="clay-card p-6 sm:p-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 class="text-lg font-bold text-white tracking-tight">Active Published Assignments</h3>
            <p class="text-xs text-neutral-400">Available across student cohorts and portals</p>
          </div>

          <div class="flex items-center gap-2">
            <select
              [value]="filterCourse()"
              (change)="onFilterCourseChange($event)"
              aria-label="Filter course assignments"
              class="clay-input px-3 py-1.5 text-xs"
            >
              <option value="All">All Courses</option>
              <option value="B.Tech">B.Tech</option>
              <option value="M.Tech">M.Tech</option>
              <option value="BCA">BCA</option>
              <option value="BBA">BBA</option>
            </select>
          </div>
        </div>

        <div class="space-y-4">
          @for (item of assignmentList(); track item.id) {
            <div class="clay-secondary p-5 border border-[#333333] rounded-xl hover:border-[#444444] transition-all">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2 text-xs">
                    <span class="font-bold text-white">{{ item.course }}</span>
                    <span class="text-neutral-600">·</span>
                    <span class="text-neutral-400">Section {{ item.section }}</span>
                    <span class="text-neutral-600">·</span>
                    <span class="text-neutral-400 font-mono text-[11px]">{{ formatDate(item.uploadedAt) }}</span>
                  </div>
                  <h4 class="text-base font-bold text-white tracking-tight">{{ item.title }}</h4>
                  @if (item.description) {
                    <p class="text-xs text-neutral-400 line-clamp-2 max-w-2xl">{{ item.description }}</p>
                  }
                </div>

                <div class="flex items-center gap-3 shrink-0">
                  <div class="text-right hidden sm:block">
                    <p class="text-xs font-mono text-neutral-300 font-medium">{{ item.fileName }}</p>
                    <p class="text-[11px] text-neutral-500 font-mono">{{ formatSize(item.fileSize) }}</p>
                  </div>
                  <button
                    type="button"
                    (click)="previewAssignment(item)"
                    class="btn-secondary-charcoal py-2 px-3 text-xs"
                  >
                    <mat-icon class="text-sm">visibility</mat-icon>
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="py-12 text-center text-xs text-neutral-500">
              No assignments published yet for this selection.
            </div>
          }
        </div>
      </div>

      <!-- Preview Modal -->
      @if (inspectingItem()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="clay-elevated max-w-2xl w-full p-6 sm:p-8 border border-[#444444] rounded-2xl space-y-5">
            <div class="flex items-start justify-between border-b border-[#333333] pb-4">
              <div>
                <span class="text-xs font-mono text-neutral-400">{{ inspectingItem()?.course }} - Sec {{ inspectingItem()?.section }}</span>
                <h3 class="text-lg font-bold text-white mt-1">{{ inspectingItem()?.title }}</h3>
              </div>
              <button
                type="button"
                (click)="closePreview()"
                class="text-neutral-400 hover:text-white"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="space-y-4">
              @if (inspectingItem()?.description) {
                <div class="p-3.5 rounded-xl bg-[#141414] border border-[#2a2a2a] text-xs text-neutral-300 leading-relaxed">
                  {{ inspectingItem()?.description }}
                </div>
              }

              <div class="clay-secondary p-4 rounded-xl flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <mat-icon class="text-white text-xl">
                    {{ inspectingItem()?.fileType?.includes('pdf') ? 'picture_as_pdf' : 'image' }}
                  </mat-icon>
                  <div>
                    <p class="text-xs font-mono font-medium text-white">{{ inspectingItem()?.fileName }}</p>
                    <p class="text-[10px] text-neutral-500 font-mono">{{ formatSize(inspectingItem()?.fileSize || 0) }}</p>
                  </div>
                </div>
                <button
                  type="button"
                  (click)="downloadFile(inspectingItem()!)"
                  class="btn-primary-white py-1.5 px-3 text-xs"
                >
                  <mat-icon class="text-xs">download</mat-icon>
                  <span>Download File</span>
                </button>
              </div>
            </div>

            <div class="pt-2 text-right">
              <button
                type="button"
                (click)="closePreview()"
                class="btn-secondary-charcoal py-2 px-5 text-xs font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AssignmentComponent implements OnInit {
  private campus = inject(CampusService);

  isSubmitting = signal(false);
  isDragging = signal(false);
  errorMessage = signal<string | null>(null);
  selectedFile = signal<{ name: string; size: number; type: string; base64?: string } | null>(null);
  assignmentList = signal<Assignment[]>([]);
  filterCourse = signal('All');
  inspectingItem = signal<Assignment | null>(null);

  assignmentForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    course: new FormControl('B.Tech', [Validators.required]),
    section: new FormControl('A', [Validators.required]),
    description: new FormControl(''),
  });

  ngOnInit() {
    this.loadAssignments();
  }

  loadAssignments() {
    this.campus.getAssignments(this.filterCourse(), 'All').subscribe({
      next: (res) => this.assignmentList.set(res.assignments),
      error: (err) => console.error(err)
    });
  }

  onFilterCourseChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.filterCourse.set(val);
    this.loadAssignments();
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this.handleFile(e.dataTransfer.files[0]);
    }
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File) {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isExtAllowed = ext && ['pdf', 'jpg', 'jpeg', 'png'].includes(ext);

    if (!allowed.includes(file.type) && !isExtAllowed) {
      this.errorMessage.set('Only PDF, JPG, JPEG, and PNG files are supported.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      this.errorMessage.set('File exceeds the 15MB size limit.');
      return;
    }

    this.errorMessage.set(null);
    this.selectedFile.set({
      name: file.name,
      size: file.size,
      type: file.type || 'application/pdf',
      base64: ''
    });

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.selectedFile.update(f => f ? { ...f, base64 } : null);
    };
    reader.readAsDataURL(file);
  }

  removeSelectedFile() {
    this.selectedFile.set(null);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  getFileExtension(): string {
    const file = this.selectedFile();
    if (!file) return 'FILE';
    const parts = file.type.split('/');
    if (parts.length > 1 && parts[1]) {
      return parts[1];
    }
    const ext = file.name.split('.').pop();
    return ext ? ext.toUpperCase() : 'FILE';
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

  previewAssignment(item: Assignment) {
    this.inspectingItem.set(item);
  }

  closePreview() {
    this.inspectingItem.set(null);
  }

  downloadFile(item: Assignment) {
    // Generate synthetic downloadable blob
    const content = `CampusDesk Academic System Assignment\nTitle: ${item.title}\nCourse: ${item.course} - Section ${item.section}\nUploaded: ${item.uploadedAt}\n\n${item.description || 'No additional instructions provided.'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName || 'assignment-download.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  onSubmit() {
    if (this.assignmentForm.invalid || !this.selectedFile()) {
      this.assignmentForm.markAllAsTouched();
      if (!this.selectedFile()) {
        this.errorMessage.set('Please select a coursework file to upload.');
      }
      return;
    }

    const { title, course, section, description } = this.assignmentForm.value;
    const file = this.selectedFile()!;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.campus.uploadAssignment({
      title: title!,
      course: course!,
      section: section!,
      description: description || '',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileData: file.base64
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        // Exact message display as requested
        this.campus.showToast('Assignment saved successfully');
        this.assignmentForm.reset({
          title: '',
          course: 'B.Tech',
          section: 'A',
          description: '',
        });
        this.selectedFile.set(null);
        this.loadAssignments();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.error || 'Failed to save assignment.');
      }
    });
  }
}
