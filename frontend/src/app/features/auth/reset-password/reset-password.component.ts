import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  form: FormGroup;
  token = '';
  loading = false;
  errorMessage = '';
  successMessage = '';
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.form = this.fb.group(
      {
                newPassword: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: (g: AbstractControl): ValidationErrors | null =>
          g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : { passwordMismatch: true } },
    );
    if (!this.token) {
      this.errorMessage = 'Invalid or missing reset link.';
    }
  }

  get f() { return this.form.controls; }

  onSubmit(): void {
    if (this.form.invalid || !this.token) return;
    this.loading = true;
    this.errorMessage = '';
    this.authService.resetPassword(this.token, this.f['newPassword'].value).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Password updated! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Reset link is invalid or expired.';
      },
    });
  }
}