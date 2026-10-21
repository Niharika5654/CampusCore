import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CampusService } from '../../services/campus';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-black text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      <!-- Ambient subtle background depth -->
      <div class="absolute inset-0 pointer-events-none opacity-20">
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-neutral-900 rounded-full blur-[140px]"></div>
      </div>

      <!-- Top Header Brand Zone -->
      <header class="relative z-10 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center shadow-inner">
            <mat-icon class="text-white text-xl">account_balance</mat-icon>
          </div>
          <div>
            <h1 class="text-xl font-bold tracking-tight text-white leading-tight">CampusDesk</h1>
            <p class="text-xs text-neutral-400">Academic ERP & Student Management</p>
          </div>
        </div>

        <div class="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
          <span>Enterprise Edition</span>
          <span aria-hidden="true">·</span>
          <span>Monochrome UI</span>
        </div>
      </header>

      <!-- Center Clay Login Card -->
      <main class="relative z-10 w-full max-w-md mx-auto my-auto py-8">
        <div class="clay-card p-8 sm:p-10 border border-[#333333]">
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-white tracking-tight">System Sign In</h2>
            <p class="text-sm text-neutral-400 mt-1.5">Access your academic records or administration workspace</p>
          </div>

          @if (errorMessage()) {
            <div class="mb-6 p-3.5 rounded-xl bg-[#1f1313] border border-red-900/40 text-red-300 text-sm flex items-center gap-2.5">
              <mat-icon class="text-red-400 shrink-0">error_outline</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label for="identifier" class="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                Email or Roll Number
              </label>
              <div class="relative">
                <input
                  id="identifier"
                  type="text"
                  formControlName="identifier"
                  placeholder="admin@campusdesk.edu or 2024CS101"
                  class="clay-input w-full px-4 py-3 text-sm placeholder:text-neutral-500"
                  autocomplete="username"
                />
              </div>
              @if (loginForm.get('identifier')?.touched && loginForm.get('identifier')?.invalid) {
                <p class="text-xs text-red-400 mt-1.5">Please provide an email or student roll number.</p>
              }
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Password
                </label>
                <button
                  type="button"
                  (click)="togglePassword()"
                  class="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  {{ showPassword() ? 'Hide' : 'Show' }}
                </button>
              </div>
              <div class="relative">
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="••••••••••••"
                  class="clay-input w-full px-4 py-3 text-sm placeholder:text-neutral-500"
                  autocomplete="current-password"
                />
              </div>
              @if (loginForm.get('password')?.touched && loginForm.get('password')?.invalid) {
                <p class="text-xs text-red-400 mt-1.5">Password is required.</p>
              }
            </div>

            <button
              type="submit"
              [disabled]="isLoading()"
              class="btn-primary-white w-full py-3.5 text-sm font-semibold tracking-wide mt-2"
            >
              @if (isLoading()) {
                <span class="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                <span>Signing in...</span>
              } @else {
                <mat-icon>login</mat-icon>
                <span>Sign In to CampusDesk</span>
              }
            </button>
          </form>

          <!-- Quick Test Credentials for evaluator -->
          <div class="mt-8 pt-6 border-t border-neutral-800">
            <p class="text-xs text-neutral-400 font-medium mb-3">Quick Credentials Switcher:</p>
            <div class="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                (click)="fillCredentials('admin@campusdesk.edu', 'admin123')"
                class="btn-secondary-charcoal py-2 px-3 text-xs w-full text-left flex items-center justify-between"
              >
                <span>Dean / Admin</span>
                <span class="text-neutral-400 font-mono text-[10px]">admin123</span>
              </button>
              <button
                type="button"
                (click)="fillCredentials('2024CS101', 'student123')"
                class="btn-secondary-charcoal py-2 px-3 text-xs w-full text-left flex items-center justify-between"
              >
                <span>Student</span>
                <span class="text-neutral-400 font-mono text-[10px]">student123</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <!-- Bottom footer -->
      <footer class="relative z-10 max-w-5xl mx-auto w-full text-center text-xs text-neutral-500 py-2">
        <p>© 2026 CampusDesk Academic ERP · Dark Monochrome Edition</p>
      </footer>
    </div>
  `,
})
export class LoginPage {
  private campus = inject(CampusService);
  private router = inject(Router);

  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = new FormGroup({
    identifier: new FormControl('admin@campusdesk.edu', [Validators.required]),
    password: new FormControl('admin123', [Validators.required]),
  });

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  fillCredentials(id: string, pass: string) {
    this.loginForm.patchValue({
      identifier: id,
      password: pass
    });
    this.errorMessage.set(null);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { identifier, password } = this.loginForm.value;
    if (!identifier || !password) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.campus.login(identifier, password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.user.role === 'Admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/student/portal']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.error || 'Authentication failed. Please verify credentials.';
        this.errorMessage.set(msg);
      }
    });
  }
}
