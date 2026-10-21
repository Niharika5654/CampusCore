import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CampusService } from '../../services/campus';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="min-h-screen bg-black text-white flex flex-col md:flex-row">
      <!-- Toast Notification Container -->
      @if (campus.toastMessage()) {
        <div class="fixed top-6 right-6 z-50 animate-bounce duration-300">
          <div class="clay-elevated px-5 py-3.5 bg-[#171717] border border-[#444444] rounded-xl flex items-center gap-3 shadow-2xl">
            <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
            <p class="text-sm font-semibold text-white tracking-wide">{{ campus.toastMessage() }}</p>
            <button
              (click)="campus.clearToast()"
              class="ml-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <mat-icon class="text-sm">close</mat-icon>
            </button>
          </div>
        </div>
      }

      <!-- Mobile Top Bar -->
      <div class="md:hidden flex items-center justify-between px-5 py-4 bg-[#0D0D0D] border-b border-[#333333]">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#333333] flex items-center justify-center">
            <mat-icon class="text-white text-base">account_balance</mat-icon>
          </div>
          <span class="font-bold text-white tracking-tight">CampusDesk</span>
        </div>
        <button
          (click)="toggleMobileMenu()"
          class="p-2 text-neutral-300 hover:text-white rounded-lg bg-[#171717] border border-[#333333]"
        >
          <mat-icon>{{ isMobileMenuOpen() ? 'close' : 'menu' }}</mat-icon>
        </button>
      </div>

      <!-- Sidebar Navigation (Desktop Fixed & Mobile Drawer) -->
      <aside
        class="bg-[#0D0D0D] border-r border-[#333333] w-full md:w-64 shrink-0 flex flex-col justify-between"
        [class.hidden]="!isMobileMenuOpen() && isMobileView()"
        [class.block]="isMobileMenuOpen() || !isMobileView()"
      >
        <div>
          <!-- Desktop Brand Lockup -->
          <div class="hidden md:flex items-center gap-3 px-6 py-6 border-b border-[#222222]">
            <div class="w-10 h-10 rounded-xl bg-[#171717] border border-[#333333] flex items-center justify-center shadow-inner">
              <mat-icon class="text-white">account_balance</mat-icon>
            </div>
            <div>
              <span class="text-lg font-bold text-white tracking-tight block leading-tight">CampusDesk</span>
              <span class="text-xs text-neutral-400">Administration Console</span>
            </div>
          </div>

          <!-- Section Label -->
          <div class="px-6 pt-6 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Academic Operations
          </div>

          <!-- Nav Items -->
          <nav class="px-3 space-y-1.5">
            <a
              routerLink="/admin/dashboard"
              routerLinkActive="bg-[#202020] text-white border-[#444444]"
              [routerLinkActiveOptions]="{ exact: true }"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-neutral-300 hover:text-white hover:bg-[#171717] transition-all border border-transparent"
            >
              <mat-icon class="text-neutral-400">dashboard</mat-icon>
              <span class="text-sm font-medium">Dashboard Overview</span>
            </a>

            <a
              routerLink="/admin/add-student"
              routerLinkActive="bg-[#202020] text-white border-[#444444]"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-neutral-300 hover:text-white hover:bg-[#171717] transition-all border border-transparent"
            >
              <mat-icon class="text-neutral-400">person_add</mat-icon>
              <span class="text-sm font-medium">Add Student</span>
            </a>

            <a
              routerLink="/admin/attendance"
              routerLinkActive="bg-[#202020] text-white border-[#444444]"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-neutral-300 hover:text-white hover:bg-[#171717] transition-all border border-transparent"
            >
              <mat-icon class="text-neutral-400">fact_check</mat-icon>
              <span class="text-sm font-medium">Daily Attendance</span>
            </a>

            <a
              routerLink="/admin/assignment"
              routerLinkActive="bg-[#202020] text-white border-[#444444]"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-neutral-300 hover:text-white hover:bg-[#171717] transition-all border border-transparent"
            >
              <mat-icon class="text-neutral-400">assignment</mat-icon>
              <span class="text-sm font-medium">Assignment Portal</span>
            </a>

            <a
              routerLink="/admin/delete-student"
              routerLinkActive="bg-[#202020] text-white border-[#444444]"
              (click)="closeMobileMenu()"
              class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-neutral-300 hover:text-white hover:bg-[#171717] transition-all border border-transparent"
            >
              <mat-icon class="text-neutral-400">manage_accounts</mat-icon>
              <span class="text-sm font-medium">Manage Students</span>
            </a>

            <a
              routerLink="/admin/low-attendance"
              routerLinkActive="bg-[#202020] text-white border-[#444444]"
              (click)="closeMobileMenu()"
              class="flex items-center justify-between px-3.5 py-3 rounded-xl text-neutral-300 hover:text-white hover:bg-[#171717] transition-all border border-transparent group"
            >
              <div class="flex items-center gap-3">
                <mat-icon class="text-red-400">warning_amber</mat-icon>
                <span class="text-sm font-medium">Low Attendance</span>
              </div>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800 font-bold">
                &lt;75%
              </span>
            </a>
          </nav>

          <!-- Secondary Portals -->
          <div class="px-6 pt-6 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Student Access
          </div>
          <nav class="px-3 space-y-1.5">
            <a
              routerLink="/student/portal"
              (click)="closeMobileMenu()"
              class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-[#171717] transition-all border border-transparent text-sm"
            >
              <div class="flex items-center gap-3">
                <mat-icon class="text-neutral-400">school</mat-icon>
                <span>View Student Portal</span>
              </div>
              <mat-icon class="text-xs text-neutral-400">arrow_forward</mat-icon>
            </a>
          </nav>
        </div>

        <!-- Logged-in Administrator Badge & Logout -->
        <div class="p-4 border-t border-[#222222] bg-[#0A0A0A]">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-xl bg-[#202020] border border-[#333333] flex items-center justify-center font-bold text-white text-sm">
              AK
            </div>
            <div class="overflow-hidden">
              <p class="text-sm font-medium text-white truncate">Dr. Arvind Kumar</p>
              <p class="text-[11px] text-neutral-400 truncate">Dean / System Admin</p>
            </div>
          </div>
          <button
            (click)="onLogout()"
            class="btn-secondary-charcoal w-full py-2 text-xs text-neutral-300 hover:text-white"
          >
            <mat-icon class="text-sm">logout</mat-icon>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <!-- Main Workspace -->
      <div class="flex-1 flex flex-col min-h-screen bg-black">
        <!-- Top App Bar Header -->
        <header class="h-16 px-6 sm:px-8 border-b border-[#222222] bg-[#0A0A0A]/80 backdrop-blur-sm flex items-center justify-between sticky top-0 z-30">
          <div class="flex items-center gap-3">
            <span class="text-xs text-neutral-400 font-mono tracking-wider">CAMPUSDESK</span>
            <span class="text-neutral-700">/</span>
            <span class="text-sm font-medium text-white tracking-wide">Administration System</span>
          </div>

          <div class="flex items-center gap-4">
            <div class="hidden sm:flex items-center gap-2 text-xs text-neutral-400 font-mono">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>2026-2027 Academic Term</span>
            </div>
            <a
              routerLink="/student/portal"
              class="hidden sm:inline-flex btn-secondary-charcoal py-1.5 px-3 text-xs"
            >
              <mat-icon class="text-xs">swap_horiz</mat-icon>
              <span>Switch to Student View</span>
            </a>
          </div>
        </header>

        <!-- Main Viewport Content -->
        <main class="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {
  campus = inject(CampusService);
  private router = inject(Router);

  isMobileMenuOpen = signal(false);

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  isMobileView(): boolean {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  }

  onLogout() {
    this.campus.logout();
    this.router.navigate(['/login']);
  }
}
